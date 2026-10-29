import type { Formatters } from '@/shared/format/formatters';

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  detail?: string | undefined;
  /** Qui ou quoi : « Vincent C. ». */
  meta?: string | undefined;
  /** Un jour en retard ou un fait à surveiller se lit en couleur, toujours doublé d'un texte. */
  tone?: 'late' | 'warning' | 'success' | undefined;
  /** Un fait qui mène quelque part. */
  onOpen?: (() => void) | undefined;
  /** Texte d'état sous le détail : « En retard de 1 j ». */
  status?: string | undefined;
}

/** Frise d'historique (SLDS activity timeline) : le jour et le mois à gauche, le fait et son détail à droite. */
export function Timeline({ items, fmt }: { items: TimelineItem[]; fmt: Formatters }) {
  return (
    <>
      {items.map(item => {
        const { day, month } = fmt.dayMonth(item.date);
        const body = (
          <>
            <div>
              <div className={item.tone === 'late' ? 'timeline-item__day timeline-item__day--late' : 'timeline-item__day'}>{day}</div>
              <div className="timeline-item__month">{month}</div>
            </div>
            <div>
              <div className="timeline-item__title">{item.title}</div>
              {item.detail ? <div className="timeline-item__detail">{item.detail}</div> : null}
              {item.meta ? <div className="timeline-item__detail">{item.meta}</div> : null}
              {item.status ? <div className={`timeline-item__status timeline-item__status--${item.tone ?? 'neutral'}`}>{item.status}</div> : null}
            </div>
          </>
        );
        return item.onOpen ? (
          <button type="button" className="timeline-item timeline-item--link" key={item.id} onClick={item.onOpen}>
            {body}
          </button>
        ) : (
          <div className="timeline-item" key={item.id}>
            {body}
          </div>
        );
      })}
    </>
  );
}
