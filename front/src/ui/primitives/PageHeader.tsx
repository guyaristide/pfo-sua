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
  const definition = objects[object];
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
      <header className="page-header">
        <div className="page-header__object">
          <span className="object-icon" style={{ background: definition.color }}>
            <Icon name={definition.icon} size={18} />
          </span>
          <div>
            {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
            <h1 className="page-header__title">{title}</h1>
          </div>
        </div>
        {aside ? <div className="page-header__aside">{aside}</div> : null}
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </header>
      {highlights && highlights.length > 0 ? (
        <div className="page-header card" style={{ borderTop: 0, borderRadius: '0 0 4px 4px', padding: 0 }}>
          <div className="page-header__highlights" style={{ borderTop: 0, width: '100%' }}>
            {highlights.map(h => (
              <div className="highlight" key={h.label}>
                <div className="highlight__label">{h.label}</div>
                <div className="highlight__value">{h.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
