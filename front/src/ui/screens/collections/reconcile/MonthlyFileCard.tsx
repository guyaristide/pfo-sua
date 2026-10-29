import { useState } from 'react';
import type { MonthlyFile } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { monthlyFileStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, ConfirmDialog, Dialog, Field, FormAttemptContext, Notice, Stack, TextArea } from '@/ui/primitives';

interface MonthlyFileCardProps {
  file: MonthlyFile;
  bank: string;
  month: string;
  fmt: Formatters;
  canApprove: boolean;
  busy: boolean;
  error: string | undefined;
  onApprove: () => void;
  onReturn: (comment: string) => void;
  onDownload: () => void;
}

/** Le dossier mensuel du compte après validation (Q20, Q31) : contenu, statut, approbation ou renvoi. */
export function MonthlyFileCard({ file, bank, month, fmt, canApprove, busy, error, onApprove, onReturn, onDownload }: MonthlyFileCardProps) {
  const [returning, setReturning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [comment, setComment] = useState('');
  const [attempted, setAttempted] = useState(false);
  const status = monthlyFileStatus[file.status];
  const detail =
    file.status === 'submitted'
      ? t('file.detail.submitted', { to: file.submittedTo })
      : file.status === 'returned'
        ? t('file.detail.returned', { by: file.submittedTo })
        : t('file.detail.sent', { by: file.approvedBy ?? file.submittedTo, date: file.approvedAt ? fmt.shortDate(file.approvedAt.slice(0, 10)) : '' });
  const sendBack = () => {
    if (!comment.trim()) {
      setAttempted(true);
      return;
    }
    onReturn(comment.trim());
    setReturning(false);
  };
  return (
    <Card
      title={t('file.title', { version: file.version })}
      meta={t('file.validatedBy', { by: file.validatedBy, date: fmt.shortDate(file.validatedAt.slice(0, 10)) })}
      actions={
        <>
          <Button variant="neutral" iconLeading="download" onClick={onDownload}>
            {t('reconcile.action.download')}
          </Button>
          {canApprove && file.status === 'submitted' ? (
            <>
              <Button variant="neutral" disabled={busy} onClick={() => setReturning(true)}>
                {t('file.action.return')}
              </Button>
              <Button variant="success" disabled={busy} onClick={() => setApproving(true)}>
                {t('file.action.approve')}
              </Button>
            </>
          ) : null}
        </>
      }
    >
      <Stack gap={12}>
        <div>
          <Badge tone={status.tone}>{t(status.labelKey)}</Badge>
        </div>
        <p>{detail}</p>
        {file.comment ? <Notice tone="warning" title={t('file.comment.title', { by: file.submittedTo })}>{file.comment}</Notice> : null}
        {error ? <Notice tone="danger" title={error} /> : null}
        <div>
          <h3 className="detail-section__title">{t('file.contents', { bank })}</h3>
          <ul className="bullet-list">
            {(['1', '2', '3', '4'] as const).map(n => (
              <li key={n}>{t(`file.contents.${n}`)}</li>
            ))}
          </ul>
        </div>
      </Stack>
      <ConfirmDialog
        open={approving}
        title={t('file.approve.title', { month })}
        confirmLabel={t('file.action.approve')}
        busy={busy}
        onCancel={() => setApproving(false)}
        onConfirm={() => {
          setApproving(false);
          onApprove();
        }}
      >
        <p>{t('file.approve.body', { amount: fmt.money(file.collectedAmount), count: file.imputedCount })}</p>
      </ConfirmDialog>
      <Dialog
        open={returning}
        title={t('file.return.title')}
        closeLabel={t('dialog.close')}
        onClose={() => setReturning(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setReturning(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button variant="brand" disabled={busy} onClick={sendBack}>
              {t('file.action.return')}
            </Button>
          </>
        }
      >
        <FormAttemptContext.Provider value={attempted}>
          <p>{t('file.return.body')}</p>
          <Field id="file-comment" label={t('file.return.comment')} required error={!comment.trim() ? t('form.required') : undefined}>
            <TextArea id="file-comment" value={comment} invalid={!comment.trim()} onChange={e => setComment(e.target.value)} />
          </Field>
        </FormAttemptContext.Provider>
      </Dialog>
    </Card>
  );
}
