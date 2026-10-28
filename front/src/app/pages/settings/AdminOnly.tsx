import type { ReactNode } from 'react';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { t } from '@/i18n/t';
import { Button, EmptyState } from '@/ui/primitives';

/** Une page d'édition des paramètres sans le droit : un état explicite, pas un formulaire grisé (règle 14). */
export function AdminOnly({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  const isAdmin = usePermission(PERMISSIONS.ADMIN);
  if (isAdmin) return <>{children}</>;
  return (
    <div className="card">
      <EmptyState
        icon="lock"
        title={t('settings.adminOnly')}
        action={
          <Button variant="neutral" onClick={onBack}>
            {t('settings.action.cancel')}
          </Button>
        }
      />
    </div>
  );
}

export function useIsAdmin(): boolean {
  return usePermission(PERMISSIONS.ADMIN);
}
