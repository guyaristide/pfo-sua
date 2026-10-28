import { useSession } from '@/services/hooks/use-session';
import type { Permission } from './permissions';

export function usePermission(permission: Permission): boolean {
  const session = useSession();
  return session.permissions.includes(permission);
}
