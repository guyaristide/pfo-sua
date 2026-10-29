import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { DashboardKpiKey, DashboardPeriod } from '@/services/contracts';
import { useSession } from '@/services/hooks/use-session';
import { useGetDashboard } from '@/services/hooks/use-get-dashboard';
import { dashboardKpisByRole, portfolioRoles } from '@/shared/roles';
import { t } from '@/i18n/t';
import { DashboardScreen } from '@/ui/screens/DashboardScreen';
import { EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';
import { targetPath } from '../targets';

/** La liste source de chaque indicateur (E0.2) : le lien « Voir… » du détail. */
const kpiSource: Record<DashboardKpiKey, string> = {
  occupancy: '/assets',
  vacancy: '/assets',
  leases: '/assets',
  recovery: '/billing',
  unpaid: '/arrears',
  'pre-litigation': '/arrears',
  collected: '/collections',
  cheques: '/collections/cheques',
  budget: '/budget',
};

export function DashboardPage() {
  const session = useSession();
  const scope = useScope();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<DashboardPeriod>({ kind: 'today', from: null, to: null });
  // Une période personnalisée n'interroge le serveur qu'une fois ses deux bornes saisies.
  const effective: DashboardPeriod = period.kind === 'custom' && (!period.from || !period.to) ? { kind: 'today', from: null, to: null } : period;
  const query = useGetDashboard(scope.assetId, effective);
  const role = session.user.role;
  return (
    <QueryState query={query}>
      {summary =>
        summary.assets.length === 0 ? (
          <EmptyState title={t('state.empty.title')} />
        ) : (
          <DashboardScreen
            firstName={session.user.firstName}
            summary={summary}
            fmt={fmt}
            kpiKeys={dashboardKpisByRole[role]}
            showPortfolio={portfolioRoles.includes(role)}
            today={new Date().toISOString().slice(0, 10)}
            period={period}
            onPeriod={setPeriod}
            onOpenKpiSource={key => void navigate(kpiSource[key])}
            onOpenAsset={assetId => void navigate(`/assets/${assetId}`)}
            onOpenTarget={target => void navigate(targetPath(target))}
            onOpenCalendar={() => void navigate('/settings/calendar')}
          />
        )
      }
    </QueryState>
  );
}
