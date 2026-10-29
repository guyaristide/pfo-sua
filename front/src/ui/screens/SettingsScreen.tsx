import type { SettingsOverview, SettingsSectionKey } from '@/services/contracts';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Button, Icon, PageHeader, type IconName } from '@/ui/primitives';

interface SettingsScreenProps {
  overview: SettingsOverview;
  isAdmin: boolean;
  onOpenSection: (key: SettingsSectionKey) => void;
}

const sections: Record<SettingsSectionKey, { icon: IconName; labelKey: MessageKey }> = {
  users: { icon: 'users', labelKey: 'settings.section.users' },
  'billing-items': { icon: 'tag', labelKey: 'settings.section.billingItems' },
  calendar: { icon: 'calendar', labelKey: 'settings.section.calendar' },
  'reminder-templates': { icon: 'bell', labelKey: 'settings.section.reminderTemplates' },
  'bank-accounts': { icon: 'bank', labelKey: 'settings.section.bankAccounts' },
  fees: { icon: 'percent', labelKey: 'settings.section.fees' },
};

/** Paramètres : les référentiels que l'application ne code jamais en dur (règle 6), par section. */
export function SettingsScreen({ overview, isAdmin, onOpenSection }: SettingsScreenProps) {
  return (
    <>
      <PageHeader object="settings" eyebrow={t('settings.subtitle')} title={t('settings.title')} />
      {isAdmin ? null : (
        <p className="card__meta">
          <Icon name="lock" size={12} /> {t('settings.readOnly')}
        </p>
      )}
      <div className="section-grid">
        {overview.sections.map(section => {
          const definition = sections[section.key];
          return (
            <section className="section-tile" key={section.key} aria-labelledby={`settings-${section.key}`}>
              <span className="object-icon object-icon--brand" aria-hidden="true">
                <Icon name={definition.icon} size={18} />
              </span>
              <div className="section-tile__body">
                <div className="section-tile__count">{section.count}</div>
                <h2 className="section-tile__title" id={`settings-${section.key}`}>
                  {t(definition.labelKey)}
                </h2>
                <div className="section-tile__detail">{section.detail}</div>
                <div>
                  <Button variant="neutral" onClick={() => onOpenSection(section.key)}>
                    {isAdmin ? t('settings.action.manage') : t('settings.action.view')}
                  </Button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
