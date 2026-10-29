import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '@/i18n/t';
import { Icon, type IconName } from './Icon';
import { TextInput } from './Field';
import { useFormAttempted } from './Field';
import { useDismiss } from './use-dismiss';

export interface LookupOption {
  id: string;
  label: string;
  meta?: string | undefined;
  icon?: IconName | undefined;
}

interface LookupProps {
  id: string;
  options: readonly LookupOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean | undefined;
  disabled?: boolean;
}

const MAX_RESULTS = 12;
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Lookup SLDS : un champ de recherche, une liste de résultats avec pictogramme et sous-titre, puis la
 * valeur choisie en vignette retirable. Pour les listes longues (locataires, lots) qu'une liste
 * déroulante rendrait illisible.
 */
export function Lookup({ id, options, value, onChange, placeholder, invalid, disabled = false }: LookupProps) {
  const attempted = useFormAttempted();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const needle = fold(query.trim());
  const results = options.filter(o => !needle || fold(`${o.label} ${o.meta ?? ''}`).includes(needle)).slice(0, MAX_RESULTS);
  const selected = options.find(o => o.id === value);

  useDismiss(root, open, () => setOpen(false), { escape: false });

  const pick = (option: LookupOption) => {
    onChange(option.id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(true);
      else if (results.length) setActive(a => (a + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    } else if (event.key === 'Enter') {
      if (open && results[active]) {
        event.preventDefault();
        pick(results[active]);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  if (selected) {
    return (
      <div className={attempted && invalid ? 'lookup__selected lookup__selected--invalid' : 'lookup__selected'} id={id}>
        <span className="lookup__thumb" aria-hidden="true">
          <Icon name={selected.icon ?? 'user'} size={16} />
        </span>
        <span className="lookup__text">
          <span>{selected.label}</span>
          {selected.meta ? <small>{selected.meta}</small> : null}
        </span>
        {disabled ? null : (
          <button type="button" className="lookup__remove" aria-label={t('lookup.remove', { name: selected.label })} onClick={() => onChange('')}>
            <Icon name="close" size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={root} className="lookup">
      <span className="lookup__icon" aria-hidden="true">
        <Icon name="search" size={16} />
      </span>
      <TextInput
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        invalid={invalid}
        disabled={disabled}
        className="lookup__input"
        placeholder={placeholder ?? t('lookup.search')}
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul id={listId} role="listbox" className="lookup__results">
          {results.length ? (
            results.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? 'lookup__result lookup__result--active' : 'lookup__result'}
                onPointerMove={() => setActive(index)}
                onPointerDown={event => event.preventDefault()}
                onClick={() => pick(option)}
              >
                <span className="lookup__thumb" aria-hidden="true">
                  <Icon name={option.icon ?? 'user'} size={16} />
                </span>
                <span className="lookup__text">
                  <span>{option.label}</span>
                  {option.meta ? <small>{option.meta}</small> : null}
                </span>
              </li>
            ))
          ) : (
            <li className="lookup__empty">{t('lookup.noMatch')}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
