import type { ReactNode } from 'react';

const gapClass = { 4: 'gap-4', 8: 'gap-8', 12: 'gap-12', 16: 'gap-16', 24: 'gap-24' } as const;
type Gap = keyof typeof gapClass;

/** Empilement vertical sur la grille de 4 px, à la place des marges posées à la main dans les écrans. */
export function Stack({ gap = 16, children, className }: { gap?: Gap; children: ReactNode; className?: string }) {
  return <div className={['stack', `stack--${gapClass[gap]}`, className].filter(Boolean).join(' ')}>{children}</div>;
}

/** Une rangée qui passe à la ligne quand la place manque (aucun débordement à 360 px). */
export function Inline({ gap = 8, justify = 'start', align = 'center', children }: { gap?: Gap; justify?: 'start' | 'between' | 'end'; align?: 'center' | 'start'; children: ReactNode }) {
  return <div className={`inline inline--${gapClass[gap]} inline--justify-${justify} inline--align-${align}`}>{children}</div>;
}

/** Les boutons d'un bloc de formulaire, sous ses champs. */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="form-actions">{children}</div>;
}

/** Fiche (SLDS §5) : colonne principale à deux tiers, colonne latérale pour les listes associées ; empilées sous 1024 px. */
export function RecordLayout({ main, aside }: { main: ReactNode; aside?: ReactNode }) {
  return (
    <div className={aside ? 'record-layout' : 'record-layout record-layout--single'}>
      <div className="record-layout__main">{main}</div>
      {aside ? <div className="record-layout__aside">{aside}</div> : null}
    </div>
  );
}
