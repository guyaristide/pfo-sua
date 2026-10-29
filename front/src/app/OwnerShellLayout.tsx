import { Outlet, useLocation, useNavigate } from 'react-router';
import { useSession } from '@/services/hooks/use-session';
import { useSignOut } from '@/services/hooks/use-sign-out';
import { OwnerShell, type OwnerSection } from '@/ui/owner/OwnerShell';

const sectionPath: Record<OwnerSection, string> = { home: '/owner', lots: '/owner/lots', reports: '/owner/reports', documents: '/owner/documents' };

export function OwnerShellLayout() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const path = location.pathname;
  const current: OwnerSection = path.startsWith('/owner/lots') ? 'lots' : path.startsWith('/owner/reports') ? 'reports' : path.startsWith('/owner/documents') ? 'documents' : 'home';
  return (
    <OwnerShell
      personName={`${session.user.firstName} ${session.user.lastName}`}
      sciName={session.tenant.name}
      current={current}
      hrefOf={section => sectionPath[section]}
      onNavigate={section => void navigate(sectionPath[section])}
      onSignOut={() => signOut.mutate(undefined, { onSettled: () => void navigate('/owner/login', { replace: true }) })}
    >
      <Outlet />
    </OwnerShell>
  );
}
