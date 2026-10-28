import type { SearchKind, SearchResult } from '@/services/contracts';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, type Column } from '@/ui/primitives';

interface SearchScreenProps {
  query: string;
  results: SearchResult[];
  onOpen: (kind: SearchKind, id: string) => void;
}

const kindObject = { asset: 'asset', tenant: 'asset', invoice: 'invoice', document: 'document' } as const;

export function SearchScreen({ query, results, onOpen }: SearchScreenProps) {
  const columns: Column<SearchResult>[] = [
    { key: 'kind', header: '', width: '120px', render: row => <Badge tone="neutral">{t(`search.kind.${row.kind}`)}</Badge> },
    {
      key: 'title',
      header: t('search.title', { query }),
      render: row => (
        <div>
          <div className="table__primary">{row.title}</div>
          <div className="table__secondary">{row.detail}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: row => (
        <div className="table__actions">
          <Button variant="neutral" onClick={() => onOpen(row.kind, row.id)}>
            {t('search.open')}
          </Button>
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader object={kindObject.asset} eyebrow={t('search.subtitle')} title={t('search.title', { query })} />
      <Card meta={results.length === 1 ? t('search.count.one') : t('search.count', { count: results.length })} flush>
        {results.length === 0 ? (
          <EmptyState icon="search" title={t('search.empty.title')} body={t('search.empty.body')} />
        ) : (
          <DataTable caption={t('search.title', { query })} columns={columns} rows={results} rowKey={row => `${row.kind}-${row.id}`} />
        )}
      </Card>
    </>
  );
}
