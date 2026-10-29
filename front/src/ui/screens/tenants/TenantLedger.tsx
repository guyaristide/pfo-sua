import { useState } from 'react';
import type { InvoiceItemKind, LedgerEntry } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { exportCsv } from '@/shared/export/csv';
import { invoiceItemKey } from '@/shared/labels';
import { t } from '@/i18n/t';
import { AmountList, Button, Card, DetailPanel, DetailSection, EmptyState, FilterPills, KpiRow, ListBody, RecordLink, SplitView, type Column } from '@/ui/primitives';

interface TenantLedgerProps {
  tenantName: string;
  entries: LedgerEntry[];
  fmt: Formatters;
  onOpenInvoice: (invoiceId: string) => void;
}

interface Row {
  entry: LedgerEntry;
  invoiced: number;
  collected: number;
  balance: number;
}

/** E1.6 · Compte : facturé, réglé, solde ; chaque ligne se détaille par rubrique. Rien n'y est modifié. */
export function TenantLedger({ tenantName, entries, fmt, onOpenInvoice }: TenantLedgerProps) {
  const [quarter, setQuarter] = useState<string>('all');
  const [item, setItem] = useState<InvoiceItemKind | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  if (entries.length === 0) {
    return (
      <Card>
        <EmptyState icon="invoice" title={t('ledger.empty')} body={t('ledger.empty.body')} trame />
      </Card>
    );
  }
  const quarters = [...new Set(entries.map(e => e.quarter).filter(Boolean))].sort((a, b) => b.slice(3).localeCompare(a.slice(3)) || b.localeCompare(a));
  const items = [...new Set(entries.flatMap(e => e.lines.map(l => l.item)))];
  const amountOf = (entry: LedgerEntry) => (item === 'all' ? entry.amount : entry.lines.filter(l => l.item === item).reduce((sum, l) => sum + l.amount, 0));
  let running = 0;
  const rows: Row[] = entries
    .filter(e => quarter === 'all' || e.quarter === quarter)
    .filter(e => amountOf(e) > 0)
    .map(entry => {
      const amount = amountOf(entry);
      running += entry.kind === 'invoice' ? -amount : amount;
      return { entry, invoiced: entry.kind === 'invoice' ? amount : 0, collected: entry.kind === 'payment' ? amount : 0, balance: running };
    });
  const invoiced = rows.reduce((sum, r) => sum + r.invoiced, 0);
  const collected = rows.reduce((sum, r) => sum + r.collected, 0);
  const balance = collected - invoiced;
  const detail = rows.find(r => r.entry.id === selected)?.entry ?? null;
  const periodLabel = quarter === 'all' ? t('ledger.filter.allQuarters') : quarter;

  const columns: Column<Row>[] = [
    { key: 'date', header: t('ledger.col.date'), render: r => fmt.shortDate(r.entry.date), width: '96px' },
    {
      key: 'label',
      header: t('ledger.col.operation'),
      render: r => (
        <div>
          <RecordLink onClick={() => setSelected(r.entry.id === selected ? null : r.entry.id)}>{r.entry.label}</RecordLink>
          <div className="table__secondary">{r.entry.reference}</div>
        </div>
      ),
    },
    { key: 'invoiced', header: t('ledger.col.invoiced'), numeric: true, render: r => (r.invoiced ? fmt.signedMoney(-r.invoiced) : '') },
    { key: 'collected', header: t('ledger.col.collected'), numeric: true, render: r => (r.collected ? fmt.moneyPlain(r.collected) : '') },
    { key: 'balance', header: t('ledger.col.balance'), numeric: true, render: r => fmt.signedMoney(r.balance) },
  ];

  const exportRows = () =>
    exportCsv(
      `${t('export.filename.ledger')}-${tenantName}`,
      [
        { header: t('ledger.col.date'), value: r => fmt.shortDate(r.entry.date) },
        { header: t('ledger.col.operation'), value: r => `${r.entry.label} · ${r.entry.reference}` },
        { header: t('ledger.col.invoiced'), value: r => (r.invoiced ? -r.invoiced : '') },
        { header: t('ledger.col.collected'), value: r => r.collected || '' },
        { header: t('ledger.col.balance'), value: r => r.balance },
      ],
      rows,
    );

  return (
    <>
      <Card flush>
        <KpiRow
          items={[
            { key: 'invoiced', label: t('ledger.kpi.invoiced'), value: fmt.moneyCompact(invoiced), hint: periodLabel },
            { key: 'collected', label: t('ledger.kpi.collected'), value: fmt.moneyCompact(collected), hint: periodLabel },
            {
              key: 'balance',
              label: balance < 0 ? t('ledger.kpi.due') : balance > 0 ? t('ledger.kpi.advance') : t('ledger.kpi.balance'),
              value: fmt.moneyCompact(Math.abs(balance)),
              delta: { text: balance < 0 ? t('ledger.kpi.due.detail') : t('ledger.kpi.upToDate'), tone: balance < 0 ? 'bad' : 'good' },
            },
          ]}
        />
      </Card>
      <SplitView
        list={
          <Card
            title={t('ledger.title')}
            actions={
              <Button variant="neutral" iconLeading="download" onClick={exportRows}>
                {t('list.export.excel')}
              </Button>
            }
            flush
          >
            <ListBody
              rows={rows}
              haystack={r => [r.entry.label, r.entry.reference, r.entry.bankLabel]}
              columns={columns}
              rowKey={r => r.entry.id}
              caption={t('ledger.title')}
              selectedKey={selected}
              filters={{ options: [{ key: 'all', label: t('ledger.filter.allQuarters') }, ...quarters.map(q => ({ key: q, label: q }))], value: quarter, onChange: setQuarter, label: t('ledger.filter.quarter') }}
              toolbar={items.length > 1 ? <FilterPills<InvoiceItemKind | 'all'> options={[{ key: 'all', label: t('ledger.filter.allItems') }, ...items.map(i => ({ key: i, label: t(invoiceItemKey[i]) }))]} value={item} onChange={setItem} label={t('ledger.filter.item')} /> : undefined}
              footer={() => [t('ledger.total'), periodLabel, invoiced ? fmt.signedMoney(-invoiced) : fmt.moneyPlain(0), fmt.moneyPlain(collected), fmt.signedMoney(balance)]}
              empty={<EmptyState icon="invoice" title={t('ledger.filtered.empty')} action={<Button variant="neutral" onClick={() => { setQuarter('all'); setItem('all'); }}>{t('ledger.filtered.reset')}</Button>} />}
            />
          </Card>
        }
        detail={
          detail ? (
            <DetailPanel
              label={detail.label}
              meta={`${t(detail.kind === 'invoice' ? 'ledger.kind.invoice' : 'ledger.kind.payment')} · ${fmt.shortDate(detail.date)}`}
              title={fmt.money(detail.amount)}
              closeLabel={t('reconcile.panel.close')}
              onClose={() => setSelected(null)}
              footer={
                detail.invoiceId ? (
                  <Button variant="neutral" onClick={() => onOpenInvoice(detail.invoiceId as string)}>
                    {t('tenant.schedule.openInvoice')}
                  </Button>
                ) : undefined
              }
            >
              <DetailSection title={`${detail.label} · ${detail.reference}`}>
                <AmountList lines={detail.lines.map(line => ({ label: t(invoiceItemKey[line.item]), value: fmt.money(line.amount) }))} />
              </DetailSection>
              {detail.bankLabel ? <p className="detail-panel__hint">{detail.bankLabel}</p> : null}
              <p className="detail-panel__hint">{detail.by}</p>
            </DetailPanel>
          ) : null
        }
      />
    </>
  );
}
