import { useNavigate } from 'react-router';
import { useGenerateReportDrafts } from '@/services/hooks/use-report-actions';
import { useToast } from '../toast-context';
import { useGetReportsOverview } from '@/services/hooks/use-get-reports-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ReportsScreen } from '@/ui/screens/ReportsScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function ReportsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const toast = useToast();
  const generate = useGenerateReportDrafts();
  const query = useGetReportsOverview(scope.assetId);
  const canValidate = usePermission(PERMISSIONS.REPORT_VALIDATE);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return (
    <ReportsScreen
      overview={query.data}
      fmt={fmt}
      canValidate={canValidate}
      onOpen={id => void navigate(`/reports/${encodeURIComponent(id)}`)}
      generating={generate.isPending}
      onGenerate={() =>
        generate.mutate(query.data.currentPeriod, {
          onSuccess: result => toast.notify({ tone: 'success', title: t('report.generate.done', { count: result.created }) }),
          onError: error => {
            const appError = AppError.from(error);
            toast.notify({ tone: 'danger', title: appError.userMessage ?? t('state.error.body', { reference: appError.reference }) });
          },
        })
      }
    />
  );
}
