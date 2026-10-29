import type { DemoService } from '@/services/contracts';
import { sampleLease, sampleTenantRows } from '../fixtures/samples';
import { type MockContext } from '../context';

export function createDemoMock(ctx: MockContext): DemoService {
  const { state } = ctx;
  return {
    enabled: true,
    sampleLease: async assetId => {
      const record = state.assetRecords.find(a => a.id === assetId);
      const vacant = record?.lots.find(lot => lot.status === 'vacant');
      return sampleLease(vacant?.code ?? '');
    },
    sampleTenantRows: async assetId => {
      const record = state.assetRecords.find(a => a.id === assetId);
      return sampleTenantRows((record?.lots ?? []).filter(lot => lot.status === 'vacant').map(lot => lot.code));
    },
  };
}
