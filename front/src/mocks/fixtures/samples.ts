import type { NewTenantInput, TenantImportRow } from '@/services/contracts';

/** Le bail d'exemple du prototype « facture d'entrée » (Kora Énergies, bureaux de 186 m²). */
export function sampleLease(lotCode: string): NewTenantInput {
  return {
    name: 'Kora Énergies SARL',
    registration: 'CI-ABJ-03-2021-B13-08812',
    contactName: 'Mme Aya Koné, directrice financière',
    email: 'finance@kora-energies.ci',
    lotCode,
    lease: { start: '2027-01-15', durationYears: 3, monthlyRent: 1_200_000, monthlyCharges: 250_000, deposit: 3_600_000, keyMoney: 0, periodicity: 'quarterly', indexation: '3 % à chaque date anniversaire' },
  };
}

/** Le fichier d'exemple du prototype « socle » : deux baux sur les premiers lots vacants. */
export function sampleTenantRows(vacantLotCodes: string[]): TenantImportRow[] {
  return [
    { name: 'Cabinet Diallo & Associés', contactName: 'K. Diallo', email: 'contact@diallo-associes.ci', lotCode: vacantLotCodes[0] ?? 'A-101', start: '2026-11-01', monthlyRent: 650_000, monthlyCharges: 85_000, deposit: 1_950_000 },
    { name: 'Pharmacie des Flamboyants', contactName: 'A. Koné', email: 'pharmacie.flamboyants@exemple.ci', lotCode: vacantLotCodes[1] ?? 'A-102', start: '2026-11-01', monthlyRent: 820_000, monthlyCharges: 95_000, deposit: 2_460_000 },
  ];
}
