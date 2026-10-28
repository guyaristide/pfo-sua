import type { ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Icon } from './Icon';
import { Button } from './Button';

interface ListStatusProps {
  /** Effectif de la liste filtrée, toujours affiché à côté des sommes (règle 10). */
  count: number;
  extra?: ReactNode;
  search: string;
  onSearch: (value: string) => void;
  filters?: ReactNode;
}

/** Ligne d'état d'une vue de liste (SLDS §4) : effectif, filtres en pastilles, recherche dans la liste. */
export function ListStatus({ count, extra, search, onSearch, filters }: ListStatusProps) {
  return (
    <div className="list-status">
      <span>
        {count === 1 ? t('list.count.one') : t('list.count', { count })}
        {extra ? <> · {extra}</> : null}
      </span>
      {filters ? <div className="list-status__filters">{filters}</div> : null}
      <label className="list-status__search">
        <Icon name="search" />
        <input
          type="search"
          value={search}
          onChange={event => onSearch(event.target.value)}
          placeholder={t('list.search.placeholder')}
          aria-label={t('list.search.placeholder')}
        />
      </label>
    </div>
  );
}

/** Pied « Afficher plus » : des lots de 20, jamais de pagination numérotée (SLDS §4). */
export function ShowMore({ hidden, onClick }: { hidden: number; onClick: () => void }) {
  if (hidden <= 0) return null;
  return (
    <div className="card__footer">
      <Button variant="base" onClick={onClick}>
        {t('list.showMore')} ({hidden})
      </Button>
    </div>
  );
}

interface FilterPillsProps<Key extends string> {
  options: { key: Key; label: string }[];
  value: Key;
  onChange: (key: Key) => void;
  label: string;
}

/** Filtres en pastilles rectangulaires, un seul actif (SLDS §4). */
export function FilterPills<Key extends string>({ options, value, onChange, label }: FilterPillsProps<Key>) {
  return (
    <div role="group" aria-label={label} style={{ display: 'contents' }}>
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          className="filter-pill"
          aria-pressed={option.key === value}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
