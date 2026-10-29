import type { MessageKey } from '@/i18n/fr';
import type { DashboardKpiKey, RoleKey } from '@/services/contracts/types';

/** Un rôle, un libellé (règle 13) : lu par la coquille et par les paramètres. */
export const roleLabelKey: Record<RoleKey, MessageKey> = {
  pmLead: 'role.pmLead',
  assetManager: 'role.assetManager',
  financeManager: 'role.financeManager',
  owner: 'role.owner',
  operations: 'role.operations',
  admin: 'role.admin',
};

export const roleKeys = Object.keys(roleLabelKey) as RoleKey[];

/**
 * Les indicateurs du tableau de bord selon le rôle (E0.1, prototype 0) : la responsable PM, la direction et
 * l'Asset Manager voient le patrimoine ; les gestionnaires, leur situation de travail.
 */
export const dashboardKpisByRole: Record<RoleKey, DashboardKpiKey[]> = {
  pmLead: ['vacancy', 'unpaid', 'pre-litigation', 'budget'],
  financeManager: ['unpaid', 'collected', 'recovery', 'cheques'],
  assetManager: ['unpaid', 'pre-litigation', 'leases', 'vacancy'],
  owner: ['occupancy', 'unpaid', 'recovery', 'budget'],
  operations: ['occupancy', 'vacancy', 'leases', 'unpaid'],
  admin: ['vacancy', 'unpaid', 'pre-litigation', 'budget'],
};

/** Rôles qui voient le tableau « Les chiffres de chaque actif », exportable avec une ligne Total. */
export const portfolioRoles: readonly RoleKey[] = ['pmLead', 'owner', 'admin'];
