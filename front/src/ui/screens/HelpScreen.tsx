import type { NavigationTarget } from '@/services/contracts';
import { t } from '@/i18n/t';
import { Button, Card, PageHeader } from '@/ui/primitives';

const flows: { key: 'billing' | 'collections' | 'arrears' | 'reports' | 'budget'; target: NavigationTarget }[] = [
  { key: 'billing', target: 'invoice' },
  { key: 'collections', target: 'collection' },
  { key: 'arrears', target: 'arrears' },
  { key: 'reports', target: 'report' },
  { key: 'budget', target: 'budget' },
];

export function HelpScreen({ onOpen }: { onOpen: (target: NavigationTarget) => void }) {
  return (
    <>
      <PageHeader object="settings" eyebrow={t('help.subtitle')} title={t('help.title')} />
      <div className="layout-two">
        <Card title={t('help.flows.title')}>
          <ul className="check-list">
            {flows.map(flow => (
              <li key={flow.key} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="check-list__detail" style={{ color: 'var(--text-primary)' }}>{t(`help.flow.${flow.key}`)}</span>
                <Button variant="base" onClick={() => onOpen(flow.target)}>
                  {t('help.flows.open')}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t('help.support.title')}>
          <p>{t('help.support.body')}</p>
          <a href={`mailto:${t('help.support.email')}`}>{t('help.support.email')}</a>
        </Card>
      </div>
    </>
  );
}
