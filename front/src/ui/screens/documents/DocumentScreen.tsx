import type { AssetSummary, DocumentDetail, DocumentKind, DocumentUploadInput, DocumentVersion, TenantOption } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { documentKindKey } from '@/shared/labels';
import { Button, Card, DataTable, Field, FileDrop, FormPage, Lookup, PageHeader, SelectInput, TextInput, issuesFrom, type Column } from '@/ui/primitives';

interface DocumentScreenProps {
  document: DocumentDetail;
  fmt: Formatters;
  canUpload: boolean;
  onDownload: () => void;
  onNewVersion: () => void;
  onOpenAsset: () => void;
  onOpenTenant: () => void;
  onBack: () => void;
}

export function DocumentScreen({ document, fmt, canUpload, onDownload, onNewVersion, onOpenAsset, onOpenTenant, onBack }: DocumentScreenProps) {
  const columns: Column<DocumentVersion>[] = [
    { key: 'version', header: t('document.versions.col.version'), numeric: true, render: v => v.version, width: '80px' },
    { key: 'date', header: t('document.versions.col.date'), render: v => fmt.shortDate(v.updatedAt) },
    { key: 'author', header: t('document.versions.col.author'), render: v => v.updatedBy },
    { key: 'note', header: t('document.versions.col.note'), render: v => v.note ?? '' },
  ];
  return (
    <>
      <PageHeader
        object="document"
        breadcrumbs={[{ label: t('nav.documents'), onClick: onBack }]}
        eyebrow={`${t(documentKindKey[document.kind])} · ${document.formatLabel} · ${document.sizeLabel}`}
        title={document.name}
        actions={
          <>
            {document.assetId ? (
              <Button variant="neutral" onClick={onOpenAsset}>
                {t('document.action.openAsset')}
              </Button>
            ) : null}
            {document.tenantId ? (
              <Button variant="neutral" onClick={onOpenTenant}>
                {t('document.action.openTenant')}
              </Button>
            ) : null}
            {canUpload ? (
              <Button variant="neutral" iconLeading="upload" onClick={onNewVersion}>
                {t('document.action.newVersion')}
              </Button>
            ) : null}
            <Button variant="brand" iconLeading="download" onClick={onDownload}>
              {t('document.action.download')}
            </Button>
          </>
        }
        highlights={[
          { label: t('document.highlight.kind'), value: t(documentKindKey[document.kind]) },
          { label: t('document.highlight.asset'), value: document.assetName },
          { label: t('document.highlight.tenant'), value: document.tenantName ?? '' },
          { label: t('documents.col.updated'), value: `${fmt.shortDate(document.updatedAt)} · ${t('documents.version', { version: document.version })}` },
        ]}
      />
      <Card title={t('document.versions.title')} flush>
        <DataTable caption={t('document.versions.title')} columns={columns} rows={document.versions} rowKey={v => String(v.version)} />
      </Card>
    </>
  );
}

export interface UploadForm {
  fileName: string;
  name: string;
  kind: DocumentKind;
  assetId: string;
  tenantId: string;
  note: string;
}

export const emptyUploadForm: UploadForm = { fileName: '', name: '', kind: 'other', assetId: '', tenantId: '', note: '' };

export function validateUpload(form: UploadForm, replacing: boolean): Partial<Record<keyof UploadForm, string>> {
  const errors: Partial<Record<keyof UploadForm, string>> = {};
  if (!form.fileName) errors.fileName = t('form.required');
  if (!form.name.trim()) errors.name = t('form.required');
  if (!replacing && !form.assetId) errors.assetId = t('form.required');
  return errors;
}

export function toUploadInput(form: UploadForm, replacesId: string | null): DocumentUploadInput {
  return { name: form.name.trim(), kind: form.kind, assetId: form.assetId || null, tenantId: form.tenantId || null, note: form.note.trim() || null, replacesId };
}

interface UploadDocumentScreenProps {
  replacing: DocumentDetail | null;
  assets: AssetSummary[];
  tenants: TenantOption[];
  form: UploadForm;
  onChange: (form: UploadForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onCancel: () => void;
  onBack: () => void;
}

export function UploadDocumentScreen({ replacing, assets, tenants, form, onChange, onSubmit, submitting, submitError, onCancel, onBack }: UploadDocumentScreenProps) {
  const errors = validateUpload(form, replacing !== null);
  const set = (changes: Partial<UploadForm>) => onChange({ ...form, ...changes });
  const assetName = assets.find(a => a.id === form.assetId)?.name;
  const tenantOptions = tenants.filter(tn => !assetName || tn.assetName === assetName);
  return (
    <FormPage
      object="document"
      breadcrumbs={[{ label: t('nav.documents'), onClick: onBack }]}
      title={replacing ? t('document.upload.versionTitle', { name: replacing.name }) : t('document.upload.title')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => `up-${key === 'fileName' ? 'file' : key === 'assetId' ? 'asset' : key}`, key => t(key === 'fileName' ? 'document.upload.file' : key === 'assetId' ? 'document.upload.asset' : 'document.upload.name'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
      saveLabel={t('document.upload.action')}
    >
      <Card>
        <Field id="up-file" label={t('document.upload.file')} required error={errors.fileName}>
          <FileDrop
            id="up-file"
            label={t('document.upload.drop')}
            accept=""
            fileName={form.fileName ? t('document.upload.chosen', { name: form.fileName }) : null}
            onFile={file => set({ fileName: file.name, name: form.name || file.name.replace(/\.[^.]+$/, '') })}
          />
        </Field>
        <div className="form-grid form-grid--spaced">
          <Field id="up-name" label={t('document.upload.name')} required error={errors.name}>
            <TextInput id="up-name" value={form.name} invalid={!!errors.name} onChange={e => set({ name: e.target.value })} />
          </Field>
          <Field id="up-kind" label={t('document.upload.kind')} required>
            <SelectInput id="up-kind" value={form.kind} onChange={e => set({ kind: e.target.value as DocumentKind })}>
              {(Object.keys(documentKindKey) as DocumentKind[]).map(kind => (
                <option key={kind} value={kind}>
                  {t(documentKindKey[kind])}
                </option>
              ))}
            </SelectInput>
          </Field>
          {replacing ? null : (
            <>
              <Field id="up-asset" label={t('document.upload.asset')} required error={errors.assetId}>
                <SelectInput id="up-asset" value={form.assetId} invalid={!!errors.assetId} onChange={e => set({ assetId: e.target.value, tenantId: '' })}>
                  <option value="">{t('document.upload.asset.placeholder')}</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field id="up-tenant" label={t('document.upload.tenant')}>
                <Lookup
                  id="up-tenant"
                  options={tenantOptions.map(tn => ({ id: tn.id, label: tn.name, meta: `${tn.assetName} · ${tn.lotCode}`, icon: 'user' }))}
                  value={form.tenantId}
                  disabled={!form.assetId}
                  placeholder={t('document.upload.tenant.placeholder')}
                  onChange={tenantId => set({ tenantId })}
                />
              </Field>
            </>
          )}
          <Field id="up-note" label={t('document.upload.note')}>
            <TextInput id="up-note" value={form.note} onChange={e => set({ note: e.target.value })} />
          </Field>
        </div>
      </Card>
    </FormPage>
  );
}
