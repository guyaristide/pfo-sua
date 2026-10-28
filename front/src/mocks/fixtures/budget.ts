import type { BudgetOverview } from '@/services/contracts';

/** Budgets de charges 2026 par actif : initial en octobre, réestimé à mi-année, reddition au 15 avril suivant. */
export const budgetAll: BudgetOverview = {
  year: 2026,
  rows: [
    { id: 'b-1', assetName: 'ITC', year: 2026, status: 're-estimated', budgetAmount: 412_000_000, realisedAmount: 318_500_000, settlementDeadline: '2027-04-15', detail: 'Réestimé en juillet · gardiennage et climatisation en hausse' },
    { id: 'b-2', assetName: 'Les Trois Jardins', year: 2026, status: 'initial', budgetAmount: 96_000_000, realisedAmount: 71_200_000, settlementDeadline: '2027-04-15', detail: 'Clés du géomètre en attente pour le bâtiment B' },
    { id: 'b-3', assetName: 'Badamier', year: 2026, status: 'initial', budgetAmount: 58_000_000, realisedAmount: 44_900_000, settlementDeadline: '2027-04-15', detail: 'Reddition 2024 à 2026 prévue en mars-avril 2027' },
    { id: 'b-4', assetName: 'Boulevard Latrille', year: 2026, status: 'initial', budgetAmount: 74_000_000, realisedAmount: 60_800_000, settlementDeadline: '2027-04-15', detail: 'Ascenseurs : contrat renégocié en septembre' },
    { id: 'b-5', assetName: 'Baie des Sirènes', year: 2026, status: 'initial', budgetAmount: 23_000_000, realisedAmount: 15_100_000, settlementDeadline: '2027-04-15', detail: 'Locataire unique : charges forfaitaires' },
    { id: 'b-6', assetName: 'ITC', year: 2025, status: 'settled', budgetAmount: 388_000_000, realisedAmount: 401_300_000, settlementDeadline: '2026-04-15', detail: 'Reddition transmise le 12.04.2026' },
    { id: 'b-7', assetName: 'Les Trois Jardins', year: 2025, status: 'settled', budgetAmount: 91_000_000, realisedAmount: 88_600_000, settlementDeadline: '2026-04-15', detail: 'Reddition transmise le 12.04.2026' },
  ],
};
