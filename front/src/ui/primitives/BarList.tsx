export interface BarItem {
  key: string;
  label: string;
  /** Part entre 0 et 1. */
  ratio: number;
  /** Ce que la barre montre, en texte : la couleur ne porte jamais seule le sens. */
  display: string;
  tone?: 'brand' | 'warning' | 'danger' | 'critical' | undefined;
}

/** Barres horizontales compactes (SLDS §8 : graphique d'appoint en version courte). */
export function BarList({ items, label }: { items: BarItem[]; label: string }) {
  return (
    <ul className="bar-list" aria-label={label}>
      {items.map(item => (
        <li key={item.key} className="bar-list__row">
          <span className="bar-list__label">{item.label}</span>
          <span className="bar-list__track" aria-hidden="true">
            <span className={`bar-list__fill bar-list__fill--${item.tone ?? 'brand'}`} style={{ ['--ratio' as string]: Math.max(0, Math.min(1, item.ratio)) }} />
          </span>
          <span className="bar-list__value numeric">{item.display}</span>
        </li>
      ))}
    </ul>
  );
}
