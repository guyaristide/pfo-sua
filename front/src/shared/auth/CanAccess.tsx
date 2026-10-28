import type { ReactNode } from 'react';
import { usePermission } from './use-permission';
import type { Permission } from './permissions';

interface CanAccessProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/** La garde d'affichage. Toute condition de droit passe par ici ou par `usePermission`, jamais recopiée. */
export function CanAccess({ permission, children, fallback = null }: CanAccessProps) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}
