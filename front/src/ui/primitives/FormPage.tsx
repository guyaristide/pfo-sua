import { useEffect, useState, type ReactNode } from 'react';
import { t } from '@/i18n/t';
import type { ObjectKey } from '@/shared/objects';
import { Button } from './Button';
import { FormAttemptContext } from './Field';
import { Icon } from './Icon';
import { PageHeader, type Breadcrumb } from './PageHeader';

export interface FormIssue {
  /** Identifiant du contrôle en faute : le résumé y fait défiler et y place le focus. */
  id: string;
  message: string;
}

/** Construit le résumé d'erreurs depuis les erreurs d'un formulaire et les libellés de ses champs. */
export function issuesFrom(errors: Record<string, string | undefined>, idFor: (key: string) => string, labelFor: (key: string) => string): FormIssue[] {
  return Object.entries(errors)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, message]) => ({ id: idFor(key), message: `${labelFor(key)} : ${message}` }));
}

interface FormPageProps {
  object: ObjectKey;
  breadcrumbs: Breadcrumb[];
  eyebrow?: string;
  title: string;
  children: ReactNode;
  errorCount: number;
  /** Détail des erreurs pour le résumé du pied fixe ; sans lui, seul le nombre s'affiche. */
  issues?: FormIssue[];
  submitError: string | undefined;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  saveLabel?: string;
  /** Un geste destructeur (rejet, suppression) se valide en rouge (SLDS §7.3). */
  saveVariant?: 'brand' | 'destructive';
}

function goTo(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (element as HTMLElement).focus({ preventScroll: true });
}

/**
 * Page de saisie (règle 9, SLDS §6) : en-tête, contenu, pied fixe avec l'état du brouillon, le bouton
 * « N erreurs » qui ouvre le résumé et renvoie à chaque champ, et les actions.
 */
export function FormPage({ object, breadcrumbs, eyebrow, title, children, errorCount, issues, submitError, submitting, onCancel, onSubmit, saveLabel, saveVariant = 'brand' }: FormPageProps) {
  const [attempted, setAttempted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const showErrors = attempted && errorCount > 0;

  useEffect(() => {
    if (attempt > 0 && errorCount > 0) setSummaryOpen(true);
    // Seule une nouvelle tentative rouvre le résumé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const status = submitError ? (
    <span className="docked-footer__error">{submitError}</span>
  ) : showErrors ? (
    <span className="error-summary">
      <button type="button" className="error-summary__button" aria-expanded={summaryOpen} onClick={() => setSummaryOpen(o => !o)}>
        <Icon name="bell" size={14} />
        {errorCount === 1 ? t('form.errors.one') : t('form.errors', { count: errorCount })}
      </button>
      {summaryOpen && issues && issues.length > 0 ? (
        <div className="error-summary__panel" role="dialog" aria-label={t('form.errors.title')}>
          <strong>{t('form.errors.title')}</strong>
          <ul>
            {issues.map(issue => (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryOpen(false);
                    goTo(issue.id);
                  }}
                >
                  {issue.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </span>
  ) : (
    t('draft.saved')
  );

  return (
    <>
      <PageHeader object={object} breadcrumbs={breadcrumbs} {...(eyebrow ? { eyebrow } : {})} title={title} />
      <form
        onSubmit={event => {
          event.preventDefault();
          setAttempted(true);
          setAttempt(n => n + 1);
          if (errorCount === 0 && !submitting) onSubmit();
        }}
        noValidate
        style={{ display: 'contents' }}
      >
        <FormAttemptContext.Provider value={attempted}>{children}</FormAttemptContext.Provider>
        <div className={`docked-footer docked-footer--${submitError ? 'danger' : showErrors ? 'warning' : 'neutral'}`} role="region">
          <div className="docked-footer__status">{status}</div>
          <div className="docked-footer__actions">
            <Button variant="neutral" onClick={onCancel}>
              {t('settings.action.cancel')}
            </Button>
            <Button variant={saveVariant} type="submit" disabled={submitting}>
              {saveLabel ?? t('settings.action.save')}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
