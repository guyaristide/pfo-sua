/**
 * Types métier échangés entre l'interface et les services. Les montants sont des entiers dans l'unité
 * principale de la devise du client ; les dates sont des chaînes ISO.
 */
import type {
  ArrearsBucket,
  BudgetStatus,
  InvoiceStatus,
  ReconciliationLineState,
  ReminderLevel,
  ReportStatus,
  StatementStatus,
} from '@/shared/status';

export type RoleKey = 'pmLead' | 'assetManager' | 'financeManager' | 'owner' | 'operations' | 'admin';

export interface Session {
  user: { id: string; firstName: string; lastName: string; role: RoleKey };
  tenant: { id: string; name: string; currency: string; locale: string; timeZone: string };
  permissions: string[];
}

export interface CodeRequestResult {
  expiresInMinutes: number;
  /** Présent seulement sur un environnement de démonstration : le code que l'e-mail aurait porté. */
  demoCode: string | null;
}

export interface AssetSummary {
  id: string;
  code: string;
  name: string;
  location: string;
  ownerName: string;
  buildingCount: number;
  lotCount: number;
  occupancyRate: number;
  unpaidAmount: number;
}

export interface AssetDetail extends AssetSummary {
  managerName: string;
  bankAccountOwner: 'sci' | 'pfo';
  expensesPaidBy: 'sci' | 'pfo';
}

export type LotType = 'offices' | 'shops' | 'villas' | 'apartments' | 'land' | 'parking';
export type LotStatus = 'occupied' | 'vacant';

export interface LotRow {
  id: string;
  building: string;
  code: string;
  type: LotType;
  surface: number;
  floor: string | null;
  status: LotStatus;
  tenantName: string | null;
  monthlyRent: number | null;
}

export type TenantStatus = 'current' | 'late' | 'ending';

export interface TenantRow {
  id: string;
  name: string;
  contactName: string;
  email: string;
  lotCodes: string[];
  leaseStart: string;
  leaseEnd: string | null;
  monthlyRent: number;
  monthlyCharges: number;
  deposit: number;
  balance: number;
  status: TenantStatus;
}

export type LeasePeriodicity = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export interface LeaseTerms {
  start: string;
  end: string | null;
  durationYears: number;
  monthlyRent: number;
  monthlyCharges: number;
  deposit: number;
  keyMoney: number;
  periodicity: LeasePeriodicity;
  /** Clause de révision, telle qu'écrite au bail. */
  indexation: string;
}

export type ScheduleStatus = 'paid' | 'partially-paid' | 'due' | 'late' | 'upcoming';

export interface ScheduleRow {
  id: string;
  invoiceId: string | null;
  date: string;
  label: string;
  invoiced: number;
  collected: number;
  balance: number;
  status: ScheduleStatus;
}

export type AccountEventKind = 'invoice' | 'payment' | 'reminder' | 'note';

export interface AccountEvent {
  id: string;
  date: string;
  kind: AccountEventKind;
  label: string;
  amount: number | null;
}

/** Le dossier d'un locataire : bail, échéancier, historique du compte. */
export interface TenantAccount {
  id: string;
  name: string;
  contactName: string;
  email: string;
  registration: string | null;
  assetId: string;
  assetName: string;
  lotCodes: string[];
  lease: LeaseTerms;
  balance: number;
  status: TenantStatus;
  reminderLevel: ReminderLevel;
  schedule: ScheduleRow[];
  history: AccountEvent[];
}

export interface ReminderInput {
  level: ReminderLevel;
  channel: ReminderChannel;
  subject: string;
  body: string;
}

export interface NewTenantInput {
  name: string;
  registration: string;
  contactName: string;
  email: string;
  lotCode: string;
  lease: Omit<LeaseTerms, 'end'>;
}

export interface TenantImportRow {
  name: string;
  contactName: string;
  email: string;
  lotCode: string;
  start: string;
  monthlyRent: number;
  monthlyCharges: number;
  deposit: number;
}

export interface TenantImportResult {
  created: number;
  tenantIds: string[];
}

export interface OwnerCompany {
  name: string;
  registration: string;
  address: string;
  representative: string;
}

export interface Mandate {
  reference: string;
  signedOn: string;
  durationYears: number;
  endsOn: string;
}

/** La fiche complète d'un actif : société, mandat, particularités, lots et locataires. */
export interface AssetRecord extends AssetDetail {
  owner: OwnerCompany;
  mandate: Mandate;
  rentAccountLabel: string | null;
  billingItemCodes: string[];
  lots: LotRow[];
  tenants: TenantRow[];
}

export interface NewLotInput {
  building: string;
  code: string;
  type: LotType;
  surface: number;
  floor: string | null;
}

export interface NewAssetInput {
  name: string;
  location: string;
  owner: OwnerCompany;
  mandate: { reference: string; signedOn: string; durationYears: number };
  bankAccountOwner: 'sci' | 'pfo';
  rentAccountLastDigits: string | null;
  expensesPaidBy: 'sci' | 'pfo';
  lots: NewLotInput[];
  billingItemCodes: string[];
}

export interface DashboardIndicator {
  value: number;
  /** Variation en points depuis le mois précédent ; absent quand stable ou non comparable. */
  deltaPoints?: number;
  comparedToMonth?: string;
}

export type TaskUrgency = 'late' | 'to-validate' | 'this-week';

/** L'objet métier vers lequel une tâche, une échéance ou une notification renvoie. */
export type NavigationTarget = 'asset' | 'invoice' | 'collection' | 'arrears' | 'report' | 'budget' | 'document' | 'settings';

export interface DashboardTask {
  id: string;
  title: string;
  detail: string;
  urgency: TaskUrgency;
  lateDays?: number;
  target: NavigationTarget | null;
}

export type DeadlineState = 'late' | 'soon' | 'upcoming';

export interface DashboardDeadline {
  id: string;
  date: string;
  title: string;
  detail: string;
  state: DeadlineState;
  days?: number;
  target: NavigationTarget | null;
}

export type SearchKind = 'asset' | 'tenant' | 'invoice' | 'document';
export type SearchScope = SearchKind | 'all';

export interface SearchResult {
  kind: SearchKind;
  id: string;
  title: string;
  detail: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  at: string;
  target: NavigationTarget | null;
  read: boolean;
}

export interface DashboardAssetRow {
  assetId: string;
  assetName: string;
  lotCount: number;
  occupancyRate: number;
  recoveryRate: number;
  unpaidAmount: number;
  reportStatus: ReportStatus;
}

export interface DashboardSummary {
  asOf: string;
  period: { year: number; quarter: number };
  vacancyRate: DashboardIndicator;
  unpaidRate: DashboardIndicator;
  preLitigationCount: DashboardIndicator;
  budgetRealisationRate: DashboardIndicator & { asOfDate: string };
  tasks: DashboardTask[];
  deadlines: DashboardDeadline[];
  assets: DashboardAssetRow[];
}

export type InboxKind =
  | 'cheque-rejected'
  | 'cheque-late'
  | 'statement-to-reconcile'
  | 'bank-captures'
  | 'observation';

export interface CollectionInboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  detail: string;
  /** Relevé visé par le sujet, quand il y en a un : l'action ouvre son rapprochement. */
  statementId: string | null;
}

export interface ChequeCounter {
  count: number;
  amount?: number;
  note: string;
}

export interface ChequeCounters {
  toDeposit: ChequeCounter;
  deposited: ChequeCounter;
  late: ChequeCounter;
  rejected: ChequeCounter;
}

export interface BankStatementRow {
  id: string;
  bank: string;
  accountOwner: 'sci' | 'pfo';
  assetName: string | null;
  lastPeriod: string;
  status: StatementStatus;
  statusDetail: string;
}

export interface CollectionsOverview {
  inbox: CollectionInboxItem[];
  cheques: ChequeCounters;
  statements: BankStatementRow[];
}

export interface Period {
  year: number;
  quarter: number;
}

export interface InvoiceRow {
  id: string;
  tenantName: string;
  assetName: string;
  /** Premier jour de la période facturée, ISO. */
  periodStart: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  /** Trace de la distribution physique (dépôt, confirmation, retour signé). */
  deliveryDetail: string | null;
}

export interface BillingCampaign {
  period: Period;
  issueDeadline: string;
  dueDate: string;
  invoiceCount: number;
  issuedCount: number;
  toCheckCount: number;
  deliveredCount: number;
  totalAmount: number;
}

export interface BillingOverview {
  campaign: BillingCampaign;
  invoices: InvoiceRow[];
}

export interface InvoiceLine {
  label: string;
  amount: number;
}

export type DeliveryMode = 'deposit' | 'email' | 'courier';

export interface InvoiceDetail extends InvoiceRow {
  tenantId: string;
  lines: InvoiceLine[];
  vatAmount: number;
  paidAmount: number;
  issuedOn: string | null;
  deliveredOn: string | null;
  deliveryMode: DeliveryMode | null;
  deliveryProof: string | null;
  history: AccountEvent[];
}

export interface DeliveryInput {
  date: string;
  mode: DeliveryMode;
  proof: string;
}

export interface CampaignPreview {
  period: Period;
  leaseCount: number;
  estimatedAmount: number;
  issueDeadline: string;
  dueDate: string;
  alreadyPrepared: boolean;
}

export interface ArrearsRow {
  id: string;
  tenantId: string;
  tenantName: string;
  assetName: string;
  amountDue: number;
  lateDays: number;
  bucket: ArrearsBucket;
  lastPaymentDate: string | null;
  reminderLevel: ReminderLevel;
}

export interface ArrearsOverview {
  asOf: string;
  totalDue: number;
  unpaidRate: number;
  preLitigationCount: number;
  /** Date du prochain tableau des impayés pour la direction (le 8 de chaque mois). */
  directionReportDate: string;
  rows: ArrearsRow[];
}

export interface ReportRow {
  id: string;
  assetName: string;
  period: Period;
  status: ReportStatus;
  preparedBy: string;
  dueDate: string;
  /** Solde à reverser au propriétaire ; absent tant que le brouillon n'est pas calculé. */
  amountToTransfer: number | null;
  stepDetail: string;
}

export type ReportSectionKey = 'collections' | 'arrears' | 'charges' | 'fees' | 'transfer' | 'budget';

export interface ReportSection {
  key: ReportSectionKey;
  amount: number | null;
  detail: string;
}

export interface ReportSignatory {
  role: string;
  name: string;
  signedOn: string | null;
}

/** Un CRG : les six parties du compte rendu de gestion, ses signataires, son avancement. */
export interface ReportDetail extends ReportRow {
  assetId: string;
  sections: ReportSection[];
  signatories: ReportSignatory[];
  history: AccountEvent[];
}

export type ReportTransition = 'submit' | 'validate' | 'sign' | 'reopen';

export interface ReportsOverview {
  currentPeriod: Period;
  rows: ReportRow[];
}

export interface BudgetRow {
  id: string;
  assetName: string;
  year: number;
  status: BudgetStatus;
  budgetAmount: number;
  realisedAmount: number;
  settlementDeadline: string;
  detail: string;
}

export type BudgetLineCategory = 'common' | 'special';

export interface BudgetLine {
  id: string;
  label: string;
  category: BudgetLineCategory;
  building: string | null;
  budget: number;
  realised: number;
  reestimated: number | null;
}

export interface BudgetDetail extends BudgetRow {
  assetId: string;
  lines: BudgetLine[];
}

export interface ReestimateInput {
  lines: { id: string; reestimated: number }[];
  note: string | null;
}

export interface BudgetOverview {
  year: number;
  rows: BudgetRow[];
}

export type ChequeStatus = 'to-deposit' | 'deposited' | 'late' | 'rejected' | 'collected';

export interface ChequeRow {
  id: string;
  chequeNumber: string;
  tenantId: string;
  tenantName: string;
  assetName: string;
  bank: string;
  amount: number;
  receivedOn: string;
  depositedOn: string | null;
  status: ChequeStatus;
  note: string;
}

export type ChequeRejectReason = 'insufficient-funds' | 'signature' | 'amount' | 'expired' | 'other';

export interface CaptureLine {
  id: string;
  date: string;
  label: string;
  amount: number;
  assetId: string | null;
  tenantId: string | null;
}

export interface CaptureAssignment {
  lineId: string;
  assetId: string;
  tenantId: string;
}

export interface StatementImportInput {
  bankAccountId: string;
  period: string;
}

export type DocumentKind = 'lease' | 'report' | 'invoice' | 'statement' | 'minutes' | 'other';

export interface DocumentRow {
  id: string;
  name: string;
  kind: DocumentKind;
  assetName: string;
  tenantName: string | null;
  updatedAt: string;
  version: number;
}

export interface DocumentVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  note: string | null;
}

export interface DocumentDetail extends DocumentRow {
  assetId: string | null;
  tenantId: string | null;
  sizeLabel: string;
  formatLabel: string;
  versions: DocumentVersion[];
}

export interface DocumentUploadInput {
  name: string;
  kind: DocumentKind;
  assetId: string | null;
  tenantId: string | null;
  note: string | null;
  /** Identifiant du document existant pour une nouvelle version. */
  replacesId: string | null;
}

export type SettingsSectionKey = 'users' | 'billing-items' | 'calendar' | 'reminder-templates' | 'bank-accounts' | 'fees';

export type UserStatus = 'active' | 'invited' | 'disabled';

export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleKey;
  /** Périmètre de données : tous les actifs ou une liste d'actifs (offre technique §IX). */
  assetScope: 'all' | string[];
  status: UserStatus;
  lastSeenAt: string | null;
}

export interface UserInvitation {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleKey;
  assetScope: 'all' | string[];
}

export type AccessDomain = 'referentials' | 'assets' | 'leases' | 'finance' | 'documents' | 'reporting' | 'validation';
export type AccessLevel = 'none' | 'read' | 'create' | 'full' | 'workflow';

export interface RoleDefinition {
  role: RoleKey;
  access: Record<AccessDomain, AccessLevel>;
}

/**
 * Un paramètre de gestion ne se remplace jamais : chaque modification crée une version datée, avec son
 * auteur et son motif. La version en vigueur est la plus récente dont la date d'effet est passée ; une
 * version à date future est « programmée ». Les objets métier (factures, relances, CRG) se calculent avec
 * la version en vigueur à leur date, jamais avec la dernière saisie.
 */
export interface SettingVersion<Value> {
  version: number;
  effectiveFrom: string;
  createdAt: string;
  createdBy: string;
  note: string | null;
  value: Value;
}

export interface VersionedInput<Value> {
  value: Value;
  effectiveFrom: string;
  note: string | null;
}

export type BillingPeriodicity = 'quarterly' | 'monthly' | 'once';

export interface BillingItemValue {
  /** Ligne reprise dans le CRG, ou hors CRG (revenus suivis sur le compte PFO). */
  inReport: boolean;
  /** Entre dans l'assiette des honoraires de gestion. */
  inFeeBase: boolean;
  vatApplicable: boolean;
  periodicity: BillingPeriodicity;
}

export interface BillingItem {
  id: string;
  code: string;
  label: string;
  assetScope: 'all' | string[];
  active: boolean;
  current: SettingVersion<BillingItemValue>;
  versions: SettingVersion<BillingItemValue>[];
}

export interface BillingItemInput extends VersionedInput<BillingItemValue> {
  code: string;
  label: string;
}

export type CalendarFrequency = 'monthly' | 'quarterly' | 'yearly' | 'after-event';

export interface CalendarRuleValue {
  /** Jour du mois pour les règles mensuelles, trimestrielles et annuelles. */
  dayOfMonth: number | null;
  /** Mois (1 à 12) pour une règle annuelle ; position dans le trimestre (0 = mois précédent, 1 à 3) pour une règle trimestrielle. */
  month: number | null;
  /** Décalage en jours après l'événement déclencheur. */
  offsetDays: number | null;
  ownerRole: RoleKey;
}

export interface CalendarRule {
  id: string;
  label: string;
  frequency: CalendarFrequency;
  triggerLabel: string | null;
  nextOccurrence: string | null;
  current: SettingVersion<CalendarRuleValue>;
  versions: SettingVersion<CalendarRuleValue>[];
}

export type CalendarRuleInput = VersionedInput<CalendarRuleValue>;

export type ReminderChannel = 'email' | 'letter' | 'registered-letter' | 'file';

export interface ReminderTemplateValue {
  delayDays: number;
  channel: ReminderChannel;
  subject: string;
  body: string;
}

export interface ReminderTemplate {
  id: string;
  level: ReminderLevel;
  current: SettingVersion<ReminderTemplateValue>;
  versions: SettingVersion<ReminderTemplateValue>[];
}

export type ReminderTemplateInput = VersionedInput<ReminderTemplateValue>;

export type StatementCadence = 'monthly' | 'daily';

export interface BankAccount {
  id: string;
  bank: string;
  holder: 'sci' | 'pfo';
  holderName: string;
  assetName: string | null;
  /** Numéro masqué : les quatre derniers chiffres seulement. */
  accountLabel: string;
  cadence: StatementCadence;
  active: boolean;
}

export interface BankAccountInput {
  bank: string;
  holder: 'sci' | 'pfo';
  holderName: string;
  assetName: string | null;
  /** Les quatre derniers chiffres ; le serveur construit le libellé masqué. */
  lastDigits: string;
  cadence: StatementCadence;
}

export type FeeBaseItem = 'rent' | 'signage' | 'ancillary';

export interface FeeValue {
  rate: number;
  base: FeeBaseItem[];
  vatApplicable: boolean;
}

export interface FeeSettings {
  current: SettingVersion<FeeValue>;
  versions: SettingVersion<FeeValue>[];
}

export type FeeSettingsInput = VersionedInput<FeeValue>;

export interface SettingsSection {
  key: SettingsSectionKey;
  count: number;
  detail: string;
}

export interface SettingsOverview {
  sections: SettingsSection[];
}

export interface ReconciliationLine {
  id: string;
  date: string;
  label: string;
  amount: number;
  state: ReconciliationLineState;
  tenantName: string | null;
  lotCode: string | null;
  invoiceLabel: string | null;
  dueAmount: number | null;
  /** Explication de la proposition (ou de l'absence de proposition), écrite pour la personne qui lit. */
  hint: string | null;
}

export interface StatementChecks {
  periodFrom: string;
  periodTo: string;
  duplicatesIgnored: number;
  debitsExcluded: number;
  openingBalance: number;
  closingBalance: number;
  previousStatementComplete: boolean;
}

export interface PreviousStatement {
  period: string;
  collectedAmount: number;
  status: StatementStatus;
}

export interface StatementDetail {
  id: string;
  bank: string;
  accountLabel: string;
  accountOwner: 'sci' | 'pfo';
  assetName: string;
  period: string;
  status: StatementStatus;
  imported: boolean;
  linesRead: number;
  pageCount: number;
  checks: StatementChecks;
  previous: PreviousStatement[];
  lines: ReconciliationLine[];
  /** Jours restants avant le cut-off comptable du dossier mensuel. */
  cutOffInDays: number;
}

export type ReconciliationAction = 'confirm' | 'exclude';

export interface ReconciliationDecision {
  lineId: string;
  action: ReconciliationAction;
}

export interface ReconciliationResult {
  statementId: string;
  validatedAt: string;
  matchedCount: number;
  excludedCount: number;
  collectedAmount: number;
}

export interface TenantOption {
  id: string;
  name: string;
  lotCode: string;
  assetName: string;
  dueAmount: number;
  dueDetail: string;
}

export interface ChequeInput {
  tenantId: string;
  amount: number;
  bank: string;
  chequeNumber: string;
  payee: string;
  receivedOn: string;
}

export interface ChequeRecord {
  id: string;
  chequeNumber: string;
  tenantName: string;
  lotCode: string;
  amount: number;
  allocationDetail: string;
  depositPlannedOn: string;
  depositAccountLabel: string;
}
