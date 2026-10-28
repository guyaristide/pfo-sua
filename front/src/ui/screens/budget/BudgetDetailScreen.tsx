import type { BudgetDetail, BudgetLine, ReestimateInput } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { budgetStatus } from '@/shared/status';
import { exportCsv } from '@/shared/export/csv';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, Field, FormPage, NumberInput, PageHeader, TextInput, type Column , issuesFrom } from '@/ui/primitives';

const categoryLabel = (line: BudgetLine) => (line.category === 'common' ? t('budget.category.common') : t('budget.category.special', { building: line.building ?? '' }));

/** Une seule formule pour le budget de référence d'une ligne : réestimé s'il existe, sinon initial. */
export function referenceBudget(line: BudgetLine): number {
  return line.reestimated ?? line.budget;
}

interface BudgetDetailScreenProps {
  budget: BudgetDetail;
  fmt: Formatters;
  canValidate: boolean;
  onReestimate: () => void;
  onOpenAsset: () => void;
  onBack: () => void;
}

export function BudgetDetailScreen({ budget, fmt, canValidate, onReestimate, onOpenAsset, onBack }: BudgetDetailScreenProps) {
  const columns: Column<BudgetLine>[] = [
    { key: 'label', header: t('budget.lines.col.label'), render: line => <span className="table__primary">{line.label}</span> },
    { key: 'category', header: t('budget.lines.col.category'), render: line => categoryLabel(line) },
    { key: 'budget', header: t('budget.lines.col.budget'), numeric: true, render: line => fmt.moneyPlain(line.budget) },
    { key: 'reestimated', header: t('budget.lines.col.reestimated'), numeric: true, render: line => (line.reestimated === null ? '' : fmt.moneyPlain(line.reestimated)) },
    { key: 'realised', header: t('budget.lines.col.realised'), numeric: true, render: line => fmt.moneyPlain(line.realised) },
    { key: 'variance', header: t('budget.lines.col.variance'), numeric: true, render: line => fmt.moneyPlain(referenceBudget(line) - line.realised) },
  ];
  const totals = budget.lines.reduce((acc, line) => ({ budget: acc.budget + line.budget, reestimated: acc.reestimated + (line.reestimated ?? 0), realised: acc.realised + line.realised, reference: acc.reference + referenceBudget(line) }), { budget: 0, reestimated: 0, realised: 0, reference: 0 });
  const rate = totals.reference > 0 ? totals.realised / totals.reference : 0;
  return (
    <>
      <PageHeader
        object="budget"
        breadcrumbs={[{ label: t('nav.budget'), onClick: onBack }]}
        eyebrow={budget.detail}
        title={t('budget.detail.title', { year: budget.year, asset: budget.assetName })}
        actions={
          <>
            <Button
              variant="neutral"
              iconLeading="download"
              onClick={() =>
                exportCsv(
                  `budget-${budget.assetName}-${budget.year}`,
                  [
                    { header: t('budget.lines.col.label'), value: line => line.label },
                    { header: t('budget.lines.col.category'), value: line => categoryLabel(line) },
                    { header: t('budget.lines.col.budget'), value: line => line.budget },
                    { header: t('budget.lines.col.reestimated'), value: line => line.reestimated },
                    { header: t('budget.lines.col.realised'), value: line => line.realised },
                  ],
                  budget.lines,
                )
              }
            >
              {t('budget.action.export')}
            </Button>
            <Button variant="neutral" onClick={onOpenAsset}>
              {t('budget.action.openAsset')}
            </Button>
            {canValidate && budget.status !== 'settled' ? (
              <Button variant="brand" onClick={onReestimate}>
                {t('budget.action.reestimate')}
              </Button>
            ) : null}
          </>
        }
        highlights={[
          { label: t('budget.highlight.budget'), value: fmt.money(totals.reference) },
          { label: t('budget.highlight.realised'), value: fmt.money(totals.realised) },
          { label: t('budget.highlight.rate'), value: fmt.percent(rate) },
          { label: t('budget.highlight.settlement'), value: <span>{fmt.shortDate(budget.settlementDeadline)} <Badge tone={budgetStatus[budget.status].tone}>{t(budgetStatus[budget.status].labelKey)}</Badge></span> },
        ]}
      />
      <Card title={t('budget.lines.title')} flush>
        <DataTable
          caption={t('budget.lines.title')}
          columns={columns}
          rows={budget.lines}
          rowKey={line => line.id}
          footer={[t('budget.total', { count: budget.lines.length }), '', fmt.moneyPlain(totals.budget), totals.reestimated ? fmt.moneyPlain(totals.reestimated) : '', fmt.moneyPlain(totals.realised), fmt.moneyPlain(totals.reference - totals.realised)]}
        />
      </Card>
    </>
  );
}

export interface ReestimateForm {
  amounts: Record<string, string>;
  note: string;
}

export function reestimateFormFrom(budget: BudgetDetail): ReestimateForm {
  return { amounts: Object.fromEntries(budget.lines.map(line => [line.id, String(referenceBudget(line))])), note: '' };
}

export function validateReestimate(form: ReestimateForm): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [id, value] of Object.entries(form.amounts)) if (!/^\d+$/.test(value.trim())) errors[id] = t('form.invalidAmount');
  return errors;
}

export function toReestimateInput(form: ReestimateForm): ReestimateInput {
  return { lines: Object.entries(form.amounts).map(([id, value]) => ({ id, reestimated: Number(value) })), note: form.note.trim() || null };
}

interface ReestimateScreenProps {
  budget: BudgetDetail;
  fmt: Formatters;
  form: ReestimateForm;
  onChange: (form: ReestimateForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onCancel: () => void;
  onBack: () => void;
}

export function ReestimateScreen({ budget, fmt, form, onChange, onSubmit, submitting, submitError, onCancel, onBack }: ReestimateScreenProps) {
  const errors = validateReestimate(form);
  const total = Object.values(form.amounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return (
    <FormPage
      object="budget"
      breadcrumbs={[{ label: t('nav.budget'), onClick: onBack }, { label: budget.assetName, onClick: onCancel }]}
      eyebrow={t('budget.reestimate.body')}
      title={t('budget.reestimate.title', { year: budget.year })}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => `re-${key}`, key => budget.lines.find(line => line.id === key)?.label ?? key)}
      submitError={submitError}
      submitting={submitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <Card meta={`${t('budget.highlight.budget')} : ${fmt.money(total)}`}>
        <div className="form-grid">
          {budget.lines.map(line => (
            <Field key={line.id} id={`re-${line.id}`} label={line.label} required error={errors[line.id]} help={`${categoryLabel(line)} · ${t('budget.lines.col.realised')} ${fmt.moneyPlain(line.realised)}`}>
              <NumberInput id={`re-${line.id}`} unit={fmt.currencyLabel} value={form.amounts[line.id] ?? ''} invalid={!!errors[line.id]} onChange={e => onChange({ ...form, amounts: { ...form.amounts, [line.id]: e.target.value } })} />
            </Field>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Field id="re-note" label={t('budget.reestimate.note')}>
            <TextInput id="re-note" value={form.note} onChange={e => onChange({ ...form, note: e.target.value })} />
          </Field>
        </div>
      </Card>
    </FormPage>
  );
}
