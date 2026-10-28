import type { Session } from '@/services/contracts';

/** Jeu de sessions : une par rôle du cadrage. Les droits reflètent la matrice de l'offre technique (§IX) ;
 * la responsable PM tient le rôle d'administratrice fonctionnelle. */
export const sessions: Record<string, Session> = {
  pmLead: {
    user: { id: 'u-elea', firstName: 'Eléa', lastName: 'M.', role: 'pmLead' },
    tenant: { id: 'pfo-immobilier', name: 'PFO Immobilier', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: [
      'asset.read',
      'asset.write',
      'tenant.write',
      'lease.write',
      'invoice.issue',
      'collection.record',
      'collection.validate',
      'report.validate',
      'budget.validate',
      'admin',
    ],
  },
  assetManager: {
    user: { id: 'u-elema', firstName: 'Eléma', lastName: 'B.', role: 'assetManager' },
    tenant: { id: 'pfo-immobilier', name: 'PFO Immobilier', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: ['asset.read', 'asset.write', 'tenant.write', 'lease.write', 'collection.validate'],
  },
  financeManager: {
    user: { id: 'u-vincent', firstName: 'Vincent', lastName: 'C.', role: 'financeManager' },
    tenant: { id: 'pfo-immobilier', name: 'PFO Immobilier', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: ['asset.read', 'invoice.issue', 'collection.record'],
  },
};

export const defaultSessionKey = 'pmLead';
