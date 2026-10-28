import type { CollectionsOverview } from '@/services/contracts';

/** Accueil « Encaissements » du prototype 2 (gestionnaire financier), transposé. */
export const collectionsAll: CollectionsOverview = {
  inbox: [
    {
      id: 'in-1',
      kind: 'cheque-rejected',
      title: 'Afrik Logistique · chèque n° 0072214 · 3 250 000',
      detail: 'Refusé par la banque (provision insuffisante) · relevé journalier SGCI du 16.10',
      statementId: null,
    },
    {
      id: 'in-2',
      kind: 'cheque-late',
      title: 'Optique Marcory · chèque n° 0690412 · 780 000',
      detail: 'Remis en banque le 09.10 · toujours pas crédité 7 jours après',
      statementId: null,
    },
    {
      id: 'in-3',
      kind: 'statement-to-reconcile',
      title: 'SGCI · ITC · septembre 2026',
      detail: 'Relevé mensuel reçu de la comptabilité · 24 lignes de crédit',
      statementId: 's-1',
    },
    {
      id: 'in-4',
      kind: 'bank-captures',
      title: 'BGFI · PFO Immobilier · crédits du 1er au 13 octobre',
      detail: 'E-mail du 13.10 · 6 crédits pour plusieurs actifs',
      statementId: 's-6',
    },
    {
      id: 'in-5',
      kind: 'observation',
      title: 'Stanbic · Les Trois Jardins · septembre 2026',
      detail: 'Eléma signale une ligne du 18.09 imputée au mauvais locataire',
      statementId: 's-2',
    },
  ],
  cheques: {
    toDeposit: { count: 3, amount: 4_650_000, note: 'coursier jeudi' },
    deposited: { count: 1, note: 'Suivi pendant 5 jours après le dépôt' },
    late: { count: 1, note: 'Optique Marcory · 7 jours sans crédit' },
    rejected: { count: 1, note: 'Signalé par la banque · à traiter' },
  },
  statements: [
    { id: 's-1', bank: 'SGCI', accountOwner: 'sci', assetName: 'ITC', lastPeriod: '2026-09-01', status: 'to-reconcile', statusDetail: 'Reçu le 03.10.2026' },
    { id: 's-2', bank: 'Stanbic', accountOwner: 'sci', assetName: 'Les Trois Jardins', lastPeriod: '2026-09-01', status: 'validated-with-observation', statusDetail: 'Observation d’Eléma' },
    { id: 's-3', bank: 'BOA', accountOwner: 'sci', assetName: 'Badamier', lastPeriod: '2026-09-01', status: 'validated', statusDetail: 'Le 06.10.2026 par Vincent' },
    { id: 's-4', bank: 'BGFI', accountOwner: 'sci', assetName: 'Boulevard Latrille', lastPeriod: '2026-09-01', status: 'validated', statusDetail: 'Le 07.10 par Vincent' },
    { id: 's-5', bank: 'SGCI', accountOwner: 'pfo', assetName: null, lastPeriod: '2026-09-01', status: 'validated', statusDetail: 'Le 06.10.2026 par Vincent' },
    { id: 's-6', bank: 'BGFI', accountOwner: 'pfo', assetName: null, lastPeriod: '2026-10-01', status: 'captures-to-process', statusDetail: 'E-mail de la DAF du 13.10.2026' },
  ],
};
