import { useCallback, useEffect, useState } from 'react';
import { clearDraft, readDraft, writeDraft } from '@/services/storage/draft-store';

/**
 * Un brouillon par page de geste à risque : restauré à l'ouverture, écrit à chaque changement,
 * effacé à la fin du geste. L'écran ne sait pas où il est rangé.
 */
export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = readDraft<T>(key);
    return stored === undefined ? initial : stored;
  });
  const [restored] = useState(() => {
    return readDraft<T>(key) !== undefined;
  });

  useEffect(() => {
    writeDraft(key, value);
  }, [key, value]);

  const discard = useCallback(() => {
    clearDraft(key);
    setValue(initial);
  }, [key, initial]);

  const finish = useCallback(() => clearDraft(key), [key]);

  return { value, setValue, restored, discard, finish };
}
