import type { SessionService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { type MockContext } from '../context';

export function createSessionMock(ctx: MockContext): SessionService {
  const { latency, sessionKeyFromToken, activeSession } = ctx;
  return {
    getSession: async () => {
      if (!sessionKeyFromToken()) throw new AppError('unauthorized');
      return delay(activeSession(), latency);
    },
  };
}
