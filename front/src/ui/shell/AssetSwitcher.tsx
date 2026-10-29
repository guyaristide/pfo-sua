import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '@/i18n/t';
import { Icon, useDismiss } from '@/ui/primitives';

export interface AssetOption {
  id: string;
  name: string;
  buildingCount: number;
  lotCount: number;
  /** Actif connu sans données reprises : proposé grisé, avec la mention « données à venir ». */
  pendingData?: boolean;
}

interface AssetSwitcherProps {
  assets: AssetOption[];
  selectedAssetId: string | undefined;
  onSelect: (assetId: string | undefined) => void;
}

const ALL = '__all__';

/**
 * Sélecteur d'actif de la barre latérale (architecture d'Elodie) : un bouton à deux lignes qui ouvre un menu
 * `menuitemradio`. Clavier : flèches, Entrée, Échap ; clic hors du menu le ferme.
 */
export function AssetSwitcher({ assets, selectedAssetId, onSelect }: AssetSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const options: { id: string; name: string; summary: string; pending?: boolean }[] = [
    {
      id: ALL,
      name: t('assetSwitcher.all'),
      summary: t('assetSwitcher.summary', { assets: assets.filter(a => !a.pendingData).length, lots: assets.reduce((sum, a) => sum + a.lotCount, 0) }),
    },
    ...assets.map(a => ({
      id: a.id,
      name: a.name,
      summary: a.pendingData ? t('assetSwitcher.pendingData') : t('assetSwitcher.assetSummary', { buildings: a.buildingCount, lots: a.lotCount }),
      pending: a.pendingData === true,
    })),
  ];
  const current = options.find(o => o.id === (selectedAssetId ?? ALL)) ?? options[0]!;

  useDismiss(rootRef, open, () => setOpen(false), { escape: false });

  useEffect(() => {
    if (!open) return;
    const checked = rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]');
    checked?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const pick = (id: string) => {
    onSelect(id === ALL ? undefined : id);
    close();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    const index = items.findIndex(item => item === document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <div className="asset-switcher" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="asset-switcher__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('assetSwitcher.change', { name: current.name })}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="asset-switcher__text">
          <span className="asset-switcher__label">{t('assetSwitcher.label')}</span>
          <span className="asset-switcher__name">{current.name}</span>
          <span className="asset-switcher__summary">{current.summary}</span>
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} />
      </button>
      {open ? (
        <div className="asset-menu" role="menu" id={menuId} aria-label={t('assetSwitcher.menu')} onKeyDown={onMenuKeyDown}>
          {options.map(option => {
            const checked = option.id === current.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                className={option.pending ? 'asset-menu__item asset-menu__item--pending' : 'asset-menu__item'}
                onClick={() => pick(option.id)}
              >
                <span className="asset-menu__text">
                  <span className="asset-menu__name">{option.name}</span>
                  <span className="asset-menu__summary">{option.summary}</span>
                </span>
                {checked ? <Icon name="check" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
