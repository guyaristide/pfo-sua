import type { ReactNode } from 'react';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { RequirePermission } from '../../require-permission';

/** Les pages d'édition des paramètres exigent le droit d'administration. */
export function AdminOnly({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  return (
    <RequirePermission permission={PERMISSIONS.ADMIN} onBack={onBack}>
      {children}
    </RequirePermission>
  );
}

export function useIsAdmin(): boolean {
  return usePermission(PERMISSIONS.ADMIN);
}
