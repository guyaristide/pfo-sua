import type { ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Button } from './Button';
import { Stat } from './Stat';

export interface KpiItem {
  key: string;
  label: string;
  value: ReactNode;
  unit?: string | undefined;
  delta?: { text: string; tone: 'good' | 'bad' | 'neutral' } | undefined;
  hint?: string | undefined;
}

interface KpiRowProps {
  items: KpiItem[];
  /** Indicateur dont le détail est ouvert (E0.2) ; sans `onToggle`, les tuiles ne sont pas cliquables. */
  open?: string | null | undefined;
  onToggle?: ((key: string | null) => void) | undefined;
  /** Détail de l'indicateur ouvert : titre, chiffres, définition, lien vers la liste source. */
  detail?: { title: string; body: ReactNode; definition: string; action?: { label: string; onClick: () => void } | undefined } | undefined;
}

/** Rangée d'indicateurs (SLDS §8) : libellé gris, valeur grasse, variation signée ; détail au clic. */
export function KpiRow({ items, open, onToggle, detail }: KpiRowProps) {
  return (
    <>
      <div className="stat-row">
        {items.map(item =>
          onToggle ? (
            <button key={item.key} type="button" className={item.key === open ? 'kpi-tile kpi-tile--open' : 'kpi-tile'} aria-expanded={item.key === open} onClick={() => onToggle(item.key === open ? null : item.key)}>
              <Stat label={item.label} value={item.value} {...(item.unit ? { unit: item.unit } : {})} delta={item.delta} hint={item.hint} />
            </button>
          ) : (
            <Stat key={item.key} label={item.label} value={item.value} {...(item.unit ? { unit: item.unit } : {})} delta={item.delta} hint={item.hint} />
          ),
        )}
      </div>
      {detail && open ? (
        <div className="kpi-detail" role="region" aria-label={detail.title}>
          <div>
            <h3 className="kpi-detail__title">{detail.title}</h3>
            <div>{detail.body}</div>
            <p className="kpi-detail__definition">{detail.definition}</p>
          </div>
          <div className="kpi-detail__actions">
            {detail.action ? (
              <Button variant="neutral" onClick={detail.action.onClick}>
                {detail.action.label}
              </Button>
            ) : null}
            <Button variant="base" onClick={() => onToggle?.(null)}>
              {t('dialog.close')}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
