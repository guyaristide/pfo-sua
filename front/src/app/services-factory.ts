import type { Services } from '@/services/contracts';
import { createHttpServices } from '@/services/http/create-http-services';
import { createMockServices } from '@/mocks/create-mock-services';

/**
 * Le seul endroit qui connaît les deux implémentations. `VITE_DATA_SOURCE` choisit ; par défaut, mock.
 * Un cliquet refuse tout autre import de `mocks/` dans l'application.
 */
export function createServices(): Services {
  const source = import.meta.env.VITE_DATA_SOURCE ?? 'mock';
  if (source === 'http') {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL is required when VITE_DATA_SOURCE=http');
    }
    return createHttpServices(baseUrl);
  }
  const latency = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 250);
  const sessionKey = import.meta.env.VITE_MOCK_SESSION;
  const autoSignIn = import.meta.env.VITE_MOCK_AUTO_LOGIN === 'true';
  return createMockServices({ latencyMs: Number.isFinite(latency) ? latency : 250, autoSignIn, ...(sessionKey ? { sessionKey } : {}) });
}
