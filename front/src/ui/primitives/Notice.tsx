import type { ReactNode } from 'react';
import type { Tone } from '@/shared/status';

interface NoticeProps {
  tone: Extract<Tone, 'info' | 'warning' | 'danger' | 'success'>;
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Notification de section SLDS : un titre, un détail, parfois une action ; pour alerter dans un panneau. */
export function Notice({ tone, title, actions, children }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <div className="notice__body">
        <div className="notice__title">{title}</div>
        {children ? <div className="notice__detail">{children}</div> : null}
      </div>
      {actions ? <div className="notice__actions">{actions}</div> : null}
    </div>
  );
}
