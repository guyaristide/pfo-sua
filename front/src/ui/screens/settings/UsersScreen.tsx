import type { AccessDomain, AccessLevel, RoleDefinition, UserRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { roleLabelKey } from '@/shared/roles';
import { userStatus } from '@/shared/status';
import { assetScopeLabel } from '@/shared/labels';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, ListBody, PageHeader, type Column } from '@/ui/primitives';
import { settingsRootCrumb } from './crumbs';

interface UsersScreenProps {
  users: UserRow[];
  roles: RoleDefinition[];
  fmt: Formatters;
  isAdmin: boolean;
  onInvite: () => void;
  onOpenSettings: () => void;
}

const domains: AccessDomain[] = ['referentials', 'assets', 'leases', 'finance', 'documents', 'reporting', 'validation'];
const domainKey: Record<AccessDomain, MessageKey> = {
  referentials: 'users.domain.referentials',
  assets: 'users.domain.assets',
  leases: 'users.domain.leases',
  finance: 'users.domain.finance',
  documents: 'users.domain.documents',
  reporting: 'users.domain.reporting',
  validation: 'users.domain.validation',
};
const accessKey: Record<AccessLevel, MessageKey> = {
  none: 'users.access.none',
  read: 'users.access.read',
  create: 'users.access.create',
  full: 'users.access.full',
  workflow: 'users.access.workflow',
};

/** Comptes de l'équipe et matrice des rôles de l'offre technique §IX ; la garde reste côté serveur (règle 14). */
export function UsersScreen({ users, roles, fmt, isAdmin, onInvite, onOpenSettings }: UsersScreenProps) {

  const columns: Column<UserRow>[] = [
    {
      key: 'user',
      header: t('users.col.user'),
      render: user => (
        <div>
          <div className="table__strong">
            {user.firstName} {user.lastName}
          </div>
          <div className="table__secondary">{user.email}</div>
        </div>
      ),
    },
    { key: 'role', header: t('users.col.role'), render: user => t(roleLabelKey[user.role]) },
    { key: 'scope', header: t('users.col.scope'), render: user => assetScopeLabel(user.assetScope) },
    { key: 'status', header: t('users.col.status'), render: user => <Badge tone={userStatus[user.status].tone}>{t(userStatus[user.status].labelKey)}</Badge> },
    {
      key: 'lastSeen',
      header: t('users.col.lastSeen'),
      render: user => (user.lastSeenAt ? fmt.shortDate(user.lastSeenAt) : <span className="table__secondary">{t('users.lastSeen.never')}</span>),
    },
  ];

  const matrixColumns: Column<RoleDefinition>[] = [
    { key: 'role', header: t('users.roles.col.role'), render: role => <span className="table__strong">{t(roleLabelKey[role.role])}</span> },
    ...domains.map(domain => ({
      key: domain,
      header: t(domainKey[domain]),
      render: (role: RoleDefinition) => <span className={`matrix__cell--${role.access[domain]}`}>{t(accessKey[role.access[domain]])}</span>,
    })),
  ];

  return (
    <>
      <PageHeader
        object="settings"
        breadcrumbs={settingsRootCrumb(onOpenSettings)}
        eyebrow={t('users.subtitle')}
        title={t('users.title')}
        actions={
          isAdmin ? (
            <Button variant="brand" iconLeading="plus" onClick={onInvite}>
              {t('users.action.invite')}
            </Button>
          ) : null
        }
      />
      <Card title={t('users.list.title')} flush>
        <ListBody
          rows={users}
          haystack={user => [user.firstName, user.lastName, user.email]}
          columns={columns}
          rowKey={user => user.id}
          caption={t('users.list.title')}
          footer={rows => [t('users.total', { count: rows.length }), '', '', '', '']}
          empty={<EmptyState icon="users" title={t('users.empty.title')} body={t('users.empty.body')} action={isAdmin ? <Button variant="neutral" onClick={onInvite}>{t('users.action.invite')}</Button> : null} />}
        />
      </Card>
      <Card title={t('users.roles.title')} meta={t('users.roles.meta')} flush className="matrix">
        <DataTable caption={t('users.roles.title')} columns={matrixColumns} rows={roles} rowKey={role => role.role} />
      </Card>
    </>
  );
}
