import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface StatProps {
  icon?: IconName;
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: { text: string; tone: 'good' | 'bad' | 'neutral' } | undefined;
}

export function Stat({ icon, label, value, unit, delta }: StatProps) {
  return (
    <div className="stat">
      <div className="stat__label">
        {icon ? <Icon name={icon} size={14} /> : null}
        {label}
      </div>
      <div className="stat__value">
        {value}
        {unit ? <span className="stat__unit">{unit}</span> : null}
      </div>
      {delta ? <div className={`stat__delta stat__delta--${delta.tone}`}>{delta.text}</div> : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="stat-row">{children}</div>;
}
