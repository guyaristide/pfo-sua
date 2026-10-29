import type { ArrearsService } from '@/services/contracts';
import { delay } from '../latency';
import { type MockContext } from '../context';

export function createArrearsMock(ctx: MockContext): ArrearsService {
  const { latency, byAsset, state } = ctx;
  return {
    getOverview: assetId => {
      const rows = byAsset(state.arrears.rows, assetId);
      return delay(
        {
          ...state.arrears,
          rows,
          totalDue: rows.reduce((sum, r) => sum + r.amountDue, 0),
          preLitigationCount: rows.filter(r => r.reminderLevel === 'pre-litigation').length,
        },
        latency,
      );
    },
  };
}
