import type { Tone } from '@/shared/status';
import { Icon, type IconName } from './Icon';

export interface ToastItem {
  id: string;
  tone: Tone;
  title: string;
  detail?: string | undefined;
  /** Lien d'action (« Voir la remise ») : SLDS §7.9. */
  action?: { label: string; onClick: () => void } | undefined;
}

const toastIcon: Record<Tone, IconName> = { neutral: 'info', info: 'info', success: 'success', warning: 'warning', danger: 'error', inverse: 'info' };

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  dismissLabel: string;
}

/** Toasts SLDS : centrés sous l'en-tête, fond plein par nature, icône cerclée, fermeture explicite. */
export function ToastStack({ toasts, onDismiss, dismissLabel }: ToastStackProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="toasts">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role={toast.tone === 'danger' ? 'alert' : 'status'}>
          <span className="toast__icon" aria-hidden="true">
            <Icon name={toastIcon[toast.tone]} size={20} />
          </span>
          <span className="toast__body">
            <span className="toast__title">{toast.title}</span>
            {toast.detail ? <span className="toast__detail">{toast.detail}</span> : null}
            {toast.action ? (
              <button type="button" className="toast__action" onClick={toast.action.onClick}>
                {toast.action.label}
              </button>
            ) : null}
          </span>
          <button type="button" className="toast__close" aria-label={dismissLabel} onClick={() => onDismiss(toast.id)}>
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
