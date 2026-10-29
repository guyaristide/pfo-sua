import { useListUsers } from '@/services/hooks/use-list-users';
import { useListRoles } from '@/services/hooks/use-list-roles';
import { UsersScreen } from '@/ui/screens/settings/UsersScreen';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { AdminOnly, useIsAdmin } from './AdminOnly';
import { useSettingsNavigation } from './settings-navigation';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { useInviteUser } from '@/services/hooks/use-invite-user';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { UserInviteScreen, emptyUserInviteForm, toUserInvitation, type UserInviteForm } from '@/ui/screens/settings/UserInviteScreen';
import { useDraft } from '../../use-draft';
import { useToast } from '../../toast-context';

export function UsersPage() {
  const fmt = useFormatters();
  const users = useListUsers();
  const roles = useListRoles();
  const isAdmin = useIsAdmin();
  const nav = useSettingsNavigation('users');
  return (
    <QueryState query={users}>
      {userRows => (
        <QueryState query={roles}>
          {roleRows => (
            <UsersScreen users={userRows} roles={roleRows} fmt={fmt} isAdmin={isAdmin} onInvite={() => void nav.navigate('/settings/users/new')} onOpenSettings={nav.onOpenSettings} />
          )}
        </QueryState>
      )}
    </QueryState>
  );
}

export function UserInvitePage() {
  const nav = useSettingsNavigation('users');
  const assets = useListAssets();
  return (
    <AdminOnly onBack={nav.onOpenSection}>
      <QueryState query={assets}>{assetRows => <UserInviteBody assets={assetRows} />}</QueryState>
    </AdminOnly>
  );
}

function UserInviteBody({ assets }: { assets: Parameters<typeof UserInviteScreen>[0]['assets'] }) {
  const nav = useSettingsNavigation('users');
  const toast = useToast();
  const draft = useDraft<UserInviteForm>('settings.users.invite', emptyUserInviteForm);
  const mutation = useInviteUser();
  return (
    <UserInviteScreen
      assets={assets}
      form={draft.value}
      onChange={draft.setValue}
      submitting={mutation.isPending}
      submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
      onSubmit={() =>
        mutation.mutate(toUserInvitation(draft.value), {
          onSuccess: user => {
            draft.finish();
            toast.notify({ tone: 'success', title: t('users.invited', { email: user.email }) });
            nav.onOpenSection();
          },
        })
      }
      onOpenSettings={nav.onOpenSettings}
      onOpenSection={nav.onOpenSection}
    />
  );
}
