import type { OpenInvoice, StatementDetail, StatementTenant } from '@/services/contracts';

const invoice = (tenantId: string, id: string, item: OpenInvoice['item'], label: string, reference: string, period: OpenInvoice['period'], due: number): OpenInvoice => ({
  id,
  tenantId,
  item,
  label,
  reference,
  period,
  due,
});

/** Les locataires du compte SGCI · ITC et leurs factures ouvertes au moment du rapprochement. */
export const statementTenantsItc: StatementTenant[] = [
  { id: 'tn-atlantis', name: 'Atlantis Télécom', lotCode: 'C-203', invoices: [] },
  { id: 'tn-ivoire', name: 'Ivoire Assurances', lotCode: 'B-402', invoices: [] },
  { id: 'tn-lagune', name: 'Lagune Audit et Conseil', lotCode: 'A-101', invoices: [] },
  {
    id: 'tn-pharma',
    name: 'Pharmacie du Centre',
    lotCode: 'A-012',
    invoices: [invoice('tn-pharma', 'fa-0915-r', 'rent', 'Loyer T3 2026', 'FA-2026-0915', 'current', 4_350_000), invoice('tn-pharma', 'fa-0915-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0915', 'current', 750_000)],
  },
  {
    id: 'tn-cafe',
    name: 'Café du Plateau',
    lotCode: 'RDC-04',
    invoices: [invoice('tn-cafe', 'fa-0940-r', 'rent', 'Loyer T3 2026', 'FA-2026-0940', 'current', 3_600_000), invoice('tn-cafe', 'fa-0940-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0940', 'current', 600_000)],
  },
  {
    id: 'tn-savane',
    name: 'Savane Conseil',
    lotCode: 'B-115',
    invoices: [
      invoice('tn-savane', 'fa-0041-s', 'sign', 'Enseigne T1 2026', 'FA-2026-0041', 'prior', 900_000),
      invoice('tn-savane', 'fa-0927-r', 'rent', 'Loyer T3 2026', 'FA-2026-0927', 'current', 2_800_000),
      invoice('tn-savane', 'fa-0927-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0927', 'current', 400_000),
    ],
  },
  {
    id: 'tn-savane-d',
    name: 'Savane Digital',
    lotCode: 'B-116',
    invoices: [invoice('tn-savane-d', 'fa-0928-r', 'rent', 'Loyer T3 2026', 'FA-2026-0928', 'current', 2_300_000), invoice('tn-savane-d', 'fa-0928-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0928', 'current', 500_000)],
  },
  {
    id: 'tn-afrik',
    name: 'Afrik Logistique',
    lotCode: 'D-010',
    invoices: [
      invoice('tn-afrik', 'fa-0612-r', 'rent', 'Loyer T2 2026', 'FA-2026-0612', 'prior', 8_250_000),
      invoice('tn-afrik', 'fa-0612-c', 'charges', 'Charges locatives T2 2026', 'FA-2026-0612', 'prior', 1_500_000),
      invoice('tn-afrik', 'fa-0912-r', 'rent', 'Loyer T3 2026', 'FA-2026-0912', 'current', 8_250_000),
      invoice('tn-afrik', 'fa-0912-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0912', 'current', 1_500_000),
    ],
  },
  {
    id: 'tn-sni',
    name: 'Société Nouvelle Import',
    lotCode: 'C-105',
    invoices: [
      invoice('tn-sni', 'fa-0605-r', 'rent', 'Loyer T2 2026', 'FA-2026-0605', 'prior', 3_430_000),
      invoice('tn-sni', 'fa-0605-c', 'charges', 'Charges locatives T2 2026', 'FA-2026-0605', 'prior', 450_000),
      invoice('tn-sni', 'fa-0905-r', 'rent', 'Loyer T3 2026', 'FA-2026-0905', 'current', 4_620_000),
      invoice('tn-sni', 'fa-0905-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0905', 'current', 450_000),
    ],
  },
];

const chequeProof = { kind: 'cheque-photos' as const, name: 'Photos du chèque et bordereau de remise, enregistrés à la réception', source: 'reception' as const };
const none = { proof: null, availableProof: null, notice: null, internal: false, exclusion: null };

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
  tenants: statementTenantsItc,
  file: null,
  fileVersions: [],
  journal: [],
  observation: null,
  reportSigned: false,
  lines: [
    { id: 'l-01', date: '2026-09-02', label: 'VIR ATLANTIS TELECOM LOYER T3', amount: 27_000_000, state: 'matched', paymentKind: 'transfer', tenantId: 'tn-atlantis', tenantName: 'Atlantis Télécom', lotCode: 'C-203', invoiceLabel: 'Facture T3 2026', dueAmount: 27_000_000, hint: 'Imputée le 05.09 depuis le relevé journalier', ...none, proof: { kind: 'transfer-notice', name: 'Avis de virement du 02.09', source: 'email' } },
    { id: 'l-02', date: '2026-09-03', label: 'VIR IVOIRE ASSURANCES', amount: 18_600_000, state: 'matched', paymentKind: 'transfer', tenantId: 'tn-ivoire', tenantName: 'Ivoire Assurances', lotCode: 'B-402', invoiceLabel: 'Facture T3 2026', dueAmount: 18_600_000, hint: 'Imputée le 05.09 depuis le relevé journalier', ...none, proof: { kind: 'bank-capture', name: 'Capture SGCI du 03.09', source: 'email' } },
    { id: 'l-03', date: '2026-09-04', label: 'REMISE CHQ 0024102 LAGUNE AUDIT', amount: 2_400_000, state: 'matched', paymentKind: 'cheque', tenantId: 'tn-lagune', tenantName: 'Lagune Audit et Conseil', lotCode: 'A-101', invoiceLabel: 'Facture T3 2026', dueAmount: 2_400_000, hint: 'Chèque enregistré le 01.09, crédité le 04.09', ...none, proof: chequeProof },
    { id: 'l-04', date: '2026-09-05', label: 'FRAIS TENUE DE COMPTE', amount: -45_000, state: 'excluded', paymentKind: 'other', tenantId: null, tenantName: null, lotCode: null, invoiceLabel: null, dueAmount: null, hint: 'Débit écarté à l’import', ...none, exclusion: { reason: 'bank-fees', note: null } },
    { id: 'l-05', date: '2026-09-08', label: 'VIR PHARMACIE DU CENTRE SEPT', amount: 5_100_000, state: 'ready', paymentKind: 'transfer', tenantId: 'tn-pharma', tenantName: 'Pharmacie du Centre', lotCode: 'A-012', invoiceLabel: 'Facture T3 2026', dueAmount: 5_100_000, hint: 'Nom du payeur et 5 virements précédents', ...none, availableProof: { kind: 'transfer-notice', name: 'Avis de virement reçu par e-mail le 08.09', source: 'email' } },
    { id: 'l-06', date: '2026-09-09', label: 'VERSEMENT ESPECES GUICHET · CAFE DU PLATEAU', amount: 4_200_000, state: 'ready', paymentKind: 'cash', tenantId: 'tn-cafe', tenantName: 'Café du Plateau', lotCode: 'RDC-04', invoiceLabel: 'Facture T3 2026', dueAmount: 4_200_000, hint: 'Nom du déposant, montant exact de la facture', ...none, availableProof: { kind: 'cash-slip', name: 'Bordereau de versement scanné à la réception', source: 'reception' } },
    { id: 'l-07', date: '2026-09-12', label: 'VIR SAVANE CONSEIL LOYER CHARGES T3', amount: 3_200_000, state: 'to-check', paymentKind: 'transfer', tenantId: 'tn-savane', tenantName: 'Savane Conseil', lotCode: 'B-115', invoiceLabel: 'Factures T1 et T3 2026', dueAmount: 4_100_000, hint: 'Le locataire a joint un avis de virement : loyer et charges du T3, l’enseigne du T1 reste due', ...none, proof: { kind: 'transfer-notice', name: 'Avis de virement du 12.09', source: 'email' }, notice: { label: 'Loyer 2 800 000 et charges 400 000 du T3', amounts: { 'fa-0927-r': 2_800_000, 'fa-0927-c': 400_000 } } },
    { id: 'l-08', date: '2026-09-15', label: 'VIR AFRIK LOGISTIQUE', amount: 6_000_000, state: 'to-check', paymentKind: 'transfer', tenantId: 'tn-afrik', tenantName: 'Afrik Logistique', lotCode: 'D-010', invoiceLabel: 'Factures T2 et T3 2026', dueAmount: 19_500_000, hint: 'Règlement partiel : les factures les plus anciennes d’abord, sans avis de virement', ...none },
    { id: 'l-09', date: '2026-09-18', label: 'CHQ 0071990 REJETE', amount: -1_250_000, state: 'excluded', paymentKind: 'other', tenantId: null, tenantName: null, lotCode: null, invoiceLabel: null, dueAmount: null, hint: 'Chèque émis par la SCI et rejeté par la banque', ...none, internal: true },
    { id: 'l-10', date: '2026-09-22', label: 'VIR DE M. K. TRAORE', amount: 950_000, state: 'unrecognised', paymentKind: 'transfer', tenantId: null, tenantName: null, lotCode: null, invoiceLabel: null, dueAmount: null, hint: 'Aucun locataire ni facture ne correspond à ce libellé', ...none },
    { id: 'l-11', date: '2026-09-29', label: 'VIR SOC NOUVELLE IMPORT', amount: 2_000_000, state: 'to-check', paymentKind: 'transfer', tenantId: 'tn-sni', tenantName: 'Société Nouvelle Import', lotCode: 'C-105', invoiceLabel: 'Factures T2 et T3 2026', dueAmount: 8_950_000, hint: 'Règlement partiel d’un locataire en mise en demeure', ...none, availableProof: { kind: 'bank-capture', name: 'Capture SGCI du 29.09 reçue par e-mail', source: 'email' } },
  ],
};

const tjProof = { kind: 'transfer-notice' as const, name: 'Avis de virement', source: 'email' as const };
const tjLine = (id: string, date: string, label: string, amount: number, tenantId: string, tenantName: string, lotCode: string, hint: string) => ({
  id,
  date,
  label,
  amount,
  state: 'matched' as const,
  paymentKind: 'transfer' as const,
  tenantId,
  tenantName,
  lotCode,
  invoiceLabel: 'Facture T3 2026',
  dueAmount: amount,
  hint,
  ...none,
  proof: tjProof,
});

/** Relevé Stanbic · Les Trois Jardins · septembre 2026 : validé, approuvé, puis observation d'Eléma (prototype 2F). */
export const statementTroisJardinsSeptember: StatementDetail = {
  id: 's-2',
  bank: 'Stanbic',
  accountLabel: '•••• 0917',
  accountOwner: 'sci',
  assetName: 'Les Trois Jardins',
  period: '2026-09-01',
  status: 'validated-with-observation',
  imported: true,
  linesRead: 41,
  pageCount: 4,
  checks: { periodFrom: '2026-09-01', periodTo: '2026-09-30', duplicatesIgnored: 0, debitsExcluded: 5, openingBalance: 812_450_000, closingBalance: 871_300_000, previousStatementComplete: true },
  previous: [{ period: '2026-08-01', collectedAmount: 13_950_000, status: 'validated' }],
  cutOffInDays: 0,
  tenants: [
    { id: 'tn-koffi', name: 'Cabinet Koffi', lotCode: 'TJ-B-03', invoices: [] },
    { id: 'tn-nawa', name: 'Studio Nawa', lotCode: 'TJ-A-21', invoices: [] },
    { id: 'tn-kouame', name: 'M. Patrick Kouamé', lotCode: 'TJ-A-01', invoices: [] },
    {
      id: 'tn-ehui',
      name: 'M. Patrick Ehui',
      lotCode: 'TJ-A-02',
      invoices: [invoice('tn-ehui', 'fa-0981-r', 'rent', 'Loyer T3 2026', 'FA-2026-0981', 'current', 1_650_000), invoice('tn-ehui', 'fa-0981-c', 'charges', 'Charges locatives T3 2026', 'FA-2026-0981', 'current', 300_000)],
    },
  ],
  file: {
    version: 1,
    status: 'sent-to-accounting',
    validatedAt: '2026-10-05T09:20:00Z',
    validatedBy: 'Vincent C.',
    submittedTo: 'Eléma B.',
    approvedAt: '2026-10-06T08:10:00Z',
    approvedBy: 'Eléma B.',
    sentAt: '2026-10-06T08:10:00Z',
    comment: null,
    collectedAmount: 14_400_000,
    imputedCount: 4,
    excludedCount: 0,
    ignoredCount: 0,
    changes: 0,
  },
  fileVersions: [],
  journal: [
    { id: 'j-1', date: '2026-10-05', kind: 'validated', title: 'Validé · version 1', detail: '4 lignes imputées · 14 400 000 encaissés', by: 'Vincent C.' },
    { id: 'j-2', date: '2026-10-06', kind: 'approved', title: 'Approuvé · version 1', detail: 'Envoyé à la comptabilité', by: 'Eléma B.' },
    { id: 'j-3', date: '2026-10-15', kind: 'observation', title: 'Observation', detail: 'Ligne du 18.09 imputée au mauvais locataire', by: 'Eléma B.' },
  ],
  observation: { by: 'Eléma B.', date: '2026-10-15', text: 'M. Kouamé a payé en espèces le 12.09. Le virement du 18.09 est celui de M. Patrick Ehui (A-102) : il m’a envoyé son avis de virement.', lineId: 'tj-03' },
  reportSigned: false,
  lines: [
    tjLine('tj-01', '2026-09-04', 'VIR CABINET KOFFI LOYER T3', 7_200_000, 'tn-koffi', 'Cabinet Koffi', 'TJ-B-03', 'Imputée le 05.10'),
    tjLine('tj-02', '2026-09-12', 'VERSEMENT ESPECES · KOUAME', 1_950_000, 'tn-kouame', 'M. Patrick Kouamé', 'TJ-A-01', 'Imputée le 05.10'),
    tjLine('tj-03', '2026-09-18', 'VIREMENT RECU DE · M PATRICK - SGBCI', 1_950_000, 'tn-kouame', 'M. Patrick Kouamé', 'TJ-A-01', 'Imputée le 05.10 · observation d’Eléma le 15.10'),
    tjLine('tj-04', '2026-09-26', 'VIR STUDIO NAWA', 3_300_000, 'tn-nawa', 'Studio Nawa', 'TJ-A-21', 'Imputée le 05.10'),
  ],
};
