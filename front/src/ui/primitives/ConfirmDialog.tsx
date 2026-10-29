import type { ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  /** Nomme l'entité et le geste : « Approuver le dossier de septembre ? ». */
  title: string;
  /** Ce qui va réellement se produire (règle 5) : « Le dossier part à la comptabilité. » */
  children: ReactNode;
  confirmLabel: string;
  tone?: 'brand' | 'destructive' | undefined;
  busy?: boolean | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Aucune écriture sans confirmation préalable, boutons isolés compris (règle 5). */
export function ConfirmDialog({ open, title, children, confirmLabel, tone = 'brand', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      title={title}
      closeLabel={t('dialog.close')}
      onClose={onCancel}
      footer={
        <>
          <Button variant="neutral" onClick={onCancel}>
            {t('dialog.cancel')}
          </Button>
          <Button variant={tone} disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
