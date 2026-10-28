import { Icon } from './Icon';

export interface PathStep<Key extends string> {
  key: Key;
  label: string;
}

interface PathProps<Key extends string> {
  steps: PathStep<Key>[];
  current: Key;
  /** Les étapes atteignables au clic (celles déjà franchies, en général). */
  onSelect?: ((key: Key) => void) | undefined;
  label: string;
}

/** Indicateur d'étapes (SLDS Path) : numéro et libellé, étape courante soulignée, précédentes cochées. */
export function Path<Key extends string>({ steps, current, onSelect, label }: PathProps<Key>) {
  const currentIndex = steps.findIndex(step => step.key === current);
  return (
    <ol className="path" aria-label={label}>
      {steps.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
        const clickable = state === 'done' && onSelect;
        const marker = state === 'done' ? <Icon name="check" size={12} /> : <span className="path__number">{index + 1}</span>;
        return (
          <li key={step.key} className={`path__item path__item--${state}`} style={{ zIndex: steps.length - index }} aria-current={state === 'current' ? 'step' : undefined}>
            {clickable ? (
              <button type="button" className="path__link" onClick={() => onSelect(step.key)}>
                {marker}
                {step.label}
              </button>
            ) : (
              <span className="path__link">
                {marker}
                {step.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
