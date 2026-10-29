import type {
  Allocation,
  ExcludedQualification,
  OpenInvoice,
  PaymentProof,
  ReconciliationDecision,
  ReconciliationLine,
  StatementDetail,
  StatementTenant,
} from '@/services/contracts';
import type { ReconciliationLineState } from '@/shared/status';

export type ExtraKind = 'advance' | 'deposit' | 'penalties';
export type LineTab = ReconciliationLineState;

/** Ce que la personne a fait sur une ligne, conservé en brouillon jusqu'à la validation. */
export interface LineWork {
  /** Locataire choisi à la main ; `null` : celui que l'outil propose. */
  tenantId: string | null;
  /** Autres locataires ajoutés à la ventilation (règlement groupé). */
  others: string[];
  /** Montant par facture (id) ou par part hors facture (id de l'extra) ; vide : proposition de l'outil. */
  amounts: Record<string, number>;
  extras: { id: string; kind: ExtraKind; tenantId: string }[];
  offAccount: { amount: number; reason: string } | null;
  proof: PaymentProof | null;
  decision: 'impute' | 'exclude' | null;
  qualification: ExcludedQualification | null;
  /** Ligne écartée remise en rapprochement : elle repasse en « non reconnue ». */
  reinstated: boolean;
  /** Ligne imputée reprise après réouverture du rapprochement (E2.11) : elle repasse « à vérifier ». */
  correcting: boolean;
}

export const emptyWork: LineWork = { tenantId: null, others: [], amounts: {}, extras: [], offAccount: null, proof: null, decision: null, qualification: null, reinstated: false, correcting: false };

export const workOf = (work: Record<string, LineWork>, lineId: string): LineWork => work[lineId] ?? emptyWork;

export function effectiveState(line: ReconciliationLine, work: LineWork): ReconciliationLineState {
  if (work.decision === 'impute') return 'matched';
  if (work.decision === 'exclude') return 'excluded';
  if (work.reinstated) return 'unrecognised';
  if (work.correcting) return 'to-check';
  return line.state;
}

/** Le locataire retenu : choisi à la main (« » quand la personne a retiré le choix), sinon celui que propose l'outil. */
export const tenantIdOf = (line: ReconciliationLine, work: LineWork): string | null => {
  if (work.reinstated || work.tenantId !== null) return work.tenantId || null;
  return line.tenantId;
};
export const proofOf = (line: ReconciliationLine, work: LineWork): PaymentProof | null => work.proof ?? line.proof;
export const qualificationOf = (line: ReconciliationLine, work: LineWork): ExcludedQualification | null => (work.reinstated ? null : (work.qualification ?? line.exclusion));
/** Une ligne qui compte dans la progression : à traiter au départ, ou remise en rapprochement. */
export const isOpen = (line: ReconciliationLine, work: LineWork): boolean => work.reinstated || work.correcting || (line.state !== 'matched' && line.state !== 'excluded');
export const isEditable = (line: ReconciliationLine, work: LineWork): boolean => isOpen(line, work) && work.decision === null;

/** Proposition de l'outil (Q17) : les périodes antérieures d'abord, puis le loyer avant le reste, jusqu'à épuisement. */
export function proposeAmounts(invoices: OpenInvoice[], amount: number): Record<string, number> {
  const rank = (inv: OpenInvoice) => (inv.period === 'prior' ? 0 : 2) + (inv.item === 'rent' ? 0 : 1);
  const ordered = [...invoices].sort((a, b) => rank(a) - rank(b));
  const out: Record<string, number> = {};
  let rest = Math.max(0, amount);
  for (const inv of ordered) {
    const part = Math.min(rest, inv.due);
    out[inv.id] = part;
    rest -= part;
  }
  return out;
}

export interface AllocationRow {
  id: string;
  kind: 'invoice' | ExtraKind;
  tenantId: string;
  invoice: OpenInvoice | null;
  amount: number;
}

const tenantById = (tenants: StatementTenant[], id: string | null) => (id ? (tenants.find(tn => tn.id === id) ?? null) : null);

/** Les parts du règlement telles qu'elles s'affichent : factures du locataire, des autres, parts hors facture. */
export function rowsOf(line: ReconciliationLine, work: LineWork, tenants: StatementTenant[]): AllocationRow[] {
  const origin = tenantById(tenants, tenantIdOf(line, work));
  if (!origin) return [];
  const touched = Object.keys(work.amounts).length > 0;
  const proposed = touched ? {} : proposeAmounts(origin.invoices, line.amount);
  const amountOf = (id: string) => work.amounts[id] ?? proposed[id] ?? 0;
  const invoiceRows = [origin, ...work.others.map(id => tenantById(tenants, id)).filter((tn): tn is StatementTenant => tn !== null)].flatMap(tn =>
    tn.invoices.map(inv => ({ id: inv.id, kind: 'invoice' as const, tenantId: tn.id, invoice: inv, amount: amountOf(inv.id) })),
  );
  const extraRows = work.extras.map(extra => ({ id: extra.id, kind: extra.kind, tenantId: extra.tenantId, invoice: null, amount: amountOf(extra.id) }));
  return [...invoiceRows, ...extraRows];
}

export interface Balance {
  allocated: number;
  remaining: number;
  /** Toutes les factures ouvertes sont soldées : un reste positif passe en réglé d'avance. */
  covered: boolean;
  surplus: number;
}

export function balanceOf(line: ReconciliationLine, rows: AllocationRow[], work: LineWork): Balance {
  const allocated = rows.reduce((sum, row) => sum + row.amount, 0) + (work.offAccount?.amount ?? 0);
  const remaining = line.amount - allocated;
  const covered = rows.filter(row => row.invoice).every(row => row.amount >= (row.invoice?.due ?? 0));
  return { allocated, remaining, covered, surplus: remaining > 0 && covered ? remaining : 0 };
}

export type ImputeBlock = 'internal' | 'no-tenant' | 'no-proof' | 'remaining' | 'over' | 'off-reason' | null;

/** Pourquoi la ligne ne peut pas encore être imputée ; `null` quand tout est prêt. */
export function imputeBlock(line: ReconciliationLine, work: LineWork, tenants: StatementTenant[]): ImputeBlock {
  if (line.internal) return 'internal';
  if (!tenantIdOf(line, work)) return 'no-tenant';
  if (!proofOf(line, work)) return 'no-proof';
  const balance = balanceOf(line, rowsOf(line, work, tenants), work);
  if (balance.remaining < 0) return 'over';
  if (balance.remaining > 0 && balance.surplus === 0) return 'remaining';
  if (work.offAccount && !work.offAccount.reason.trim()) return 'off-reason';
  return null;
}

export const needsNote = (reason: ExcludedQualification['reason']) => reason === 'ignore' || reason === 'other';
export const qualificationValid = (q: ExcludedQualification | null): q is ExcludedQualification => q !== null && (!needsNote(q.reason) || Boolean(q.note?.trim()));

export function imputeDecision(line: ReconciliationLine, work: LineWork, tenants: StatementTenant[]): ReconciliationDecision | null {
  const tenantId = tenantIdOf(line, work);
  const proof = proofOf(line, work);
  if (!tenantId || !proof || imputeBlock(line, work, tenants) !== null) return null;
  const rows = rowsOf(line, work, tenants);
  const balance = balanceOf(line, rows, work);
  const allocations: Allocation[] = rows.filter(row => row.amount > 0).map(row => ({ kind: row.kind, tenantId: row.tenantId, invoiceId: row.invoice?.id ?? null, amount: row.amount }));
  if (balance.surplus > 0) allocations.push({ kind: 'advance', tenantId, invoiceId: null, amount: balance.surplus });
  return { lineId: line.id, action: 'impute', tenantId, allocations, offAccount: work.offAccount, proof };
}

/** Les décisions envoyées à la validation : imputations complètes et qualifications des écartées. */
export function buildDecisions(statement: StatementDetail, works: Record<string, LineWork>): ReconciliationDecision[] {
  const decisions: ReconciliationDecision[] = [];
  for (const line of statement.lines) {
    const work = workOf(works, line.id);
    if (work.decision === 'impute') {
      const decision = imputeDecision(line, work, statement.tenants);
      if (decision) decisions.push(decision);
    } else if (work.decision === 'exclude' || (line.state === 'excluded' && !work.reinstated && work.qualification)) {
      const qualification = qualificationOf(line, work);
      if (qualificationValid(qualification)) decisions.push({ lineId: line.id, action: 'exclude', qualification });
    }
  }
  return decisions;
}

export interface Counts {
  byState: Record<ReconciliationLineState, number>;
  toQualify: number;
  treated: number;
  total: number;
  collected: number;
}

export function countsOf(statement: StatementDetail, works: Record<string, LineWork>): Counts {
  const byState: Record<ReconciliationLineState, number> = { matched: 0, excluded: 0, ready: 0, 'to-check': 0, unrecognised: 0 };
  let toQualify = 0;
  let treated = 0;
  let total = 0;
  let collected = 0;
  for (const line of statement.lines) {
    const work = workOf(works, line.id);
    const state = effectiveState(line, work);
    byState[state] += 1;
    if (state === 'excluded' && !qualificationValid(qualificationOf(line, work))) toQualify += 1;
    if (state === 'matched') collected += line.amount - (work.decision === 'impute' ? (work.offAccount?.amount ?? 0) : 0);
    if (isOpen(line, work)) {
      total += 1;
      if (work.decision !== null) treated += 1;
    }
  }
  return { byState, toQualify, treated, total, collected };
}
