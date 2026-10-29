import type { ChequeCheckIssue, ChequeReturnRecord, TenantOption } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Band, Card, Checklist, Field, RecordLayout, TextArea, TextInput } from '@/ui/primitives';
import type { ChequeForm } from '../../RecordChequeScreen';

export interface ReturnMessage {
  to: string;
  subject: string;
  body: string;
}

interface ReturnedChequeStepProps {
  form: ChequeForm;
  tenant: TenantOption | null;
  fmt: Formatters;
  issues: ChequeCheckIssue[];
  message: ReturnMessage;
  onMessage: (message: ReturnMessage) => void;
  returned: ChequeReturnRecord | null;
}

const issueKey: Record<ChequeCheckIssue, MessageKey> = {
  'amount-mismatch': 'cheque.issue.amount-mismatch',
  'payee-missing': 'cheque.issue.payee-missing',
  'payee-wrong': 'cheque.issue.payee-wrong',
  unsigned: 'cheque.issue.unsigned',
};

/** E2.6, issue non conforme : le chèque est rendu, le locataire doit faire un nouveau règlement. */
export function ReturnedChequeStep({ form, tenant, fmt, issues, message, onMessage, returned }: ReturnedChequeStepProps) {
  const amount = fmt.money(Number(form.amount.trim()) || 0);
  return (
    <>
      <Band eyebrow={tenant ? t('cheque.receipt.summary', { number: form.chequeNumber, tenant: tenant.name, lot: tenant.lotCode }) : form.chequeNumber} title={t('cheque.return.title', { number: form.chequeNumber })} body={issues.map(issue => t(issueKey[issue])).join(' · ')} />
      <RecordLayout
        main={
        <Card title={t('cheque.return.message.title')} meta={t('cheque.return.message.attachment', { number: form.chequeNumber })}>
          <div className="form-grid">
            <Field id="return-to" label={t('cheque.return.message.to')} required error={!message.to.trim() ? t('form.required') : undefined}>
              <TextInput id="return-to" type="email" value={message.to} invalid={!message.to.trim()} disabled={returned !== null} onChange={e => onMessage({ ...message, to: e.target.value })} />
            </Field>
            <Field id="return-subject" label={t('cheque.return.message.subject')} required error={!message.subject.trim() ? t('form.required') : undefined}>
              <TextInput id="return-subject" value={message.subject} invalid={!message.subject.trim()} disabled={returned !== null} onChange={e => onMessage({ ...message, subject: e.target.value })} />
            </Field>
            <Field id="return-body" label={t('cheque.return.message.body')} required error={!message.body.trim() ? t('form.required') : undefined}>
              <TextArea id="return-body" rows={9} value={message.body} invalid={!message.body.trim()} disabled={returned !== null} onChange={e => onMessage({ ...message, body: e.target.value })} />
            </Field>
          </div>
        </Card>
        }
        aside={
          <Card>
            <Checklist
              items={[
                { id: 'returned', tone: 'success', title: t('cheque.return.returned'), detail: t('cheque.return.returned.detail') },
                { id: 'due', tone: 'warning', title: t('cheque.return.stillDue'), detail: t('cheque.return.stillDue.detail', { amount }) },
                { id: 'next', tone: returned ? 'success' : 'step', title: t('cheque.return.next'), detail: returned ? t('cheque.return.sent', { email: returned.sentTo }) : t('cheque.return.next.detail') },
              ]}
            />
          </Card>
        }
      />
    </>
  );
}
