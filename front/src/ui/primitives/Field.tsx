import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { t } from '@/i18n/t';
import { Icon } from './Icon';

/**
 * Les erreurs d'un formulaire n'apparaissent qu'après une tentative d'envoi (ou de passage à l'étape
 * suivante) : un formulaire vierge n'est pas un formulaire en faute. `FormPage` et les assistants posent ce contexte.
 */
export const FormAttemptContext = createContext<boolean>(true);

export function useFormAttempted(): boolean {
  return useContext(FormAttemptContext);
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
  help?: string | undefined;
  children: ReactNode;
}

/** Un champ SLDS : libellé au-dessus (astérisque rouge avant), contrôle, puis erreur ou aide. */
export function Field({ id, label, required = false, error, help, children }: FieldProps) {
  const attempted = useFormAttempted();
  const shown = attempted ? error : undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id} id={`${id}-label`}>
        {required ? <abbr title={t('form.required')}>*</abbr> : null}
        {label}
      </label>
      <FormAttemptContext.Provider value={attempted && !!error}>{children}</FormAttemptContext.Provider>
      {shown ? (
        <div className="field__error" id={`${id}-error`} role="alert">
          {shown}
        </div>
      ) : help ? (
        <div className="field__help" id={`${id}-help`}>
          {help}
        </div>
      ) : null}
    </div>
  );
}

type ControlProps = { invalid?: boolean | undefined };

export function TextInput({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & ControlProps) {
  const shown = useFormAttempted() && invalid;
  return <input className={['field__control', className].filter(Boolean).join(' ')} aria-invalid={shown ? true : undefined} aria-describedby={shown && rest.id ? `${rest.id}-error` : undefined} {...rest} />;
}

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  /** Unité affichée à droite dans le champ (devise, m², %). */
  unit?: string | undefined;
  invalid?: boolean | undefined;
  decimal?: boolean;
}

/** Champ nombre : clavier numérique sans `type="number"` (molette et formats refusés), unité à droite. */
export function NumberInput({ unit, invalid, decimal = false, className, ...rest }: NumberInputProps) {
  const shown = useFormAttempted() && invalid;
  const input = (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      className={['field__control', unit ? 'field__control--unit' : '', className].filter(Boolean).join(' ')}
      aria-invalid={shown ? true : undefined}
      aria-describedby={shown && rest.id ? `${rest.id}-error` : undefined}
      {...rest}
    />
  );
  if (!unit) return input;
  return (
    <span className="unit-field">
      {input}
      <span className="unit-field__unit" aria-hidden="true">
        {unit}
      </span>
    </span>
  );
}

export function TextArea({ invalid, className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps) {
  const shown = useFormAttempted() && invalid;
  return <textarea rows={rows} className={['field__control', 'field__control--area', className].filter(Boolean).join(' ')} aria-invalid={shown ? true : undefined} {...rest} />;
}

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled: boolean;
}

/** Options déclarées en enfants `<option>` : la liste déroulante garde l'écriture d'un select natif. */
function optionsOf(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child) || child.type !== 'option') return;
    options.push({ value: String(child.props.value ?? ''), label: child.props.children, disabled: Boolean(child.props.disabled) });
  });
  return options;
}

const textOf = (node: ReactNode): string => (typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : '');

/**
 * Liste déroulante SLDS (« picklist ») : un bouton qui porte la valeur et une liste d'options sous lui,
 * au lieu du menu natif du navigateur qui échappe à la charte. Même contrat qu'un `<select>` :
 * `value`, `onChange` reçoit un événement dont `target.value` est la valeur choisie, options en enfants `<option>`.
 */
export function SelectInput({
  invalid,
  className,
  value,
  defaultValue,
  onChange,
  children,
  disabled,
  id,
  name,
  'aria-label': ariaLabel,
}: SelectHTMLAttributes<HTMLSelectElement> & ControlProps) {
  const attempted = useFormAttempted();
  const options = optionsOf(children);
  const current = String(value ?? defaultValue ?? options[0]?.value ?? '');
  const selected = options.find(o => o.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  useEffect(() => {
    if (!open || !list.current) return;
    (list.current.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const choose = (option: SelectOption) => {
    setOpen(false);
    button.current?.focus();
    if (option.value === current || option.disabled) return;
    const target = { value: option.value, name: name ?? '' } as unknown as HTMLSelectElement;
    onChange?.({ target, currentTarget: target } as ChangeEvent<HTMLSelectElement>);
  };

  const show = () => {
    if (disabled) return;
    const rect = button.current?.getBoundingClientRect();
    setAbove(Boolean(rect && window.innerHeight - rect.bottom < 280 && rect.top > 280));
    setActive(Math.max(0, options.findIndex(o => o.value === current)));
    setOpen(true);
  };

  const move = (delta: number) => {
    if (!options.length) return;
    let next = active;
    for (let step = 0; step < options.length; step += 1) {
      next = (next + delta + options.length) % options.length;
      if (!options[next]!.disabled) break;
    }
    setActive(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) show();
        else move(event.key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Home':
      case 'End':
        if (!open) return;
        event.preventDefault();
        setActive(event.key === 'Home' ? 0 : options.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open && options[active]) choose(options[active]);
        else show();
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      case 'Tab':
        setOpen(false);
        return;
      default:
    }
    if (event.key.length !== 1) return;
    const now = Date.now();
    const text = (now - typed.current.at < 1000 ? typed.current.text : '') + event.key.toLowerCase();
    typed.current = { text, at: now };
    const index = options.findIndex(o => !o.disabled && textOf(o.label).toLowerCase().startsWith(text));
    if (index < 0) return;
    if (open) setActive(index);
    else choose(options[index]!);
  };

  const shownInvalid = attempted && invalid;
  return (
    <div ref={root} className={['picklist', className].filter(Boolean).join(' ')}>
      <button
        ref={button}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={shownInvalid ? true : undefined}
        aria-describedby={shownInvalid && id ? `${id}-error` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={id && !ariaLabel ? `${id}-label` : undefined}
        disabled={disabled}
        className={['field__control', 'picklist__button', selected ? '' : 'picklist__button--placeholder'].filter(Boolean).join(' ')}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span className="picklist__value">{selected?.label ?? ' '}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      {open ? (
        <ul ref={list} id={listId} role="listbox" className={above ? 'picklist__options picklist__options--above' : 'picklist__options'} aria-activedescendant={`${listId}-${active}`}>
          {options.map((option, index) => (
            <li
              key={`${option.value}-${index}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === current}
              aria-disabled={option.disabled || undefined}
              className={[
                'picklist__option',
                index === active ? 'picklist__option--active' : '',
                option.value === current ? 'picklist__option--selected' : '',
                option.disabled ? 'picklist__option--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerMove={() => setActive(index)}
              onPointerDown={event => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span className="picklist__check">{option.value === current ? <Icon name="check" size={14} /> : null}</span>
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  help?: string | undefined;
  disabled?: boolean;
}

/** Case à cocher dessinée (SLDS) : la case native échappe à la charte. */
export function CheckboxField({ id, label, checked, onChange, help, disabled = false }: CheckboxFieldProps) {
  return (
    <label className={disabled ? 'check check--disabled' : 'check'} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      <span className="check__box" aria-hidden="true">
        <Icon name="check" size={12} />
      </span>
      <span className="check__text">
        <span>{label}</span>
        {help ? <span className="check__help">{help}</span> : null}
      </span>
    </label>
  );
}

interface RadioFieldProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  help?: string | undefined;
}

export function RadioField({ id, name, label, checked, onChange, help }: RadioFieldProps) {
  return (
    <label className="check" htmlFor={id}>
      <input id={id} type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="check__box check__box--radio" aria-hidden="true" />
      <span className="check__text">
        <span>{label}</span>
        {help ? <span className="check__help">{help}</span> : null}
      </span>
    </label>
  );
}
