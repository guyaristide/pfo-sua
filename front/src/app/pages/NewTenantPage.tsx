import { useNavigate, useParams } from 'react-router';
import type { AssetRecord } from '@/services/contracts';
import { useGetAssetRecord } from '@/services/hooks/use-get-asset-record';
import { useCreateTenant } from '@/services/hooks/use-create-tenant';
import { useServices } from '@/services/service-context';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { NewTenantScreen, draftFromLease, emptyNewTenantDraft, toNewTenantInput, type NewTenantDraft } from '@/ui/screens/NewTenantScreen';
import { QueryState } from '../query-state';
import { RequirePermission } from '../require-permission';
import { useDraft } from '../use-draft';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function NewTenantPage() {
  const { assetId = '' } = useParams();
  const navigate = useNavigate();
  const record = useGetAssetRecord(assetId);
  return (
    <RequirePermission permission={PERMISSIONS.TENANT_WRITE} onBack={() => void navigate(`/assets/${assetId}`)} backLabel={t('asset.record.backToList')}>
      <QueryState query={record}>{asset => <NewTenantBody asset={asset} />}</QueryState>
    </RequirePermission>
  );
}

function NewTenantBody({ asset }: { asset: AssetRecord }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const { demo } = useServices();
  const draft = useDraft<NewTenantDraft>(`tenants.new.${asset.id}`, emptyNewTenantDraft);
  const mutation = useCreateTenant(asset.id);
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
          if (sample) draft.setValue(draftFromLease(draft.value, sample, vacant[0]?.code ?? ''));
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
      submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
      onBack={() => void navigate('/assets')}
      onOpenAsset={openAsset}
    />
  );
}
