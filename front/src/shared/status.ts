import type { MessageKey } from '@/i18n/fr';

/** Un concept, un nom (règle 13) : les statuts et leur ton visuel vivent ici, et nulle part ailleurs. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inverse';

export interface StatusDefinition {
  labelKey: MessageKey;
  tone: Tone;
}

export const statementStatus = {
  'to-reconcile': { labelKey: 'status.statement.toReconcile', tone: 'warning' },
  validated: { labelKey: 'status.statement.validated', tone: 'success' },
  'validated-with-observation': { labelKey: 'status.statement.validatedWithObservation', tone: 'warning' },
  'captures-to-process': { labelKey: 'status.statement.capturesToProcess', tone: 'warning' },
  reopened: { labelKey: 'status.statement.reopened', tone: 'warning' },
} as const satisfies Record<string, StatusDefinition>;
export type StatementStatus = keyof typeof statementStatus;

export const reportStatus = {
  draft: { labelKey: 'status.report.draft', tone: 'neutral' },
  'in-review': { labelKey: 'status.report.inReview', tone: 'info' },
  validated: { labelKey: 'status.report.validated', tone: 'success' },
  signed: { labelKey: 'status.report.signed', tone: 'success' },
} as const satisfies Record<string, StatusDefinition>;
export type ReportStatus = keyof typeof reportStatus;

export const invoiceStatus = {
  draft: { labelKey: 'status.invoice.draft', tone: 'neutral' },
  'to-check': { labelKey: 'status.invoice.toCheck', tone: 'warning' },
  issued: { labelKey: 'status.invoice.issued', tone: 'info' },
  delivered: { labelKey: 'status.invoice.delivered', tone: 'info' },
  'partially-paid': { labelKey: 'status.invoice.partiallyPaid', tone: 'warning' },
  paid: { labelKey: 'status.invoice.paid', tone: 'success' },
} as const satisfies Record<string, StatusDefinition>;
export type InvoiceStatus = keyof typeof invoiceStatus;

/** Tranches du tableau direction (procédure PM / AM) : 30, 60, 90 jours. */
export const arrearsBucket = {
  'under-30': { labelKey: 'status.bucket.under30', tone: 'neutral' },
  'over-30': { labelKey: 'status.bucket.over30', tone: 'warning' },
  'over-60': { labelKey: 'status.bucket.over60', tone: 'warning' },
  'over-90': { labelKey: 'status.bucket.over90', tone: 'danger' },
} as const satisfies Record<string, StatusDefinition>;
export type ArrearsBucket = keyof typeof arrearsBucket;

/** Niveaux de relance (cadrage du 13/10 : 15, 30, 45 jours, puis procédure contentieux). */
export const reminderLevel = {
  none: { labelKey: 'status.reminder.none', tone: 'neutral' },
  'reminder-1': { labelKey: 'status.reminder.reminder1', tone: 'info' },
  'reminder-2': { labelKey: 'status.reminder.reminder2', tone: 'warning' },
  'reminder-3': { labelKey: 'status.reminder.reminder3', tone: 'warning' },
  'formal-notice': { labelKey: 'status.reminder.formalNotice', tone: 'danger' },
  'pre-litigation': { labelKey: 'status.reminder.preLitigation', tone: 'danger' },
} as const satisfies Record<string, StatusDefinition>;
export type ReminderLevel = keyof typeof reminderLevel;

export const budgetStatus = {
  initial: { labelKey: 'status.budget.initial', tone: 'neutral' },
  're-estimated': { labelKey: 'status.budget.reEstimated', tone: 'info' },
  settled: { labelKey: 'status.budget.settled', tone: 'success' },
} as const satisfies Record<string, StatusDefinition>;
export type BudgetStatus = keyof typeof budgetStatus;

/** Lignes d'un rapprochement (prototype 2A) : imputée, écartée, prête, à vérifier, non reconnue. */
export const reconciliationLineState = {
  matched: { labelKey: 'status.line.matched', tone: 'success' },
  excluded: { labelKey: 'status.line.excluded', tone: 'neutral' },
  ready: { labelKey: 'status.line.ready', tone: 'info' },
  'to-check': { labelKey: 'status.line.toCheck', tone: 'warning' },
  unrecognised: { labelKey: 'status.line.unrecognised', tone: 'danger' },
} as const satisfies Record<string, StatusDefinition>;
export type ReconciliationLineState = keyof typeof reconciliationLineState;

/** Le dossier mensuel après validation (Q20) : soumis, validé par le gestionnaire de patrimoine, envoyé, renvoyé. */
export const monthlyFileStatus = {
  submitted: { labelKey: 'status.file.submitted', tone: 'info' },
  approved: { labelKey: 'status.file.approved', tone: 'success' },
  'sent-to-accounting': { labelKey: 'status.file.sentToAccounting', tone: 'success' },
  returned: { labelKey: 'status.file.returned', tone: 'warning' },
} as const satisfies Record<string, StatusDefinition>;
export type MonthlyFileStatus = keyof typeof monthlyFileStatus;

export const userStatus = {
  active: { labelKey: 'status.user.active', tone: 'success' },
  invited: { labelKey: 'status.user.invited', tone: 'info' },
  disabled: { labelKey: 'status.user.disabled', tone: 'neutral' },
} as const satisfies Record<string, StatusDefinition>;
export type UserStatus = keyof typeof userStatus;

export const assetDataStatus = {
  active: { labelKey: 'status.asset.active', tone: 'success' },
  draft: { labelKey: 'status.asset.draft', tone: 'neutral' },
  'pending-data': { labelKey: 'status.asset.pending-data', tone: 'neutral' },
} as const satisfies Record<string, StatusDefinition>;

export const lotStatus = {
  occupied: { labelKey: 'status.lot.occupied', tone: 'success' },
  vacant: { labelKey: 'status.lot.vacant', tone: 'warning' },
} as const satisfies Record<string, StatusDefinition>;

export const tenantStatus = {
  current: { labelKey: 'status.tenant.current', tone: 'success' },
  late: { labelKey: 'status.tenant.late', tone: 'danger' },
  ending: { labelKey: 'status.tenant.ending', tone: 'warning' },
} as const satisfies Record<string, StatusDefinition>;

export const scheduleStatus = {
  paid: { labelKey: 'status.schedule.paid', tone: 'success' },
  'partially-paid': { labelKey: 'status.schedule.partiallyPaid', tone: 'warning' },
  due: { labelKey: 'status.schedule.due', tone: 'info' },
  late: { labelKey: 'status.schedule.late', tone: 'danger' },
  upcoming: { labelKey: 'status.schedule.upcoming', tone: 'neutral' },
} as const satisfies Record<string, StatusDefinition>;

export const chequeStatus = {
  'to-deposit': { labelKey: 'status.cheque.to-deposit', tone: 'info' },
  deposited: { labelKey: 'status.cheque.deposited', tone: 'neutral' },
  late: { labelKey: 'status.cheque.late', tone: 'warning' },
  rejected: { labelKey: 'status.cheque.rejected', tone: 'danger' },
  collected: { labelKey: 'status.cheque.collected', tone: 'success' },
} as const satisfies Record<string, StatusDefinition>;
export type ChequeStatusKey = keyof typeof chequeStatus;

/** Bordereau d'un chèque remis en banque (E2.7). */
export const depositSlipStatus = {
  pending: { labelKey: 'deposit.slip.pending', tone: 'neutral' },
  received: { labelKey: 'deposit.slip.receivedShort', tone: 'success' },
  missing: { labelKey: 'deposit.slip.missingShort', tone: 'warning' },
} as const satisfies Record<string, StatusDefinition>;

/** Remise en banque (E2.7). */
export const depositStatus = {
  'at-courier': { labelKey: 'deposit.status.atCourier', tone: 'warning' },
  deposited: { labelKey: 'deposit.status.deposited', tone: 'success' },
} as const satisfies Record<string, StatusDefinition>;

/** Lot vu par le propriétaire (E3.2, état locatif). */
export const ownerLotStatus = {
  occupied: { labelKey: 'owner.lot.occupied', tone: 'success' },
  unpaid: { labelKey: 'owner.lot.unpaid', tone: 'danger' },
  vacant: { labelKey: 'owner.lot.vacant', tone: 'neutral' },
  signed: { labelKey: 'owner.lot.signed', tone: 'info' },
} as const satisfies Record<string, StatusDefinition>;

export const inboxKindTone: Record<string, Tone> = {
  'cheque-rejected': 'danger',
  'cheque-late': 'danger',
  'statement-to-reconcile': 'warning',
  'excluded-to-qualify': 'warning',
  'bank-captures': 'warning',
  observation: 'warning',
};
