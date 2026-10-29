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

/** Brouillon en cours de création, actif renseigné, ou actif connu dont les données ne sont pas encore reprises. */
export type AssetDataStatus = 'draft' | 'active' | 'pending-data';

export interface AssetSummary {
  id: string;
  code: string;
  name: string;
  dataStatus: AssetDataStatus;
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

/** Une opération du compte locataire (E1.6) : une facture, ou un règlement imputé, détaillé par rubrique. */
export interface LedgerEntry {
  id: string;
  date: string;
  kind: 'invoice' | 'payment';
  label: string;
  reference: string;
  /** Trimestre de rattachement, ex. « T3 2026 ». */
  quarter: string;
  lines: { item: InvoiceItemKind; amount: number }[];
  amount: number;
  /** Qui a émis la facture ou imputé le règlement. */
  by: string;
  /** Ligne du relevé bancaire d'origine, pour un règlement. */
  bankLabel: string | null;
  invoiceId: string | null;
}

/** Le dossier d'un locataire : bail, échéancier, compte, historique. */
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
  ledger: LedgerEntry[];
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

export type DashboardKpiKey = 'occupancy' | 'recovery' | 'unpaid' | 'pre-litigation' | 'collected' | 'cheques' | 'vacancy' | 'budget' | 'leases';

/** Période du tableau de bord (E0.1) : comparée à la période équivalente précédente. */
export type DashboardPeriodKind = 'today' | 'last-quarter' | 'year' | 'since-start' | 'custom';

export interface DashboardPeriod {
  kind: DashboardPeriodKind;
  /** Bornes d'une période personnalisée, au format ISO. */
  from: string | null;
  to: string | null;
}

/** Un indicateur (Q37) : libellé, chiffre, évolution ; le détail s'ouvre au clic (E0.2). */
export interface DashboardKpi {
  key: DashboardKpiKey;
  value: number;
  unit: 'percent' | 'count' | 'money';
  /** Période que nomme le libellé : « T3 », « septembre », « 2026 ». */
  periodLabel: string;
  /** Détail chiffré, ex. « 7 lots · 6,9 M FCFA de loyers perdus par mois ». */
  detail: string;
  /** Évolution par rapport à la période équivalente précédente. */
  delta: string;
  trend: 'good' | 'bad' | 'flat';
  /** Au-delà du seuil d'alerte (impayés > 20 %, chèque en retard…). */
  alert: boolean;
}

export interface DashboardSummary {
  asOf: string;
  period: { year: number; quarter: number };
  kpis: DashboardKpi[];
  tasks: DashboardTask[];
  deadlines: DashboardDeadline[];
  assets: DashboardAssetRow[];
}

export type InboxKind =
  | 'cheque-rejected'
  | 'cheque-late'
  | 'statement-to-reconcile'
  | 'excluded-to-qualify'
  | 'bank-captures'
  | 'observation';

export interface CollectionInboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  detail: string;
  /** Relevé visé par le sujet, quand il y en a un : l'action ouvre son rapprochement. */
  statementId: string | null;
  /** Chèque visé par le sujet, quand il y en a un : l'action ouvre sa fiche. */
  chequeId: string | null;
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

/** Crédit d'un relevé importé qui pourrait être ce chèque (même montant, numéro proche). */
export interface CandidateCredit {
  statementId: string;
  lineId: string;
  statementLabel: string;
  date: string;
  label: string;
  amount: number;
  hint: string;
  dismissed: boolean;
}

export interface ChequeFollowUp {
  id: string;
  date: string;
  who: string;
  reply: string;
}

export interface ChequeFollowUpInput {
  date: string;
  who: string;
  reply: string;
}

/** La fiche d'un chèque déposé (E2.10) : où il en est, les crédits candidats, les démarches. */
export interface ChequeDetail {
  cheque: ChequeRow;
  lotCode: string;
  slipName: string | null;
  daysSinceDeposit: number | null;
  candidates: CandidateCredit[];
  followUps: ChequeFollowUp[];
}

/** Au retour du coursier, un bordereau par chèque : reçu, ou manquant à réclamer à la banque (E2.7). */
export type DepositSlip = { kind: 'received'; name: string } | { kind: 'missing' };

export type BankDepositStatus = 'at-courier' | 'deposited';

export interface BankDeposit {
  id: string;
  /** Référence de remise donnée par la banque, connue une fois le dépôt validé. */
  reference: string | null;
  accountLabel: string;
  assetName: string;
  plannedOn: string;
  depositedOn: string | null;
  /** Date limite à laquelle chaque chèque doit être repéré dans les relevés importés. */
  creditExpectedBy: string;
  status: BankDepositStatus;
  cheques: ChequeRow[];
  total: number;
  slips: Record<string, DepositSlip>;
}

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

export type PaymentKind = 'transfer' | 'cheque' | 'cash' | 'other';

/** Preuve du règlement, obligatoire pour imputer (E2.3) : reprise dans le dossier mensuel. */
export interface PaymentProof {
  kind: 'cheque-photos' | 'cash-slip' | 'transfer-notice' | 'bank-capture' | 'file';
  name: string;
  /** D'où vient la preuve : jointe à la réception du chèque, reçue par e-mail, ajoutée à la main. */
  source: 'reception' | 'email' | 'upload';
}

export type InvoiceItemKind = 'rent' | 'charges' | 'sign' | 'parking' | 'deposit' | 'penalties' | 'advance';

/** Une facture ouverte d'un locataire, telle qu'elle se ventile pendant le rapprochement. */
export interface OpenInvoice {
  id: string;
  tenantId: string;
  item: InvoiceItemKind;
  label: string;
  reference: string;
  /** Période antérieure (impayé) ou trimestre en cours : les plus anciennes s'imputent d'abord (Q17). */
  period: 'prior' | 'current';
  due: number;
}

/** Un locataire du compte, avec ses factures ouvertes : la base des propositions et des ventilations. */
export interface StatementTenant {
  id: string;
  name: string;
  lotCode: string;
  invoices: OpenInvoice[];
}

export type ExclusionReason = 'tenant' | 'internal-transfer' | 'off-asset' | 'bank-fees' | 'refund' | 'ignore' | 'other';

/** Qualification d'une ligne écartée (E2.4) : motif obligatoire pour « ignorer » et « autre ». */
export interface ExcludedQualification {
  reason: ExclusionReason;
  note: string | null;
}

export interface ReconciliationLine {
  id: string;
  date: string;
  label: string;
  amount: number;
  state: ReconciliationLineState;
  paymentKind: PaymentKind;
  tenantId: string | null;
  tenantName: string | null;
  lotCode: string | null;
  invoiceLabel: string | null;
  dueAmount: number | null;
  /** Explication de la proposition (ou de l'absence de proposition), écrite pour la personne qui lit. */
  hint: string | null;
  /** Preuve déjà jointe (chèque : photos et bordereau enregistrés à la réception). */
  proof: PaymentProof | null;
  /** Preuve disponible en un geste : avis reçu par e-mail, bordereau scanné à la réception. */
  availableProof: PaymentProof | null;
  /** Ventilation annoncée par le locataire (avis de virement), par facture. */
  notice: { label: string; amounts: Record<string, number> } | null;
  /** Crédit interne (chèque émis par la SCI et rejeté) : pas un règlement de locataire. */
  internal: boolean;
  /** Qualification d'une ligne déjà écartée ; `null` tant qu'elle reste à qualifier. */
  exclusion: ExcludedQualification | null;
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

export type MonthlyFileStatus = 'submitted' | 'approved' | 'sent-to-accounting' | 'returned';

/** Le dossier mensuel du compte (Q31) : versionné, soumis au gestionnaire de patrimoine après validation (Q20). */
export interface MonthlyFile {
  version: number;
  status: MonthlyFileStatus;
  validatedAt: string;
  validatedBy: string;
  submittedTo: string;
  approvedAt: string | null;
  approvedBy: string | null;
  sentAt: string | null;
  comment: string | null;
  collectedAmount: number;
  imputedCount: number;
  excludedCount: number;
  ignoredCount: number;
  /** Lignes réimputées par rapport à la version précédente (E2.11) ; 0 pour la première version. */
  changes: number;
}

export type StatementEventKind = 'validated' | 'approved' | 'sent' | 'observation' | 'returned' | 'reopened';

/** Le journal d'un relevé : validations, approbations, observations, réouvertures. */
export interface StatementEvent {
  id: string;
  date: string;
  kind: StatementEventKind;
  title: string;
  detail: string;
  by: string;
}

/** Observation du gestionnaire de patrimoine sur un rapprochement validé (E2.11). */
export interface StatementObservation {
  by: string;
  date: string;
  text: string;
  lineId: string | null;
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
  tenants: StatementTenant[];
  lines: ReconciliationLine[];
  /** Jours restants avant le cut-off comptable du dossier mensuel. */
  cutOffInDays: number;
  file: MonthlyFile | null;
  /** Versions précédentes du dossier mensuel, la plus récente d'abord. */
  fileVersions: MonthlyFile[];
  journal: StatementEvent[];
  observation: StatementObservation | null;
  /** Le CRG du trimestre est signé : plus de réouverture possible. */
  reportSigned: boolean;
}

export type AllocationKind = 'invoice' | 'advance' | 'deposit' | 'penalties';

/** Une part d'un règlement : vers une facture ouverte, ou hors facture (réglé d'avance, dépôt, pénalités). */
export interface Allocation {
  kind: AllocationKind;
  tenantId: string;
  invoiceId: string | null;
  amount: number;
}

/** Part qui ne revient pas au compte du locataire (honoraires PFO…) : motif obligatoire, reprise au dossier. */
export interface OffAccountPart {
  amount: number;
  reason: string;
}

export type ReconciliationDecision =
  | { lineId: string; action: 'impute'; tenantId: string; allocations: Allocation[]; offAccount: OffAccountPart | null; proof: PaymentProof }
  | { lineId: string; action: 'exclude'; qualification: ExcludedQualification };

export interface ReconciliationResult {
  statementId: string;
  validatedAt: string;
  matchedCount: number;
  excludedCount: number;
  ignoredCount: number;
  collectedAmount: number;
  file: MonthlyFile;
}

export interface TenantOption {
  id: string;
  name: string;
  lotCode: string;
  assetName: string;
  email: string;
  /** Bénéficiaire attendu sur un chèque : la SCI propriétaire de l'actif (E2.6). */
  payeeName: string;
  dueAmount: number;
  dueDetail: string;
}

export interface ChequeInput {
  tenantId: string;
  amount: number;
  /** Montant en toutes lettres tel que lu sur le chèque : doit concorder avec le montant en chiffres. */
  amountInWords: string;
  bank: string;
  chequeNumber: string;
  payee: string;
  receivedOn: string;
  /** Le tireur a signé : un chèque non signé ne peut pas être remis. */
  signed: boolean;
}

/** Contrôles bloquants d'un chèque (E2.6) : chiffres et lettres, bénéficiaire = la SCI, signature. */
export type ChequeCheckIssue = 'amount-mismatch' | 'payee-missing' | 'payee-wrong' | 'unsigned';

export interface ChequeReturnInput {
  cheque: ChequeInput;
  issues: ChequeCheckIssue[];
  /** Demande de nouveau règlement envoyée au locataire, photo du chèque jointe. */
  message: { to: string; subject: string; body: string };
}

export interface ChequeReturnRecord {
  chequeNumber: string;
  tenantName: string;
  amount: number;
  sentTo: string;
  sentAt: string;
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

// ---------------------------------------------------------------------------------------------------------
// Espace propriétaire (parcours 3) : un espace distinct, les seuls actifs de la SCI, des documents validés.
// ---------------------------------------------------------------------------------------------------------

export interface OwnerContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface OwnerProfile {
  personName: string;
  email: string;
  sciName: string;
  assetName: string;
  assetDescription: string;
  /** « Vos interlocuteurs chez PFO » (E3.2). */
  contacts: OwnerContact[];
  /** Compte de la SCI qui reçoit le reversement, masqué. */
  payoutAccount: string | null;
  /** Nouvel actif sans compte-rendu : date prévue du premier (E3.2, état). */
  firstReportExpected: string | null;
}

export type AgingBucket = 'under-30' | '30-90' | 'over-90';

export interface OwnerAging {
  bucket: AgingBucket;
  amount: number;
  tenantCount: number;
}

export interface OwnerAmountLine {
  label: string;
  amount: number;
}

/** Un compte-rendu validé et signé, tel que le propriétaire le lit (E3.3). */
export interface OwnerReport {
  id: string;
  quarter: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  signedOn: string;
  invoiced: number;
  collected: number;
  unpaid: number;
  /** Solde reversé à la SCI. */
  payout: number;
  unpaidDetail: string;
  byItem: OwnerAmountLine[];
  byType: OwnerAmountLine[];
  aging: OwnerAging[];
  adjustments: string;
  charges: OwnerAmountLine[];
  fees: OwnerAmountLine[];
  payoutLines: OwnerAmountLine[];
  budgetLines: OwnerAmountLine[];
  budgetRealised: number;
  budgetRate: number;
  signatories: { role: string; signedBy: string }[];
}

export type OwnerReportSummary = Pick<OwnerReport, 'id' | 'quarter' | 'year' | 'periodStart' | 'periodEnd' | 'signedOn' | 'invoiced' | 'collected' | 'unpaid' | 'payout' | 'aging' | 'unpaidDetail'>;

export type OwnerLotStatus = 'occupied' | 'unpaid' | 'vacant' | 'signed';

export interface OwnerLot {
  code: string;
  type: string;
  area: number;
  building: string;
  tenantName: string | null;
  since: string | null;
  quarterlyRent: number | null;
  status: OwnerLotStatus;
}

export interface OwnerDocument {
  id: string;
  name: string;
  detail: string;
  fileName: string;
}

export interface OwnerDocumentGroup {
  label: string;
  documents: OwnerDocument[];
}

/** L'accueil du propriétaire (E3.2) : chiffres arrêtés au dernier compte-rendu validé et au point des impayés. */
export interface OwnerHome {
  profile: OwnerProfile;
  /** Date d'arrêté des chiffres et ce dont ils sont tirés. */
  asOf: string | null;
  sources: string | null;
  reports: OwnerReportSummary[];
  buildings: { key: string; name: string; lots: number; occupied: number }[];
  vacantLots: Pick<OwnerLot, 'code' | 'type' | 'area' | 'since'>[];
  lotCount: number;
  occupiedCount: number;
  signedCount: number;
  debtorCount: number;
  riskCount: number;
  upcoming: { date: string; title: string; detail: string }[];
}

export interface OwnerAccessInfo {
  email: string;
  personName: string;
  sciName: string;
  activated: boolean;
}

export interface OwnerFile {
  fileName: string;
  blob: Blob;
}
