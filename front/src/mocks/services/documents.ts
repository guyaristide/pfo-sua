import type { DocumentDetail, DocumentService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { type MockContext } from '../context';

export function createDocumentMock(ctx: MockContext): DocumentService {
  const { latency, byAsset, state, author, today } = ctx;
  return {
    listDocuments: assetId => delay(byAsset(state.documents, assetId), latency),
    getDocument: async id => {
      const found = state.documents.find(d => d.id === id);
      if (!found) throw new AppError('resource-missing');
      return delay(found, latency);
    },
    upload: async input => {
      const asset = input.assetId ? state.assets.find(a => a.id === input.assetId) : undefined;
      const tenant = input.tenantId ? state.tenants.find(tn => tn.id === input.tenantId) : undefined;
      const existing = input.replacesId ? state.documents.find(d => d.id === input.replacesId) : undefined;
      if (input.replacesId && !existing) throw new AppError('resource-missing');
      const version = existing ? existing.version + 1 : 1;
      const document: DocumentDetail = {
        id: existing?.id ?? `d-${Date.now()}`,
        name: input.name,
        kind: input.kind,
        assetName: asset?.name ?? existing?.assetName ?? tenant?.assetName ?? '',
        assetId: asset?.id ?? existing?.assetId ?? tenant?.assetId ?? null,
        tenantName: tenant?.name ?? existing?.tenantName ?? null,
        tenantId: tenant?.id ?? existing?.tenantId ?? null,
        updatedAt: today(),
        version,
        sizeLabel: `${200 + version * 10} Ko`,
        formatLabel: 'PDF',
        versions: [{ version, updatedAt: today(), updatedBy: author(), note: input.note }, ...(existing?.versions ?? [])],
      };
      state.documents = existing ? state.documents.map(d => (d.id === existing.id ? document : d)) : [document, ...state.documents];
      return delay(document, latency);
    },
    download: async id => {
      const found = state.documents.find(d => d.id === id);
      if (!found) throw new AppError('resource-missing');
      return new Blob([`${found.name}\nVersion ${found.version} · document de démonstration`], { type: 'text/plain;charset=utf-8' });
    },
  };
}
