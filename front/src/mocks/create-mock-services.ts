import type { Services } from '@/services/contracts';
import { createMockContext, type MockOptions } from './context';
import { createDemoMock } from './services/demo';
import { createSessionMock } from './services/session';
import { createSearchMock } from './services/search';
import { createNotificationMock } from './services/notifications';
import { createAuthMock } from './services/auth';
import { createAssetMock } from './services/assets';
import { createTenantMock } from './services/tenants';
import { createDashboardMock } from './services/dashboard';
import { createCollectionMock } from './services/collections';
import { createBillingMock } from './services/billing';
import { createArrearsMock } from './services/arrears';
import { createReportMock } from './services/reports';
import { createBudgetMock } from './services/budget';
import { createDocumentMock } from './services/documents';
import { createSettingsMock } from './services/settings';
import { createOwnerAuthMock } from './services/owner-auth';
import { createOwnerMock } from './services/owner';

export type { MockOptions } from './context';

/**
 * Implémentation simulée des contrats, un fichier par domaine. Même forme que l'API, données en mémoire,
 * latence réglable ; un filtre par actif réduit les jeux globaux pour que le sélecteur d'actif ait un effet visible.
 */
export function createMockServices(options: MockOptions = {}): Services {
  const ctx = createMockContext(options);
  return {
    demo: createDemoMock(ctx),
    session: createSessionMock(ctx),
    search: createSearchMock(ctx),
    notifications: createNotificationMock(ctx),
    auth: createAuthMock(ctx),
    assets: createAssetMock(ctx),
    tenants: createTenantMock(ctx),
    dashboard: createDashboardMock(ctx),
    collections: createCollectionMock(ctx),
    ownerAuth: createOwnerAuthMock(ctx),
    owner: createOwnerMock(ctx),
    billing: createBillingMock(ctx),
    arrears: createArrearsMock(ctx),
    reports: createReportMock(ctx),
    budget: createBudgetMock(ctx),
    documents: createDocumentMock(ctx),
    settings: createSettingsMock(ctx),
  };
}
