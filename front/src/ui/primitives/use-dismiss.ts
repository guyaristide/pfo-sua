import { useEffect, type RefObject } from 'react';

/** Ferme un panneau flottant au clic extérieur ou à la touche Échap. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void, { escape = true } = {}) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (escape && event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, close, escape]);
}
