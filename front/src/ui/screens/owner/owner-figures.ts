import type { AgingBucket, OwnerReportSummary } from '@/services/contracts';
import type { MessageKey } from '@/i18n/fr';

/** La période de l'accueil (E3.2) : un trimestre (le dernier compte-rendu par défaut), l'année, ou depuis le début. */
export type OwnerPeriod = { kind: 'report'; index: number } | { kind: 'year' } | { kind: 'all' };

export const periodKey = (period: OwnerPeriod) => (period.kind === 'report' ? String(period.index) : period.kind);
export const periodFromKey = (key: string): OwnerPeriod => (key === 'year' || key === 'all' ? { kind: key } : { kind: 'report', index: Number(key) || 0 });

/** Les comptes-rendus que couvre la période, du plus récent au plus ancien. */
export function reportsIn(reports: OwnerReportSummary[], period: OwnerPeriod): OwnerReportSummary[] {
  if (reports.length === 0) return [];
  if (period.kind === 'all') return reports;
  if (period.kind === 'year') return reports.filter(r => r.year === reports[0]!.year);
  return [reports[period.index] ?? reports[0]!];
}

export function totals(reports: OwnerReportSummary[]) {
  return reports.reduce((acc, r) => ({ invoiced: acc.invoiced + r.invoiced, collected: acc.collected + r.collected, payout: acc.payout + r.payout }), { invoiced: 0, collected: 0, payout: 0 });
}

export const quarterLabel = (r: Pick<OwnerReportSummary, 'quarter' | 'year'>) => `T${r.quarter} ${r.year}`;

export const agingKey: Record<AgingBucket, MessageKey> = {
  'under-30': 'owner.aging.under30',
  '30-90': 'owner.aging.30to90',
  'over-90': 'owner.aging.over90',
};

/** Ancienneté des impayés : la couleur fonce avec l'âge, toujours doublée du libellé et du montant. */
export const agingTone: Record<AgingBucket, 'warning' | 'danger' | 'critical'> = {
  'under-30': 'warning',
  '30-90': 'danger',
  'over-90': 'critical',
};
