/**
 * Brouillons des pages de geste à risque (règle 9). Seul module autorisé à toucher sessionStorage ;
 * un cliquet le vérifie. Le brouillon vit le temps de l'onglet : fermer l'onglet, c'est l'abandonner.
 */
const PREFIX = 'sua.draft.';

export function readDraft<T>(key: string): T | undefined {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeDraft<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée, quota) : le brouillon reste en mémoire.
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    // Rien à faire : il n'y avait rien.
  }
}
