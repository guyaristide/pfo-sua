import type { AssetRecord, LotRow } from '@/services/contracts';
import { assets } from './assets';
import { tenantAccounts, toTenantRow } from './tenants';

/** Lots et locataires d'ITC (échantillon du prototype « socle ») ; les autres actifs reçoivent une fiche réduite. */
const itcLots: LotRow[] = [
  { id: 'lot-a101', building: 'A', code: 'A-101', type: 'offices', surface: 142, floor: '1', status: 'occupied', tenantName: 'Lagune Audit et Conseil', monthlyRent: 800_000 },
  { id: 'lot-a102', building: 'A', code: 'A-102', type: 'offices', surface: 138, floor: '1', status: 'vacant', tenantName: null, monthlyRent: null },
  { id: 'lot-a012', building: 'A', code: 'A-012', type: 'shops', surface: 96, floor: 'RDC', status: 'occupied', tenantName: 'Pharmacie du Centre', monthlyRent: 1_700_000 },
  { id: 'lot-b115', building: 'B', code: 'B-115', type: 'offices', surface: 120, floor: '1', status: 'occupied', tenantName: 'Savane Conseil', monthlyRent: 950_000 },
  { id: 'lot-b116', building: 'B', code: 'B-116', type: 'offices', surface: 118, floor: '1', status: 'occupied', tenantName: 'Savane Digital', monthlyRent: 930_000 },
  { id: 'lot-b402', building: 'B', code: 'B-402', type: 'offices', surface: 410, floor: '4', status: 'occupied', tenantName: 'Ivoire Assurances', monthlyRent: 6_200_000 },
  { id: 'lot-c203', building: 'C', code: 'C-203', type: 'offices', surface: 620, floor: '2', status: 'occupied', tenantName: 'Atlantis Télécom', monthlyRent: 9_000_000 },
  { id: 'lot-c105', building: 'C', code: 'C-105', type: 'offices', surface: 210, floor: '1', status: 'occupied', tenantName: 'Société Nouvelle Import', monthlyRent: 2_980_000 },
  { id: 'lot-c204', building: 'C', code: 'C-204', type: 'offices', surface: 180, floor: '2', status: 'vacant', tenantName: null, monthlyRent: null },
  { id: 'lot-d010', building: 'D', code: 'D-010', type: 'shops', surface: 260, floor: 'RDC', status: 'occupied', tenantName: 'Afrik Logistique', monthlyRent: 3_250_000 },
  { id: 'lot-rdc04', building: 'A', code: 'RDC-04', type: 'shops', surface: 85, floor: 'RDC', status: 'occupied', tenantName: 'Café du Plateau', monthlyRent: 1_400_000 },
  { id: 'lot-p1', building: 'Parking', code: 'P-01', type: 'parking', surface: 12, floor: '-1', status: 'occupied', tenantName: 'Atlantis Télécom', monthlyRent: 50_000 },
  { id: 'lot-p2', building: 'Parking', code: 'P-02', type: 'parking', surface: 12, floor: '-1', status: 'vacant', tenantName: null, monthlyRent: null },
];

function record(asset: (typeof assets)[number], lots: LotRow[]): AssetRecord {
  const tenants = tenantAccounts.filter(account => account.assetId === asset.id).map(toTenantRow);
  return {
    ...asset,
    owner: {
      name: asset.ownerName,
      registration: `CI-ABJ-2019-B-${asset.code.padEnd(4, '0').slice(0, 4)}`,
      address: `${asset.location} · Abidjan`,
      representative: 'PFO Immobilier, mandataire',
    },
    mandate: { reference: `MG-${asset.code}-2024`, signedOn: '2024-03-01', durationYears: 3, endsOn: '2027-02-28' },
    rentAccountLabel: asset.bankAccountOwner === 'sci' ? `Compte de la SCI · ${asset.ownerName}` : 'Compte de PFO Immobilier',
    billingItemCodes: ['LOY', 'CHG', 'ENS', 'PKG', 'REA', 'DEP', 'PDP', 'TRV'],
    lots,
    tenants,
  };
}

function reducedLots(code: string, count: number): LotRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `lot-${code}-${index + 1}`,
    building: 'A',
    code: `${code}-${String(index + 1).padStart(2, '0')}`,
    type: index % 3 === 0 ? ('shops' as const) : ('offices' as const),
    surface: 60 + index * 15,
    floor: index === 0 ? 'RDC' : String(index),
    status: index % 4 === 3 ? ('vacant' as const) : ('occupied' as const),
    tenantName: index % 4 === 3 ? null : `Locataire ${code} ${index + 1}`,
    monthlyRent: index % 4 === 3 ? null : 450_000 + index * 50_000,
  }));
}

export const assetRecords: AssetRecord[] = assets.map(asset =>
  asset.id === 'itc' ? record(asset, itcLots) : record(asset, reducedLots(asset.code, 6)),
);
