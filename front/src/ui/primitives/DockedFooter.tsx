import type { ReactNode } from 'react';

interface DockedFooterProps {
  /** État du brouillon ou résumé des erreurs, à gauche. */
  status?: ReactNode;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  actions: ReactNode;
}

/** Pied fixe d'une page de geste à risque (règle 9, SLDS §6) : l'état à gauche, les actions à droite. */
export function DockedFooter({ status, tone = 'neutral', actions }: DockedFooterProps) {
  return (
    <div className={`docked-footer docked-footer--${tone}`} role="region">
      <div className="docked-footer__status">{status}</div>
      <div className="docked-footer__actions">{actions}</div>
    </div>
  );
}
