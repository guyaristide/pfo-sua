import type { ReactNode } from 'react';

export interface FieldItem {
  label: string;
  value: ReactNode;
  /** Un champ long occupe toute la largeur. */
  wide?: boolean;
  numeric?: boolean;
}

/** Grille de champs en lecture (SLDS §5) : libellé au-dessus de la valeur, deux colonnes, filet sous chaque champ. */
export function FieldGrid({ fields, columns = 2 }: { fields: FieldItem[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={`field-grid field-grid--${columns}`}>
      {fields.map(field => (
        <div key={field.label} className={field.wide ? 'field-grid__item field-grid__item--wide' : 'field-grid__item'}>
          <dt className="field-grid__label">{field.label}</dt>
          <dd className={field.numeric ? 'field-grid__value numeric' : 'field-grid__value'}>{field.value === null || field.value === undefined || field.value === '' ? '-' : field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Lignes libellé et montant alignés à droite, avec un total facultatif (récapitulatifs, CRG). */
export function AmountList({ lines, total }: { lines: { label: string; value: ReactNode }[]; total?: { label: string; value: ReactNode } | undefined }) {
  return (
    <dl className="amount-list">
      {lines.map(line => (
        <div key={line.label} className="amount-list__row">
          <dt>{line.label}</dt>
          <dd className="numeric">{line.value}</dd>
        </div>
      ))}
      {total ? (
        <div className="amount-list__row amount-list__row--total">
          <dt>{total.label}</dt>
          <dd className="numeric">{total.value}</dd>
        </div>
      ) : null}
    </dl>
  );
}
