/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'http';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MOCK_LATENCY_MS?: string;
  /** Session simulée : pmLead (défaut), assetManager, financeManager. */
  readonly VITE_MOCK_SESSION?: string;
  /** `true` ouvre la session simulée sans passer par l'écran de connexion. */
  readonly VITE_MOCK_AUTO_LOGIN?: string;
  /** `true` affiche le code de connexion simulé à l'écran (jamais en production). */
  readonly VITE_MOCK_EXPOSE_LOGIN_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
