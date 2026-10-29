import type { BillingService, InvoiceDetail } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { billingAll } from '../fixtures/billing';
import { invoiceDetail } from '../fixtures/details';
import { type MockContext } from '../context';

export function createBillingMock(ctx: MockContext): BillingService {
  const { latency, byAsset, state, assetName, author, today, billableTenants } = ctx;
  return {
    getOverview: assetId => {
      const invoices = byAsset(state.invoices, assetId);
      const campaign = {
        ...billingAll.campaign,
        invoiceCount: invoices.length,
        issuedCount: invoices.filter(i => i.status !== 'draft' && i.status !== 'to-check').length,
        toCheckCount: invoices.filter(i => i.status === 'to-check').length,
        deliveredCount: invoices.filter(i => i.deliveryDetail !== null).length,
        totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
      };
      return delay({ campaign, invoices }, latency);
    },
    getInvoice: async id => {
      const invoice = state.invoices.find(i => i.id === id);
      if (!invoice) throw new AppError('resource-missing');
      return delay(invoice, latency);
    },
    markChecked: async id => {
      const invoice = state.invoices.find(i => i.id === id);
      if (!invoice) throw new AppError('resource-missing');
      if (invoice.status !== 'to-check' && invoice.status !== 'draft') throw new AppError('business', { userMessage: 'Cette facture a déjà été émise.' });
      const updated: InvoiceDetail = { ...invoice, status: 'issued', issuedOn: today(), history: [{ id: `${id}-chk`, date: today(), kind: 'note', label: `Contrôlée et émise par ${author()}`, amount: null }, ...invoice.history] };
      state.invoices = state.invoices.map(i => (i.id === id ? updated : i));
      return delay(updated, latency);
    },
    recordDelivery: async (id, input) => {
      const invoice = state.invoices.find(i => i.id === id);
      if (!invoice) throw new AppError('resource-missing');
      if (invoice.status === 'draft' || invoice.status === 'to-check') throw new AppError('business', { userMessage: 'Émettez la facture avant d’enregistrer sa distribution.' });
      const updated: InvoiceDetail = {
        ...invoice,
        status: invoice.status === 'issued' ? 'delivered' : invoice.status,
        deliveredOn: input.date,
        deliveryMode: input.mode,
        deliveryProof: input.proof,
        deliveryDetail: `${input.proof} · ${input.date}`,
        history: [{ id: `${id}-dlv-${Date.now()}`, date: input.date, kind: 'note', label: `Distribuée (${input.proof})`, amount: null }, ...invoice.history],
      };
      state.invoices = state.invoices.map(i => (i.id === id ? updated : i));
      return delay(updated, latency);
    },
    previewCampaign: async period => {
      const start = `${period.year}-${String((period.quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
      const alreadyPrepared = state.invoices.some(i => i.periodStart === start);
      const leases = billableTenants(start);
      const estimated = leases.reduce((sum, tn) => sum + (tn.lease.monthlyRent + tn.lease.monthlyCharges) * 3, 0);
      const previousMonth = new Date(Date.UTC(period.year, (period.quarter - 1) * 3 - 1, 20)).toISOString().slice(0, 10);
      return delay({ period, leaseCount: leases.length, estimatedAmount: estimated, issueDeadline: previousMonth, dueDate: start.slice(0, 8) + '05', alreadyPrepared }, latency);
    },
    prepareCampaign: async period => {
      const start = `${period.year}-${String((period.quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
      if (state.invoices.some(i => i.periodStart === start)) throw new AppError('business', { userMessage: `La campagne T${period.quarter} ${period.year} est déjà préparée.` });
      const created = billableTenants(start).map((tn, index) => {
        const amount = (tn.lease.monthlyRent + tn.lease.monthlyCharges) * 3;
        const row = { id: `f-${period.year}${period.quarter}-${index}`, tenantName: tn.name, assetName: tn.assetName, periodStart: start, amount, dueDate: start.slice(0, 8) + '05', status: 'to-check' as const, deliveryDetail: null };
        return invoiceDetail(row);
      });
      state.invoices = [...state.invoices, ...created];
      return delay({ created: created.length }, latency);
    },
    issueChecked: async assetId => {
      const name = assetName(assetId);
      let issued = 0;
      state.invoices = state.invoices.map(i => {
        if (i.status === 'to-check' && (!name || i.assetName === name)) {
          issued += 1;
          return { ...i, status: 'issued' as const, issuedOn: today(), history: [{ id: `${i.id}-iss2`, date: today(), kind: 'invoice' as const, label: 'Facture émise', amount: i.amount }, ...i.history] };
        }
        return i;
      });
      return delay({ issued }, latency);
    },
  };
}
