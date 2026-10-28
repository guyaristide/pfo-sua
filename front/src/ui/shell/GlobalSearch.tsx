import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { SearchKind, SearchResult, SearchScope } from '@/services/contracts';
import { objects } from '@/shared/objects';
import { t } from '@/i18n/t';
import { Icon, SelectInput } from '@/ui/primitives';

const MAX_RESULTS = 5;
const scopes: SearchScope[] = ['all', 'asset', 'tenant', 'invoice', 'document'];
const kindObject = { asset: 'asset', tenant: 'asset', invoice: 'invoice', document: 'document' } as const;
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Surligne les caractères trouvés dans un libellé. */
function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const needle = fold(query.trim());
  const index = needle ? fold(text).indexOf(needle) : -1;
  if (index < 0) return text;
  const end = index + needle.length;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, end)}</mark>
      {text.slice(end)}
    </>
  );
}

interface GlobalSearchProps {
  query: string;
  scope: SearchScope;
  results: SearchResult[];
  recent: SearchResult[];
  onQueryChange: (query: string) => void;
  onScopeChange: (scope: SearchScope) => void;
  onOpen: (kind: SearchKind, id: string, result: SearchResult) => void;
  onSeeAll: () => void;
}

/**
 * Recherche globale SLDS : éléments récents au focus, cinq résultats instantanés pendant la saisie avec
 * l'icône d'objet, le type et un champ de désambiguïsation, portée restreignable à un type d'enregistrement.
 */
export function GlobalSearch({ query, scope, results, recent, onQueryChange, onScopeChange, onOpen, onSeeAll }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const typing = query.trim().length > 0;
  const shown = (typing ? results : recent).slice(0, MAX_RESULTS);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (result: SearchResult) => {
    setOpen(false);
    onQueryChange('');
    onOpen(result.kind, result.id, result);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive(i => Math.min(shown.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(i => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (shown[active]) choose(shown[active]);
      else if (typing) {
        setOpen(false);
        onSeeAll();
      }
    }
  };

  return (
    <div ref={root} className="global-search" role="search">
      <SelectInput className="global-search__scope" aria-label={t('header.search.scope')} value={scope} onChange={event => onScopeChange(event.target.value as SearchScope)}>
        {scopes.map(key => (
          <option key={key} value={key}>
            {t(`header.search.scope.${key}`)}
          </option>
        ))}
      </SelectInput>
      <label className="global-search__input">
        <Icon name="search" />
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          value={query}
          placeholder={t('header.search.placeholder')}
          aria-label={t('header.search.placeholder')}
          onFocus={() => setOpen(true)}
          onChange={event => {
            onQueryChange(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button type="button" className="global-search__clear" aria-label={t('header.search.clear')} onClick={() => onQueryChange('')}>
            <Icon name="close" size={13} />
          </button>
        ) : null}
      </label>
      {open ? (
        <div className="search-panel">
          <span className="search-panel__title">{typing ? t('header.search.results') : t('header.search.recent')}</span>
          <ul id={listId} role="listbox" aria-label={t('header.search.results')}>
            {shown.map((result, index) => {
              const definition = objects[kindObject[result.kind]];
              return (
                <li
                  key={`${result.kind}-${result.id}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? 'search-item search-item--active' : 'search-item'}
                  onPointerDown={event => {
                    event.preventDefault();
                    choose(result);
                  }}
                  onPointerEnter={() => setActive(index)}
                >
                  <span className="object-icon object-icon--sm" style={{ background: definition.color }}>
                    <Icon name={definition.icon} size={12} />
                  </span>
                  <span className="search-item__text">
                    <strong>
                      <Highlight text={result.title} query={query} />
                    </strong>
                    <small>
                      {t(`search.kind.${result.kind}`)} · {result.detail}
                    </small>
                  </span>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 ? <p className="search-panel__empty">{typing ? t('search.empty.title') : t('header.search.noRecent')}</p> : null}
          {typing && results.length > 0 ? (
            <button
              type="button"
              className="search-panel__all"
              onPointerDown={event => {
                event.preventDefault();
                setOpen(false);
                onSeeAll();
              }}
            >
              {t('header.search.seeAll', { count: results.length })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
