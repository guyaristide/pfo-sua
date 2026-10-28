import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import type { SearchResult, SearchScope } from '@/services/contracts';
import { useSearch } from '@/services/hooks/use-search';
import { t } from '@/i18n/t';
import { useSession } from '@/services/hooks/use-session';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { useSignOut } from '@/services/hooks/use-sign-out';
import { useListNotifications, useMarkNotificationsRead } from '@/services/hooks/use-list-notifications';
import { searchResultPath, targetPath } from './targets';
import { useFormatters } from './use-formatters';
import { roleLabelKey } from '@/shared/roles';
import { GlobalHeader, Sidebar, type NavEntry } from '@/ui/shell';
import { useScope } from './scope-context';
import { routes } from './routes';


export function AppShellLayout() {
  const session = useSession();
  const assetsQuery = useListAssets();
  const scope = useScope();
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const notifications = useListNotifications();
  const markRead = useMarkNotificationsRead();
  const fmt = useFormatters();
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const search = useSearch(query, searchScope);
  const searchProps = useMemo(
    () => ({
      query,
      scope: searchScope,
      results: search.data ?? [],
      recent,
      onQueryChange: setQuery,
      onScopeChange: setSearchScope,
      onOpen: (kind: SearchResult['kind'], id: string, result: SearchResult) => {
        setRecent(current => [result, ...current.filter(r => !(r.kind === kind && r.id === id))].slice(0, 8));
        void navigate(searchResultPath(kind, id));
      },
      onSeeAll: () => void navigate(`/search?q=${encodeURIComponent(query.trim())}&scope=${encodeURIComponent(searchScope)}`),
    }),
    [query, searchScope, search.data, recent, navigate],
  );

  const entries: NavEntry[] = routes.map(route => ({
    object: route.object,
    href: route.path,
    active: route.path === '/' ? location.pathname === '/' : location.pathname.startsWith(route.path),
  }));

  const initials = `${session.user.firstName[0] ?? ''}${session.user.lastName[0] ?? ''}`.toUpperCase();
  const name = `${session.user.firstName} ${session.user.lastName}`;

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        {t('app.skipToContent')}
      </a>
      <GlobalHeader
        userInitials={initials}
        userName={name}
        userRoleLabel={t(roleLabelKey[session.user.role])}
        notifications={notifications.data ?? []}
        fmt={fmt}
        search={searchProps}
        onOpenNotification={target => void navigate(target ? targetPath(target) : '/')}
        onMarkNotificationsRead={() => markRead.mutate()}
        onOpenHelp={() => void navigate('/help')}
        onSignOut={() => signOut.mutate(undefined, { onSettled: () => void navigate('/login', { replace: true }) })}
      />
      <Sidebar
        entries={entries}
        assets={assetsQuery.data ?? []}
        selectedAssetId={scope.assetId}
        onSelectAsset={scope.setAssetId}
        user={{ initials, name: session.user.firstName, roleLabel: t(roleLabelKey[session.user.role]) }}
        renderLink={(entry, children, className) => (
          <NavLink to={entry.href} className={className} end={entry.href === '/'}>
            {children}
          </NavLink>
        )}
      />
      <main id="main" className="main">
        <Outlet />
      </main>
    </div>
  );
}
