/**
 * La seule couche qui connaît le jeton (règle 16). Aucun composant, aucun hook métier ne lit le
 * stockage directement ; un cliquet le vérifie.
 */
const TOKEN_KEY = 'sua.session.token';

export const sessionStore = {
  getToken(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string | null): void {
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Stockage indisponible (navigation privée) : la session ne survit pas au rechargement, rien d'autre.
    }
  },
};
