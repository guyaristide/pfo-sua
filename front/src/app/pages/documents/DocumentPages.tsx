import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { DocumentDetail } from '@/services/contracts';
import { useGetDocument } from '@/services/hooks/use-get-document';
import { useUploadDocument } from '@/services/hooks/use-upload-document';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { useListTenants } from '@/services/hooks/use-list-tenants';
import { useServices } from '@/services/service-context';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { DocumentScreen, UploadDocumentScreen, emptyUploadForm, toUploadInput, type UploadForm } from '@/ui/screens/documents/DocumentScreen';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

const message = (error: unknown) => {
  const appError = AppError.from(error);
  return appError.userMessage ?? t('state.error.body', { reference: appError.reference });
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function DocumentPage() {
  const { documentId = '' } = useParams();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const { documents } = useServices();
  const query = useGetDocument(documentId);
  const canUpload = usePermission(PERMISSIONS.ASSET_WRITE);
  return (
    <QueryState query={query}>
      {doc => (
        <DocumentScreen
          document={doc}
          fmt={fmt}
          canUpload={canUpload}
          onDownload={() =>
            void documents
              .download(doc.id)
              .then(blob => saveBlob(blob, `${doc.name}.${doc.formatLabel.toLowerCase()}`))
              .catch(error => toast.notify({ tone: 'danger', title: message(error) }))
          }
          onNewVersion={() => void navigate(`/documents/${encodeURIComponent(doc.id)}/version`)}
          onOpenAsset={() => void navigate(`/assets/${encodeURIComponent(doc.assetId ?? '')}`)}
          onOpenTenant={() => void navigate(`/tenants/${encodeURIComponent(doc.tenantId ?? '')}`)}
          onBack={() => void navigate('/documents')}
        />
      )}
    </QueryState>
  );
}

export function UploadDocumentPage() {
  const { documentId } = useParams();
  const assets = useListAssets();
  const tenants = useListTenants();
  const existing = useGetDocument(documentId ?? '');
  const body = (replacing: DocumentDetail | null) => (
    <QueryState query={assets}>
      {assetRows => <QueryState query={tenants}>{tenantRows => <UploadBody replacing={replacing} assets={assetRows} tenants={tenantRows} />}</QueryState>}
    </QueryState>
  );
  if (!documentId) return body(null);
  return <QueryState query={existing}>{doc => body(doc)}</QueryState>;
}

function UploadBody({ replacing, assets, tenants }: { replacing: DocumentDetail | null; assets: Parameters<typeof UploadDocumentScreen>[0]['assets']; tenants: Parameters<typeof UploadDocumentScreen>[0]['tenants'] }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<UploadForm>(replacing ? { ...emptyUploadForm, name: replacing.name, kind: replacing.kind } : emptyUploadForm);
  const mutation = useUploadDocument();
  const back = () => void navigate(replacing ? `/documents/${encodeURIComponent(replacing.id)}` : '/documents');
  return (
    <UploadDocumentScreen
      replacing={replacing}
      assets={assets}
      tenants={tenants}
      form={form}
      onChange={setForm}
      onSubmit={() =>
        mutation.mutate(toUploadInput(form, replacing?.id ?? null), {
          onSuccess: doc => {
            toast.notify({ tone: 'success', title: t('document.uploaded') });
            void navigate(`/documents/${encodeURIComponent(doc.id)}`, { replace: true });
          },
        })
      }
      submitting={mutation.isPending}
      submitError={mutation.isError ? message(mutation.error) : undefined}
      onCancel={back}
      onBack={() => void navigate('/documents')}
    />
  );
}
