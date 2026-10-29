import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useDownloadOwnerFile, useGetOwnerHome, useGetOwnerReport, useListOwnerDocuments, useListOwnerLots, useListOwnerReports } from '@/services/hooks/use-owner';
import { saveBlob } from '@/shared/export/save-file';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { OwnerHomeScreen } from '@/ui/screens/owner/OwnerHomeScreen';
import { OwnerReportScreen, OwnerReportsScreen } from '@/ui/screens/owner/OwnerReportsScreens';
import { OwnerDocumentsScreen, OwnerLotsScreen } from '@/ui/screens/owner/OwnerLotsScreens';
import type { OwnerPeriod } from '@/ui/screens/owner/owner-figures';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

/** Le téléchargement d'un PDF de l'espace : le navigateur l'enregistre, une erreur s'affiche en toast. */
function useOwnerDownload() {
  const toast = useToast();
  const download = useDownloadOwnerFile();
  const start = (documentId: string) =>
    download.mutate(documentId, {
      onSuccess: file => saveBlob(file.blob, file.fileName),
      onError: error => toast.notify({ tone: 'danger', title: errorMessage(error) }),
    });
  return { start, pending: download.isPending, pendingId: download.isPending ? (download.variables ?? null) : null, failed: download.isError };
}

export function OwnerHomePage() {
  const fmt = useFormatters();
  const navigate = useNavigate();
  const query = useGetOwnerHome();
  const [period, setPeriod] = useState<OwnerPeriod>({ kind: 'report', index: 0 });
  return (
    <QueryState query={query}>
      {home => (
        <OwnerHomeScreen
          home={home}
          fmt={fmt}
          period={period}
          onPeriod={setPeriod}
          onOpenReport={id => void navigate(`/owner/reports/${encodeURIComponent(id)}`)}
          onOpenReports={() => void navigate('/owner/reports')}
          onOpenLots={() => void navigate('/owner/lots')}
        />
      )}
    </QueryState>
  );
}

export function OwnerReportsPage() {
  const fmt = useFormatters();
  const navigate = useNavigate();
  const home = useGetOwnerHome();
  const reports = useListOwnerReports();
  const download = useOwnerDownload();
  return (
    <QueryState query={reports}>
      {list => (
        <OwnerReportsScreen
          profile={{ assetName: home.data?.profile.assetName ?? '', firstReportExpected: home.data?.profile.firstReportExpected ?? null }}
          reports={list}
          fmt={fmt}
          onOpen={id => void navigate(`/owner/reports/${encodeURIComponent(id)}`)}
          onDownload={download.start}
          downloading={download.pendingId}
        />
      )}
    </QueryState>
  );
}

export function OwnerReportPage() {
  const { reportId = '' } = useParams();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const home = useGetOwnerHome();
  const query = useGetOwnerReport(reportId);
  const download = useOwnerDownload();
  const back = () => void navigate('/owner/reports');
  return (
    <QueryState
      query={query}
      missing={
        <div className="card">
          <EmptyState icon="chart" title={t('state.missingResource')} action={<Button variant="neutral" onClick={back}>{t('owner.nav.reports')}</Button>} />
        </div>
      }
    >
      {report => (
        <OwnerReportScreen
          assetName={home.data?.profile.assetName ?? ''}
          report={report}
          fmt={fmt}
          onDownload={() => download.start(report.id)}
          downloading={download.pending}
          downloadFailed={download.failed}
          onBack={back}
        />
      )}
    </QueryState>
  );
}

export function OwnerLotsPage() {
  const fmt = useFormatters();
  const home = useGetOwnerHome();
  const lots = useListOwnerLots();
  return (
    <QueryState query={lots}>
      {list => <OwnerLotsScreen assetName={home.data?.profile.assetName ?? ''} lots={list} buildings={(home.data?.buildings ?? []).map(b => ({ key: b.key, name: b.name }))} fmt={fmt} />}
    </QueryState>
  );
}

export function OwnerDocumentsPage() {
  const home = useGetOwnerHome();
  const documents = useListOwnerDocuments();
  const download = useOwnerDownload();
  return (
    <QueryState query={documents}>
      {groups => <OwnerDocumentsScreen assetName={home.data?.profile.assetName ?? ''} groups={groups} onDownload={download.start} downloading={download.pendingId} />}
    </QueryState>
  );
}
