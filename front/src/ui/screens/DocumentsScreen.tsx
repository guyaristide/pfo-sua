import { useState } from 'react';
import type { DocumentKind, DocumentRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { documentKindKey as kindLabelKey } from '@/shared/labels';
import { Button, Card, EmptyState, ListBody, PageHeader, RecordLink, type Column } from '@/ui/primitives';

interface DocumentsScreenProps {
  documents: DocumentRow[];
  fmt: Formatters;
  canUpload: boolean;
  onOpen: (documentId: string) => void;
  onUpload: () => void;
}

type Filter = DocumentKind | 'all';

/** GED métier : classement par type, actif et locataire, versions (offre technique §III, D-09). */
export function DocumentsScreen({ documents, fmt, canUpload, onOpen, onUpload }: DocumentsScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const scoped = filter === 'all' ? documents : documents.filter(d => d.kind === filter);

  const columns: Column<DocumentRow>[] = [
    { key: 'name', header: t('documents.col.name'), render: row => <RecordLink onClick={() => onOpen(row.id)}>{row.name}</RecordLink>, sortValue: row => row.name },
    { key: 'kind', header: t('documents.col.kind'), render: row => t(kindLabelKey[row.kind]) },
    { key: 'asset', header: t('documents.col.asset'), render: row => row.assetName },
    { key: 'tenant', header: t('documents.col.tenant'), render: row => row.tenantName ?? <span className="table__secondary">{t('documents.col.asset')}</span> },
    { key: 'updated', header: t('documents.col.updated'), render: row => fmt.shortDate(row.updatedAt) },
    { key: 'version', header: t('documents.col.version'), numeric: true, render: row => t('documents.version', { version: row.version }) },
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
        <ListBody
          rows={scoped}
          haystack={row => [row.name, row.assetName, row.tenantName]}
          columns={columns}
          rowKey={row => row.id}
          rowActions={row => [{ label: t('documents.action.open'), onSelect: () => onOpen(row.id) }]}
          caption={t('documents.title')}
          filters={{ options: filters, value: filter, onChange: setFilter, label: t('documents.col.kind') }}
          footer={rows => [t('documents.total', { count: rows.length }), '', '', '', '', '']}
          empty={<EmptyState icon="folder" title={t('documents.empty.title')} body={t('documents.empty.body')} trame />}
        />
      </Card>
    </>
  );
}
