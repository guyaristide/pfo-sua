import type { OwnerAuthService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { sessionStore } from '@/services/http/session-store';
import { delay } from '../latency';
import { ownerSeeds } from '../fixtures/owner';
import { type MockContext, MOCK_TOKEN_PREFIX } from '../context';

/** E3.1 : activation par mot de passe (8 caractères au moins), connexion, lien à usage unique de 15 minutes. */
export function createOwnerAuthMock(ctx: MockContext): OwnerAuthService {
  const { latency, state } = ctx;
  const accountOf = (email: string) => {
    const account = state.owners.find(o => o.email === email.trim().toLowerCase());
    if (!account) throw new AppError('validation', { userMessage: 'Cette adresse n’a pas d’accès à l’espace propriétaire. Utilisez celle de l’e-mail reçu.' });
    return account;
  };
  const open = (sessionKey: string) => sessionStore.setToken(`${MOCK_TOKEN_PREFIX}${sessionKey}`);
  return {
    getAccess: async email => {
      const account = accountOf(email);
      const profile = ownerSeeds[account.seed].profile;
      return delay({ email: account.email, personName: profile.personName, sciName: profile.sciName, activated: account.password !== null }, latency);
    },
    activate: async (email, password) => {
      const account = accountOf(email);
      if (password.length < 8) throw new AppError('validation', { userMessage: 'Le mot de passe doit compter 8 caractères au moins.' });
      account.password = password;
      await delay(undefined, latency);
      open(account.sessionKey);
    },
    signIn: async (email, password) => {
      const account = accountOf(email);
      if (account.password === null) throw new AppError('business', { userMessage: 'Votre accès n’est pas encore activé : choisissez d’abord un mot de passe.' });
      if (account.password !== password) throw new AppError('validation', { userMessage: 'Mot de passe incorrect. Réessayez ou recevez un lien de connexion.' });
      await delay(undefined, latency);
      open(account.sessionKey);
    },
    requestLink: async email => {
      const account = accountOf(email);
      account.pendingLink = true;
      return delay({ expiresInMinutes: 15 }, latency);
    },
    openLink: async email => {
      const account = accountOf(email);
      if (!account.pendingLink) throw new AppError('business', { userMessage: 'Ce lien a déjà servi ou a expiré. Demandez-en un nouveau.' });
      account.pendingLink = false;
      await delay(undefined, latency);
      open(account.sessionKey);
    },
    requestReset: async email => {
      accountOf(email);
      await delay(undefined, latency);
    },
  };
}
