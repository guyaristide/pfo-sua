import { useNavigate } from 'react-router';
import { useCreateAsset } from '@/services/hooks/use-create-asset';
import { useListBillingItems } from '@/services/hooks/use-list-billing-items';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { NewAssetScreen, emptyNewAssetDraft, toNewAssetInput, type NewAssetDraft, type NewAssetStep } from '@/ui/screens/NewAssetScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useDraft } from '../use-draft';
import { useToast } from '../toast-context';

/** Valeurs d'exemple du prototype « socle » (démo) : un extrait de société, un mandat, un état locatif. */
const samples = {
  owner: { name: 'Les Flamboyants', location: 'Cocody Riviera 3 · Abidjan', ownerName: 'SCI Les Flamboyants', registration: 'CI-ABJ-03-2019-B-11204', ownerAddress: 'Riviera 3, Cocody, Abidjan', representative: 'PFO Immobilier, mandataire' },
  mandate: { mandateReference: 'MG-FLAMB-2026', signedOn: '2026-11-01', durationYears: '3' },
  lots: [
    { building: 'A', code: 'A-101', type: 'offices', surface: '142', floor: '1' },
    { building: 'A', code: 'A-102', type: 'offices', surface: '138', floor: '1' },
    { building: 'B', code: 'B-101', type: 'shops', surface: '64', floor: 'RDC' },
  ],
} as const;

export function NewAssetPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const canCreate = usePermission(PERMISSIONS.ASSET_WRITE);
  const billingItems = useListBillingItems();
  const draft = useDraft<NewAssetDraft>('assets.new', emptyNewAssetDraft);
  const mutation = useCreateAsset();
  const back = () => void navigate('/assets');

  if (!canCreate) {
    return (
      <div className="card">
        <EmptyState icon="lock" title={t('settings.adminOnly')} action={<Button variant="neutral" onClick={back}>{t('asset.record.backToList')}</Button>} />
      </div>
    );
  }

  const useSample = (step: NewAssetStep) => {
    if (step === 'owner') draft.setValue({ ...draft.value, ...samples.owner });
    if (step === 'mandate') draft.setValue({ ...draft.value, ...samples.mandate });
    if (step === 'lots') draft.setValue({ ...draft.value, lots: samples.lots.map((lot, index) => ({ key: `sample-${index}`, ...lot })) });
  };
  const error = mutation.isError ? AppError.from(mutation.error) : null;

  return (
    <QueryState query={billingItems}>
      {items => (
        <NewAssetScreen
          draft={draft.value.billingItemCodes.length === 0 && draft.value.step === 'owner' ? { ...draft.value, billingItemCodes: items.filter(i => i.active).map(i => i.code) } : draft.value}
          billingItems={items}
          onDraftChange={draft.setValue}
          onUseSample={useSample}
          onSubmit={() =>
            mutation.mutate(toNewAssetInput(draft.value), {
              onSuccess: asset => {
                draft.finish();
                toast.notify({ tone: 'success', title: t('newAsset.created', { name: asset.name }) });
                void navigate(`/assets/${asset.id}`, { replace: true });
              },
            })
          }
          submitting={mutation.isPending}
          submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
          onKeepDraft={back}
          onDiscardDraft={() => {
            draft.discard();
            back();
          }}
          onBack={back}
        />
      )}
    </QueryState>
  );
}
