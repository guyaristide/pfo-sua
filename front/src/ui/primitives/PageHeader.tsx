import type { ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Icon } from './Icon';
import { objects, type ObjectKey } from '@/shared/objects';

interface Highlight {
  label: string;
  value: ReactNode;
}

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  object: ObjectKey;
  /** Fil d'Ariane : les parents, du plus lointain au plus proche ; la page courante est le titre. */
  breadcrumbs?: Breadcrumb[];
  eyebrow?: string;
  title: string;
  /** Zone entre le titre et les actions : un Path, le plus souvent. */
  aside?: ReactNode;
  actions?: ReactNode;
  highlights?: Highlight[];
}

/** En-tête de page SLDS §5 : icône d'objet, surtitre, titre, actions, champs en évidence. */
export function PageHeader({ object, breadcrumbs, eyebrow, title, aside, actions, highlights }: PageHeaderProps) {
  return (
    <div>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="breadcrumbs" aria-label={t('nav.breadcrumbs')}>
          <ol>
            {breadcrumbs.map(crumb => (
              <li key={crumb.label}>
                {crumb.onClick ? (
                  <button type="button" className="breadcrumbs__link" onClick={crumb.onClick}>
                    {crumb.label}
                  </button>
                ) : (
                  <span>{crumb.label}</span>
                )}
                <Icon name="chevron-right" size={12} />
              </li>
            ))}
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
      ) : null}
      <div className={highlights && highlights.length > 0 ? 'page-header-card page-header-card--highlights' : 'page-header-card'}>
      <header className="page-header">
        <div className="page-header__object">
          <ObjectIcon object={object} />
          <div>
            {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
            <h1 className="page-header__title">{title}</h1>
          </div>
        </div>
        {aside ? <div className="page-header__aside">{aside}</div> : null}
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </header>
      {highlights && highlights.length > 0 ? (
        <dl className="page-header__highlights">
          {highlights.map(h => (
            <div className="highlight" key={h.label}>
              <dt className="highlight__label">{h.label}</dt>
              <dd className="highlight__value">{h.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      </div>
    </div>
  );
}

/** Pictogramme d'objet (SLDS §3) : glyphe blanc sur carré coloré, couleur lue dans le registre unique. */
export function ObjectIcon({ object, size = 18 }: { object: ObjectKey; size?: number }) {
  const definition = objects[object];
  return (
    <span className={size < 16 ? "object-icon object-icon--sm" : "object-icon"} style={{ background: definition.color }} aria-hidden="true">
      <Icon name={definition.icon} size={size} />
    </span>
  );
}
