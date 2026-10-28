import type {
  AccountEvent,
  AssetRecord,
  BudgetDetail,
  ChequeRow,
  DocumentDetail,
  InvoiceDetail,
  ReportDetail,
  TenantAccount,
  BankAccount,
  BillingItem,
  CalendarRule,
  FeeSettings,
  ReminderTemplate,
  Services,
  SettingVersion,
  StatementDetail,
  UserRow,
  VersionedInput,
} from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { sessionStore } from '@/services/http/session-store';
import { delay } from './latency';
import { assets } from './fixtures/assets';
import { assetRecords } from './fixtures/asset-records';
import { dashboardAll } from './fixtures/dashboard';
import { collectionsAll } from './fixtures/collections';
import { statementItcSeptember } from './fixtures/statements';
import { tenantAccounts, toTenantOption, toTenantRow } from './fixtures/tenants';
import { notificationsAll } from './fixtures/notifications';
import { sampleLease, sampleTenantRows } from './fixtures/samples';
import { budgetDetail, capturesBgfiOctober, chequesAll, documentDetail, invoiceDetail, reportDetail } from './fixtures/details';
import { billingAll } from './fixtures/billing';
import { arrearsAll } from './fixtures/arrears';
import { reportsAll } from './fixtures/reports';
import { budgetAll } from './fixtures/budget';
import { documentsAll } from './fixtures/documents';
import {
  bankAccountsAll,
  billingItemsAll,
  calendarRulesAll,
  feesAll,
  reminderTemplatesAll,
  rolesAll,
  settingsAll,
  usersAll,
} from './fixtures/settings';
import { sessions, defaultSessionKey } from './fixtures/session';

const MOCK_TOKEN_PREFIX = 'mock:';
const DEMO_DOMAIN = 'pfo-immobilier.ci';
const DEMO_CODE = '123456';
/** Quelle session simulée derrière quelle adresse (prénom ou initiale.nom). */
const sessionEmails: Record<string, string[]> = {
  pmLead: ['elea', 'e.menard'],
  assetManager: ['elema', 'e.bosso'],
  financeManager: ['vincent', 'v.chapoutot'],
};

export interface MockOptions {
  latencyMs?: number;
  sessionKey?: string;
  /** Ouvre d'emblée la session simulée (confort de développement et captures) ; jamais par défaut. */
  autoSignIn?: boolean;
}

/**
 * Implémentation simulée des contrats. Même forme que l'API, données en mémoire, latence réglable.
 * Un filtre par actif réduit les jeux globaux, pour que le sélecteur d'actif ait un effet visible.
 */
export function createMockServices(options: MockOptions = {}): Services {
  const latency = options.latencyMs ?? 250;
  const fallbackKey = options.sessionKey ?? defaultSessionKey;
  if (options.autoSignIn && !sessionStore.getToken()) sessionStore.setToken(`${MOCK_TOKEN_PREFIX}${fallbackKey}`);
  /** Le jeton simulé porte la clé de session : « mock:pmLead ». Sans jeton, pas de session. */
  const sessionKeyFromToken = (): string | null => {
    const token = sessionStore.getToken();
    return token && token.startsWith(MOCK_TOKEN_PREFIX) ? token.slice(MOCK_TOKEN_PREFIX.length) : null;
  };
  const currentKey = () => sessionKeyFromToken() ?? fallbackKey;
  const activeSession = () => sessions[currentKey()] ?? sessions[defaultSessionKey]!;
  const byAsset = <Row extends { assetName: string }>(rows: Row[], assetId?: string): Row[] => {
    const name = assetName(assetId);
    return name ? rows.filter(row => row.assetName === name) : rows;
  };
  // État mutable de la simulation : les validations et enregistrements se voient jusqu'au rechargement.
  const state = {
    statements: new Map<string, StatementDetail>([[statementItcSeptember.id, structuredClone(statementItcSeptember)]]),
    chequeSequence: 45_822,
    assets: structuredClone(assets),
    assetRecords: structuredClone(assetRecords),
    notifications: structuredClone(notificationsAll),
    tenants: structuredClone(tenantAccounts),
    arrears: structuredClone(arrearsAll),
    invoices: billingAll.invoices.map(invoiceDetail),
    reports: reportsAll.rows.map(reportDetail),
    budgets: budgetAll.rows.map(budgetDetail),
    cheques: structuredClone(chequesAll),
    captures: new Map<string, typeof capturesBgfiOctober>([['s-6', structuredClone(capturesBgfiOctober)]]),
    documents: documentsAll.map(documentDetail),
    users: structuredClone(usersAll),
    billingItems: structuredClone(billingItemsAll),
    calendarRules: structuredClone(calendarRulesAll),
    reminderTemplates: structuredClone(reminderTemplatesAll),
    bankAccounts: structuredClone(bankAccountsAll),
    fees: structuredClone(feesAll),
  };
  const assetName = (assetId?: string) => (assetId ? state.assets.find(a => a.id === assetId)?.name : undefined);
  const author = () => `${activeSession().user.firstName} ${activeSession().user.lastName}`;
  const today = () => new Date().toISOString().slice(0, 10);
  const requireAdmin = () => {
    if (!activeSession().permissions.includes('admin')) throw new AppError('forbidden', { userMessage: 'Seul un administrateur peut modifier les paramètres.' });
  };
  /** Ajoute une version et recalcule celle en vigueur : la plus récente dont la date d'effet est passée. */
  const addVersion = <Value>(versions: SettingVersion<Value>[], input: VersionedInput<Value>) => {
    if (!input.effectiveFrom) throw new AppError('validation', { userMessage: 'La date d’effet est obligatoire.' });
    if (versions.some(v => v.effectiveFrom === input.effectiveFrom)) {
      throw new AppError('validation', { userMessage: `Une version prend déjà effet le ${input.effectiveFrom}. Choisissez une autre date d’effet.` });
    }
    const next: SettingVersion<Value> = {
      version: Math.max(0, ...versions.map(v => v.version)) + 1,
      effectiveFrom: input.effectiveFrom,
      createdAt: new Date().toISOString(),
      createdBy: author(),
      note: input.note,
      value: input.value,
    };
    const all = [next, ...versions].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version - a.version);
    const current = all.find(v => v.effectiveFrom <= today()) ?? all[all.length - 1]!;
    return { current, versions: all };
  };
  /** Les baux facturables pour une période : une seule règle pour l'aperçu et la génération. */
  const billableTenants = (periodStart: string) => state.tenants.filter(tn => tn.status !== 'ending' || (tn.lease.end ?? '9999') >= periodStart);
  const overview = () => ({
    sections: settingsAll.sections.map(section => {
      const counts: Record<string, number> = {
        users: state.users.length,
        'billing-items': state.billingItems.filter(item => item.active).length,
        calendar: state.calendarRules.length,
        'reminder-templates': state.reminderTemplates.length,
        'bank-accounts': state.bankAccounts.filter(account => account.active).length,
        fees: 1,
      };
      return { ...section, count: counts[section.key] ?? section.count };
    }),
  });

  return {
    demo: {
      enabled: true,
      sampleLease: async assetId => {
        const record = state.assetRecords.find(a => a.id === assetId);
        const vacant = record?.lots.find(lot => lot.status === 'vacant');
        return sampleLease(vacant?.code ?? '');
      },
      sampleTenantRows: async assetId => {
        const record = state.assetRecords.find(a => a.id === assetId);
        return sampleTenantRows((record?.lots ?? []).filter(lot => lot.status === 'vacant').map(lot => lot.code));
      },
    },
    session: {
      getSession: async () => {
        if (!sessionKeyFromToken()) throw new AppError('unauthorized');
        return delay(activeSession(), latency);
      },
    },
    search: {
      query: async (text, scope) => {
        const needle = text.trim().toLowerCase();
        if (needle.length < 2) return [];
        const hit = (...values: (string | null)[]) => values.some(v => v !== null && v.toLowerCase().includes(needle));
        const results = [
          ...(scope === 'all' || scope === 'asset'
            ? state.assets.filter(a => hit(a.name, a.location, a.ownerName)).map(a => ({ kind: 'asset' as const, id: a.id, title: a.name, detail: `${a.location} · ${a.lotCount} lots` }))
            : []),
          ...(scope === 'all' || scope === 'tenant'
            ? state.tenants.filter(tn => hit(tn.name, ...tn.lotCodes)).map(tn => ({ kind: 'tenant' as const, id: tn.id, title: tn.name, detail: `${tn.assetName} · ${tn.lotCodes.join(', ')}` }))
            : []),
          ...(scope === 'all' || scope === 'invoice'
            ? billingAll.invoices.filter(i => hit(i.tenantName, i.assetName)).map(i => ({ kind: 'invoice' as const, id: i.id, title: `${i.tenantName} · ${i.periodStart.slice(0, 7)}`, detail: i.assetName }))
            : []),
          ...(scope === 'all' || scope === 'document'
            ? documentsAll.filter(d => hit(d.name, d.assetName, d.tenantName)).map(d => ({ kind: 'document' as const, id: d.id, title: d.name, detail: d.assetName }))
            : []),
        ];
        return delay(results.slice(0, 50), latency);
      },
    },
    notifications: {
      list: () => delay(state.notifications, latency),
      markAllRead: async () => {
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
        await delay(undefined, 0);
      },
    },
    auth: {
      requestCode: async email => {
        const normalized = email.trim().toLowerCase();
        if (!normalized.endsWith(`@${DEMO_DOMAIN}`)) {
          throw new AppError('validation', { userMessage: `Cette adresse n’est pas connue de SUA. Utilisez votre adresse @${DEMO_DOMAIN}.` });
        }
        return delay({ expiresInMinutes: 10, demoCode: DEMO_CODE }, latency);
      },
      verifyCode: async (email, code) => {
        if (code.trim() !== DEMO_CODE) throw new AppError('validation', { userMessage: 'Code incorrect ou expiré. Vérifiez les six chiffres ou demandez un nouveau code.' });
        const local = email.trim().toLowerCase().split('@')[0] ?? '';
        const key = Object.entries(sessionEmails).find(([, prefixes]) => prefixes.some(prefix => local.startsWith(prefix)))?.[0] ?? fallbackKey;
        await delay(undefined, latency);
        sessionStore.setToken(`${MOCK_TOKEN_PREFIX}${key}`);
      },
      signOut: async () => {
        sessionStore.setToken(null);
        await delay(undefined, 0);
      },
    },
    assets: {
      listAssets: () => delay(state.assets, latency),
      getAsset: async id => {
        const asset = state.assets.find(a => a.id === id);
        if (!asset) throw new AppError('resource-missing');
        return delay(asset, latency);
      },
      getAssetRecord: async id => {
        const found = state.assetRecords.find(a => a.id === id);
        if (!found) throw new AppError('resource-missing');
        return delay(found, latency);
      },
      createAsset: async input => {
        if (!activeSession().permissions.includes('asset.write')) throw new AppError('forbidden', { userMessage: 'Vous n’avez pas le droit de créer un actif.' });
        if (state.assets.some(a => a.name.toLowerCase() === input.name.trim().toLowerCase())) {
          throw new AppError('validation', { userMessage: `Un actif nommé « ${input.name.trim()} » existe déjà.` });
        }
        const codes = new Set<string>();
        for (const lot of input.lots) {
          if (codes.has(lot.code)) throw new AppError('validation', { userMessage: `La référence de lot ${lot.code} apparaît deux fois.` });
          codes.add(lot.code);
        }
        const id = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `actif-${Date.now()}`;
        const code = input.name.trim().split(/\s+/).map(word => word[0]?.toUpperCase() ?? '').join('').slice(0, 4) || 'ACT';
        const buildings = new Set(input.lots.map(lot => lot.building));
        const summary = {
          id,
          code,
          name: input.name.trim(),
          location: input.location.trim(),
          ownerName: input.owner.name.trim(),
          buildingCount: buildings.size,
          lotCount: input.lots.length,
          occupancyRate: 0,
          unpaidAmount: 0,
          managerName: author(),
          bankAccountOwner: input.bankAccountOwner,
          expensesPaidBy: input.expensesPaidBy,
        };
        const signed = new Date(input.mandate.signedOn);
        const ends = new Date(Date.UTC(signed.getUTCFullYear() + input.mandate.durationYears, signed.getUTCMonth(), signed.getUTCDate() - 1));
        const fullRecord: AssetRecord = {
          ...summary,
          owner: input.owner,
          mandate: { ...input.mandate, endsOn: ends.toISOString().slice(0, 10) },
          rentAccountLabel:
            input.bankAccountOwner === 'sci' ? `Compte de la SCI · ${input.owner.name}${input.rentAccountLastDigits ? ` •••• ${input.rentAccountLastDigits}` : ''}` : 'Compte de PFO Immobilier',
          billingItemCodes: input.billingItemCodes,
          lots: input.lots.map((lot, index) => ({ id: `lot-${id}-${index}`, ...lot, status: 'vacant' as const, tenantName: null, monthlyRent: null })),
          tenants: [],
        };
        state.assets = [...state.assets, summary];
        state.assetRecords = [...state.assetRecords, fullRecord];
        return delay(summary, latency);
      },
    },
    tenants: {
      getAccount: async id => {
        const account = state.tenants.find(tn => tn.id === id);
        if (!account) throw new AppError('resource-missing');
        return delay(account, latency);
      },
      sendReminder: async (id, input) => {
        const account = state.tenants.find(tn => tn.id === id);
        if (!account) throw new AppError('resource-missing');
        if (account.balance >= 0) throw new AppError('business', { userMessage: `${account.name} est à jour : aucune relance à envoyer.` });
        const event: AccountEvent = { id: `${id}-r-${Date.now()}`, date: today(), kind: 'reminder', label: `${input.subject}`, amount: null };
        const updated: TenantAccount = { ...account, reminderLevel: input.level, history: [event, ...account.history] };
        state.tenants = state.tenants.map(tn => (tn.id === id ? updated : tn));
        state.arrears = { ...state.arrears, rows: state.arrears.rows.map(row => (row.tenantId === id ? { ...row, reminderLevel: input.level } : row)) };
        return delay(updated, latency);
      },
      createFromLease: async (assetId, input) => {
        const record = state.assetRecords.find(a => a.id === assetId);
        if (!record) throw new AppError('resource-missing');
        const lot = record.lots.find(l => l.code === input.lotCode);
        if (!lot) throw new AppError('validation', { userMessage: `Le lot ${input.lotCode} n’existe pas dans cet actif.` });
        if (lot.status === 'occupied') throw new AppError('validation', { userMessage: `Le lot ${input.lotCode} est déjà occupé par ${lot.tenantName ?? ''}.` });
        const id = `tn-${Date.now()}`;
        const quarterly = (input.lease.monthlyRent + input.lease.monthlyCharges) * 3;
        const entry = input.lease.deposit + input.lease.keyMoney;
        const start = new Date(input.lease.start);
        const end = new Date(Date.UTC(start.getUTCFullYear() + input.lease.durationYears, start.getUTCMonth(), start.getUTCDate() - 1)).toISOString().slice(0, 10);
        const account: TenantAccount = {
          id,
          name: input.name,
          contactName: input.contactName,
          email: input.email,
          registration: input.registration || null,
          assetId,
          assetName: record.name,
          lotCodes: [input.lotCode],
          lease: { ...input.lease, end },
          balance: -entry,
          status: 'current',
          reminderLevel: 'none',
          schedule: [
            { id: `${id}-entry`, invoiceId: null, date: input.lease.start, label: 'Facture d’entrée', invoiced: entry, collected: 0, balance: -entry, status: 'due' },
            { id: `${id}-first`, invoiceId: null, date: input.lease.start, label: 'Premier avis d’échéance', invoiced: quarterly, collected: 0, balance: 0, status: 'upcoming' },
          ],
          history: [{ id: `${id}-h0`, date: today(), kind: 'invoice', label: 'Facture d’entrée émise', amount: entry }],
        };
        state.tenants = [...state.tenants, account];
        const lots = record.lots.map(l => (l.code === input.lotCode ? { ...l, status: 'occupied' as const, tenantName: input.name, monthlyRent: input.lease.monthlyRent } : l));
        const occupied = lots.filter(l => l.status === 'occupied').length;
        const updatedRecord = { ...record, lots, tenants: [...record.tenants, toTenantRow(account)], occupancyRate: lots.length ? occupied / lots.length : 0 };
        state.assetRecords = state.assetRecords.map(a => (a.id === assetId ? updatedRecord : a));
        state.assets = state.assets.map(a => (a.id === assetId ? { ...a, occupancyRate: updatedRecord.occupancyRate } : a));
        return delay(account, latency);
      },
      importRows: async (assetId, rows) => {
        const record = state.assetRecords.find(a => a.id === assetId);
        if (!record) throw new AppError('resource-missing');
        const created: string[] = [];
        for (const row of rows) {
          const lot = record.lots.find(l => l.code === row.lotCode);
          if (!lot) throw new AppError('validation', { userMessage: `Le lot ${row.lotCode} n’existe pas dans cet actif.` });
          if (lot.status === 'occupied') throw new AppError('validation', { userMessage: `Le lot ${row.lotCode} est déjà occupé.` });
        }
        for (const row of rows) {
          const id = `tn-${Date.now()}-${created.length}`;
          const account: TenantAccount = {
            id,
            name: row.name,
            contactName: row.contactName,
            email: row.email,
            registration: null,
            assetId,
            assetName: record.name,
            lotCodes: [row.lotCode],
            lease: { start: row.start, end: null, durationYears: 3, monthlyRent: row.monthlyRent, monthlyCharges: row.monthlyCharges, deposit: row.deposit, keyMoney: 0, periodicity: 'quarterly', indexation: '' },
            balance: 0,
            status: 'current',
            reminderLevel: 'none',
            schedule: [],
            history: [{ id: `${id}-h0`, date: today(), kind: 'note', label: 'Importé depuis l’état locatif', amount: null }],
          };
          state.tenants = [...state.tenants, account];
          created.push(id);
          const current = state.assetRecords.find(a => a.id === assetId)!;
          const lots = current.lots.map(l => (l.code === row.lotCode ? { ...l, status: 'occupied' as const, tenantName: row.name, monthlyRent: row.monthlyRent } : l));
          const occupied = lots.filter(l => l.status === 'occupied').length;
          const updatedRecord = { ...current, lots, tenants: [...current.tenants, toTenantRow(account)], occupancyRate: lots.length ? occupied / lots.length : 0 };
          state.assetRecords = state.assetRecords.map(a => (a.id === assetId ? updatedRecord : a));
          state.assets = state.assets.map(a => (a.id === assetId ? { ...a, occupancyRate: updatedRecord.occupancyRate } : a));
        }
        return delay({ created: created.length, tenantIds: created }, latency);
      },
    },
    dashboard: {
      getSummary: assetId => {
        if (!assetId) return delay(dashboardAll, latency);
        return delay({ ...dashboardAll, assets: dashboardAll.assets.filter(row => row.assetId === assetId) }, latency);
      },
    },
    collections: {
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
        const pending = statement.lines.filter(line => line.state !== 'matched' && line.state !== 'excluded');
        const undecided = pending.filter(line => !decisions.some(d => d.lineId === line.id));
        if (undecided.length > 0) {
          throw new AppError('business', { userMessage: `${undecided.length} lignes restent à traiter avant la validation.` });
        }
        const lines = statement.lines.map(line => {
          const decision = decisions.find(d => d.lineId === line.id);
          if (!decision) return line;
          return { ...line, state: decision.action === 'confirm' ? ('matched' as const) : ('excluded' as const) };
        });
        state.statements.set(id, { ...statement, lines, status: 'validated', imported: true });
        const matched = lines.filter(line => line.state === 'matched');
        return delay(
          {
            statementId: id,
            validatedAt: new Date().toISOString(),
            matchedCount: matched.length,
            excludedCount: lines.length - matched.length,
            collectedAmount: matched.reduce((sum, line) => sum + line.amount, 0),
          },
          latency,
        );
      },
      listCheques: assetId => delay(byAsset(state.cheques, assetId), latency),
      markChequesDeposited: async ids => {
        state.cheques = state.cheques.map(c => (ids.includes(c.id) && c.status === 'to-deposit' ? { ...c, status: 'deposited' as const, depositedOn: today(), note: 'Crédit attendu' } : c));
        return delay(state.cheques.filter(c => ids.includes(c.id)), latency);
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
        state.chequeSequence += 1;
        return delay(
          {
            id: `chq-${state.chequeSequence}`,
            chequeNumber: input.chequeNumber,
            tenantName: tenant.name,
            lotCode: tenant.lotCode,
            amount: input.amount,
            allocationDetail: tenant.dueDetail,
            depositPlannedOn: '2026-10-22',
            depositAccountLabel: `compte SGCI · SCI ${tenant.assetName}`,
          },
          latency,
        );
      },
    },
    billing: {
      getOverview: assetId => {
        const invoices = byAsset(state.invoices, assetId);
        const campaign = {
          ...billingAll.campaign,
          invoiceCount: invoices.length,
          issuedCount: invoices.filter(i => i.status !== 'draft' && i.status !== 'to-check').length,
          toCheckCount: invoices.filter(i => i.status === 'to-check').length,
          deliveredCount: invoices.filter(i => i.deliveryDetail !== null).length,
          totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
        };
        return delay({ campaign, invoices }, latency);
      },
      getInvoice: async id => {
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) throw new AppError('resource-missing');
        return delay(invoice, latency);
      },
      markChecked: async id => {
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) throw new AppError('resource-missing');
        if (invoice.status !== 'to-check' && invoice.status !== 'draft') throw new AppError('business', { userMessage: 'Cette facture a déjà été émise.' });
        const updated: InvoiceDetail = { ...invoice, status: 'issued', issuedOn: today(), history: [{ id: `${id}-chk`, date: today(), kind: 'note', label: `Contrôlée et émise par ${author()}`, amount: null }, ...invoice.history] };
        state.invoices = state.invoices.map(i => (i.id === id ? updated : i));
        return delay(updated, latency);
      },
      recordDelivery: async (id, input) => {
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) throw new AppError('resource-missing');
        if (invoice.status === 'draft' || invoice.status === 'to-check') throw new AppError('business', { userMessage: 'Émettez la facture avant d’enregistrer sa distribution.' });
        const updated: InvoiceDetail = {
          ...invoice,
          status: invoice.status === 'issued' ? 'delivered' : invoice.status,
          deliveredOn: input.date,
          deliveryMode: input.mode,
          deliveryProof: input.proof,
          deliveryDetail: `${input.proof} · ${input.date}`,
          history: [{ id: `${id}-dlv-${Date.now()}`, date: input.date, kind: 'note', label: `Distribuée (${input.proof})`, amount: null }, ...invoice.history],
        };
        state.invoices = state.invoices.map(i => (i.id === id ? updated : i));
        return delay(updated, latency);
      },
      previewCampaign: async period => {
        const start = `${period.year}-${String((period.quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
        const alreadyPrepared = state.invoices.some(i => i.periodStart === start);
        const leases = billableTenants(start);
        const estimated = leases.reduce((sum, tn) => sum + (tn.lease.monthlyRent + tn.lease.monthlyCharges) * 3, 0);
        const previousMonth = new Date(Date.UTC(period.year, (period.quarter - 1) * 3 - 1, 20)).toISOString().slice(0, 10);
        return delay({ period, leaseCount: leases.length, estimatedAmount: estimated, issueDeadline: previousMonth, dueDate: start.slice(0, 8) + '05', alreadyPrepared }, latency);
      },
      prepareCampaign: async period => {
        const start = `${period.year}-${String((period.quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
        if (state.invoices.some(i => i.periodStart === start)) throw new AppError('business', { userMessage: `La campagne T${period.quarter} ${period.year} est déjà préparée.` });
        const created = billableTenants(start).map((tn, index) => {
          const amount = (tn.lease.monthlyRent + tn.lease.monthlyCharges) * 3;
          const row = { id: `f-${period.year}${period.quarter}-${index}`, tenantName: tn.name, assetName: tn.assetName, periodStart: start, amount, dueDate: start.slice(0, 8) + '05', status: 'to-check' as const, deliveryDetail: null };
          return invoiceDetail(row);
        });
        state.invoices = [...state.invoices, ...created];
        return delay({ created: created.length }, latency);
      },
      issueChecked: async assetId => {
        const name = assetName(assetId);
        let issued = 0;
        state.invoices = state.invoices.map(i => {
          if (i.status === 'to-check' && (!name || i.assetName === name)) {
            issued += 1;
            return { ...i, status: 'issued' as const, issuedOn: today(), history: [{ id: `${i.id}-iss2`, date: today(), kind: 'invoice' as const, label: 'Facture émise', amount: i.amount }, ...i.history] };
          }
          return i;
        });
        return delay({ issued }, latency);
      },
    },
    arrears: {
      getOverview: assetId => {
        const rows = byAsset(state.arrears.rows, assetId);
        return delay(
          {
            ...state.arrears,
            rows,
            totalDue: rows.reduce((sum, r) => sum + r.amountDue, 0),
            preLitigationCount: rows.filter(r => r.reminderLevel === 'pre-litigation').length,
          },
          latency,
        );
      },
    },
    reports: {
      getOverview: assetId => delay({ ...reportsAll, rows: byAsset(state.reports, assetId) }, latency),
      getReport: async id => {
        const report = state.reports.find(r => r.id === id);
        if (!report) throw new AppError('resource-missing');
        return delay(report, latency);
      },
      generateDrafts: async period => {
        const missing = state.assets.filter(a => !state.reports.some(r => r.assetName === a.name && r.period.year === period.year && r.period.quarter === period.quarter));
        if (missing.length === 0) throw new AppError('business', { userMessage: `Tous les CRG T${period.quarter} ${period.year} existent déjà.` });
        const due = new Date(Date.UTC(period.year, period.quarter * 3, 15)).toISOString().slice(0, 10);
        const created = missing.map(a =>
          reportDetail({ id: `r-${period.year}${period.quarter}-${a.id}`, assetName: a.name, period, status: 'draft', preparedBy: author(), dueDate: due, amountToTransfer: null, stepDetail: 'Brouillon généré, en attente des rapprochements' }),
        );
        state.reports = [...created, ...state.reports];
        return delay({ created: created.length }, latency);
      },
      transition: async (id, action, note) => {
        const report = state.reports.find(r => r.id === id);
        if (!report) throw new AppError('resource-missing');
        const next: Record<string, ReportDetail['status'] | undefined> = {
          'draft:submit': 'in-review',
          'in-review:validate': 'validated',
          'validated:sign': 'signed',
          'in-review:reopen': 'draft',
          'validated:reopen': 'in-review',
        };
        const status = next[`${report.status}:${action}`];
        if (!status) throw new AppError('business', { userMessage: 'Cette étape n’est pas possible dans l’état actuel du CRG.' });
        const labels: Record<string, string> = { submit: 'Envoyé en relecture', validate: 'Validé', sign: 'Signé et transmis au propriétaire', reopen: 'Rouvert' };
        const amount = report.amountToTransfer ?? Math.round(28_000_000 + Math.random() * 20_000_000);
        const updated: ReportDetail = {
          ...report,
          status,
          amountToTransfer: amount,
          sections: report.sections.map(section => (section.key === 'transfer' ? { ...section, amount } : section)),
          stepDetail: `${labels[action]} par ${author()} le ${today()}${note ? ` · ${note}` : ''}`,
          signatories: status === 'signed' ? report.signatories.map(sg => ({ ...sg, signedOn: today() })) : report.signatories,
          history: [{ id: `${id}-${action}-${Date.now()}`, date: today(), kind: 'note', label: `${labels[action]} par ${author()}${note ? ` · ${note}` : ''}`, amount: null }, ...report.history],
        };
        state.reports = state.reports.map(r => (r.id === id ? updated : r));
        return delay(updated, latency);
      },
    },
    budget: {
      getOverview: assetId => delay({ ...budgetAll, rows: byAsset(state.budgets, assetId) }, latency),
      getBudget: async id => {
        const found = state.budgets.find(b => b.id === id);
        if (!found) throw new AppError('resource-missing');
        return delay(found, latency);
      },
      reestimate: async (id, input) => {
        const found = state.budgets.find(b => b.id === id);
        if (!found) throw new AppError('resource-missing');
        if (found.status === 'settled') throw new AppError('business', { userMessage: 'La reddition de ce budget est faite : il ne se réestime plus.' });
        const lines = found.lines.map(line => {
          const change = input.lines.find(l => l.id === line.id);
          return change ? { ...line, reestimated: change.reestimated } : line;
        });
        const updated: BudgetDetail = {
          ...found,
          lines,
          status: 're-estimated',
          budgetAmount: lines.reduce((sum, line) => sum + (line.reestimated ?? line.budget), 0),
          detail: `Réestimé le ${today()} par ${author()}${input.note ? ` · ${input.note}` : ''}`,
        };
        state.budgets = state.budgets.map(b => (b.id === id ? updated : b));
        return delay(updated, latency);
      },
      prepareYear: async year => {
        const missing = state.assets.filter(a => !state.budgets.some(b => b.assetName === a.name && b.year === year));
        if (missing.length === 0) throw new AppError('business', { userMessage: `Les budgets ${year} existent déjà pour tous les actifs.` });
        const created = missing.map(a => {
          const previous = state.budgets.filter(b => b.assetName === a.name).sort((x, y) => y.year - x.year)[0];
          const amount = previous ? Math.round(previous.budgetAmount * 1.03) : 50_000_000;
          return budgetDetail({ id: `b-${year}-${a.id}`, assetName: a.name, year, status: 'initial', budgetAmount: amount, realisedAmount: 0, settlementDeadline: `${year + 1}-04-15`, detail: `Budget initial préparé le ${today()} depuis les devis` });
        });
        state.budgets = [...created, ...state.budgets];
        return delay({ created: created.length }, latency);
      },
    },
    documents: {
      listDocuments: assetId => delay(byAsset(state.documents, assetId), latency),
      getDocument: async id => {
        const found = state.documents.find(d => d.id === id);
        if (!found) throw new AppError('resource-missing');
        return delay(found, latency);
      },
      upload: async input => {
        const asset = input.assetId ? state.assets.find(a => a.id === input.assetId) : undefined;
        const tenant = input.tenantId ? state.tenants.find(tn => tn.id === input.tenantId) : undefined;
        const existing = input.replacesId ? state.documents.find(d => d.id === input.replacesId) : undefined;
        if (input.replacesId && !existing) throw new AppError('resource-missing');
        const version = existing ? existing.version + 1 : 1;
        const document: DocumentDetail = {
          id: existing?.id ?? `d-${Date.now()}`,
          name: input.name,
          kind: input.kind,
          assetName: asset?.name ?? existing?.assetName ?? tenant?.assetName ?? '',
          assetId: asset?.id ?? existing?.assetId ?? tenant?.assetId ?? null,
          tenantName: tenant?.name ?? existing?.tenantName ?? null,
          tenantId: tenant?.id ?? existing?.tenantId ?? null,
          updatedAt: today(),
          version,
          sizeLabel: `${200 + version * 10} Ko`,
          formatLabel: 'PDF',
          versions: [{ version, updatedAt: today(), updatedBy: author(), note: input.note }, ...(existing?.versions ?? [])],
        };
        state.documents = existing ? state.documents.map(d => (d.id === existing.id ? document : d)) : [document, ...state.documents];
        return delay(document, latency);
      },
      download: async id => {
        const found = state.documents.find(d => d.id === id);
        if (!found) throw new AppError('resource-missing');
        return new Blob([`${found.name}\nVersion ${found.version} · document de démonstration`], { type: 'text/plain;charset=utf-8' });
      },
    },
    settings: {
      getOverview: () => delay(overview(), latency),
      listUsers: () => delay(state.users, latency),
      listRoles: () => delay(rolesAll, latency),
      inviteUser: async input => {
        requireAdmin();
        if (state.users.some(user => user.email.toLowerCase() === input.email.toLowerCase())) {
          throw new AppError('validation', { userMessage: 'Cette adresse e-mail a déjà un compte.' });
        }
        const user: UserRow = { id: `u-${Date.now()}`, ...input, status: 'invited', lastSeenAt: null };
        state.users = [...state.users, user];
        return delay(user, latency);
      },
      listBillingItems: () => delay(state.billingItems, latency),
      saveBillingItem: async (input, id) => {
        requireAdmin();
        const duplicate = state.billingItems.find(item => item.code === input.code && item.id !== id);
        if (duplicate) throw new AppError('validation', { userMessage: `Le code ${input.code} est déjà utilisé par « ${duplicate.label} ».` });
        const existing = id ? state.billingItems.find(item => item.id === id) : undefined;
        if (id && !existing) throw new AppError('resource-missing');
        const item: BillingItem = {
          ...(existing ?? { id: `bi-${Date.now()}`, assetScope: 'all' as const, active: true }),
          code: input.code,
          label: input.label,
          ...addVersion(existing?.versions ?? [], input),
        };
        state.billingItems = existing ? state.billingItems.map(i => (i.id === id ? item : i)) : [...state.billingItems, item];
        return delay(item, latency);
      },
      listCalendarRules: () => delay(state.calendarRules, latency),
      saveCalendarRule: async (id, input) => {
        requireAdmin();
        const existing = state.calendarRules.find(rule => rule.id === id);
        if (!existing) throw new AppError('resource-missing');
        const rule: CalendarRule = { ...existing, ...addVersion(existing.versions, input) };
        state.calendarRules = state.calendarRules.map(r => (r.id === id ? rule : r));
        return delay(rule, latency);
      },
      listReminderTemplates: () => delay(state.reminderTemplates, latency),
      saveReminderTemplate: async (id, input) => {
        requireAdmin();
        const existing = state.reminderTemplates.find(template => template.id === id);
        if (!existing) throw new AppError('resource-missing');
        const template: ReminderTemplate = { ...existing, ...addVersion(existing.versions, input) };
        state.reminderTemplates = state.reminderTemplates.map(t => (t.id === id ? template : t));
        return delay(template, latency);
      },
      listBankAccounts: () => delay(state.bankAccounts, latency),
      saveBankAccount: async (input, id) => {
        requireAdmin();
        const existing = id ? state.bankAccounts.find(account => account.id === id) : undefined;
        if (id && !existing) throw new AppError('resource-missing');
        const { lastDigits, ...rest } = input;
        const accountLabel = `•••• ${lastDigits}`;
        const account: BankAccount = existing ? { ...existing, ...rest, accountLabel } : { id: `ba-${Date.now()}`, ...rest, accountLabel, active: true };
        state.bankAccounts = existing ? state.bankAccounts.map(a => (a.id === id ? account : a)) : [...state.bankAccounts, account];
        return delay(account, latency);
      },
      getFees: () => delay(state.fees, latency),
      saveFees: async input => {
        requireAdmin();
        const fees: FeeSettings = addVersion(state.fees.versions, input);
        state.fees = fees;
        return delay(fees, latency);
      },
    },
  };
}
