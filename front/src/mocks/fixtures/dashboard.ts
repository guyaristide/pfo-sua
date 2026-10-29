import type { DashboardKpi, DashboardKpiKey, DashboardSummary } from '@/services/contracts';
import { assets } from './assets';

/** Tableau de bord « Responsable PM » du prototype du 16/10/2026, transposé. */
type KpiSeed = Omit<DashboardKpi, 'key' | 'periodLabel'> & { period: 'quarter' | 'month' | 'year' | 'none' };

/** Les neuf indicateurs du prototype 0, pour l'actif ITC puis pour tous les actifs (E0.1, Q37). */
export const kpiSeeds: Record<DashboardKpiKey, { itc: KpiSeed; all: KpiSeed }> = {
  occupancy: {
    itc: { value: 0.92, unit: 'percent', detail: '79 lots loués sur 86', delta: '+1 pt depuis le T2', trend: 'good', alert: false, period: 'none' },
    all: { value: 0.89, unit: 'percent', detail: '277 lots loués sur 312', delta: '+1 pt depuis le T2', trend: 'good', alert: false, period: 'none' },
  },
  recovery: {
    itc: { value: 0.94, unit: 'percent', detail: 'sur 516 300 000 facturés', delta: '+1 pt depuis le T2', trend: 'good', alert: false, period: 'quarter' },
    all: { value: 0.92, unit: 'percent', detail: 'sur 1 324 500 000 facturés', delta: '+1 pt depuis le T2', trend: 'good', alert: false, period: 'quarter' },
  },
  unpaid: {
    itc: { value: 0.055, unit: 'percent', detail: '28 millions · 7 locataires, dont 2 à mettre en demeure', delta: '−0,6 pt depuis septembre', trend: 'good', alert: false, period: 'none' },
    all: { value: 0.056, unit: 'percent', detail: '74 millions · 19 locataires, dont 6 à mettre en demeure', delta: '+0,2 pt depuis septembre', trend: 'bad', alert: false, period: 'none' },
  },
  'pre-litigation': {
    itc: { value: 2, unit: 'count', detail: '9 850 000 en jeu', delta: 'Stable depuis septembre', trend: 'flat', alert: false, period: 'none' },
    all: { value: 5, unit: 'count', detail: '31 400 000 en jeu', delta: '+1 dossier depuis septembre', trend: 'bad', alert: false, period: 'none' },
  },
  collected: {
    itc: { value: 486_000_000, unit: 'money', detail: '64 crédits rapprochés · compte SGCI', delta: '+7 % depuis août', trend: 'good', alert: false, period: 'month' },
    all: { value: 1_215_000_000, unit: 'money', detail: '5 actifs · 3 relevés encore à rapprocher', delta: '+3 % depuis août', trend: 'good', alert: false, period: 'month' },
  },
  cheques: {
    itc: { value: 4, unit: 'count', detail: '3 à déposer en banque · 1 déposé non repéré au relevé', delta: '1 en retard', trend: 'bad', alert: true, period: 'none' },
    all: { value: 7, unit: 'count', detail: '5 à déposer en banque · 2 déposés non repérés au relevé', delta: '1 en retard', trend: 'bad', alert: true, period: 'none' },
  },
  vacancy: {
    itc: { value: 0.08, unit: 'percent', detail: '7 lots · 6,9 millions de loyers perdus par mois', delta: '−1 pt depuis septembre', trend: 'good', alert: false, period: 'none' },
    all: { value: 0.11, unit: 'percent', detail: '35 lots · 29 millions de loyers perdus par mois', delta: '−1 pt depuis septembre', trend: 'good', alert: false, period: 'none' },
  },
  budget: {
    itc: { value: 0.96, unit: 'percent', detail: 'du chiffre d’affaires prévu · charges engagées : 88 %', delta: 'Au 30.09.2026', trend: 'flat', alert: false, period: 'year' },
    all: { value: 0.94, unit: 'percent', detail: 'du chiffre d’affaires prévu · charges engagées : 91 %', delta: 'Au 30.09.2026', trend: 'flat', alert: false, period: 'year' },
  },
  leases: {
    itc: { value: 5, unit: 'count', detail: 'dont 2 sans décision du locataire', delta: '+2 depuis septembre', trend: 'flat', alert: false, period: 'none' },
    all: { value: 14, unit: 'count', detail: 'dont 6 sans décision', delta: '+3 depuis septembre', trend: 'flat', alert: false, period: 'none' },
  },
};

/** Tableau de bord du prototype du 16/10/2026, transposé ; les indicateurs se calculent à la demande. */
export const dashboardAll: DashboardSummary = {
  asOf: '2026-10-16T07:00:00Z',
  period: { year: 2026, quarter: 3 },
  kpis: [],
  tasks: [
    {
      id: 't-1',
      title: 'Relire et signer le CRG T3 de l’actif ITC',
      detail: 'Encaissements validés par Vincent · 3 signatures restantes',
      urgency: 'late',
      lateDays: 1,
      target: 'report',
    },
    {
      id: 't-2',
      title: 'Valider 2 baux avant signature',
      detail: 'Café du Plateau (renouvellement) · Atlantis Télécom (avenant, lot C-203)',
      urgency: 'to-validate',
      target: 'asset',
    },
    {
      id: 't-3',
      title: 'Arbitrer 6 relances d’impayés',
      detail: '18 450 000 · 2 dossiers à passer en pré-contentieux',
      urgency: 'this-week',
      target: 'arrears',
    },
  ],
  deadlines: [
    { id: 'd-1', date: '2026-10-15', title: 'CRG T3 2026', detail: 'Relecture et quatre signatures attendues', state: 'late', days: 1, target: 'report' },
    { id: 'd-2', date: '2026-10-31', title: 'Préavis Optique Marcory', detail: 'Bail échu le 31.01.2027', state: 'soon', days: 15, target: 'asset' },
    { id: 'd-3', date: '2026-11-05', title: 'État locatif de novembre', detail: 'À transmettre à l’Asset Manager', state: 'upcoming', target: 'asset' },
    { id: 'd-4', date: '2026-11-08', title: 'Point des impayés', detail: '7 locataires à relancer ou suivre', state: 'upcoming', target: 'arrears' },
  ],
  assets: assets.filter(asset => asset.dataStatus === 'active').map((asset, index) => ({
    assetId: asset.id,
    assetName: asset.name,
    lotCount: asset.lotCount,
    occupancyRate: asset.occupancyRate,
    recoveryRate: [0.94, 0.91, 0.97, 0.9, 0.93][index] ?? 0.9,
    unpaidAmount: asset.unpaidAmount,
    reportStatus: (['in-review', 'validated', 'signed', 'draft', 'draft'] as const)[index] ?? 'draft',
  })),
};
