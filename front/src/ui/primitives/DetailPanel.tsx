import type { ReactNode } from 'react';
import { IconButton } from './Button';

interface DetailPanelProps {
  label: string;
  meta: string;
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

/** Panneau de détail d'une vue scindée (SLDS §4) : la ligne ouverte à droite de sa liste. */
export function DetailPanel({ label, meta, title, closeLabel, onClose, footer, children }: DetailPanelProps) {
  return (
    <aside className="detail-panel" aria-label={label}>
      <div className="detail-panel__header">
        <div>
          <div className="detail-panel__meta">{meta}</div>
          <h2 className="detail-panel__title">{title}</h2>
        </div>
        <IconButton icon="close" label={closeLabel} variant="base" onClick={onClose} />
      </div>
      <div className="detail-panel__body">{children}</div>
      {footer ? <div className="detail-panel__footer">{footer}</div> : null}
    </aside>
  );
}

/** Section titrée d'un panneau ou d'une carte : un vrai titre h3, pas un div en gras. */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <h3 className="detail-section__title">{title}</h3>
      {children}
    </section>
  );
}

/** Vue scindée : la liste, et le panneau de la ligne ouverte ; empilés sous 1100 px. */
export function SplitView({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className={detail ? 'split-view' : 'split-view split-view--single'}>
      <div className="split-view__list">{list}</div>
      {detail}
    </div>
  );
}
