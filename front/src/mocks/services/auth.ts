import type { AuthService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { sessionStore } from '@/services/http/session-store';
import { delay } from '../latency';
import { type MockContext, MOCK_TOKEN_PREFIX, DEMO_DOMAIN, DEMO_CODE, sessionEmails } from '../context';

export function createAuthMock(ctx: MockContext): AuthService {
  const { latency, fallbackKey, options } = ctx;
  return {
    requestCode: async email => {
      const normalized = email.trim().toLowerCase();
      if (!normalized.endsWith(`@${DEMO_DOMAIN}`)) {
        throw new AppError('validation', { userMessage: `Cette adresse n’est pas connue de SUA. Utilisez votre adresse @${DEMO_DOMAIN}.` });
      }
      return delay({ expiresInMinutes: 10, demoCode: options.exposeLoginCode ? DEMO_CODE : null }, latency);
    },
    verifyCode: async (email, code) => {
      if (code.trim() !== DEMO_CODE) throw new AppError('validation', { userMessage: 'Code incorrect ou expiré. Vérifiez les six chiffres ou demandez un nouveau code.' });
      const local = email.trim().toLowerCase().split('@')[0] ?? '';
      const key = Object.entries(sessionEmails).find(([, prefixes]) => prefixes.some(prefix => local.startsWith(prefix)))?.[0] ?? fallbackKey;
      await delay(undefined, latency);
      sessionStore.setToken(`${MOCK_TOKEN_PREFIX}${key}`);
    },
    signOut: async () => {
      sessionStore.setToken(null);
      await delay(undefined, 0);
    },
  };
}
