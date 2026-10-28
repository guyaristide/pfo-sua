import type { ReportsOverview } from '@/services/contracts';

/** CRG du T3 2026 (à transmettre le 15 octobre) et T2 signés, selon la procédure CRG v3. */
export const reportsAll: ReportsOverview = {
  currentPeriod: { year: 2026, quarter: 3 },
  rows: [
    { id: 'r-1', assetName: 'ITC', period: { year: 2026, quarter: 3 }, status: 'in-review', preparedBy: 'Vincent C.', dueDate: '2026-10-15', amountToTransfer: 142_300_000, stepDetail: 'Relecture Resp. PM · 3 signatures restantes' },
    { id: 'r-2', assetName: 'Les Trois Jardins', period: { year: 2026, quarter: 3 }, status: 'validated', preparedBy: 'Vincent C.', dueDate: '2026-10-15', amountToTransfer: 48_900_000, stepDetail: 'Validé DAF et AM le 14.10 · à signer' },
    { id: 'r-3', assetName: 'Badamier', period: { year: 2026, quarter: 3 }, status: 'signed', preparedBy: 'Vincent C.', dueDate: '2026-10-15', amountToTransfer: 31_250_000, stepDetail: 'Transmis au propriétaire le 13.10' },
    { id: 'r-4', assetName: 'Boulevard Latrille', period: { year: 2026, quarter: 3 }, status: 'draft', preparedBy: 'Vincent C.', dueDate: '2026-10-15', amountToTransfer: null, stepDetail: 'Relevé BGFI de septembre validé le 07.10' },
    { id: 'r-5', assetName: 'Baie des Sirènes', period: { year: 2026, quarter: 3 }, status: 'draft', preparedBy: 'Vincent C.', dueDate: '2026-10-15', amountToTransfer: null, stepDetail: 'Pas de compte SCI : revenus suivis sur le compte PFO' },
    { id: 'r-6', assetName: 'ITC', period: { year: 2026, quarter: 2 }, status: 'signed', preparedBy: 'Vincent C.', dueDate: '2026-07-15', amountToTransfer: 138_750_000, stepDetail: 'Transmis le 14.07' },
    { id: 'r-7', assetName: 'Les Trois Jardins', period: { year: 2026, quarter: 2 }, status: 'signed', preparedBy: 'Vincent C.', dueDate: '2026-07-15', amountToTransfer: 46_100_000, stepDetail: 'Transmis le 15.07' },
    { id: 'r-8', assetName: 'Badamier', period: { year: 2026, quarter: 2 }, status: 'signed', preparedBy: 'Vincent C.', dueDate: '2026-07-15', amountToTransfer: 30_400_000, stepDetail: 'Transmis le 15.07' },
    { id: 'r-9', assetName: 'Boulevard Latrille', period: { year: 2026, quarter: 2 }, status: 'signed', preparedBy: 'Vincent C.', dueDate: '2026-07-15', amountToTransfer: 22_600_000, stepDetail: 'Transmis le 16.07' },
  ],
};
