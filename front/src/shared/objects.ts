import type { MessageKey } from '@/i18n/fr';
import type { IconName } from '@/ui/primitives/Icon';

/**
 * Registre des objets métier (SLDS §3) : un pictogramme et une couleur par objet, identiques partout.
 * Aucune couleur d'objet ne s'écrit ailleurs.
 */
export interface ObjectDefinition {
  icon: IconName;
  color: string;
  labelKey: MessageKey;
}

export const objects = {
  dashboard: { icon: 'dashboard', color: 'var(--primary-600)', labelKey: 'nav.dashboard' },
  asset: { icon: 'building', color: 'var(--primary-600)', labelKey: 'nav.assets' },
  invoice: { icon: 'invoice', color: 'var(--tertiary-600)', labelKey: 'nav.billing' },
  collection: { icon: 'payments', color: 'var(--success-600)', labelKey: 'nav.collections' },
  arrears: { icon: 'bell', color: 'var(--danger-600)', labelKey: 'nav.arrears' },
  report: { icon: 'chart', color: 'var(--info-600)', labelKey: 'nav.reports' },
  budget: { icon: 'tag', color: 'var(--warning-600)', labelKey: 'nav.budget' },
  document: { icon: 'folder', color: 'var(--secondary-600)', labelKey: 'nav.documents' },
  settings: { icon: 'settings', color: 'var(--neutral-600)', labelKey: 'nav.settings' },
} as const satisfies Record<string, ObjectDefinition>;

export type ObjectKey = keyof typeof objects;
