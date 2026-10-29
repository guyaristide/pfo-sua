import { useNavigate } from 'react-router';
import { useGetReportsOverview } from '@/services/hooks/use-get-reports-overview';
import { useGenerateReportDrafts } from '@/services/hooks/use-report-actions';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ReportsScreen } from '@/ui/screens/ReportsScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function ReportsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useGetReportsOverview(scope.assetId);
  const canValidate = usePermission(PERMISSIONS.REPORT_VALIDATE);
  const generate = useGenerateReportDrafts();
  return (
    <QueryState query={query}>
      {overview => (
        <ReportsScreen
          overview={overview}
          fmt={fmt}
          canValidate={canValidate}
          onOpen={id => void navigate(`/reports/${encodeURIComponent(id)}`)}
          generating={generate.isPending}
          onGenerate={() =>
            generate.mutate(overview.currentPeriod, {
              onSuccess: result => toast.notify({ tone: 'success', title: t('report.generate.done', { count: result.created }) }),
              onError: error => toast.notify({ tone: 'danger', title: errorMessage(error) }),
            })
          }
        />
      )}
    </QueryState>
  );
}
