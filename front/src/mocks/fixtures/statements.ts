import type { StatementDetail } from '@/services/contracts';

/** Relevé SGCI · ITC · septembre 2026 du prototype 2A, réduit à un échantillon de lignes. */
export const statementItcSeptember: StatementDetail = {
  id: 's-1',
  bank: 'SGCI',
  accountLabel: '•••• 4471',
  accountOwner: 'sci',
  assetName: 'ITC',
  period: '2026-09-01',
  status: 'to-reconcile',
  imported: false,
  linesRead: 76,
  pageCount: 7,
  checks: {
    periodFrom: '2026-09-01',
    periodTo: '2026-09-30',
    duplicatesIgnored: 3,
    debitsExcluded: 9,
    openingBalance: 3_641_380_000,
    closingBalance: 3_893_160_000,
    previousStatementComplete: false,
  },
  previous: [
    { period: '2026-08-01', collectedAmount: 452_870_000, status: 'validated-with-observation' },
    { period: '2026-07-01', collectedAmount: 498_310_000, status: 'validated' },
  ],
  cutOffInDays: 2,
  lines: [
    { id: 'l-01', date: '2026-09-02', label: 'VIR ATLANTIS TELECOM LOYER T3', amount: 27_000_000, state: 'matched', tenantName: 'Atlantis Télécom', lotCode: 'C-203', invoiceLabel: 'Facture T3 2026', dueAmount: 27_000_000, hint: 'Imputée le 05.09 depuis le relevé journalier' },
    { id: 'l-02', date: '2026-09-03', label: 'VIR IVOIRE ASSURANCES', amount: 18_600_000, state: 'matched', tenantName: 'Ivoire Assurances', lotCode: 'B-402', invoiceLabel: 'Facture T3 2026', dueAmount: 18_600_000, hint: 'Imputée le 05.09 depuis le relevé journalier' },
    { id: 'l-03', date: '2026-09-04', label: 'REMISE CHQ 0024102 LAGUNE AUDIT', amount: 2_400_000, state: 'matched', tenantName: 'Lagune Audit et Conseil', lotCode: 'A-118', invoiceLabel: 'Facture T3 2026', dueAmount: 2_400_000, hint: 'Chèque enregistré le 01.09, crédité le 04.09' },
    { id: 'l-04', date: '2026-09-05', label: 'FRAIS TENUE DE COMPTE', amount: -45_000, state: 'excluded', tenantName: null, lotCode: null, invoiceLabel: null, dueAmount: null, hint: 'Débit : frais bancaires' },
    { id: 'l-05', date: '2026-09-08', label: 'VIR PHARMACIE DU CENTRE SEPT', amount: 5_100_000, state: 'ready', tenantName: 'Pharmacie du Centre', lotCode: 'A-012', invoiceLabel: 'Facture T3 2026', dueAmount: 5_100_000, hint: 'Montant et locataire reconnus' },
    { id: 'l-06', date: '2026-09-09', label: 'VIR CAFE DU PLATEAU', amount: 4_200_000, state: 'ready', tenantName: 'Café du Plateau', lotCode: 'RDC-04', invoiceLabel: 'Facture T3 2026', dueAmount: 4_200_000, hint: 'Montant et locataire reconnus' },
    { id: 'l-07', date: '2026-09-12', label: 'VIR SAVANE CONSEIL LOYER CHARGES T3', amount: 3_200_000, state: 'to-check', tenantName: 'Savane Conseil', lotCode: 'B-115', invoiceLabel: 'Factures T1 et T3 2026', dueAmount: 4_100_000, hint: 'Avis de virement joint : loyer 2 800 000 et charges 400 000 du T3 ; l’enseigne du T1 reste due' },
    { id: 'l-08', date: '2026-09-15', label: 'VIR AFRIK LOGISTIQUE', amount: 6_000_000, state: 'to-check', tenantName: 'Afrik Logistique', lotCode: 'D-010', invoiceLabel: 'Factures T2 et T3 2026', dueAmount: 19_500_000, hint: 'Règlement partiel : il solde la plus ancienne facture, le reste s’impute sur le T3' },
    { id: 'l-09', date: '2026-09-18', label: 'CHQ 0071990 REJETE', amount: -1_250_000, state: 'excluded', tenantName: null, lotCode: null, invoiceLabel: null, dueAmount: null, hint: 'Chèque émis par la SCI et rejeté par la banque : à écarter du rapprochement' },
    { id: 'l-10', date: '2026-09-22', label: 'VIR DE M. K. TRAORE', amount: 950_000, state: 'unrecognised', tenantName: null, lotCode: null, invoiceLabel: null, dueAmount: null, hint: 'Aucun locataire ni facture ne correspond à ce libellé' },
    { id: 'l-11', date: '2026-09-25', label: 'VERSEMENT ESPECES GUICHET', amount: 780_000, state: 'ready', tenantName: 'Optique Marcory', lotCode: 'BL-07', invoiceLabel: 'Facture T3 2026', dueAmount: 780_000, hint: 'Montant exact de la facture, versement au guichet annoncé par le locataire' },
    { id: 'l-12', date: '2026-09-29', label: 'VIR STUDIO NAWA', amount: 2_850_000, state: 'matched', tenantName: 'Studio Nawa', lotCode: 'TJ-A-21', invoiceLabel: 'Facture T3 2026', dueAmount: 2_850_000, hint: 'Imputée le 30.09' },
  ],
};
