import { useState } from 'react';
import type { FeeSettings } from '@/services/contracts';
import { useGetFees } from '@/services/hooks/use-get-fees';
import { useSaveFees } from '@/services/hooks/use-save-fees';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { FeesFormScreen, FeesScreen, feesToForm, toFeesInput, type FeesForm } from '@/ui/screens/settings/FeesScreen';
import { QueryState } from '../../query-state';
import { useDraft } from '../../use-draft';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';
import { AdminOnly, useIsAdmin } from './AdminOnly';
import { useSettingsNavigation } from './settings-navigation';

export function FeesPage() {
  const fmt = useFormatters();
  const fees = useGetFees();
  const isAdmin = useIsAdmin();
  const nav = useSettingsNavigation('fees');
  return <QueryState query={fees}>{data => <FeesScreen fees={data} fmt={fmt} isAdmin={isAdmin} onEdit={() => void nav.navigate('/settings/fees/edit')} onOpenSettings={nav.onOpenSettings} />}</QueryState>;
}

export function FeesFormPage() {
  const nav = useSettingsNavigation('fees');
  const fees = useGetFees();
  return (
    <AdminOnly onBack={nav.onOpenSection}>
      <QueryState query={fees}>{data => <FeesFormBody fees={data} />}</QueryState>
    </AdminOnly>
  );
}

function FeesFormBody({ fees }: { fees: FeeSettings }) {
  const fmt = useFormatters();
  const nav = useSettingsNavigation('fees');
  const toast = useToast();
  const [initial] = useState(() => feesToForm(fees));
  const draft = useDraft<FeesForm>('settings.fees', initial);
  const mutation = useSaveFees();
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  return (
    <FeesFormScreen
      fees={fees}
      fmt={fmt}
      form={draft.value}
      onChange={draft.setValue}
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onSubmit={() =>
        mutation.mutate(toFeesInput(draft.value), {
          onSuccess: () => {
            draft.finish();
            toast.notify({ tone: 'success', title: t('settings.saved') });
            nav.onOpenSection();
          },
        })
      }
      onOpenSettings={nav.onOpenSettings}
      onOpenSection={nav.onOpenSection}
    />
  );
}
