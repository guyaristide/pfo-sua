import type { NotificationService } from '@/services/contracts';
import { delay } from '../latency';
import { type MockContext } from '../context';

export function createNotificationMock(ctx: MockContext): NotificationService {
  const { latency, state } = ctx;
  return {
    list: () => delay(state.notifications, latency),
    markAllRead: async () => {
      state.notifications = state.notifications.map(n => ({ ...n, read: true }));
      await delay(undefined, 0);
    },
  };
}
