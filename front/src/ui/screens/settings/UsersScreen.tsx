import type { AccessDomain, AccessLevel, RoleDefinition, UserRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { roleLabelKey } from '@/shared/roles';
import { userStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, ListStatus, PageHeader, ShowMore, useListFilter, type Column } from '@/ui/primitives';
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

export function scopeLabel(scope: 'all' | string[]): string {
  return scope === 'all' ? t('settings.scope.all') : scope.length === 1 ? scope[0]! : t('settings.scope.some', { count: scope.length });
}

/** Comptes de l'équipe et matrice des rôles de l'offre technique §IX ; la garde reste côté serveur (règle 14). */
export function UsersScreen({ users, roles, fmt, isAdmin, onInvite, onOpenSettings }: UsersScreenProps) {
  const list = useListFilter(users, user => [user.firstName, user.lastName, user.email]);

  const columns: Column<UserRow>[] = [
    {
      key: 'user',
      header: t('users.col.user'),
      render: user => (
        <div>
          <div className="table__primary">
            {user.firstName} {user.lastName}
          </div>
          <div className="table__secondary">{user.email}</div>
        </div>
      ),
    },
    { key: 'role', header: t('users.col.role'), render: user => t(roleLabelKey[user.role]) },
    { key: 'scope', header: t('users.col.scope'), render: user => scopeLabel(user.assetScope) },
    { key: 'status', header: t('users.col.status'), render: user => <Badge tone={userStatus[user.status].tone}>{t(userStatus[user.status].labelKey)}</Badge> },
    {
      key: 'lastSeen',
      header: t('users.col.lastSeen'),
      render: user => (user.lastSeenAt ? fmt.shortDate(user.lastSeenAt) : <span className="table__secondary">{t('users.lastSeen.never')}</span>),
    },
  ];

  const matrixColumns: Column<RoleDefinition>[] = [
    { key: 'role', header: t('users.roles.col.role'), render: role => <span className="table__primary">{t(roleLabelKey[role.role])}</span> },
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
        <ListStatus count={list.filtered.length} search={list.search} onSearch={list.setSearch} />
        {list.filtered.length === 0 ? (
          <EmptyState icon="users" title={t('users.empty.title')} body={t('users.empty.body')} />
        ) : (
          <DataTable caption={t('users.list.title')} columns={columns} rows={list.visible} rowKey={user => user.id} footer={[t('users.total', { count: list.filtered.length }), '', '', '', '']} />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
      <Card title={t('users.roles.title')} meta={t('users.roles.meta')} flush className="matrix">
        <DataTable caption={t('users.roles.title')} columns={matrixColumns} rows={roles} rowKey={role => role.role} />
      </Card>
    </>
  );
}
