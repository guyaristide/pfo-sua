import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface ChecklistItem {
  id: string;
  /** Contrôle passé, à surveiller, en échec, ou étape numérotée. */
  tone: 'success' | 'warning' | 'danger' | 'step';
  title: string;
  detail?: ReactNode;
  action?: ReactNode;
}

const markIcon: Record<Exclude<ChecklistItem['tone'], 'step'>, IconName> = { success: 'check', warning: 'warning', danger: 'close' };

/** Liste de contrôles ou d'étapes : une marque, un titre, un détail ; le ton est toujours doublé d'un texte. */
export function Checklist({ items, label }: { items: ChecklistItem[]; label?: string }) {
  return (
    <ol className="checklist" aria-label={label}>
      {items.map((item, index) => (
        <li key={item.id} className={`checklist__item checklist__item--${item.tone}`}>
          <span className="checklist__mark" aria-hidden="true">
            {item.tone === 'step' ? index + 1 : <Icon name={markIcon[item.tone]} size={12} />}
          </span>
          <div className="checklist__body">
            <div className="checklist__title">{item.title}</div>
            {item.detail ? <div className="checklist__detail">{item.detail}</div> : null}
          </div>
          {item.action ? <div className="checklist__action">{item.action}</div> : null}
        </li>
      ))}
    </ol>
  );
}
