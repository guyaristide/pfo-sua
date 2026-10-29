import type { ReactNode } from 'react';
import { t } from '@/i18n/t';
import type { ObjectKey } from '@/shared/objects';
import { DockedFooter } from './DockedFooter';
import { FormAttemptContext } from './Field';
import { PageHeader, type Breadcrumb } from './PageHeader';
import { Path, type PathStep } from './Path';

export type FooterTone = 'neutral' | 'warning' | 'danger' | 'success';

/** Le texte et le ton du pied d'une étape : erreur d'envoi, erreurs visibles, sinon brouillon conservé. */
export function stepStatus(submitError: string | undefined, showErrors: boolean, errorCount: number): { status: string; tone: FooterTone } {
  if (submitError) return { status: submitError, tone: 'danger' };
  if (showErrors) return { status: errorCount === 1 ? t('form.errors.one') : t('form.errors', { count: errorCount }), tone: 'warning' };
  return { status: t('draft.saved'), tone: 'neutral' };
}

interface WizardPageProps<Key extends string> {
  object: ObjectKey;
  breadcrumbs: Breadcrumb[];
  eyebrow?: string | undefined;
  title: string;
  steps: PathStep<Key>[];
  current: Key;
  onSelectStep?: ((key: Key) => void) | undefined;
  pathLabel: string;
  /** Les erreurs de l'étape sont visibles (la personne a tenté de la quitter). */
  attempted: boolean;
  footer: { status: ReactNode; tone?: FooterTone; actions: ReactNode };
  children: ReactNode;
}

/** Page en étapes (règle 9) : en-tête avec Path, contenu de l'étape, pied fixe ; erreurs visibles après tentative. */
export function WizardPage<Key extends string>({ object, breadcrumbs, eyebrow, title, steps, current, onSelectStep, pathLabel, attempted, footer, children }: WizardPageProps<Key>) {
  return (
    <FormAttemptContext.Provider value={attempted}>
      <PageHeader object={object} breadcrumbs={breadcrumbs} {...(eyebrow ? { eyebrow } : {})} title={title} aside={<Path steps={steps} current={current} onSelect={onSelectStep} label={pathLabel} />} />
      {children}
      <DockedFooter tone={footer.tone ?? 'neutral'} status={footer.status} actions={footer.actions} />
    </FormAttemptContext.Provider>
  );
}
