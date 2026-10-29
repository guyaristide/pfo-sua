import type { CampaignPreview, InvoiceRow, Period } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import {AmountList, Button, Card, DockedFooter, EmptyState, Field, PageHeader, SelectInput, Stat, StatRow } from '@/ui/primitives';

interface CampaignScreenProps {
  period: Period;
  options: Period[];
  preview: CampaignPreview | null;
  fmt: Formatters;
  onPeriodChange: (period: Period) => void;
  onPrepare: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onBack: () => void;
}

const periodKey = (p: Period) => `${p.year}-${p.quarter}`;

/** Préparer la campagne trimestrielle : choisir la période, voir ce qui sera facturé, générer. */
export function CampaignScreen({ period, options, preview, fmt, onPeriodChange, onPrepare, submitting, submitError, onBack }: CampaignScreenProps) {
  const label = t('period.quarter', { ...period });
  return (
    <>
      <PageHeader object="invoice" breadcrumbs={[{ label: t('nav.billing'), onClick: onBack }]} eyebrow={t('campaign.subtitle')} title={t('campaign.title')} />
      <Card>
        <div className="form-grid">
          <Field id="campaign-period" label={t('campaign.field.period')} required>
            <SelectInput id="campaign-period" value={periodKey(period)} onChange={e => onPeriodChange(options.find(o => periodKey(o) === e.target.value) ?? period)}>
              {options.map(option => (
                <option key={periodKey(option)} value={periodKey(option)}>
                  {t('period.quarter', { ...option })}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Card>
      {preview ? (
        <Card title={t('billing.campaign.title', { period: label })} flush>
          <StatRow>
            <Stat label={t('campaign.preview.leases')} value={preview.leaseCount} />
            <Stat label={t('campaign.preview.amount')} value={fmt.moneyCompact(preview.estimatedAmount)} />
            <Stat label={t('campaign.preview.issue')} value={fmt.shortDate(preview.issueDeadline)} />
            <Stat label={t('campaign.preview.due')} value={fmt.shortDate(preview.dueDate)} />
          </StatRow>
          {preview.alreadyPrepared ? <div className="card__footer card__meta">{t('campaign.alreadyPrepared')}</div> : null}
        </Card>
      ) : null}
      <DockedFooter
        tone={submitError ? 'danger' : 'neutral'}
        status={submitError ?? (preview?.alreadyPrepared ? t('campaign.alreadyPrepared') : '')}
        actions={
          <>
            <Button variant="neutral" onClick={onBack}>
              {t('settings.action.cancel')}
            </Button>
            <Button variant="brand" disabled={submitting || !preview || preview.alreadyPrepared} onClick={onPrepare}>
              {t('campaign.action.prepare')}
            </Button>
          </>
        }
      />
    </>
  );
}

interface IssueScreenProps {
  invoices: InvoiceRow[];
  fmt: Formatters;
  onIssue: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onBack: () => void;
}

/** Émettre toutes les factures contrôlées du périmètre, en une confirmation. */
export function IssueScreen({ invoices, fmt, onIssue, submitting, submitError, onBack }: IssueScreenProps) {
  const checked = invoices.filter(i => i.status === 'to-check');
  const total = checked.reduce((sum, i) => sum + i.amount, 0);
  return (
    <>
      <PageHeader object="invoice" breadcrumbs={[{ label: t('nav.billing'), onClick: onBack }]} title={t('campaign.issue.title')} />
      <Card>
        {checked.length === 0 ? (
          <EmptyState icon="invoice" title={t('campaign.issue.none')} trame action={<Button variant="neutral" onClick={onBack}>{t('nav.billing')}</Button>} />
        ) : (
          <AmountList
            lines={checked.map(invoice => ({ label: `${invoice.tenantName} · ${invoice.assetName} · ${fmt.monthYear(invoice.periodStart)}`, value: fmt.moneyPlain(invoice.amount) }))}
            total={{ label: t('campaign.issue.total', { count: checked.length }), value: fmt.money(total) }}
          />
        )}
      </Card>
      <DockedFooter
        tone={submitError ? 'danger' : 'neutral'}
        status={submitError ?? t('campaign.issue.body', { count: checked.length, amount: fmt.money(total) })}
        actions={
          <>
            <Button variant="neutral" onClick={onBack}>
              {t('settings.action.cancel')}
            </Button>
            <Button variant="brand" disabled={submitting || checked.length === 0} onClick={onIssue}>
              {t('campaign.issue.action', { count: checked.length })}
            </Button>
          </>
        }
      />
    </>
  );
}
