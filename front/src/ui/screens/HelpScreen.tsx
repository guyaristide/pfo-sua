import type { NavigationTarget } from '@/services/contracts';
import { t } from '@/i18n/t';
import { Button, Card, Checklist, PageHeader, RecordLayout } from '@/ui/primitives';

const flows: {
  key: 'billing' | 'collections' | 'arrears' | 'reports' | 'budget';
  target: NavigationTarget;
}[] = [
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
      <RecordLayout
        main={
          <Card title={t('help.flows.title')}>
            <Checklist
              items={flows.map(flow => ({
                id: flow.key,
                tone: 'step' as const,
                title: t(`help.flow.${flow.key}`),
                action: (
                  <Button variant="base" onClick={() => onOpen(flow.target)}>
                    {t('help.flows.open')}
                  </Button>
                ),
              }))}
            />
          </Card>
        }
        aside={
          <Card title={t('help.support.title')}>
            <p>{t('help.support.body')}</p>
            <a href={`mailto:${t('help.support.email')}`}>{t('help.support.email')}</a>
          </Card>
        }
      />
    </>
  );
}
