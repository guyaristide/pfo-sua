import { Icon } from './Icon';

/** Pastille rectangulaire (SLDS §7.6) : un filtre actif ou une valeur saisie, retirable. */
export function Pill({ label, onRemove, removeLabel }: { label: string; onRemove?: (() => void) | undefined; removeLabel?: string | undefined }) {
  return (
    <span className="pill">
      <span className="pill__label">{label}</span>
      {onRemove ? (
        <button type="button" className="pill__remove" aria-label={removeLabel ?? label} onClick={onRemove}>
          <Icon name="close" size={12} />
        </button>
      ) : null}
    </span>
  );
}
