import type { AccountEvent, ScheduleRow, TenantAccount, TenantOption, TenantRow } from '@/services/contracts';

/**
 * Les locataires de tous les actifs, avec bail, échéancier et historique. C'est la source unique :
 * les lignes d'impayés, les options du chèque et l'onglet « Locataires » des fiches en dérivent.
 */
interface Seed {
  id: string;
  name: string;
  contactName: string;
  email: string;
  registration: string | null;
  assetId: string;
  assetName: string;
  lotCodes: string[];
  start: string;
  end: string | null;
  durationYears: number;
  monthlyRent: number;
  monthlyCharges: number;
  periodicity: TenantAccount['lease']['periodicity'];
  balance: number;
  status: TenantAccount['status'];
  reminderLevel: TenantAccount['reminderLevel'];
  lastPaymentDate: string | null;
}

const seeds: Seed[] = [
  { id: 'tn-atlantis', name: 'Atlantis Télécom', contactName: 'M. Koffi', email: 'facturation@atlantis-telecom.ci', registration: 'CI-ABJ-2015-B-20114', assetId: 'itc', assetName: 'ITC', lotCodes: ['C-203', 'P-01'], start: '2024-04-01', end: '2027-03-31', durationYears: 3, monthlyRent: 9_050_000, monthlyCharges: 1_300_000, periodicity: 'quarterly', balance: 0, status: 'current', reminderLevel: 'none', lastPaymentDate: '2026-10-02' },
  { id: 'tn-ivoire', name: 'Ivoire Assurances', contactName: 'Mme Yao', email: 'compta@ivoire-assurances.ci', registration: 'CI-ABJ-2010-B-08871', assetId: 'itc', assetName: 'ITC', lotCodes: ['B-402'], start: '2023-01-15', end: '2026-01-14', durationYears: 3, monthlyRent: 6_200_000, monthlyCharges: 900_000, periodicity: 'quarterly', balance: 0, status: 'ending', reminderLevel: 'none', lastPaymentDate: '2026-10-03' },
  { id: 'tn-afrik', name: 'Afrik Logistique', contactName: 'M. Traoré', email: 'direction@afrik-logistique.ci', registration: 'CI-ABJ-2018-B-14420', assetId: 'itc', assetName: 'ITC', lotCodes: ['D-010'], start: '2022-07-01', end: null, durationYears: 3, monthlyRent: 3_250_000, monthlyCharges: 500_000, periodicity: 'quarterly', balance: -19_500_000, status: 'late', reminderLevel: 'pre-litigation', lastPaymentDate: '2026-07-06' },
  { id: 'tn-sni', name: 'Société Nouvelle Import', contactName: 'M. Diabaté', email: 'sni@exemple.ci', registration: 'CI-ABJ-2016-B-11009', assetId: 'itc', assetName: 'ITC', lotCodes: ['C-105'], start: '2023-03-01', end: null, durationYears: 3, monthlyRent: 2_980_000, monthlyCharges: 450_000, periodicity: 'quarterly', balance: -8_950_000, status: 'late', reminderLevel: 'formal-notice', lastPaymentDate: '2026-08-06' },
  { id: 'tn-pharma', name: 'Pharmacie du Centre', contactName: 'Dr Bamba', email: 'pharmacie.centre@exemple.ci', registration: 'CI-ABJ-2020-B-30211', assetId: 'itc', assetName: 'ITC', lotCodes: ['A-012'], start: '2024-10-01', end: null, durationYears: 3, monthlyRent: 1_700_000, monthlyCharges: 300_000, periodicity: 'quarterly', balance: -5_100_000, status: 'late', reminderLevel: 'none', lastPaymentDate: '2026-07-07' },
  { id: 'tn-cafe', name: 'Café du Plateau', contactName: 'Mme Adjoua', email: 'cafeduplateau@exemple.ci', registration: 'CI-ABJ-2021-A-00412', assetId: 'itc', assetName: 'ITC', lotCodes: ['RDC-04'], start: '2023-11-01', end: '2026-10-31', durationYears: 3, monthlyRent: 1_400_000, monthlyCharges: 250_000, periodicity: 'quarterly', balance: -4_200_000, status: 'late', reminderLevel: 'none', lastPaymentDate: '2026-07-04' },
  { id: 'tn-savane', name: 'Savane Conseil', contactName: 'M. Ouattara', email: 'contact@savane-conseil.ci', registration: 'CI-ABJ-2019-B-22310', assetId: 'itc', assetName: 'ITC', lotCodes: ['B-115'], start: '2025-01-01', end: null, durationYears: 3, monthlyRent: 950_000, monthlyCharges: 130_000, periodicity: 'quarterly', balance: -900_000, status: 'late', reminderLevel: 'none', lastPaymentDate: '2026-09-12' },
  { id: 'tn-savane-d', name: 'Savane Digital', contactName: 'M. Ouattara', email: 'contact@savane-digital.ci', registration: 'CI-ABJ-2019-B-22311', assetId: 'itc', assetName: 'ITC', lotCodes: ['B-116'], start: '2025-01-01', end: null, durationYears: 3, monthlyRent: 930_000, monthlyCharges: 130_000, periodicity: 'quarterly', balance: 0, status: 'current', reminderLevel: 'none', lastPaymentDate: '2026-10-05' },
  { id: 'tn-lagune', name: 'Lagune Audit et Conseil', contactName: 'Mme Kouassi', email: 'admin@lagune-audit.ci', registration: 'CI-ABJ-2017-B-09930', assetId: 'itc', assetName: 'ITC', lotCodes: ['A-101'], start: '2024-02-01', end: null, durationYears: 3, monthlyRent: 800_000, monthlyCharges: 120_000, periodicity: 'quarterly', balance: 0, status: 'current', reminderLevel: 'none', lastPaymentDate: '2026-09-04' },
  { id: 'tn-koffi', name: 'Cabinet Koffi', contactName: 'Me Koffi', email: 'cabinet@koffi-avocats.ci', registration: 'CI-ABJ-2012-B-05512', assetId: 'trois-jardins', assetName: 'Les Trois Jardins', lotCodes: ['TJ-B-03'], start: '2023-06-01', end: null, durationYears: 3, monthlyRent: 2_100_000, monthlyCharges: 300_000, periodicity: 'quarterly', balance: -12_600_000, status: 'late', reminderLevel: 'reminder-2', lastPaymentDate: '2026-06-30' },
  { id: 'tn-nawa', name: 'Studio Nawa', contactName: 'Mme Nawa', email: 'hello@studionawa.ci', registration: 'CI-ABJ-2022-A-01877', assetId: 'trois-jardins', assetName: 'Les Trois Jardins', lotCodes: ['TJ-A-21'], start: '2024-09-01', end: null, durationYears: 3, monthlyRent: 950_000, monthlyCharges: 150_000, periodicity: 'quarterly', balance: -6_700_000, status: 'late', reminderLevel: 'reminder-2', lastPaymentDate: '2026-09-02' },
  { id: 'tn-optique', name: 'Optique Marcory', contactName: 'M. Sanogo', email: 'optique.marcory@exemple.ci', registration: 'CI-ABJ-2014-B-07731', assetId: 'boulevard-latrille', assetName: 'Boulevard Latrille', lotCodes: ['BL-07'], start: '2024-02-01', end: '2027-01-31', durationYears: 3, monthlyRent: 780_000, monthlyCharges: 100_000, periodicity: 'quarterly', balance: -780_000, status: 'late', reminderLevel: 'none', lastPaymentDate: '2026-07-05' },
  { id: 'tn-kemi', name: 'Kemi Mode', contactName: 'Mme Kemi', email: 'kemi.mode@exemple.ci', registration: 'CI-ABJ-2021-A-02290', assetId: 'boulevard-latrille', assetName: 'Boulevard Latrille', lotCodes: ['BL-12'], start: '2023-02-01', end: null, durationYears: 3, monthlyRent: 660_000, monthlyCharges: 90_000, periodicity: 'quarterly', balance: -13_850_000, status: 'late', reminderLevel: 'pre-litigation', lastPaymentDate: null },
  { id: 'tn-clinique', name: 'Clinique Sainte-Anne', contactName: 'Dr Ahoua', email: 'direction@clinique-sainte-anne.ci', registration: 'CI-ABJ-2009-B-03301', assetId: 'badamier', assetName: 'Badamier', lotCodes: ['BAD-01'], start: '2022-01-01', end: null, durationYears: 6, monthlyRent: 4_000_000, monthlyCharges: 500_000, periodicity: 'quarterly', balance: 0, status: 'current', reminderLevel: 'none', lastPaymentDate: '2026-10-02' },
  { id: 'tn-palmiers', name: 'Résidence Les Palmiers', contactName: 'M. Assi', email: 'palmiers@exemple.ci', registration: null, assetId: 'badamier', assetName: 'Badamier', lotCodes: ['BAD-02'], start: '2024-05-01', end: null, durationYears: 3, monthlyRent: 2_800_000, monthlyCharges: 350_000, periodicity: 'quarterly', balance: -4_100_000, status: 'late', reminderLevel: 'reminder-1', lastPaymentDate: '2026-07-03' },
  { id: 'tn-baie', name: 'Baie Resort SA', contactName: 'M. Dupont', email: 'finance@baie-resort.ci', registration: 'CI-ABJ-2013-B-06640', assetId: 'baie-des-sirenes', assetName: 'Baie des Sirènes', lotCodes: ['BDS-01'], start: '2024-03-15', end: null, durationYears: 9, monthlyRent: 29_293_333, monthlyCharges: 0, periodicity: 'quarterly', balance: -3_520_000, status: 'late', reminderLevel: 'reminder-3', lastPaymentDate: '2026-04-07' },
];

function quarterLabel(year: number, quarter: number): string {
  return `Facture T${quarter} ${year}`;
}

/** Un échéancier sur quatre trimestres : les trimestres passés sont réglés sauf le solde dû, le prochain est à venir. */
function schedule(seed: Seed): ScheduleRow[] {
  const quarterly = (seed.monthlyRent + seed.monthlyCharges) * 3;
  const rows: ScheduleRow[] = [];
  const periods: [number, number, string][] = [
    [2026, 1, '2026-01-05'],
    [2026, 2, '2026-04-05'],
    [2026, 3, '2026-07-05'],
    [2026, 4, '2026-10-05'],
  ];
  let remainingDebt = -seed.balance;
  for (let index = periods.length - 1; index >= 0; index -= 1) {
    const [year, quarter, date] = periods[index]!;
    const unpaid = Math.min(quarterly, Math.max(0, remainingDebt));
    remainingDebt -= unpaid;
    const collected = quarterly - unpaid;
    const status: ScheduleRow['status'] = unpaid === 0 ? 'paid' : collected > 0 ? 'partially-paid' : index === periods.length - 1 ? 'due' : 'late';
    rows.unshift({ id: `${seed.id}-${year}-${quarter}`, invoiceId: null, date, label: quarterLabel(year, quarter), invoiced: quarterly, collected, balance: unpaid === 0 ? 0 : -unpaid, status });
  }
  rows.push({ id: `${seed.id}-2027-1`, invoiceId: null, date: '2027-01-05', label: quarterLabel(2027, 1), invoiced: quarterly, collected: 0, balance: 0, status: 'upcoming' });
  return rows;
}

function history(seed: Seed): AccountEvent[] {
  const events: AccountEvent[] = [
    { id: `${seed.id}-h1`, date: '2026-09-22', kind: 'invoice', label: 'Facture T4 2026 déposée', amount: (seed.monthlyRent + seed.monthlyCharges) * 3 },
  ];
  if (seed.lastPaymentDate) events.push({ id: `${seed.id}-h2`, date: seed.lastPaymentDate, kind: 'payment', label: 'Règlement reçu', amount: (seed.monthlyRent + seed.monthlyCharges) * 3 });
  if (seed.reminderLevel !== 'none') events.push({ id: `${seed.id}-h3`, date: '2026-10-10', kind: 'reminder', label: 'Relance envoyée', amount: null });
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

export const tenantAccounts: TenantAccount[] = seeds.map(seed => ({
  id: seed.id,
  name: seed.name,
  contactName: seed.contactName,
  email: seed.email,
  registration: seed.registration,
  assetId: seed.assetId,
  assetName: seed.assetName,
  lotCodes: seed.lotCodes,
  lease: {
    start: seed.start,
    end: seed.end,
    durationYears: seed.durationYears,
    monthlyRent: seed.monthlyRent,
    monthlyCharges: seed.monthlyCharges,
    deposit: seed.monthlyRent * 3,
    keyMoney: 0,
    periodicity: seed.periodicity,
    indexation: '3 % à chaque date anniversaire',
  },
  balance: seed.balance,
  status: seed.status,
  reminderLevel: seed.reminderLevel,
  schedule: schedule(seed),
  history: history(seed),
}));

export function toTenantOption(account: TenantAccount): TenantOption {
  const due = Math.max(0, -account.balance);
  const dueRows = account.schedule.filter(row => row.balance < 0).map(row => row.label);
  return {
    id: account.id,
    name: account.name,
    lotCode: account.lotCodes[0] ?? '',
    assetName: account.assetName,
    dueAmount: due,
    dueDetail: dueRows.length > 0 ? dueRows.join(', ') : 'À jour',
  };
}

export function toTenantRow(account: TenantAccount): TenantRow {
  return {
    id: account.id,
    name: account.name,
    contactName: account.contactName,
    email: account.email,
    lotCodes: account.lotCodes,
    leaseStart: account.lease.start,
    leaseEnd: account.lease.end,
    monthlyRent: account.lease.monthlyRent,
    monthlyCharges: account.lease.monthlyCharges,
    deposit: account.lease.deposit,
    balance: account.balance,
    status: account.status,
  };
}

export const tenantsAll: TenantOption[] = tenantAccounts.map(toTenantOption);
