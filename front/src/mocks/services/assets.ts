import type { AssetRecord, AssetService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { type MockContext } from '../context';

export function createAssetMock(ctx: MockContext): AssetService {
  const { latency, activeSession, state, author } = ctx;
  return {
    listAssets: () => delay(state.assets, latency),
    getAsset: async id => {
      const asset = state.assets.find(a => a.id === id);
      if (!asset) throw new AppError('resource-missing');
      return delay(asset, latency);
    },
    getAssetRecord: async id => {
      const found = state.assetRecords.find(a => a.id === id);
      if (!found) throw new AppError('resource-missing');
      return delay(found, latency);
    },
    createAsset: async input => {
      if (!activeSession().permissions.includes('asset.write')) throw new AppError('forbidden', { userMessage: 'Vous n’avez pas le droit de créer un actif.' });
      if (state.assets.some(a => a.name.toLowerCase() === input.name.trim().toLowerCase())) {
        throw new AppError('validation', { userMessage: `Un actif nommé « ${input.name.trim()} » existe déjà.` });
      }
      const codes = new Set<string>();
      for (const lot of input.lots) {
        if (codes.has(lot.code)) throw new AppError('validation', { userMessage: `La référence de lot ${lot.code} apparaît deux fois.` });
        codes.add(lot.code);
      }
      const id = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `actif-${Date.now()}`;
      const code = input.name.trim().split(/\s+/).map(word => word[0]?.toUpperCase() ?? '').join('').slice(0, 4) || 'ACT';
      const buildings = new Set(input.lots.map(lot => lot.building));
      const summary = {
        id,
        code,
        name: input.name.trim(),
        dataStatus: 'active' as const,
        location: input.location.trim(),
        ownerName: input.owner.name.trim(),
        buildingCount: buildings.size,
        lotCount: input.lots.length,
        occupancyRate: 0,
        unpaidAmount: 0,
        managerName: author(),
        bankAccountOwner: input.bankAccountOwner,
        expensesPaidBy: input.expensesPaidBy,
      };
      const signed = new Date(input.mandate.signedOn);
      const ends = new Date(Date.UTC(signed.getUTCFullYear() + input.mandate.durationYears, signed.getUTCMonth(), signed.getUTCDate() - 1));
      const fullRecord: AssetRecord = {
        ...summary,
        owner: input.owner,
        mandate: { ...input.mandate, endsOn: ends.toISOString().slice(0, 10) },
        rentAccountLabel:
          input.bankAccountOwner === 'sci' ? `Compte de la SCI · ${input.owner.name}${input.rentAccountLastDigits ? ` •••• ${input.rentAccountLastDigits}` : ''}` : 'Compte de PFO Immobilier',
        billingItemCodes: input.billingItemCodes,
        lots: input.lots.map((lot, index) => ({ id: `lot-${id}-${index}`, ...lot, status: 'vacant' as const, tenantName: null, monthlyRent: null })),
        tenants: [],
      };
      state.assets = [...state.assets, summary];
      state.assetRecords = [...state.assetRecords, fullRecord];
      return delay(summary, latency);
    },
  };
}
