/**
 * Constantes de permission. Elles ne se référencent que dans ce module et dans les gardes (règle 14) ;
 * un cliquet le vérifie. Le serveur reste seul juge : la garde sert l'ergonomie et la lisibilité.
 */
export const PERMISSIONS = {
  ASSET_READ: 'asset.read',
  ASSET_WRITE: 'asset.write',
  TENANT_WRITE: 'tenant.write',
  LEASE_WRITE: 'lease.write',
  INVOICE_ISSUE: 'invoice.issue',
  COLLECTION_RECORD: 'collection.record',
  COLLECTION_VALIDATE: 'collection.validate',
  REPORT_VALIDATE: 'report.validate',
  BUDGET_VALIDATE: 'budget.validate',
  ADMIN: 'admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
