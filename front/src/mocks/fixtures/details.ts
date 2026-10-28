import type {
  AccountEvent,
  BudgetDetail,
  BudgetLine,
  BudgetRow,
  CaptureLine,
  ChequeRow,
  DocumentDetail,
  DocumentRow,
  InvoiceDetail,
  InvoiceRow,
  ReportDetail,
  ReportRow,
  ReportSection,
} from '@/services/contracts';
import { assets } from './assets';
import { tenantAccounts } from './tenants';

/** Fiches dérivées des listes : factures, CRG, budgets, chèques, captures et documents. */

const assetIdByName = (name: string) => assets.find(a => a.name === name)?.id ?? 'itc';
const tenantByName = (name: string) => tenantAccounts.find(tn => tn.name === name);

export function invoiceDetail(row: InvoiceRow): InvoiceDetail {
  const tenant = tenantByName(row.tenantName);
  const fromLease = tenant ? tenant.lease.monthlyRent * 3 + tenant.lease.monthlyCharges * 3 : 0;
  const fitsLease = tenant !== undefined && fromLease > 0 && fromLease <= row.amount;
  const rent = fitsLease ? tenant.lease.monthlyRent * 3 : Math.round(row.amount * 0.82);
  const charges = fitsLease ? tenant.lease.monthlyCharges * 3 : row.amount - Math.round(row.amount * 0.82);
  const extra = row.amount - rent - charges;
  const lines = [
    { label: 'Loyer du trimestre', amount: rent },
    { label: 'Provision pour charges', amount: charges },
    ...(extra !== 0 ? [{ label: 'Enseigne et parking', amount: extra }] : []),
  ];
  const paidAmount = row.status === 'paid' ? row.amount : row.status === 'partially-paid' ? Math.round(row.amount / 2) : 0;
  const issued = row.status !== 'draft' && row.status !== 'to-check';
  const history: AccountEvent[] = [
    ...(paidAmount > 0 ? [{ id: `${row.id}-pay`, date: '2026-10-04', kind: 'payment' as const, label: 'Règlement reçu', amount: paidAmount }] : []),
    ...(row.deliveryDetail ? [{ id: `${row.id}-del`, date: '2026-09-23', kind: 'note' as const, label: row.deliveryDetail, amount: null }] : []),
    ...(issued ? [{ id: `${row.id}-iss`, date: '2026-09-20', kind: 'invoice' as const, label: 'Facture émise', amount: row.amount }] : []),
    { id: `${row.id}-gen`, date: '2026-09-15', kind: 'note' as const, label: 'Facture générée depuis le bail', amount: null },
  ];
  return {
    ...row,
    tenantId: tenant?.id ?? '',
    lines,
    vatAmount: Math.round(row.amount * 0.18),
    paidAmount,
    issuedOn: issued ? '2026-09-20' : null,
    deliveredOn: row.deliveryDetail ? '2026-09-23' : null,
    deliveryMode: row.deliveryDetail ? 'deposit' : null,
    deliveryProof: row.deliveryDetail ? 'Bordereau signé' : null,
    history,
  };
}

export function reportDetail(row: ReportRow): ReportDetail {
  const base = row.amountToTransfer ?? 0;
  const collections = Math.round(base * 1.35);
  const fees = Math.round(collections * 0.08);
  const charges = Math.round(collections * 0.2);
  const sections: ReportSection[] = [
    { key: 'collections', amount: row.amountToTransfer === null ? null : collections, detail: 'Loyers, charges, enseignes et parkings encaissés sur le trimestre' },
    { key: 'arrears', amount: row.amountToTransfer === null ? null : Math.round(collections * 0.12), detail: 'Restant dû au dernier jour du trimestre, par ancienneté' },
    { key: 'charges', amount: row.amountToTransfer === null ? null : charges, detail: 'Dépenses de l’actif réglées sur la période' },
    { key: 'fees', amount: row.amountToTransfer === null ? null : fees, detail: '8 % des loyers, enseignes et revenus complémentaires' },
    { key: 'transfer', amount: row.amountToTransfer, detail: 'Encaissements moins charges et honoraires' },
    { key: 'budget', amount: null, detail: 'Avancement du budget de charges de l’exercice' },
  ];
  const signedOn = row.status === 'signed' ? row.dueDate : null;
  return {
    ...row,
    assetId: assetIdByName(row.assetName),
    sections,
    signatories: [
      { role: 'DAF', name: 'Thomas F.', signedOn },
      { role: 'Asset Manager', name: 'Marc A.', signedOn },
      { role: 'Responsable PM', name: 'Eléa M.', signedOn },
    ],
    history: [{ id: `${row.id}-h0`, date: '2026-10-02', kind: 'note', label: `Brouillon généré par ${row.preparedBy}`, amount: null }],
  };
}

export function budgetDetail(row: BudgetRow): BudgetDetail {
  const share = (ratio: number) => Math.round(row.budgetAmount * ratio);
  const realised = (ratio: number) => Math.round(row.realisedAmount * ratio);
  const lines: BudgetLine[] = [
    { id: `${row.id}-l1`, label: 'Gardiennage et sécurité', category: 'common', building: null, budget: share(0.28), realised: realised(0.3), reestimated: row.status === 're-estimated' ? share(0.31) : null },
    { id: `${row.id}-l2`, label: 'Nettoyage des parties communes', category: 'common', building: null, budget: share(0.14), realised: realised(0.13), reestimated: row.status === 're-estimated' ? share(0.14) : null },
    { id: `${row.id}-l3`, label: 'Électricité des communs', category: 'common', building: null, budget: share(0.18), realised: realised(0.19), reestimated: row.status === 're-estimated' ? share(0.2) : null },
    { id: `${row.id}-l4`, label: 'Climatisation', category: 'special', building: 'A', budget: share(0.16), realised: realised(0.17), reestimated: row.status === 're-estimated' ? share(0.18) : null },
    { id: `${row.id}-l5`, label: 'Ascenseurs', category: 'special', building: 'B', budget: share(0.12), realised: realised(0.11), reestimated: row.status === 're-estimated' ? share(0.11) : null },
    { id: `${row.id}-l6`, label: 'Assurance de l’immeuble', category: 'common', building: null, budget: share(0.12), realised: realised(0.1), reestimated: row.status === 're-estimated' ? share(0.12) : null },
  ];
  return { ...row, assetId: assetIdByName(row.assetName), lines };
}

export const chequesAll: ChequeRow[] = [
  { id: 'chq-1', chequeNumber: '0045822', tenantId: 'tn-pharma', tenantName: 'Pharmacie du Centre', assetName: 'ITC', bank: 'BLCI', amount: 1_200_000, receivedOn: '2026-10-12', depositedOn: null, status: 'to-deposit', note: 'Coursier du jeudi' },
  { id: 'chq-2', chequeNumber: '0101230', tenantId: 'tn-lagune', tenantName: 'Lagune Audit et Conseil', assetName: 'ITC', bank: 'SGCI', amount: 2_760_000, receivedOn: '2026-10-14', depositedOn: null, status: 'to-deposit', note: 'Coursier du jeudi' },
  { id: 'chq-3', chequeNumber: '0088112', tenantId: 'tn-savane-d', tenantName: 'Savane Digital', assetName: 'ITC', bank: 'BOA', amount: 690_000, receivedOn: '2026-10-15', depositedOn: null, status: 'to-deposit', note: 'Coursier du jeudi' },
  { id: 'chq-4', chequeNumber: '0690412', tenantId: 'tn-optique', tenantName: 'Optique Marcory', assetName: 'Boulevard Latrille', bank: 'Stanbic', amount: 780_000, receivedOn: '2026-10-07', depositedOn: '2026-10-09', status: 'late', note: 'Pas crédité depuis 7 jours' },
  { id: 'chq-5', chequeNumber: '0072214', tenantId: 'tn-afrik', tenantName: 'Afrik Logistique', assetName: 'ITC', bank: 'SGCI', amount: 3_250_000, receivedOn: '2026-10-09', depositedOn: '2026-10-12', status: 'rejected', note: 'Provision insuffisante · relevé du 16.10' },
  { id: 'chq-6', chequeNumber: '0024102', tenantId: 'tn-lagune', tenantName: 'Lagune Audit et Conseil', assetName: 'ITC', bank: 'SGCI', amount: 2_400_000, receivedOn: '2026-09-01', depositedOn: '2026-09-03', status: 'collected', note: 'Rapproché le 09.10' },
  { id: 'chq-7', chequeNumber: '0310077', tenantId: 'tn-clinique', tenantName: 'Clinique Sainte-Anne', assetName: 'Badamier', bank: 'BOA', amount: 13_500_000, receivedOn: '2026-10-02', depositedOn: '2026-10-05', status: 'deposited', note: 'Crédit attendu' },
];

export const capturesBgfiOctober: CaptureLine[] = [
  { id: 'cap-1', date: '2026-10-02', label: 'VIR CLINIQUE SAINTE ANNE', amount: 13_500_000, assetId: null, tenantId: null },
  { id: 'cap-2', date: '2026-10-05', label: 'VIR BAIE RESORT', amount: 29_293_333, assetId: null, tenantId: null },
  { id: 'cap-3', date: '2026-10-06', label: 'VIR STUDIO NAWA T4', amount: 3_300_000, assetId: null, tenantId: null },
  { id: 'cap-4', date: '2026-10-08', label: 'VIR KEMI MODE', amount: 2_250_000, assetId: null, tenantId: null },
  { id: 'cap-5', date: '2026-10-10', label: 'VERSEMENT ESPECES', amount: 780_000, assetId: null, tenantId: null },
  { id: 'cap-6', date: '2026-10-13', label: 'VIR RESIDENCE LES PALMIERS', amount: 9_450_000, assetId: null, tenantId: null },
];

export function documentDetail(row: DocumentRow): DocumentDetail {
  const tenant = row.tenantName ? tenantByName(row.tenantName) : undefined;
  const versions = Array.from({ length: row.version }, (_, index) => ({
    version: index + 1,
    updatedAt: index + 1 === row.version ? row.updatedAt : `2026-0${Math.max(1, index + 3)}-10`,
    updatedBy: index + 1 === row.version ? 'Vincent C.' : 'Eléma B.',
    note: index + 1 === row.version ? null : 'Version précédente',
  })).reverse();
  return {
    ...row,
    assetId: assetIdByName(row.assetName),
    tenantId: tenant?.id ?? null,
    sizeLabel: `${120 + row.version * 40} Ko`,
    formatLabel: row.kind === 'statement' ? 'PDF' : row.kind === 'invoice' ? 'PDF' : 'DOCX',
    versions,
  };
}
