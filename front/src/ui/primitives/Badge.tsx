import type { ReactNode } from 'react';
import type { Tone } from '@/shared/status';

/** Badge plein, sans point : le texte porte toujours le sens (SLDS §7.5). */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
