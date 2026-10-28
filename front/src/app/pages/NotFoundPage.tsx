import { useNavigate } from 'react-router';
import { t } from '@/i18n/t';
import { Button, EmptyState } from '@/ui/primitives';

/** Adresse inconnue : le premier des deux 404 (règle 19). L'autre, « ce dossier n'existe plus », vit dans les fiches. */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="card">
      <EmptyState
        icon="help"
        title={t('state.unknownRoute')}
        action={
          <Button variant="neutral" onClick={() => void navigate('/')}>
            {t('state.backToDashboard')}
          </Button>
        }
      />
    </div>
  );
}
