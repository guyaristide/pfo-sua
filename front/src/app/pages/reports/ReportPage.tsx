import { useNavigate, useParams } from 'react-router';
import { useGetReport } from '@/services/hooks/use-get-report';
import { useReportTransition } from '@/services/hooks/use-report-actions';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ReportScreen } from '@/ui/screens/reports/ReportScreen';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

export function ReportPage() {
  const { reportId = '' } = useParams();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const query = useGetReport(reportId);
  const canSubmit = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const canValidate = usePermission(PERMISSIONS.REPORT_VALIDATE);
  const mutation = useReportTransition(reportId);
  return (
    <QueryState query={query}>
      {report => (
        <ReportScreen
          report={report}
          fmt={fmt}
          canSubmit={canSubmit}
          canValidate={canValidate}
          onTransition={(action, note) => mutation.mutate({ action, note }, { onSuccess: () => toast.notify({ tone: 'success', title: t('report.transition.done') }) })}
          submitting={mutation.isPending}
          submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
          onOpenAsset={() => void navigate(`/assets/${encodeURIComponent(report.assetId)}`)}
          onBack={() => void navigate('/reports')}
        />
      )}
    </QueryState>
  );
}
