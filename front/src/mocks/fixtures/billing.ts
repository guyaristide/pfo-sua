import type { BillingOverview } from '@/services/contracts';

/** Campagne de facturation T4 2026 : factures émises au plus tard le 20 du mois précédent, échéance le 5 (cadrage du 13/10). */
export const billingAll: BillingOverview = {
  campaign: {
    period: { year: 2026, quarter: 4 },
    issueDeadline: '2026-09-20',
    dueDate: '2026-10-05',
    invoiceCount: 12,
    issuedCount: 9,
    toCheckCount: 2,
    deliveredCount: 7,
    totalAmount: 186_400_000,
  },
  invoices: [
    { id: 'f-1', tenantName: 'Atlantis Télécom', assetName: 'ITC', periodStart: '2026-10-01', amount: 27_000_000, dueDate: '2026-10-05', status: 'paid', deliveryDetail: 'Déposée le 22.09 · retour signé' },
    { id: 'f-2', tenantName: 'Afrik Logistique', assetName: 'ITC', periodStart: '2026-10-01', amount: 9_750_000, dueDate: '2026-10-05', status: 'partially-paid', deliveryDetail: 'Déposée le 22.09 · chèque rejeté le 16.10' },
    { id: 'f-3', tenantName: 'Café du Plateau', assetName: 'ITC', periodStart: '2026-10-01', amount: 4_200_000, dueDate: '2026-10-05', status: 'delivered', deliveryDetail: 'Déposée le 23.09 · accusé de réception' },
    { id: 'f-4', tenantName: 'Ivoire Assurances', assetName: 'ITC', periodStart: '2026-10-01', amount: 18_600_000, dueDate: '2026-10-05', status: 'delivered', deliveryDetail: 'Déposée le 23.09 · retour signé' },
    { id: 'f-5', tenantName: 'Pharmacie du Centre', assetName: 'ITC', periodStart: '2026-10-01', amount: 5_100_000, dueDate: '2026-10-05', status: 'issued', deliveryDetail: null },
    { id: 'f-6', tenantName: 'Studio Nawa', assetName: 'Les Trois Jardins', periodStart: '2026-10-01', amount: 2_850_000, dueDate: '2026-10-05', status: 'paid', deliveryDetail: 'Déposée le 24.09 · retour signé' },
    { id: 'f-7', tenantName: 'Cabinet Koffi', assetName: 'Les Trois Jardins', periodStart: '2026-10-01', amount: 6_300_000, dueDate: '2026-10-05', status: 'to-check', deliveryDetail: null },
    { id: 'f-8', tenantName: 'Optique Marcory', assetName: 'Boulevard Latrille', periodStart: '2026-10-01', amount: 2_340_000, dueDate: '2026-10-05', status: 'delivered', deliveryDetail: 'Déposée le 24.09 · accusé de réception' },
    { id: 'f-9', tenantName: 'Kemi Mode', assetName: 'Boulevard Latrille', periodStart: '2026-10-01', amount: 1_980_000, dueDate: '2026-10-05', status: 'to-check', deliveryDetail: null },
    { id: 'f-10', tenantName: 'Clinique Sainte-Anne', assetName: 'Badamier', periodStart: '2026-10-01', amount: 12_000_000, dueDate: '2026-10-05', status: 'paid', deliveryDetail: 'Déposée le 22.09 · retour signé' },
    { id: 'f-11', tenantName: 'Résidence Les Palmiers', assetName: 'Badamier', periodStart: '2026-10-01', amount: 8_400_000, dueDate: '2026-10-05', status: 'delivered', deliveryDetail: 'Déposée le 25.09 · retour signé' },
    { id: 'f-12', tenantName: 'Baie Resort SA', assetName: 'Baie des Sirènes', periodStart: '2026-10-01', amount: 87_880_000, dueDate: '2026-10-05', status: 'draft', deliveryDetail: null },
  ],
};
