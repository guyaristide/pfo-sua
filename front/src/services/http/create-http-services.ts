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
  CodeRequestResult,
  CollectionsOverview,
  DashboardSummary,
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
  Services,
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
  BankDeposit,
  OwnerAccessInfo,
  OwnerDocumentGroup,
  OwnerHome,
  OwnerLot,
  OwnerReport,
  OwnerReportSummary,
  ChequeDetail,
  ChequeFollowUpInput,
  DepositSlip,
  ChequeReturnInput,
  ChequeReturnRecord,
} from '../contracts';
import { HttpClient } from './http-client';
import { sessionStore } from './session-store';
import { AppError } from '@/shared/errors';

/**
 * Implémentation HTTP des contrats. Les chemins ci-dessous sont le contrat d'API attendu du backend.
 */
export function createHttpServices(baseUrl: string): Services {
  const client = new HttpClient({ baseUrl });
  const scope = (assetId?: string) => (assetId ? `?assetId=${encodeURIComponent(assetId)}` : '');

  return {
    demo: {
      enabled: false,
      sampleLease: async () => null,
      sampleTenantRows: async () => [],
    },
    session: {
      getSession: () => client.get<Session>('/session'),
    },
    search: {
      query: (text, scope) => client.get<SearchResult[]>(`/search?q=${encodeURIComponent(text)}&scope=${encodeURIComponent(scope)}`),
    },
    notifications: {
      list: () => client.get<NotificationItem[]>('/notifications'),
      markAllRead: () => client.post<void>('/notifications/read', {}),
    },
    auth: {
      requestCode: email => client.post<CodeRequestResult>('/auth/code', { email }),
      verifyCode: async (email, code) => {
        const { token } = await client.post<{ token: string }>('/auth/verify', { email, code });
        sessionStore.setToken(token);
      },
      signOut: async () => {
        try {
          await client.post<void>('/auth/sign-out', {});
        } finally {
          sessionStore.setToken(null);
        }
      },
    },
    assets: {
      listAssets: () => client.get<AssetSummary[]>('/assets'),
      getAsset: id => client.get<AssetDetail>(`/assets/${encodeURIComponent(id)}`),
      getAssetRecord: id => client.get<AssetRecord>(`/assets/${encodeURIComponent(id)}/record`),
      createAsset: (input: NewAssetInput) => client.post<AssetSummary>('/assets', input),
    },
    tenants: {
      getAccount: id => client.get<TenantAccount>(`/tenants/${encodeURIComponent(id)}`),
      sendReminder: (id, input: ReminderInput) => client.post<TenantAccount>(`/tenants/${encodeURIComponent(id)}/reminders`, input),
      createFromLease: (assetId, input: NewTenantInput) => client.post<TenantAccount>(`/assets/${encodeURIComponent(assetId)}/tenants`, input),
      importRows: (assetId, rows: TenantImportRow[]) => client.post<TenantImportResult>(`/assets/${encodeURIComponent(assetId)}/tenants/import`, { rows }),
    },
    dashboard: {
      getSummary: (assetId, period) => {
        const params = new URLSearchParams({ period: period.kind });
        if (assetId) params.set('assetId', assetId);
        if (period.from) params.set('from', period.from);
        if (period.to) params.set('to', period.to);
        return client.get<DashboardSummary>(`/dashboard/summary?${params.toString()}`);
      },
    },
    ownerAuth: {
      getAccess: email => client.get<OwnerAccessInfo>(`/owner/access?email=${encodeURIComponent(email)}`),
      activate: async (email, password) => {
        const { token } = await client.post<{ token: string }>('/owner/activate', { email, password });
        sessionStore.setToken(token);
      },
      signIn: async (email, password) => {
        const { token } = await client.post<{ token: string }>('/owner/sign-in', { email, password });
        sessionStore.setToken(token);
      },
      requestLink: email => client.post<{ expiresInMinutes: number }>('/owner/links', { email }),
      openLink: async email => {
        const { token } = await client.post<{ token: string }>('/owner/links/open', { email });
        sessionStore.setToken(token);
      },
      requestReset: email => client.post<void>('/owner/password-reset', { email }),
    },
    owner: {
      getHome: () => client.get<OwnerHome>('/owner/home'),
      listReports: () => client.get<OwnerReportSummary[]>('/owner/reports'),
      getReport: id => client.get<OwnerReport>(`/owner/reports/${encodeURIComponent(id)}`),
      listLots: () => client.get<OwnerLot[]>('/owner/lots'),
      listDocuments: () => client.get<OwnerDocumentGroup[]>('/owner/documents'),
      download: async id => {
        const token = sessionStore.getToken();
        const response = await fetch(`${baseUrl}/owner/documents/${encodeURIComponent(id)}/file`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok) throw new AppError(response.status === 401 ? 'unauthorized' : 'unexpected');
        const name = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1];
        return { fileName: name ?? `${id}.pdf`, blob: await response.blob() };
      },
    },
    collections: {
      getOverview: assetId => client.get<CollectionsOverview>(`/collections/overview${scope(assetId)}`),
      getStatement: id => client.get<StatementDetail>(`/collections/statements/${encodeURIComponent(id)}`),
      validateReconciliation: (id, decisions: ReconciliationDecision[]) =>
        client.post<ReconciliationResult>(`/collections/statements/${encodeURIComponent(id)}/validate`, { decisions }),
      approveMonthlyFile: id => client.post<StatementDetail>(`/collections/statements/${encodeURIComponent(id)}/file/approve`, {}),
      reopenReconciliation: (id, reason) => client.post<StatementDetail>(`/collections/statements/${encodeURIComponent(id)}/reopen`, { reason }),
      getCheque: id => client.get<ChequeDetail>(`/collections/cheques/${encodeURIComponent(id)}`),
      matchChequeCredit: (id, statementId, lineId) => client.post<ChequeDetail>(`/collections/cheques/${encodeURIComponent(id)}/match`, { statementId, lineId }),
      dismissChequeCredit: (id, lineId) => client.post<ChequeDetail>(`/collections/cheques/${encodeURIComponent(id)}/dismiss`, { lineId }),
      addChequeFollowUp: (id, input: ChequeFollowUpInput) => client.post<ChequeDetail>(`/collections/cheques/${encodeURIComponent(id)}/follow-ups`, input),
      returnMonthlyFile: (id, comment) => client.post<StatementDetail>(`/collections/statements/${encodeURIComponent(id)}/file/return`, { comment }),
      listTenants: assetId => client.get<TenantOption[]>(`/tenants${scope(assetId)}`),
      recordCheque: (input: ChequeInput) => client.post<ChequeRecord>('/collections/cheques', input),
      listCheques: assetId => client.get<ChequeRow[]>(`/collections/cheques${scope(assetId)}`),
      listDeposits: assetId => client.get<BankDeposit[]>(`/collections/deposits${scope(assetId)}`),
      getDeposit: id => client.get<BankDeposit>(`/collections/deposits/${encodeURIComponent(id)}`),
      prepareDeposit: (chequeIds: string[]) => client.post<BankDeposit>('/collections/deposits', { chequeIds }),
      completeDeposit: (id, slips: Record<string, DepositSlip>) => client.post<BankDeposit>(`/collections/deposits/${encodeURIComponent(id)}/complete`, { slips }),
      returnCheque: (input: ChequeReturnInput) => client.post<ChequeReturnRecord>('/collections/cheques/return', input),
      rejectCheque: (id, reason: ChequeRejectReason, note) => client.post<ChequeRow>(`/collections/cheques/${encodeURIComponent(id)}/reject`, { reason, note }),
      getCaptures: id => client.get<CaptureLine[]>(`/collections/statements/${encodeURIComponent(id)}/captures`),
      attachCaptures: (id, assignments: CaptureAssignment[]) => client.post<void>(`/collections/statements/${encodeURIComponent(id)}/captures`, { assignments }),
      importStatement: (input: StatementImportInput) => client.post<{ statementId: string }>('/collections/statements/import', input),
    },
    billing: {
      getOverview: assetId => client.get<BillingOverview>(`/billing/overview${scope(assetId)}`),
      getInvoice: id => client.get<InvoiceDetail>(`/billing/invoices/${encodeURIComponent(id)}`),
      markChecked: id => client.post<InvoiceDetail>(`/billing/invoices/${encodeURIComponent(id)}/check`, {}),
      recordDelivery: (id, input: DeliveryInput) => client.post<InvoiceDetail>(`/billing/invoices/${encodeURIComponent(id)}/delivery`, input),
      previewCampaign: (period: Period) => client.get<CampaignPreview>(`/billing/campaigns/preview?year=${period.year}&quarter=${period.quarter}`),
      prepareCampaign: (period: Period) => client.post<{ created: number }>('/billing/campaigns', period),
      issueChecked: assetId => client.post<{ issued: number }>(`/billing/issue${scope(assetId)}`, {}),
    },
    arrears: {
      getOverview: assetId => client.get<ArrearsOverview>(`/arrears/overview${scope(assetId)}`),
    },
    reports: {
      getOverview: assetId => client.get<ReportsOverview>(`/reports/overview${scope(assetId)}`),
      getReport: id => client.get<ReportDetail>(`/reports/${encodeURIComponent(id)}`),
      generateDrafts: (period: Period) => client.post<{ created: number }>('/reports/drafts', period),
      transition: (id, action: ReportTransition, note) => client.post<ReportDetail>(`/reports/${encodeURIComponent(id)}/${action}`, { note }),
    },
    budget: {
      getOverview: assetId => client.get<BudgetOverview>(`/budget/overview${scope(assetId)}`),
      getBudget: id => client.get<BudgetDetail>(`/budget/${encodeURIComponent(id)}`),
      reestimate: (id, input: ReestimateInput) => client.post<BudgetDetail>(`/budget/${encodeURIComponent(id)}/reestimate`, input),
      prepareYear: year => client.post<{ created: number }>('/budget/years', { year }),
    },
    documents: {
      listDocuments: assetId => client.get<DocumentRow[]>(`/documents${scope(assetId)}`),
      getDocument: id => client.get<DocumentDetail>(`/documents/${encodeURIComponent(id)}`),
      upload: (input: DocumentUploadInput) => client.post<DocumentDetail>('/documents', input),
      download: async id => {
        const response = await fetch(`${baseUrl}/documents/${encodeURIComponent(id)}/content`);
        return response.blob();
      },
    },
    settings: {
      getOverview: () => client.get<SettingsOverview>('/settings/overview'),
      listUsers: () => client.get<UserRow[]>('/settings/users'),
      listRoles: () => client.get<RoleDefinition[]>('/settings/roles'),
      inviteUser: (input: UserInvitation) => client.post<UserRow>('/settings/users', input),
      listBillingItems: () => client.get<BillingItem[]>('/settings/billing-items'),
      saveBillingItem: (input: BillingItemInput, id?: string) =>
        client.post<BillingItem>(id ? `/settings/billing-items/${encodeURIComponent(id)}` : '/settings/billing-items', input),
      listCalendarRules: () => client.get<CalendarRule[]>('/settings/calendar'),
      saveCalendarRule: (id, input: CalendarRuleInput) => client.post<CalendarRule>(`/settings/calendar/${encodeURIComponent(id)}`, input),
      listReminderTemplates: () => client.get<ReminderTemplate[]>('/settings/reminder-templates'),
      saveReminderTemplate: (id, input: ReminderTemplateInput) =>
        client.post<ReminderTemplate>(`/settings/reminder-templates/${encodeURIComponent(id)}`, input),
      listBankAccounts: () => client.get<BankAccount[]>('/settings/bank-accounts'),
      saveBankAccount: (input: BankAccountInput, id?: string) =>
        client.post<BankAccount>(id ? `/settings/bank-accounts/${encodeURIComponent(id)}` : '/settings/bank-accounts', input),
      getFees: () => client.get<FeeSettings>('/settings/fees'),
      saveFees: (input: FeeSettingsInput) => client.post<FeeSettings>('/settings/fees', input),
    },
  };
}
