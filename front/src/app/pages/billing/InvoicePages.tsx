import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { InvoiceDetail } from '@/services/contracts';
import { useGetInvoice } from '@/services/hooks/use-get-invoice';
import { useMarkInvoiceChecked, useRecordDelivery } from '@/services/hooks/use-invoice-actions';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { InvoiceDeliveryScreen, InvoiceScreen, toDeliveryInput, type DeliveryForm } from '@/ui/screens/billing/InvoiceScreen';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

const message = (error: unknown) => {
  const appError = AppError.from(error);
  return appError.userMessage ?? t('state.error.body', { reference: appError.reference });
};

export function InvoicePage() {
  const { invoiceId = '' } = useParams();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const query = useGetInvoice(invoiceId);
  const canIssue = usePermission(PERMISSIONS.INVOICE_ISSUE);
  const check = useMarkInvoiceChecked(invoiceId);
  return (
    <QueryState query={query}>
      {invoice => (
        <InvoiceScreen
          invoice={invoice}
          fmt={fmt}
          canIssue={canIssue}
          checking={check.isPending}
          onCheck={() =>
            check.mutate(undefined, {
              onSuccess: () => toast.notify({ tone: 'success', title: t('invoice.checked') }),
              onError: error => toast.notify({ tone: 'danger', title: message(error) }),
            })
          }
          onDelivery={() => void navigate(`/billing/invoices/${encodeURIComponent(invoiceId)}/delivery`)}
          onOpenTenant={() => void navigate(`/tenants/${encodeURIComponent(invoice.tenantId)}`)}
          onBack={() => void navigate('/billing')}
        />
      )}
    </QueryState>
  );
}

export function InvoiceDeliveryPage() {
  const { invoiceId = '' } = useParams();
  const query = useGetInvoice(invoiceId);
  return <QueryState query={query}>{invoice => <DeliveryBody invoice={invoice} />}</QueryState>;
}

function DeliveryBody({ invoice }: { invoice: InvoiceDetail }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const [form, setForm] = useState<DeliveryForm>({ date: new Date().toISOString().slice(0, 10), mode: 'deposit', proof: '' });
  const mutation = useRecordDelivery(invoice.id);
  const backToInvoice = () => void navigate(`/billing/invoices/${encodeURIComponent(invoice.id)}`);
  return (
    <InvoiceDeliveryScreen
      invoice={invoice}
      fmt={fmt}
      form={form}
      onChange={setForm}
      onSubmit={() =>
        mutation.mutate(toDeliveryInput(form), {
          onSuccess: () => {
            toast.notify({ tone: 'success', title: t('invoice.deliveryForm.saved') });
            backToInvoice();
          },
        })
      }
      submitting={mutation.isPending}
      submitError={mutation.isError ? message(mutation.error) : undefined}
      onCancel={backToInvoice}
      onBack={() => void navigate('/billing')}
    />
  );
}
