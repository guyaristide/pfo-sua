import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface Scope {
  assetId: string | undefined;
  setAssetId: (assetId: string | undefined) => void;
}

const ScopeContext = createContext<Scope | null>(null);

/** Le périmètre courant (un actif ou tous), choisi dans la barre latérale et lu par toutes les pages. */
export function ScopeProvider({ children }: { children: ReactNode }) {
  const [assetId, setAssetId] = useState<string | undefined>(undefined);
  const value = useMemo(() => ({ assetId, setAssetId }), [assetId]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope(): Scope {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error('ScopeProvider is missing above this component');
  return scope;
}
