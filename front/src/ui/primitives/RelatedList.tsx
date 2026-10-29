import { useState, type ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState } from './States';
import { RecordLink } from './RecordLink';

export interface RelatedItem {
  id: string;
  label: string;
  meta?: string | undefined;
  /** Statut, montant ou pièce, à droite. */
  aside?: ReactNode;
  onOpen?: (() => void) | undefined;
  /** Une action discrète par ligne (« PDF », « Retirer ») ; le reste passe par la fiche. */
  action?: ReactNode;
}

interface RelatedListProps {
  title: string;
  items: RelatedItem[];
  /** Les premiers éléments, puis « Voir tout » (SLDS §5). */
  max?: number | undefined;
  viewAll?: { label: string; onClick: () => void } | undefined;
  empty: { title: string; body?: string | undefined; action?: ReactNode };
  actions?: ReactNode;
  meta?: ReactNode;
}

/** Liste associée (SLDS §5) : titre et effectif, quelques lignes, « Voir tout ». */
export function RelatedList({ title, items, max, viewAll, empty, actions, meta }: RelatedListProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = max && !expanded ? items.slice(0, max) : items;
  const hidden = items.length - shown.length;
  return (
    <Card
      title={`${title} (${items.length})`}
      meta={meta}
      actions={actions}
      flush
      footer={
        viewAll && items.length > 0 ? (
          <Button variant="base" onClick={viewAll.onClick}>
            {viewAll.label}
          </Button>
        ) : hidden > 0 ? (
          <Button variant="base" onClick={() => setExpanded(true)}>
            {t('list.showMore')} ({hidden})
          </Button>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState title={empty.title} {...(empty.body ? { body: empty.body } : {})} action={empty.action} />
      ) : (
        <ul className="related-list">
          {shown.map(item => (
            <li key={item.id} className="related-list__item">
              <div className="related-list__main">
                {item.onOpen ? <RecordLink onClick={item.onOpen}>{item.label}</RecordLink> : <span className="table__strong">{item.label}</span>}
                {item.meta ? <span className="related-list__meta">{item.meta}</span> : null}
              </div>
              {item.aside ? <div className="related-list__aside">{item.aside}</div> : null}
              {item.action ? <div className="related-list__action">{item.action}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
