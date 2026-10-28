/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'http';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MOCK_LATENCY_MS?: string;
  /** Session simulée : pmLead (défaut), assetManager, financeManager. */
  readonly VITE_MOCK_SESSION?: string;
  /** `true` ouvre la session simulée sans passer par l'écran de connexion. */
  readonly VITE_MOCK_AUTO_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
