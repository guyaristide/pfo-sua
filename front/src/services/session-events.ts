/**
 * Une session perdue (401 définitif) se signale ici, et l'application décide quoi faire (retour à la
 * connexion). Les services ne connaissent ni le routeur ni le cache.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export const sessionEvents = {
  onLost(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitLost(): void {
    for (const listener of listeners) listener();
  },
};
