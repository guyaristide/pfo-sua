/**
 * Les contrats que l'interface consomme. Deux implémentations : `mocks/` (données simulées) et
 * `services/http/` (API). Le backend doit honorer ces contrats, endpoint par endpoint.
 */
import type {
  ArrearsOverview,
  AssetDetail,
  AssetRecord,
  AssetSummary,
  BankAccount,
  BankAccountInput,
  BillingItem,
  BillingItemInput,
  BillingOverview,
  BudgetDetail,
  BudgetOverview,
  CampaignPreview,
  CaptureAssignment,
  CaptureLine,
  ChequeRejectReason,
  ChequeRow,
  CalendarRule,
  CalendarRuleInput,
  ChequeInput,
  ChequeRecord,
  OwnerAccessInfo,
  OwnerDocumentGroup,
  OwnerFile,
  OwnerHome,
  OwnerLot,
  OwnerReport,
  OwnerReportSummary,
  ChequeDetail,
  ChequeFollowUpInput,
  ChequeReturnInput,
  ChequeReturnRecord,
  BankDeposit,
  DepositSlip,
  CodeRequestResult,
  CollectionsOverview,
  DashboardSummary,
  DashboardPeriod,
  DeliveryInput,
  DocumentDetail,
  DocumentRow,
  DocumentUploadInput,
  InvoiceDetail,
  FeeSettings,
  NewAssetInput,
  NewTenantInput,
  NotificationItem,
  FeeSettingsInput,
  ReconciliationDecision,
  ReconciliationResult,
  ReestimateInput,
  ReportDetail,
  ReportTransition,
  Period,
  ReminderTemplate,
  ReminderTemplateInput,
  ReminderInput,
  ReportsOverview,
  RoleDefinition,
  SearchResult,
  SearchScope,
  Session,
  SettingsOverview,
  StatementDetail,
  StatementImportInput,
  TenantAccount,
  TenantImportResult,
  TenantImportRow,
  TenantOption,
  UserInvitation,
  UserRow,
} from './types';

export interface SessionService {
  /** Échoue avec `unauthorized` quand aucune session valide n'existe. */
  getSession(): Promise<Session>;
}

/** Connexion par code reçu par e-mail (prototype d'Elodie) : six chiffres, dix minutes. */
export interface AuthService {
  requestCode(email: string): Promise<CodeRequestResult>;
  /** Ouvre la session ; la couche de services range le jeton, jamais l'interface. */
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Accès à l'espace propriétaire (E3.1) : mot de passe choisi à l'activation, ou lien de connexion de 15 minutes. */
export interface OwnerAuthService {
  /** Ce que l'e-mail d'invitation ou de publication sait du destinataire. */
  getAccess(email: string): Promise<OwnerAccessInfo>;
  activate(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  /** Envoie un lien de connexion à usage unique ; renvoie sa durée de validité en minutes. */
  requestLink(email: string): Promise<{ expiresInMinutes: number }>;
  /** Ouvre la session depuis le lien reçu (démonstration : le dernier lien envoyé à cette adresse). */
  openLink(email: string): Promise<void>;
  requestReset(email: string): Promise<void>;
}

/** L'espace propriétaire (E3.2 à E3.4) : en lecture seule, borné à la SCI de la session. */
export interface OwnerService {
  getHome(): Promise<OwnerHome>;
  listReports(): Promise<OwnerReportSummary[]>;
  getReport(reportId: string): Promise<OwnerReport>;
  listLots(): Promise<OwnerLot[]>;
  listDocuments(): Promise<OwnerDocumentGroup[]>;
  /** Le PDF d'un compte-rendu ou d'un document ; la consultation est journalisée côté serveur (Q29). */
  download(documentId: string): Promise<OwnerFile>;
}

export interface AssetService {
  listAssets(): Promise<AssetSummary[]>;
  getAsset(id: string): Promise<AssetDetail>;
  getAssetRecord(id: string): Promise<AssetRecord>;
  createAsset(input: NewAssetInput): Promise<AssetSummary>;
}

export interface TenantService {
  getAccount(tenantId: string): Promise<TenantAccount>;
  /** Envoie la relance et fait passer le dossier au niveau indiqué. */
  sendReminder(tenantId: string, input: ReminderInput): Promise<TenantAccount>;
  /** Nouveau locataire depuis son bail : crée le dossier, la facture d'entrée et le premier avis d'échéance. */
  createFromLease(assetId: string, input: NewTenantInput): Promise<TenantAccount>;
  importRows(assetId: string, rows: TenantImportRow[]): Promise<TenantImportResult>;
}

export interface DashboardService {
  /** `assetId` absent = tous les actifs du périmètre de l'utilisateur. */
  getSummary(assetId: string | undefined, period: DashboardPeriod): Promise<DashboardSummary>;
}

export interface CollectionService {
  getOverview(assetId?: string): Promise<CollectionsOverview>;
  listCheques(assetId?: string): Promise<ChequeRow[]>;
  /** Remise en banque en deux temps (E2.7) : choisir les chèques, puis un bordereau par chèque au retour du coursier. */
  listDeposits(assetId?: string): Promise<BankDeposit[]>;
  getDeposit(depositId: string): Promise<BankDeposit>;
  prepareDeposit(chequeIds: string[]): Promise<BankDeposit>;
  completeDeposit(depositId: string, slips: Record<string, DepositSlip>): Promise<BankDeposit>;
  /** Chèque non conforme rendu au locataire, avec la demande de nouveau règlement (E2.6). */
  returnCheque(input: ChequeReturnInput): Promise<ChequeReturnRecord>;
  rejectCheque(chequeId: string, reason: ChequeRejectReason, note: string | null): Promise<ChequeRow>;
  getCaptures(statementId: string): Promise<CaptureLine[]>;
  attachCaptures(statementId: string, assignments: CaptureAssignment[]): Promise<void>;
  /** Importe un relevé mensuel et renvoie l'identifiant du relevé à rapprocher. */
  importStatement(input: StatementImportInput): Promise<{ statementId: string }>;
  getStatement(statementId: string): Promise<StatementDetail>;
  /** Valide le rapprochement : met à jour comptes locataires, impayés et CRG brouillon côté serveur. */
  validateReconciliation(statementId: string, decisions: ReconciliationDecision[]): Promise<ReconciliationResult>;
  /** Le gestionnaire de patrimoine approuve le dossier mensuel, qui part aussitôt à la comptabilité (Q20). */
  approveMonthlyFile(statementId: string): Promise<StatementDetail>;
  /** Le gestionnaire de patrimoine renvoie le dossier au gestionnaire financier avec un commentaire. */
  returnMonthlyFile(statementId: string, comment: string): Promise<StatementDetail>;
  /** Rouvre un rapprochement validé avec un motif (E2.11) : les lignes imputées redeviennent corrigeables. */
  reopenReconciliation(statementId: string, reason: string): Promise<StatementDetail>;
  /** Chèque non repéré au relevé (E2.10) : fiche, rapprochement d'un crédit candidat, démarches auprès de la banque. */
  getCheque(chequeId: string): Promise<ChequeDetail>;
  matchChequeCredit(chequeId: string, statementId: string, lineId: string): Promise<ChequeDetail>;
  dismissChequeCredit(chequeId: string, lineId: string): Promise<ChequeDetail>;
  addChequeFollowUp(chequeId: string, input: ChequeFollowUpInput): Promise<ChequeDetail>;
  listTenants(assetId?: string): Promise<TenantOption[]>;
  recordCheque(input: ChequeInput): Promise<ChequeRecord>;
}

export interface BillingService {
  getOverview(assetId?: string): Promise<BillingOverview>;
  getInvoice(invoiceId: string): Promise<InvoiceDetail>;
  markChecked(invoiceId: string): Promise<InvoiceDetail>;
  recordDelivery(invoiceId: string, input: DeliveryInput): Promise<InvoiceDetail>;
  previewCampaign(period: Period): Promise<CampaignPreview>;
  /** Génère les factures brouillon de la période depuis les baux. */
  prepareCampaign(period: Period): Promise<{ created: number }>;
  /** Émet toutes les factures contrôlées du périmètre. */
  issueChecked(assetId?: string): Promise<{ issued: number }>;
}

export interface ArrearsService {
  getOverview(assetId?: string): Promise<ArrearsOverview>;
}

export interface ReportService {
  getOverview(assetId?: string): Promise<ReportsOverview>;
  getReport(reportId: string): Promise<ReportDetail>;
  generateDrafts(period: Period): Promise<{ created: number }>;
  transition(reportId: string, action: ReportTransition, note: string | null): Promise<ReportDetail>;
}

export interface BudgetService {
  getOverview(assetId?: string): Promise<BudgetOverview>;
  getBudget(budgetId: string): Promise<BudgetDetail>;
  reestimate(budgetId: string, input: ReestimateInput): Promise<BudgetDetail>;
  prepareYear(year: number): Promise<{ created: number }>;
}

export interface DocumentService {
  listDocuments(assetId?: string): Promise<DocumentRow[]>;
  getDocument(documentId: string): Promise<DocumentDetail>;
  upload(input: DocumentUploadInput): Promise<DocumentDetail>;
  /** Le contenu à télécharger ; en démonstration, un texte de remplacement. */
  download(documentId: string): Promise<Blob>;
}

export interface SettingsService {
  getOverview(): Promise<SettingsOverview>;
  listUsers(): Promise<UserRow[]>;
  listRoles(): Promise<RoleDefinition[]>;
  inviteUser(input: UserInvitation): Promise<UserRow>;
  listBillingItems(): Promise<BillingItem[]>;
  /** `id` absent = création. */
  saveBillingItem(input: BillingItemInput, id?: string): Promise<BillingItem>;
  listCalendarRules(): Promise<CalendarRule[]>;
  saveCalendarRule(id: string, input: CalendarRuleInput): Promise<CalendarRule>;
  listReminderTemplates(): Promise<ReminderTemplate[]>;
  saveReminderTemplate(id: string, input: ReminderTemplateInput): Promise<ReminderTemplate>;
  listBankAccounts(): Promise<BankAccount[]>;
  saveBankAccount(input: BankAccountInput, id?: string): Promise<BankAccount>;
  getFees(): Promise<FeeSettings>;
  saveFees(input: FeeSettingsInput): Promise<FeeSettings>;
}

export interface SearchService {
  query(text: string, scope: SearchScope): Promise<SearchResult[]>;
}

export interface NotificationService {
  list(): Promise<NotificationItem[]>;
  markAllRead(): Promise<void>;
}

/**
 * Jeux d'exemple de la démonstration (prototypes d'Elodie). L'implémentation HTTP n'en a pas :
 * les écrans masquent alors les boutons « Utiliser l'exemple ».
 */
export interface DemoService {
  enabled: boolean;
  sampleLease(assetId: string): Promise<NewTenantInput | null>;
  sampleTenantRows(assetId: string): Promise<TenantImportRow[]>;
}

export interface Services {
  demo: DemoService;
  session: SessionService;
  auth: AuthService;
  search: SearchService;
  notifications: NotificationService;
  assets: AssetService;
  tenants: TenantService;
  dashboard: DashboardService;
  collections: CollectionService;
  ownerAuth: OwnerAuthService;
  owner: OwnerService;
  billing: BillingService;
  arrears: ArrearsService;
  reports: ReportService;
  budget: BudgetService;
  documents: DocumentService;
  settings: SettingsService;
}

export * from './types';
