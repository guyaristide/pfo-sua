import type { MouseEvent, ReactNode } from 'react';
import { t } from '@/i18n/t';
import type { MessageKey } from '@/i18n/fr';
import { Button } from '@/ui/primitives';
import './owner.css';

export type OwnerSection = 'home' | 'lots' | 'reports' | 'documents';

const sections: { key: OwnerSection; label: MessageKey }[] = [
  { key: 'home', label: 'owner.nav.home' },
  { key: 'lots', label: 'owner.nav.lots' },
  { key: 'reports', label: 'owner.nav.reports' },
  { key: 'documents', label: 'owner.nav.documents' },
];

interface OwnerShellProps {
  personName: string;
  sciName: string;
  current: OwnerSection;
  /** Adresse de chaque rubrique : de vrais liens, ouvrables dans un nouvel onglet. */
  hrefOf: (section: OwnerSection) => string;
  onNavigate: (section: OwnerSection) => void;
  onSignOut: () => void;
  children: ReactNode;
}

/**
 * L'espace propriétaire (parcours 3), distinct de celui de l'équipe : en-tête global de 48 px, barre de
 * navigation de 40 px à onglets (SLDS §2), défilement horizontal plutôt qu'un retour à la ligne.
 */
export function OwnerShell({ personName, sciName, current, hrefOf, onNavigate, onSignOut, children }: OwnerShellProps) {
  const go = (section: OwnerSection) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onNavigate(section);
  };
  return (
    <div className="owner">
      <a className="skip-link" href="#main">
        {t('app.skipToContent')}
      </a>
      <header className="owner__header">
        <div className="owner__brand">
          <img src="/brand/pfo-immobilier-bleu.svg" alt="PFO Immobilier" />
        </div>
        <div className="owner__who">
          <div className="owner__identity">
            <div className="owner__person">{personName}</div>
            <div className="owner__sci">{sciName}</div>
          </div>
          <Button variant="base" onClick={onSignOut}>
            {t('header.signOut')}
          </Button>
        </div>
      </header>
      <nav className="owner__nav" aria-label={t('owner.space')}>
        <span className="owner__space">{t('owner.space')}</span>
        {sections.map(section => (
          <a key={section.key} href={hrefOf(section.key)} className="owner__nav-item" aria-current={section.key === current ? 'page' : undefined} onClick={go(section.key)}>
            {t(section.label)}
          </a>
        ))}
      </nav>
      <main className="owner__main" id="main">
        {children}
      </main>
    </div>
  );
}
