import { createBrowserRouter } from 'react-router';
import { AppShellLayout } from './AppShellLayout';
import { SessionGate } from './SessionGate';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { AssetRecordPage } from './pages/AssetRecordPage';
import { NewAssetPage } from './pages/NewAssetPage';
import { TenantAccountPage } from './pages/TenantAccountPage';
import { RemindTenantPage } from './pages/RemindTenantPage';
import { NewTenantPage } from './pages/NewTenantPage';
import { ImportTenantsPage } from './pages/ImportTenantsPage';
import { BillingPage } from './pages/BillingPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ReconcileStatementPage } from './pages/ReconcileStatementPage';
import { RecordChequePage } from './pages/RecordChequePage';
import { ArrearsPage } from './pages/ArrearsPage';
import { ReportsPage } from './pages/ReportsPage';
import { BudgetPage } from './pages/BudgetPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage, UserInvitePage } from './pages/settings/UsersPage';
import { BillingItemsPage, BillingItemFormPage } from './pages/settings/BillingItemsPage';
import { CalendarPage, CalendarRuleFormPage } from './pages/settings/CalendarPage';
import { ReminderTemplatesPage, ReminderTemplateFormPage } from './pages/settings/ReminderTemplatesPage';
import { BankAccountsPage, BankAccountFormPage } from './pages/settings/BankAccountsPage';
import { FeesPage, FeesFormPage } from './pages/settings/FeesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';
import { InvoicePage, InvoiceDeliveryPage } from './pages/billing/InvoicePages';
import { CampaignPage, IssuePage } from './pages/billing/CampaignPages';
import { ReportPage } from './pages/reports/ReportPage';
import { BudgetDetailPage, ReestimatePage } from './pages/budget/BudgetPages';
import { ChequesPage, RejectChequePage } from './pages/collections/ChequePages';
import { CapturesPage, ImportStatementPage } from './pages/collections/StatementPages';
import { DocumentPage, UploadDocumentPage } from './pages/documents/DocumentPages';
import { HelpPage } from './pages/HelpPage';

/** Lire avant d'éditer (règle 8) : `/assets/:assetId` est la fiche ; l'édition aura sa propre route. */
export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    element: (
      <SessionGate>
        <AppShellLayout />
      </SessionGate>
    ),
    children: [
      { index: true, Component: DashboardPage },
      { path: 'assets', Component: AssetsPage },
      { path: 'assets/new', Component: NewAssetPage },
      { path: 'assets/:assetId', Component: AssetRecordPage },
      { path: 'assets/:assetId/tenants/new', Component: NewTenantPage },
      { path: 'assets/:assetId/tenants/import', Component: ImportTenantsPage },
      { path: 'tenants/:tenantId', Component: TenantAccountPage },
      { path: 'billing', Component: BillingPage },
      { path: 'billing/campaigns/new', Component: CampaignPage },
      { path: 'billing/issue', Component: IssuePage },
      { path: 'billing/invoices/:invoiceId', Component: InvoicePage },
      { path: 'billing/invoices/:invoiceId/delivery', Component: InvoiceDeliveryPage },
      { path: 'collections', Component: CollectionsPage },
      { path: 'collections/statements/:statementId/reconcile', Component: ReconcileStatementPage },
      { path: 'collections/cheques', Component: ChequesPage },
      { path: 'collections/cheques/new', Component: RecordChequePage },
      { path: 'collections/cheques/:chequeId/reject', Component: RejectChequePage },
      { path: 'collections/statements/import', Component: ImportStatementPage },
      { path: 'collections/statements/:statementId/captures', Component: CapturesPage },
      { path: 'arrears', Component: ArrearsPage },
      { path: 'arrears/:tenantId/remind', Component: RemindTenantPage },
      { path: 'reports', Component: ReportsPage },
      { path: 'reports/:reportId', Component: ReportPage },
      { path: 'budget', Component: BudgetPage },
      { path: 'budget/:budgetId', Component: BudgetDetailPage },
      { path: 'budget/:budgetId/reestimate', Component: ReestimatePage },
      { path: 'documents', Component: DocumentsPage },
      { path: 'documents/new', Component: UploadDocumentPage },
      { path: 'documents/:documentId', Component: DocumentPage },
      { path: 'documents/:documentId/version', Component: UploadDocumentPage },
      { path: 'settings', Component: SettingsPage },
      { path: 'settings/users', Component: UsersPage },
      { path: 'settings/users/new', Component: UserInvitePage },
      { path: 'settings/billing-items', Component: BillingItemsPage },
      { path: 'settings/billing-items/new', Component: BillingItemFormPage },
      { path: 'settings/billing-items/:itemId/edit', Component: BillingItemFormPage },
      { path: 'settings/calendar', Component: CalendarPage },
      { path: 'settings/calendar/:ruleId/edit', Component: CalendarRuleFormPage },
      { path: 'settings/reminder-templates', Component: ReminderTemplatesPage },
      { path: 'settings/reminder-templates/:templateId/edit', Component: ReminderTemplateFormPage },
      { path: 'settings/bank-accounts', Component: BankAccountsPage },
      { path: 'settings/bank-accounts/new', Component: BankAccountFormPage },
      { path: 'settings/bank-accounts/:accountId/edit', Component: BankAccountFormPage },
      { path: 'settings/fees', Component: FeesPage },
      { path: 'settings/fees/edit', Component: FeesFormPage },
      { path: 'search', Component: SearchPage },
      { path: 'help', Component: HelpPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
