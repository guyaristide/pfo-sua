/** Latence simulée, pour que les états de chargement existent vraiment pendant le développement. */
export function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(structuredClone(value)), ms));
}
