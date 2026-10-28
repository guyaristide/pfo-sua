import type { DocumentRow } from '@/services/contracts';

/** Un échantillon de la GED : baux, CRG, factures, relevés et procès-verbaux, avec versions. */
export const documentsAll: DocumentRow[] = [
  { id: 'd-1', name: 'CRG T3 2026 · ITC', kind: 'report', assetName: 'ITC', tenantName: null, updatedAt: '2026-10-14', version: 3 },
  { id: 'd-2', name: 'Bail Atlantis Télécom · avenant lot C-203', kind: 'lease', assetName: 'ITC', tenantName: 'Atlantis Télécom', updatedAt: '2026-10-12', version: 2 },
  { id: 'd-3', name: 'Relevé SGCI · septembre 2026', kind: 'statement', assetName: 'ITC', tenantName: null, updatedAt: '2026-10-03', version: 1 },
  { id: 'd-4', name: 'Facture T4 2026 · Afrik Logistique', kind: 'invoice', assetName: 'ITC', tenantName: 'Afrik Logistique', updatedAt: '2026-09-22', version: 1 },
  { id: 'd-5', name: 'PV de remise des clés · Café du Plateau', kind: 'minutes', assetName: 'ITC', tenantName: 'Café du Plateau', updatedAt: '2026-09-15', version: 1 },
  { id: 'd-6', name: 'CRG T3 2026 · Les Trois Jardins', kind: 'report', assetName: 'Les Trois Jardins', tenantName: null, updatedAt: '2026-10-14', version: 2 },
  { id: 'd-7', name: 'Bail Cabinet Koffi', kind: 'lease', assetName: 'Les Trois Jardins', tenantName: 'Cabinet Koffi', updatedAt: '2026-06-02', version: 1 },
  { id: 'd-8', name: 'Relevé Stanbic · septembre 2026', kind: 'statement', assetName: 'Les Trois Jardins', tenantName: null, updatedAt: '2026-10-05', version: 1 },
  { id: 'd-9', name: 'CRG T3 2026 · Badamier', kind: 'report', assetName: 'Badamier', tenantName: null, updatedAt: '2026-10-13', version: 1 },
  { id: 'd-10', name: 'Budget de charges 2026 · Badamier', kind: 'other', assetName: 'Badamier', tenantName: null, updatedAt: '2025-11-20', version: 1 },
  { id: 'd-11', name: 'Bail Optique Marcory', kind: 'lease', assetName: 'Boulevard Latrille', tenantName: 'Optique Marcory', updatedAt: '2024-01-31', version: 1 },
  { id: 'd-12', name: 'Relevé BGFI · septembre 2026', kind: 'statement', assetName: 'Boulevard Latrille', tenantName: null, updatedAt: '2026-10-07', version: 1 },
  { id: 'd-13', name: 'Mandat de gestion · Baie des Sirènes', kind: 'other', assetName: 'Baie des Sirènes', tenantName: null, updatedAt: '2024-03-12', version: 1 },
  { id: 'd-14', name: 'Bail Baie Resort SA', kind: 'lease', assetName: 'Baie des Sirènes', tenantName: 'Baie Resort SA', updatedAt: '2024-03-12', version: 1 },
];
