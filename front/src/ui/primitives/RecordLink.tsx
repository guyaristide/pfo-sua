import type { ReactNode } from 'react';

/** Le lien d'une ligne vers sa fiche : seule la couleur de marque dit « cliquable » (SLDS §1.4). */
export function RecordLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="record-link" onClick={onClick}>
      {children}
    </button>
  );
}
