import { useNavigate, useParams } from 'react-router';
import type { AssetRecord } from '@/services/contracts';
import { useGetAssetRecord } from '@/services/hooks/use-get-asset-record';
import { useCreateTenant } from '@/services/hooks/use-create-tenant';
import { useServices } from '@/services/service-context';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { NewTenantScreen, emptyNewTenantDraft, toNewTenantInput, type NewTenantDraft } from '@/ui/screens/NewTenantScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useDraft } from '../use-draft';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function NewTenantPage() {
  const { assetId = '' } = useParams();
  const navigate = useNavigate();
  const canWrite = usePermission(PERMISSIONS.TENANT_WRITE);
  const record = useGetAssetRecord(assetId);
  if (!canWrite) {
    return (
      <div className="card">
        <EmptyState icon="lock" title={t('settings.adminOnly')} action={<Button variant="neutral" onClick={() => void navigate(`/assets/${assetId}`)}>{t('asset.record.backToList')}</Button>} />
      </div>
    );
  }
  return <QueryState query={record}>{asset => <NewTenantBody asset={asset} />}</QueryState>;
}

function NewTenantBody({ asset }: { asset: AssetRecord }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const { demo } = useServices();
  const draft = useDraft<NewTenantDraft>(`tenants.new.${asset.id}`, emptyNewTenantDraft);
  const mutation = useCreateTenant(asset.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  const vacant = asset.lots.filter(lot => lot.status === 'vacant');
  const openAsset = () => void navigate(`/assets/${encodeURIComponent(asset.id)}`);
  return (
    <NewTenantScreen
      assetName={asset.name}
      vacantLots={vacant}
      fmt={fmt}
      draft={draft.value}
      onDraftChange={draft.setValue}
      sampleAvailable={demo.enabled}
      onUseSample={() =>
        void demo.sampleLease(asset.id).then(sample => {
          if (!sample) return;
          draft.setValue({
            ...draft.value,
            step: 'check',
            name: sample.name,
            registration: sample.registration,
            contactName: sample.contactName,
            email: sample.email,
            lotCode: sample.lotCode || (vacant[0]?.code ?? ''),
            start: sample.lease.start,
            durationYears: String(sample.lease.durationYears),
            monthlyRent: String(sample.lease.monthlyRent),
            monthlyCharges: String(sample.lease.monthlyCharges),
            deposit: String(sample.lease.deposit),
            keyMoney: String(sample.lease.keyMoney),
            periodicity: sample.lease.periodicity,
            indexation: sample.lease.indexation,
          });
        })
      }
      onSubmit={() =>
        mutation.mutate(toNewTenantInput(draft.value), {
          onSuccess: account => {
            draft.finish();
            toast.notify({ tone: 'success', title: t('newTenant.created', { name: account.name }) });
            void navigate(`/tenants/${encodeURIComponent(account.id)}`, { replace: true });
          },
        })
      }
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onBack={() => void navigate('/assets')}
      onOpenAsset={openAsset}
    />
  );
}
