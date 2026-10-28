import type { ArrearsOverview } from '@/services/contracts';

/** Situation des impayés au 16/10/2026, dans l'esprit de la base « situation impayés septembre 2026 » de PFO. */
export const arrearsAll: ArrearsOverview = {
  asOf: '2026-10-16',
  totalDue: 74_200_000,
  unpaidRate: 0.055,
  preLitigationCount: 2,
  directionReportDate: '2026-11-08',
  rows: [
    { id: 'a-1', tenantId: 'tn-afrik', tenantName: 'Afrik Logistique', assetName: 'ITC', amountDue: 19_500_000, lateDays: 102, bucket: 'over-90', lastPaymentDate: '2026-07-06', reminderLevel: 'pre-litigation' },
    { id: 'a-2', tenantId: 'tn-sni', tenantName: 'Société Nouvelle Import', assetName: 'ITC', amountDue: 8_950_000, lateDays: 71, bucket: 'over-60', lastPaymentDate: '2026-08-06', reminderLevel: 'formal-notice' },
    { id: 'a-3', tenantId: 'tn-cafe', tenantName: 'Café du Plateau', assetName: 'ITC', amountDue: 4_200_000, lateDays: 11, bucket: 'under-30', lastPaymentDate: '2026-07-04', reminderLevel: 'none' },
    { id: 'a-4', tenantId: 'tn-koffi', tenantName: 'Cabinet Koffi', assetName: 'Les Trois Jardins', amountDue: 12_600_000, lateDays: 41, bucket: 'over-30', lastPaymentDate: '2026-06-30', reminderLevel: 'reminder-2' },
    { id: 'a-5', tenantId: 'tn-nawa', tenantName: 'Studio Nawa', assetName: 'Les Trois Jardins', amountDue: 6_700_000, lateDays: 34, bucket: 'over-30', lastPaymentDate: '2026-09-02', reminderLevel: 'reminder-2' },
    { id: 'a-6', tenantId: 'tn-kemi', tenantName: 'Kemi Mode', assetName: 'Boulevard Latrille', amountDue: 13_850_000, lateDays: 95, bucket: 'over-90', lastPaymentDate: null, reminderLevel: 'pre-litigation' },
    { id: 'a-7', tenantId: 'tn-optique', tenantName: 'Optique Marcory', assetName: 'Boulevard Latrille', amountDue: 780_000, lateDays: 11, bucket: 'under-30', lastPaymentDate: '2026-07-05', reminderLevel: 'none' },
    { id: 'a-8', tenantId: 'tn-palmiers', tenantName: 'Résidence Les Palmiers', assetName: 'Badamier', amountDue: 4_100_000, lateDays: 19, bucket: 'under-30', lastPaymentDate: '2026-07-03', reminderLevel: 'reminder-1' },
    { id: 'a-9', tenantId: 'tn-baie', tenantName: 'Baie Resort SA', assetName: 'Baie des Sirènes', amountDue: 3_520_000, lateDays: 48, bucket: 'over-30', lastPaymentDate: '2026-04-07', reminderLevel: 'reminder-3' },
  ],
};
