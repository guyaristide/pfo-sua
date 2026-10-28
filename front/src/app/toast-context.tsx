import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { t } from '@/i18n/t';
import { ToastStack, type ToastItem } from '@/ui/primitives';

interface ToastApi {
  notify: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const AUTO_DISMISS_MS = 5000;

/** Un seul conteneur de toasts pour l'application ; chaque page notifie, le conteneur affiche. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setToasts(current => current.filter(toast => toast.id !== id)), []);
  const notify = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts(current => [...current, { ...toast, id }]);
      // Succès et information disparaissent seuls ; une erreur reste jusqu'à sa fermeture (SLDS §7.9).
      if (toast.tone !== 'danger') window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );
  const api = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} dismissLabel={t('toast.dismiss')} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('ToastProvider is missing above this component');
  return api;
}
