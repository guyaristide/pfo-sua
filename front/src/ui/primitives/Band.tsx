import type { ReactNode } from 'react';

interface BandProps {
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: ReactNode;
}

/** Bandeau bleu clair sur trame PFO (prototype d'Elodie) : annonce l'étape en cours et ses actions. */
export function Band({ eyebrow, title, body, actions }: BandProps) {
  return (
    <section className="band state--trame">
      <div className="band__content">
        {eyebrow ? <div className="band__eyebrow">{eyebrow}</div> : null}
        <h2 className="band__title">{title}</h2>
        {body ? <p className="band__body">{body}</p> : null}
        {actions ? <div className="band__actions">{actions}</div> : null}
      </div>
    </section>
  );
}
