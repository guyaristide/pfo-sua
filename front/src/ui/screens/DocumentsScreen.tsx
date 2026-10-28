import { useState } from 'react';
import type { DocumentKind, DocumentRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Button, Card, DataTable, EmptyState, FilterPills, ListStatus, PageHeader, ShowMore, useListFilter, type Column } from '@/ui/primitives';

interface DocumentsScreenProps {
  documents: DocumentRow[];
  fmt: Formatters;
  canUpload: boolean;
  onOpen: (documentId: string) => void;
  onUpload: () => void;
}

type Filter = DocumentKind | 'all';

const kindLabelKey: Record<DocumentKind, MessageKey> = {
  lease: 'documents.kind.lease',
  report: 'documents.kind.report',
  invoice: 'documents.kind.invoice',
  statement: 'documents.kind.statement',
  minutes: 'documents.kind.minutes',
  other: 'documents.kind.other',
};

/** GED métier : classement par type, actif et locataire, versions (offre technique §III, D-09). */
export function DocumentsScreen({ documents, fmt, canUpload, onOpen, onUpload }: DocumentsScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const scoped = filter === 'all' ? documents : documents.filter(d => d.kind === filter);
  const list = useListFilter(scoped, row => [row.name, row.assetName, row.tenantName]);

  const columns: Column<DocumentRow>[] = [
    { key: 'name', header: t('documents.col.name'), render: row => <span className="table__primary">{row.name}</span> },
    { key: 'kind', header: t('documents.col.kind'), render: row => t(kindLabelKey[row.kind]) },
    { key: 'asset', header: t('documents.col.asset'), render: row => row.assetName },
    { key: 'tenant', header: t('documents.col.tenant'), render: row => row.tenantName ?? <span className="table__secondary">{t('documents.col.asset')}</span> },
    { key: 'updated', header: t('documents.col.updated'), render: row => fmt.shortDate(row.updatedAt) },
    { key: 'version', header: t('documents.col.version'), numeric: true, render: row => t('documents.version', { version: row.version }) },
    {
      key: 'actions',
      header: '',
      render: row => (
        <div className="table__actions">
          <Button variant="neutral" onClick={() => onOpen(row.id)}>
            {t('documents.action.open')}
          </Button>
        </div>
      ),
    },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('documents.filter.all') },
    ...(Object.keys(kindLabelKey) as DocumentKind[]).map(key => ({ key, label: t(kindLabelKey[key]) })),
  ];

  return (
    <>
      <PageHeader
        object="document"
        eyebrow={t('documents.subtitle')}
        title={t('documents.title')}
        actions={
          canUpload ? (
            <Button variant="brand" iconLeading="upload" onClick={onUpload}>
              {t('documents.action.upload')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <ListStatus
          count={list.filtered.length}
          search={list.search}
          onSearch={list.setSearch}
          filters={<FilterPills options={filters} value={filter} onChange={setFilter} label={t('documents.col.kind')} />}
        />
        {list.filtered.length === 0 ? (
          <EmptyState icon="folder" title={t('documents.empty.title')} body={t('documents.empty.body')} trame />
        ) : (
          <DataTable caption={t('documents.title')} columns={columns} rows={list.visible} rowKey={row => row.id} footer={[t('documents.total', { count: list.filtered.length }), '', '', '', '', '', '']} />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}
