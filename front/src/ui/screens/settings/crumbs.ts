import { t } from '@/i18n/t';
import type { Breadcrumb } from '@/ui/primitives';

/** Les deux premiers niveaux du fil d'Ariane des paramètres, construits une seule fois. */
export interface SettingsNavigation {
  onOpenSettings: () => void;
  onOpenSection: () => void;
}

export function settingsCrumbs(nav: SettingsNavigation, sectionLabel: string): Breadcrumb[] {
  return [
    { label: t('nav.settings'), onClick: nav.onOpenSettings },
    { label: sectionLabel, onClick: nav.onOpenSection },
  ];
}

export function settingsRootCrumb(onOpenSettings: () => void): Breadcrumb[] {
  return [{ label: t('nav.settings'), onClick: onOpenSettings }];
}
