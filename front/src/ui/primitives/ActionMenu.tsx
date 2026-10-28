import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface MenuAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

const ITEM_HEIGHT = 36;
const GAP = 4;
const MARGIN = 8;

interface Position {
  top: number;
  left: number;
  upward: boolean;
}

/**
 * Menu d'actions d'une ligne (SLDS §7.7) : rendu au-dessus de la page, jamais coupé par un tableau qui
 * défile, ouvert vers le haut quand la place manque, piloté au clavier, action destructrice en rouge à la fin.
 */
export function ActionMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }, []);

  const place = useCallback(() => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const height = list.current?.offsetHeight ?? actions.length * ITEM_HEIGHT + MARGIN;
    const width = list.current?.offsetWidth ?? 220;
    const upward = rect.bottom + GAP + height > window.innerHeight - MARGIN && rect.top - GAP - height > MARGIN;
    setPosition({
      top: upward ? rect.top - GAP - height : rect.bottom + GAP,
      left: Math.max(MARGIN, Math.min(rect.right - width, window.innerWidth - width - MARGIN)),
      upward,
    });
  }, [actions.length]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    list.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!list.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, place, close]);

  if (!actions.length) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items.at(-1)?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={open ? 'menu-trigger menu-trigger--open' : 'menu-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Icon name="chevron-down" size={14} />
      </button>
      {open
        ? createPortal(
            <ul
              ref={list}
              className={position?.upward ? 'menu-list menu-list--upward' : 'menu-list'}
              style={{ top: position?.top ?? -9999, left: position?.left ?? -9999 }}
              role="menu"
              aria-label={label}
              onKeyDown={onKeyDown}
            >
              {actions.map(action => (
                <li key={action.label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={action.disabled}
                    className={action.danger ? 'menu-list__item menu-list__item--danger' : 'menu-list__item'}
                    onClick={() => {
                      close();
                      action.onSelect();
                    }}
                  >
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}
