import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  flush?: boolean;
  children: ReactNode;
  className?: string;
  /** Ancre d'un sommaire : l'identifiant porte sur la section, son titre en tête. */
  id?: string | undefined;
}

export function Card({ title, meta, actions, footer, flush = false, children, className, id }: CardProps) {
  return (
    <section className={['card', className].filter(Boolean).join(' ')} id={id}>
      {title || actions ? (
        <header className="card__header">
          <div>
            {title ? <h2 className="card__title">{title}</h2> : null}
            {meta ? <div className="card__meta">{meta}</div> : null}
          </div>
          {actions ? <div className="card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? 'card__body card__body--flush' : 'card__body'}>{children}</div>
      {footer ? <footer className="card__footer">{footer}</footer> : null}
    </section>
  );
}
