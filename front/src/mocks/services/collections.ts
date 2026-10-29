import type { AccountEvent, BankDeposit, ChequeCheckIssue, ChequeDetail, ChequeInput, ChequeRow, CollectionService, LedgerEntry, MonthlyFile, StatementDetail, StatementEvent } from '@/services/contracts';
import { wordsMatchAmount } from '@/shared/format/number-words';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { collectionsAll } from '../fixtures/collections';
import { statementItcSeptember } from '../fixtures/statements';
import { toTenantOption } from '../fixtures/tenants';
import { type MockContext } from '../context';

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
/** « 03.11 » : la date courte des notes du prototype. */
const short = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
/** Le coursier part le jeudi : prochain jeudi strictement après la date donnée. */
const nextThursday = (iso: string) => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return addDays(iso, ((4 - day + 7) % 7) || 7);
};

/** Les contrôles bloquants d'un chèque (E2.6), les mêmes que ceux de l'écran : le serveur reste juge. */
export function chequeIssues(input: ChequeInput, assetName: string): ChequeCheckIssue[] {
  const issues: ChequeCheckIssue[] = [];
  if (!wordsMatchAmount(input.amountInWords, input.amount)) issues.push('amount-mismatch');
  const payee = input.payee.trim().toLowerCase();
  if (!payee) issues.push('payee-missing');
  else if (payee !== `sci ${assetName}`.toLowerCase()) issues.push('payee-wrong');
  if (!input.signed) issues.push('unsigned');
  return issues;
}

export function createCollectionMock(ctx: MockContext): CollectionService {
  const { latency, byAsset, state, assetName, today, author, requirePermission } = ctx;
  const chequeDetail = (id: string): ChequeDetail => {
    const cheque = state.cheques.find(c => c.id === id);
    if (!cheque) throw new AppError('resource-missing');
    const extra = state.chequeDetails[id];
    const tenant = state.tenants.find(tn => tn.id === cheque.tenantId);
    const days = cheque.depositedOn ? Math.round((Date.parse(today()) - Date.parse(cheque.depositedOn)) / 86_400_000) : null;
    return {
      cheque,
      lotCode: extra?.lotCode || tenant?.lotCodes[0] || '',
      slipName: extra?.slipName ?? null,
      daysSinceDeposit: days,
      candidates: cheque.status === 'collected' ? [] : (extra?.candidates ?? []),
      followUps: extra?.followUps ?? [],
    };
  };
  return {
    getOverview: assetId => {
      if (!assetId) return delay(collectionsAll, latency);
      const name = assetName(assetId);
      const statements = collectionsAll.statements.filter(row => row.assetName === null || row.assetName === name);
      const inbox = collectionsAll.inbox.filter(item => (name ? item.title.includes(name) : true));
      return delay({ ...collectionsAll, inbox, statements }, latency);
    },
    getStatement: async id => {
      const statement = state.statements.get(id);
      if (!statement) throw new AppError('resource-missing');
      return delay(statement, latency);
    },
    validateReconciliation: async (id, decisions) => {
      const statement = state.statements.get(id);
      if (!statement) throw new AppError('resource-missing');
      if (statement.status !== 'to-reconcile' && statement.status !== 'reopened') throw new AppError('business', { userMessage: 'Ce relevé est déjà validé. Une correction passe par « Rouvrir le rapprochement ».' });
      const reopened = statement.status === 'reopened';
      const decisionOf = (lineId: string) => decisions.find(d => d.lineId === lineId);
      const pending = statement.lines.filter(line => line.state !== 'matched' && line.state !== 'excluded');
      const undecided = pending.filter(line => !decisionOf(line.id));
      if (undecided.length > 0) {
        throw new AppError('business', { userMessage: `${undecided.length} lignes restent à traiter avant la validation.` });
      }
      const unqualified = statement.lines.filter(line => {
        const decision = decisionOf(line.id);
        if (decision) return decision.action === 'exclude' && !decision.qualification;
        return line.state === 'excluded' && !line.exclusion;
      });
      if (unqualified.length > 0) {
        throw new AppError('business', { userMessage: `Il reste ${unqualified.length} ligne(s) écartée(s) à qualifier avant de valider.` });
      }
      for (const decision of decisions) {
        const line = statement.lines.find(l => l.id === decision.lineId);
        if (!line) throw new AppError('validation', { userMessage: 'Une ligne de la décision n’appartient pas à ce relevé.' });
        if (decision.action === 'impute') {
          if (!decision.proof) throw new AppError('business', { userMessage: `Preuve du règlement manquante pour « ${line.label} ».` });
          if (!statement.tenants.some(tn => tn.id === decision.tenantId)) throw new AppError('validation', { userMessage: 'Le locataire indiqué est inconnu sur ce compte.' });
          const allocated = decision.allocations.reduce((sum, a) => sum + a.amount, 0) + (decision.offAccount?.amount ?? 0);
          if (allocated !== line.amount) throw new AppError('business', { userMessage: `La ventilation de « ${line.label} » ne couvre pas le montant de la ligne.` });
          if (decision.offAccount && !decision.offAccount.reason.trim()) throw new AppError('validation', { userMessage: 'La part hors compte locataire doit porter un motif.' });
        } else if ((decision.qualification.reason === 'ignore' || decision.qualification.reason === 'other') && !decision.qualification.note?.trim()) {
          throw new AppError('validation', { userMessage: `Un motif est obligatoire pour « ${line.label} ».` });
        }
      }
      const lines = statement.lines.map(line => {
        const decision = decisionOf(line.id);
        if (!decision) return line;
        if (decision.action === 'exclude') return { ...line, state: 'excluded' as const, exclusion: decision.qualification };
        const tenant = statement.tenants.find(tn => tn.id === decision.tenantId)!;
        return { ...line, state: 'matched' as const, tenantId: tenant.id, tenantName: tenant.name, lotCode: tenant.lotCode, proof: decision.proof, hint: `Imputée le ${today()} par ${author()}` };
      });
      // Une ligne corrigée après réouverture quitte d'abord le compte du locataire d'origine.
      let changes = 0;
      for (const decision of decisions) {
        const line = statement.lines.find(l => l.id === decision.lineId)!;
        if (line.state !== 'matched' || decision.action !== 'impute') continue;
        if (line.tenantId === decision.tenantId) continue;
        changes += 1;
        if (line.tenantId) {
          const event: AccountEvent = { id: `${line.tenantId}-undo-${line.id}`, date: today(), kind: 'note', label: `Règlement réimputé · ${line.label}`, amount: -line.amount };
          state.tenants = state.tenants.map(tn => (tn.id === line.tenantId ? { ...tn, balance: tn.balance - line.amount, history: [event, ...tn.history] } : tn));
        }
      }
      // Les comptes locataires se créditent de chaque part imputée : solde et historique à jour.
      for (const decision of decisions) {
        if (decision.action !== 'impute') continue;
        const line = statement.lines.find(l => l.id === decision.lineId)!;
        if (line.state === 'matched' && line.tenantId === decision.tenantId) continue;
        const byTenant = new Map<string, number>();
        for (const a of decision.allocations) byTenant.set(a.tenantId, (byTenant.get(a.tenantId) ?? 0) + a.amount);
        const invoiceOf = (id: string | null) => statement.tenants.flatMap(tn => tn.invoices).find(inv => inv.id === id);
        for (const [tenantId, amount] of byTenant) {
          const event: AccountEvent = { id: `${tenantId}-pay-${line.id}`, date: line.date, kind: 'payment', label: `Règlement imputé · ${line.label}`, amount };
          const parts = decision.allocations.filter(a => a.tenantId === tenantId);
          const lines = parts.map(a => ({ item: a.kind === 'invoice' ? (invoiceOf(a.invoiceId)?.item ?? 'rent') : a.kind, amount: a.amount }));
          const quarter = invoiceOf(parts.find(a => a.invoiceId)?.invoiceId ?? null)?.label.replace(/^.* (T\d \d{4})$/, '$1') ?? '';
          const entry: LedgerEntry = { id: `${tenantId}-led-${line.id}`, date: line.date, kind: 'payment', label: line.paymentKind === 'cheque' ? 'Chèque' : line.paymentKind === 'cash' ? 'Versement d’espèces' : 'Virement', reference: `Relevé ${statement.bank}`, quarter, lines, amount, by: `Imputé par ${author()}`, bankLabel: line.label, invoiceId: null };
          state.tenants = state.tenants.map(tn => (tn.id === tenantId ? { ...tn, balance: tn.balance + amount, status: tn.balance + amount >= 0 ? ('current' as const) : tn.status, history: [event, ...tn.history], ledger: [...tn.ledger, entry] } : tn));
        }
      }
      const matched = lines.filter(line => line.state === 'matched');
      const excluded = lines.filter(line => line.state === 'excluded');
      const ignored = excluded.filter(line => line.exclusion?.reason === 'ignore');
      // Encaissé du mois (dossier, E0.2) : toutes les lignes imputées du relevé, hors parts hors compte locataire.
      const offAccount = decisions.reduce((sum, d) => (d.action === 'impute' ? sum + (d.offAccount?.amount ?? 0) : sum), 0);
      const collectedAmount = matched.reduce((sum, line) => sum + line.amount, 0) - offAccount;
      const file: MonthlyFile = {
        version: (statement.file?.version ?? 0) + 1,
        status: 'submitted',
        validatedAt: new Date().toISOString(),
        validatedBy: author(),
        submittedTo: 'Eléma B.',
        approvedAt: null,
        approvedBy: null,
        sentAt: null,
        comment: null,
        collectedAmount,
        imputedCount: matched.length,
        excludedCount: excluded.length,
        ignoredCount: ignored.length,
        changes,
      };
      const journal: StatementEvent[] = [
        ...statement.journal,
        { id: `j-${Date.now()}`, date: today(), kind: 'validated', title: `Validé · version ${file.version}`, detail: reopened ? `${changes} ligne(s) réimputée(s) · soumis à Eléma` : `${matched.length} lignes imputées · soumis à Eléma`, by: author() },
      ];
      const fileVersions = statement.file ? [statement.file, ...statement.fileVersions] : statement.fileVersions;
      state.statements.set(id, { ...statement, lines, status: 'validated', imported: true, file, fileVersions, journal, observation: reopened ? null : statement.observation });
      collectionsAll.statements = collectionsAll.statements.map(st => (st.id === id ? { ...st, status: 'validated' as const, statusDetail: `Validé le ${today()} · soumis à Eléma` } : st));
      collectionsAll.inbox = collectionsAll.inbox.filter(item => item.statementId !== id);
      return delay({ statementId: id, validatedAt: file.validatedAt, matchedCount: matched.length, excludedCount: excluded.length, ignoredCount: ignored.length, collectedAmount, file }, latency);
    },
    approveMonthlyFile: async id => {
      requirePermission('collection.approve', 'Seul le gestionnaire de patrimoine approuve le dossier mensuel.');
      const statement = state.statements.get(id);
      if (!statement) throw new AppError('resource-missing');
      if (!statement.file || statement.file.status !== 'submitted') throw new AppError('business', { userMessage: 'Ce dossier n’attend pas d’approbation.' });
      const now = new Date().toISOString();
      const file: MonthlyFile = { ...statement.file, status: 'sent-to-accounting', approvedAt: now, approvedBy: author(), sentAt: now, comment: null };
      const journal: StatementEvent[] = [...statement.journal, { id: `j-${Date.now()}`, date: today(), kind: 'approved', title: `Approuvé · version ${file.version}`, detail: 'Envoyé à la comptabilité', by: author() }];
      const updated = { ...statement, file, journal };
      state.statements.set(id, updated);
      collectionsAll.statements = collectionsAll.statements.map(st => (st.id === id ? { ...st, statusDetail: `Approuvé par ${author()} · envoyé à la comptabilité` } : st));
      return delay(updated, latency);
    },
    returnMonthlyFile: async (id, comment) => {
      requirePermission('collection.approve', 'Seul le gestionnaire de patrimoine renvoie le dossier mensuel.');
      const statement = state.statements.get(id);
      if (!statement) throw new AppError('resource-missing');
      if (!statement.file || statement.file.status !== 'submitted') throw new AppError('business', { userMessage: 'Ce dossier n’attend pas d’approbation.' });
      if (!comment.trim()) throw new AppError('validation', { userMessage: 'Un commentaire est obligatoire pour renvoyer le dossier.' });
      const file: MonthlyFile = { ...statement.file, status: 'returned', comment: comment.trim() };
      const journal: StatementEvent[] = [...statement.journal, { id: `j-${Date.now()}`, date: today(), kind: 'returned', title: `Renvoyé · version ${file.version}`, detail: file.comment ?? '', by: author() }];
      const updated: StatementDetail = { ...statement, status: 'validated-with-observation', file, journal, observation: { by: author(), date: today(), text: file.comment ?? '', lineId: null } };
      state.statements.set(id, updated);
      collectionsAll.statements = collectionsAll.statements.map(st => (st.id === id ? { ...st, status: 'validated-with-observation' as const, statusDetail: `Renvoyé par ${author()}` } : st));
      collectionsAll.inbox = [{ id: `in-obs-${id}`, kind: 'observation', title: `${statement.bank} · ${statement.assetName} · ${statement.period.slice(0, 7)}`, detail: `${author()} renvoie le dossier : ${file.comment}`, statementId: id, chequeId: null }, ...collectionsAll.inbox];
      await delay(undefined, latency);
      return updated;
    },
    listCheques: assetId => delay(byAsset(state.cheques, assetId), latency),
    reopenReconciliation: async (id, reason) => {
      requirePermission('collection.record', 'Seul le gestionnaire financier rouvre un rapprochement.');
      const statement = state.statements.get(id);
      if (!statement) throw new AppError('resource-missing');
      if (statement.status !== 'validated' && statement.status !== 'validated-with-observation') throw new AppError('business', { userMessage: 'Seul un rapprochement validé se rouvre.' });
      if (statement.reportSigned) throw new AppError('business', { userMessage: 'Le CRG du trimestre est signé : ce rapprochement ne se rouvre plus.' });
      if (reason.trim().length < 5) throw new AppError('validation', { userMessage: 'Indiquez le motif de la réouverture.' });
      const journal: StatementEvent[] = [...statement.journal, { id: `j-${Date.now()}`, date: today(), kind: 'reopened', title: 'Rouvert', detail: `« ${reason.trim()} »`, by: author() }];
      const updated: StatementDetail = { ...statement, status: 'reopened', journal };
      state.statements.set(id, updated);
      collectionsAll.statements = collectionsAll.statements.map(st => (st.id === id ? { ...st, status: 'reopened' as const, statusDetail: `Rouvert le ${short(today())} par ${author()}` } : st));
      collectionsAll.inbox = collectionsAll.inbox.filter(item => !(item.statementId === id && item.kind === 'observation'));
      return delay(updated, latency);
    },
    getCheque: async id => delay(chequeDetail(id), latency),
    matchChequeCredit: async (id, statementId, lineId) => {
      requirePermission('collection.record', 'Seul le gestionnaire financier rapproche un chèque.');
      const detail = chequeDetail(id);
      const candidate = detail.candidates.find(c => c.statementId === statementId && c.lineId === lineId);
      if (!candidate) throw new AppError('resource-missing');
      if (candidate.amount !== detail.cheque.amount) throw new AppError('business', { userMessage: 'Le montant du crédit diffère de celui du chèque.' });
      const cheque = detail.cheque;
      state.cheques = state.cheques.map(c => (c.id === id ? { ...c, status: 'collected' as const, note: `Encaissé le ${short(candidate.date)} · rapproché le ${short(today())}` } : c));
      const event: AccountEvent = { id: `${cheque.tenantId}-chq-${id}`, date: candidate.date, kind: 'payment', label: `Chèque n° ${cheque.chequeNumber} encaissé`, amount: cheque.amount };
      const entry: LedgerEntry = { id: `${cheque.tenantId}-led-${id}`, date: candidate.date, kind: 'payment', label: 'Chèque', reference: `N° ${cheque.chequeNumber}`, quarter: '', lines: [{ item: 'rent', amount: cheque.amount }], amount: cheque.amount, by: `Imputé par ${author()}`, bankLabel: candidate.label, invoiceId: null };
      state.tenants = state.tenants.map(tn => (tn.id === cheque.tenantId ? { ...tn, balance: tn.balance + cheque.amount, status: tn.balance + cheque.amount >= 0 ? ('current' as const) : tn.status, history: [event, ...tn.history], ledger: [...tn.ledger, entry] } : tn));
      collectionsAll.inbox = collectionsAll.inbox.filter(item => item.chequeId !== id);
      const late = state.cheques.filter(c => c.status === 'late');
      collectionsAll.cheques = { ...collectionsAll.cheques, late: { count: late.length, note: late.length > 0 ? `${late[0]!.tenantName} · non repéré` : 'Aucun chèque en retard' } };
      return delay(chequeDetail(id), latency);
    },
    dismissChequeCredit: async (id, lineId) => {
      const extra = state.chequeDetails[id];
      if (!extra) throw new AppError('resource-missing');
      state.chequeDetails[id] = { ...extra, candidates: extra.candidates.map(c => (c.lineId === lineId ? { ...c, dismissed: true } : c)) };
      return delay(chequeDetail(id), latency);
    },
    addChequeFollowUp: async (id, input) => {
      requirePermission('collection.record', 'Seul le gestionnaire financier note une démarche.');
      if (!input.who.trim() || !input.reply.trim()) throw new AppError('validation', { userMessage: 'Indiquez qui a été contacté et sa réponse.' });
      const extra = state.chequeDetails[id] ?? { lotCode: '', slipName: null, daysSinceDeposit: null, candidates: [], followUps: [] };
      state.chequeDetails[id] = { ...extra, followUps: [...extra.followUps, { id: `fu-${Date.now()}`, date: input.date, who: input.who.trim(), reply: input.reply.trim() }] };
      return delay(chequeDetail(id), latency);
    },
    listDeposits: assetId => delay(byAsset(state.deposits, assetId).slice().sort((a, b) => b.plannedOn.localeCompare(a.plannedOn)), latency),
    getDeposit: async id => {
      const deposit = state.deposits.find(d => d.id === id);
      if (!deposit) throw new AppError('resource-missing');
      return delay(deposit, latency);
    },
    prepareDeposit: async chequeIds => {
      const cheques = state.cheques.filter(c => chequeIds.includes(c.id));
      if (cheques.length === 0) throw new AppError('validation', { userMessage: 'Choisissez au moins un chèque à déposer.' });
      if (cheques.some(c => c.status !== 'to-deposit')) throw new AppError('business', { userMessage: 'Un des chèques choisis est déjà déposé ou clos.' });
      const assets = new Set(cheques.map(c => c.assetName));
      if (assets.size > 1) throw new AppError('business', { userMessage: 'Une remise concerne un seul compte : choisissez les chèques d’un même actif.' });
      const assetName = cheques[0]!.assetName;
      const plannedOn = nextThursday(today());
      const deposit: BankDeposit = {
        id: `dep-${Date.now()}`,
        reference: null,
        accountLabel: `compte SGCI · SCI ${assetName}`,
        assetName,
        plannedOn,
        depositedOn: null,
        creditExpectedBy: addDays(plannedOn, 5),
        status: 'at-courier',
        cheques,
        total: cheques.reduce((sum, c) => sum + c.amount, 0),
        slips: {},
      };
      state.deposits = [deposit, ...state.deposits];
      state.cheques = state.cheques.map(c => (chequeIds.includes(c.id) ? { ...c, note: `Chez le coursier · dépôt du ${short(plannedOn)}` } : c));
      return delay(deposit, latency);
    },
    completeDeposit: async (id, slips) => {
      const deposit = state.deposits.find(d => d.id === id);
      if (!deposit) throw new AppError('resource-missing');
      if (deposit.status === 'deposited') throw new AppError('business', { userMessage: 'Cette remise est déjà validée.' });
      const untreated = deposit.cheques.filter(c => !slips[c.id]);
      if (untreated.length > 0) throw new AppError('business', { userMessage: `${untreated.length} chèque(s) sans bordereau ni mention « manquant ».` });
      const depositedOn = today();
      const missing = deposit.cheques.filter(c => slips[c.id]?.kind === 'missing').length;
      state.cheques = state.cheques.map(c =>
        deposit.cheques.some(d => d.id === c.id)
          ? { ...c, status: 'deposited' as const, depositedOn, note: slips[c.id]?.kind === 'missing' ? 'Bordereau manquant : à réclamer à la banque' : `Crédit attendu d’ici le ${short(deposit.creditExpectedBy)}` }
          : c,
      );
      state.deposits = state.deposits.map(d => (d.id === id ? { ...d, status: 'deposited' as const, depositedOn, slips, reference: `R-2026-${String(400 + state.deposits.length).padStart(4, '0')}`, cheques: state.cheques.filter(c => d.cheques.some(x => x.id === c.id)) } : d));
      collectionsAll.cheques = { ...collectionsAll.cheques, toDeposit: { count: state.cheques.filter(c => c.status === 'to-deposit').length, amount: state.cheques.filter(c => c.status === 'to-deposit').reduce((sum, c) => sum + c.amount, 0), note: 'coursier jeudi' }, deposited: { count: state.cheques.filter(c => c.status === 'deposited').length, note: missing > 0 ? `${missing} bordereau manquant à réclamer` : 'Suivi pendant 5 jours après le dépôt' } };
      return delay(state.deposits.find(d => d.id === id)!, latency);
    },
    returnCheque: async input => {
      const tenant = state.tenants.find(tn => tn.id === input.cheque.tenantId);
      if (!tenant) throw new AppError('validation', { userMessage: 'Le locataire indiqué est inconnu.' });
      if (input.issues.length === 0) throw new AppError('business', { userMessage: 'Ce chèque est conforme : enregistrez-le plutôt que de le rendre.' });
      if (!input.message.to.trim() || !input.message.body.trim()) throw new AppError('validation', { userMessage: 'La demande de nouveau règlement doit avoir un destinataire et un texte.' });
      const sentAt = new Date().toISOString();
      const event: AccountEvent = { id: `${tenant.id}-ret-${Date.now()}`, date: today(), kind: 'note', label: `Chèque n° ${input.cheque.chequeNumber} rendu (${input.issues.length} contrôle(s) en échec) · demande de nouveau règlement envoyée`, amount: input.cheque.amount };
      state.tenants = state.tenants.map(tn => (tn.id === tenant.id ? { ...tn, history: [event, ...tn.history] } : tn));
      return delay({ chequeNumber: input.cheque.chequeNumber, tenantName: tenant.name, amount: input.cheque.amount, sentTo: input.message.to, sentAt }, latency);
    },
    rejectCheque: async (id, reason, note) => {
      const cheque = state.cheques.find(c => c.id === id);
      if (!cheque) throw new AppError('resource-missing');
      if (cheque.status === 'rejected' || cheque.status === 'collected') throw new AppError('business', { userMessage: 'Ce chèque est déjà clos.' });
      const reasons: Record<string, string> = { 'insufficient-funds': 'Provision insuffisante', signature: 'Signature non conforme', amount: 'Montant irrégulier', expired: 'Chèque périmé', other: 'Autre motif' };
      const updated: ChequeRow = { ...cheque, status: 'rejected', note: `${reasons[reason] ?? reason}${note ? ` · ${note}` : ''}` };
      state.cheques = state.cheques.map(c => (c.id === id ? updated : c));
      const tenant = state.tenants.find(tn => tn.id === cheque.tenantId);
      if (tenant) {
        const event: AccountEvent = { id: `${tenant.id}-rej-${Date.now()}`, date: today(), kind: 'note', label: `Chèque n° ${cheque.chequeNumber} rejeté : ${reasons[reason] ?? reason}`, amount: cheque.amount };
        state.tenants = state.tenants.map(tn => (tn.id === tenant.id ? { ...tn, balance: tn.balance - cheque.amount, status: 'late' as const, history: [event, ...tn.history] } : tn));
      }
      return delay(updated, latency);
    },
    getCaptures: async statementId => delay(state.captures.get(statementId) ?? [], latency),
    attachCaptures: async (statementId, assignments) => {
      const lines = state.captures.get(statementId) ?? [];
      const missing = lines.filter(line => !assignments.some(a => a.lineId === line.id));
      if (missing.length > 0) throw new AppError('business', { userMessage: `${missing.length} crédits restent sans actif ni locataire.` });
      state.captures.set(statementId, lines.map(line => {
        const a = assignments.find(x => x.lineId === line.id)!;
        return { ...line, assetId: a.assetId, tenantId: a.tenantId };
      }));
      collectionsAll.statements = collectionsAll.statements.map(st => (st.id === statementId ? { ...st, status: 'validated' as const, statusDetail: `Captures rattachées le ${today()}` } : st));
      collectionsAll.inbox = collectionsAll.inbox.filter(item => item.statementId !== statementId);
      await delay(undefined, latency);
    },
    importStatement: async input => {
      const id = `s-${Date.now()}`;
      const imported: StatementDetail = { ...structuredClone(statementItcSeptember), id, period: input.period, imported: true, status: 'to-reconcile' };
      state.statements.set(id, imported);
      collectionsAll.statements = [{ id, bank: imported.bank, accountOwner: 'sci', assetName: imported.assetName, lastPeriod: input.period, status: 'to-reconcile', statusDetail: `Importé le ${today()}` }, ...collectionsAll.statements];
      return delay({ statementId: id }, latency);
    },
    listTenants: assetId => delay(byAsset(state.tenants.map(toTenantOption), assetId), latency),
    recordCheque: async input => {
      const tenant = state.tenants.map(toTenantOption).find(t => t.id === input.tenantId);
      if (!tenant) throw new AppError('validation', { userMessage: 'Le locataire indiqué est inconnu.' });
      const issues = chequeIssues(input, tenant.assetName);
      if (issues.length > 0) throw new AppError('business', { userMessage: 'Ce chèque n’est pas conforme : rendez-le au locataire.' });
      state.chequeSequence += 1;
      const id = `chq-${state.chequeSequence}`;
      const plannedOn = nextThursday(today());
      state.cheques = [{ id, chequeNumber: input.chequeNumber, tenantId: tenant.id, tenantName: tenant.name, assetName: tenant.assetName, bank: input.bank, amount: input.amount, receivedOn: input.receivedOn, depositedOn: null, status: 'to-deposit', note: `Coursier du ${short(plannedOn)}` }, ...state.cheques];
      return delay(
        {
          id,
          chequeNumber: input.chequeNumber,
          tenantName: tenant.name,
          lotCode: tenant.lotCode,
          amount: input.amount,
          allocationDetail: tenant.dueDetail,
          depositPlannedOn: plannedOn,
          depositAccountLabel: `compte SGCI · SCI ${tenant.assetName}`,
        },
        latency,
      );
    },
  };
}
