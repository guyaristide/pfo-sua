import { useState } from 'react';
import type { ReportDetail, ReportTransition } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { reportStatus, type ReportStatus } from '@/shared/status';
import { exportCsv } from '@/shared/export/csv';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DockedFooter, Field, PageHeader, Path, TextInput, type PathStep } from '@/ui/primitives';

const steps: ReportStatus[] = ['draft', 'in-review', 'validated', 'signed'];

interface ReportScreenProps {
  report: ReportDetail;
  fmt: Formatters;
  canSubmit: boolean;
  canValidate: boolean;
  onTransition: (action: ReportTransition, note: string | null) => void;
  submitting: boolean;
  submitError: string | undefined;
  onOpenAsset: () => void;
  onBack: () => void;
}

/** Un CRG en six parties (procédure CRG v3), du brouillon à la signature. */
export function ReportScreen({ report, fmt, canSubmit, canValidate, onTransition, submitting, submitError, onOpenAsset, onBack }: ReportScreenProps) {
  const [note, setNote] = useState('');
  const period = t('period.quarter', { ...report.period });
  const pathSteps: PathStep<ReportStatus>[] = steps.map(key => ({ key, label: t(`report.step.${key}`) }));
  const act = (action: ReportTransition) => onTransition(action, note.trim() || null);
  const actions = (
    <>
      {report.status === 'draft' && canSubmit ? (
        <Button variant="brand" disabled={submitting} onClick={() => act('submit')}>
          {t('report.action.submit')}
        </Button>
      ) : null}
      {report.status === 'in-review' && canValidate ? (
        <>
          <Button variant="neutral" disabled={submitting} onClick={() => act('reopen')}>
            {t('report.action.reopen')}
          </Button>
          <Button variant="brand" disabled={submitting} onClick={() => act('validate')}>
            {t('report.action.validate')}
          </Button>
        </>
      ) : null}
      {report.status === 'validated' && canValidate ? (
        <>
          <Button variant="neutral" disabled={submitting} onClick={() => act('reopen')}>
            {t('report.action.reopen')}
          </Button>
          <Button variant="brand" disabled={submitting} onClick={() => act('sign')}>
            {t('report.action.sign')}
          </Button>
        </>
      ) : null}
    </>
  );
  return (
    <>
      <PageHeader
        object="report"
        breadcrumbs={[{ label: t('nav.reports'), onClick: onBack }]}
        eyebrow={report.stepDetail}
        title={t('report.title', { period, asset: report.assetName })}
        aside={<Path steps={pathSteps} current={report.status} label={t('report.pathLabel')} />}
        actions={
          <>
            <Button
              variant="neutral"
              iconLeading="download"
              onClick={() =>
                exportCsv(
                  `crg-${report.assetName}-${report.period.year}-T${report.period.quarter}`,
                  [
                    { header: t('report.sections.title'), value: section => t(`report.section.${section.key}`) },
                    { header: t('invoice.lines.col.amount'), value: section => section.amount },
                    { header: t('report.note'), value: section => section.detail },
                  ],
                  report.sections,
                )
              }
            >
              {t('report.action.export')}
            </Button>
            <Button variant="neutral" onClick={onOpenAsset}>
              {t('report.action.openAsset')}
            </Button>
          </>
        }
        highlights={[
          { label: t('report.highlight.transfer'), value: report.amountToTransfer === null ? t('report.section.pending') : fmt.money(report.amountToTransfer) },
          { label: t('report.highlight.due'), value: fmt.shortDate(report.dueDate) },
          { label: t('report.highlight.preparedBy'), value: report.preparedBy },
          { label: t('reports.col.status'), value: <Badge tone={reportStatus[report.status].tone}>{t(reportStatus[report.status].labelKey)}</Badge> },
        ]}
      />
      <div className="layout-two">
        <Card title={t('report.sections.title')} flush>
          <StatGrid report={report} fmt={fmt} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title={t('report.signatories.title')}>
            <ul className="check-list">
              {report.signatories.map(signatory => (
                <li key={signatory.role}>
                  <div style={{ flex: 1 }}>
                    <div className="check-list__title">{signatory.name}</div>
                    <div className="check-list__detail">{signatory.role}</div>
                  </div>
                  <Badge tone={signatory.signedOn ? 'success' : 'neutral'}>{signatory.signedOn ? t('report.signatories.signed', { date: fmt.shortDate(signatory.signedOn) }) : t('report.signatories.pending')}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card title={t('report.history.title')} flush>
            {report.history.map(event => {
              const { day, month } = fmt.dayMonth(event.date);
              return (
                <div className="timeline-item" key={event.id}>
                  <div>
                    <div className="timeline-item__day">{day}</div>
                    <div className="timeline-item__month">{month}</div>
                  </div>
                  <div>
                    <div className="timeline-item__title">{event.label}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
      {report.status !== 'signed' ? (
        <Card>
          <Field id="report-note" label={t('report.note')}>
            <TextInput id="report-note" value={note} onChange={e => setNote(e.target.value)} />
          </Field>
        </Card>
      ) : null}
      <DockedFooter tone={submitError ? 'danger' : 'neutral'} status={submitError ?? report.stepDetail} actions={actions} />
    </>
  );
}

function StatGrid({ report, fmt }: { report: ReportDetail; fmt: Formatters }) {
  return (
    <div className="stat-row" style={{ flexWrap: 'wrap' }}>
      {report.sections.map(section => (
        <div className="stat" key={section.key} style={{ flex: '1 1 45%' }}>
          <div className="stat__label">{t(`report.section.${section.key}`)}</div>
          <div className="stat__value" style={{ fontSize: 20 }}>
            {section.amount === null ? t('report.section.pending') : fmt.moneyPlain(section.amount)}
          </div>
          <div className="stat__delta stat__delta--neutral">{section.detail}</div>
        </div>
      ))}
    </div>
  );
}
