import type { ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { Loader } from './Loader';

/** Chargement, erreur, vide : trois composants distincts, jamais confondus (règle 2). */

export function LoadingState({ inline = false }: { inline?: boolean }) {
  return (
    <div className={inline ? 'state state--inline' : 'state'} role="status" aria-live="polite">
      <Loader size={inline ? 28 : 56} />
      <span>{t('state.loading')}</span>
    </div>
  );
}

interface ErrorStateProps {
  reference: string;
  /** Un refus que nous avons écrit, déjà adressé à la personne qui lit (règle 11). */
  userMessage?: string;
  onRetry?: () => void;
}

export function ErrorState({ reference, userMessage, onRetry }: ErrorStateProps) {
  return (
    <div className="state" role="alert">
      <div className="state__illustration">
        <Icon name="help" size={28} />
      </div>
      <div className="state__title">{t('state.error.title')}</div>
      <p>{userMessage ?? t('state.error.body', { reference })}</p>
      {onRetry ? (
        <Button variant="neutral" iconLeading="refresh" onClick={onRetry}>
          {t('state.error.retry')}
        </Button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  /** Bandeau bleu clair sur trame PFO : pour un vide qui est un bon état métier (« tout est à jour »). */
  trame?: boolean;
}

export function EmptyState({ icon = 'folder', title, body, action, trame = false }: EmptyStateProps) {
  return (
    <div className={trame ? 'state state--trame' : 'state'}>
      <div className="state__illustration" aria-hidden="true">
        <Icon name={icon} size={28} />
      </div>
      <div className="state__title">{title}</div>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}
