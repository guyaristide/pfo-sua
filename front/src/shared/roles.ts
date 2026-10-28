import type { MessageKey } from '@/i18n/fr';
import type { RoleKey } from '@/services/contracts/types';

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
