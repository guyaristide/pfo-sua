import type { StatementDetail, StatementEventKind } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { Button, Card, RelatedList, Timeline } from '@/ui/primitives';

const eventTone: Record<StatementEventKind, 'success' | 'warning' | undefined> = { validated: 'success', approved: 'success', sent: 'success', observation: 'warning', returned: 'warning', reopened: 'warning' };

/** Journal du relevé et versions du dossier mensuel (E2.11) : chaque version reste consultable. */
export function StatementHistory({ statement, fmt, onDownload }: { statement: StatementDetail; fmt: Formatters; onDownload: () => void }) {
  const versions = [...(statement.file ? [statement.file] : []), ...statement.fileVersions];
  return (
    <>
      <Card title={t('reconcile.history.title')} flush>
        <Timeline
          fmt={fmt}
          items={[...statement.journal].reverse().map(event => ({ id: event.id, date: event.date, title: event.title, detail: event.detail || undefined, meta: event.by, tone: eventTone[event.kind] }))}
        />
      </Card>
      {versions.length > 1 ? (
        <RelatedList
          title={t('reconcile.versions.title')}
          items={versions.map(version => ({
            id: String(version.version),
            label: t('reconcile.versions.row', { version: version.version, date: fmt.shortDate(version.validatedAt.slice(0, 10)) }),
            meta: version.changes > 0 ? t('reconcile.versions.changes', { count: version.changes }) : t('reconcile.versions.first'),
            action: (
              <Button variant="base" iconLeading="download" onClick={onDownload}>
                {t('reconcile.versions.download')}
              </Button>
            ),
          }))}
          empty={{ title: t('reconcile.versions.title') }}
        />
      ) : null}
    </>
  );
}
