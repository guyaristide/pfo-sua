import { useState } from 'react';
import { useParams } from 'react-router';
import type { BillingItem } from '@/services/contracts';
import { useListBillingItems } from '@/services/hooks/use-list-billing-items';
import { useSaveBillingItem } from '@/services/hooks/use-save-billing-item';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import {
  BillingItemFormScreen,
  BillingItemsScreen,
  billingItemToForm,
  emptyBillingItemForm,
  toBillingItemInput,
  type BillingItemForm,
} from '@/ui/screens/settings/BillingItemsScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useDraft } from '../../use-draft';
import { useToast } from '../../toast-context';
import { useFormatters } from '../../use-formatters';
import { AdminOnly, useIsAdmin } from './AdminOnly';
import { useSettingsNavigation } from './settings-navigation';

export function BillingItemsPage() {
  const fmt = useFormatters();
  const items = useListBillingItems();
  const isAdmin = useIsAdmin();
  const nav = useSettingsNavigation('billing-items');
  return (
    <QueryState query={items}>
      {rows => (
        <BillingItemsScreen
          items={rows}
          fmt={fmt}
          isAdmin={isAdmin}
          onNew={() => void nav.navigate('/settings/billing-items/new')}
          onEdit={id => void nav.navigate(`/settings/billing-items/${encodeURIComponent(id)}/edit`)}
          onOpenSettings={nav.onOpenSettings}
        />
      )}
    </QueryState>
  );
}

export function BillingItemFormPage() {
  const { itemId } = useParams();
  const nav = useSettingsNavigation('billing-items');
  const items = useListBillingItems();
  if (!itemId) {
    return (
      <AdminOnly onBack={nav.onOpenSection}>
        <BillingItemFormBody item={null} />
      </AdminOnly>
    );
  }
  return (
    <AdminOnly onBack={nav.onOpenSection}>
      <QueryState query={items}>
        {rows => {
          const item = rows.find(row => row.id === itemId);
          if (!item) {
            return (
              <div className="card">
                <EmptyState icon="tag" title={t('state.missingResource')} action={<Button variant="neutral" onClick={nav.onOpenSection}>{t('settings.action.cancel')}</Button>} />
              </div>
            );
          }
          return <BillingItemFormBody item={item} />;
        }}
      </QueryState>
    </AdminOnly>
  );
}

function BillingItemFormBody({ item }: { item: BillingItem | null }) {
  const nav = useSettingsNavigation('billing-items');
  const toast = useToast();
  const fmt = useFormatters();
  const [initial] = useState(() => (item ? billingItemToForm(item) : emptyBillingItemForm()));
  const draft = useDraft<BillingItemForm>(`settings.billing-item.${item?.id ?? 'new'}`, initial);
  const mutation = useSaveBillingItem(item?.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  return (
    <BillingItemFormScreen
      item={item}
      fmt={fmt}
      form={draft.value}
      onChange={draft.setValue}
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onSubmit={() =>
        mutation.mutate(toBillingItemInput(draft.value), {
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
