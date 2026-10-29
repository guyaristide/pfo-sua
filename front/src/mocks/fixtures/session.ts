import type { Session } from '@/services/contracts';

/** Jeu de sessions : une par rôle du cadrage. Les droits reflètent la matrice de l'offre technique (§IX) ;
 * la responsable PM tient le rôle d'administratrice fonctionnelle. */
export const sessions: Record<string, Session> = {
  pmLead: {
    user: { id: 'u-elea', firstName: 'Eléa', lastName: 'M.', role: 'pmLead' },
    tenant: { id: 'pfo-immobilier', name: 'PFO Immobilier', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    // Annexe B du dossier de transmission (28/10) : la Responsable PM lit les encaissements et peut créer un actif (Q1).
    permissions: ['asset.read', 'asset.write', 'tenant.write', 'lease.write', 'invoice.issue', 'report.validate', 'budget.validate', 'admin'],
  },
  assetManager: {
    user: { id: 'u-elema', firstName: 'Eléma', lastName: 'B.', role: 'assetManager' },
    tenant: { id: 'pfo-immobilier', name: 'PFO Immobilier', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: ['asset.read', 'asset.write', 'tenant.write', 'lease.write', 'collection.approve'],
  },
  financeManager: {
    user: { id: 'u-vincent', firstName: 'Vincent', lastName: 'C.', role: 'financeManager' },
    tenant: { id: 'pfo-immobilier', name: 'PFO Immobilier', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: ['asset.read', 'invoice.issue', 'collection.record'],
  },
};

/** Espace propriétaire (parcours 3) : le représentant de la SCI ITC, et celui d'un nouvel actif sans compte-rendu. */
export const ownerSessions: Record<string, Session> = {
  ownerItc: {
    user: { id: 'u-jm-aka', firstName: 'Jean-Marc', lastName: 'Aka', role: 'owner' },
    tenant: { id: 'pfo-immobilier', name: 'SCI ITC', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: ['owner.read'],
  },
  ownerFlamboyants: {
    user: { id: 'u-a-brou', firstName: 'Adjoua', lastName: 'Brou', role: 'owner' },
    tenant: { id: 'pfo-immobilier', name: 'SCI Les Flamboyants', currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' },
    permissions: ['owner.read'],
  },
};

export const defaultSessionKey = 'pmLead';
