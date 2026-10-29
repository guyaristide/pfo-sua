import type { ReactNode } from 'react';
import { usePermission } from '@/shared/auth/use-permission';
import type { Permission } from '@/shared/auth/permissions';
import { t } from '@/i18n/t';
import { Button, EmptyState } from '@/ui/primitives';

interface RequirePermissionProps {
  permission: Permission;
  onBack: () => void;
  backLabel?: string;
  children: ReactNode;
}

/** Une page de geste sans le droit : un état explicite avec retour, pas un formulaire grisé (règle 14). */
export function RequirePermission({ permission, onBack, backLabel, children }: RequirePermissionProps) {
  const allowed = usePermission(permission);
  if (allowed) return <>{children}</>;
  return (
    <div className="card">
      <EmptyState
        icon="lock"
        title={t('settings.adminOnly')}
        action={
          <Button variant="neutral" onClick={onBack}>
            {backLabel ?? t('settings.action.cancel')}
          </Button>
        }
      />
    </div>
  );
}
