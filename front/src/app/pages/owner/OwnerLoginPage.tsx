import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useOwnerAccess, useOwnerAuthActions } from '@/services/hooks/use-owner-auth';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { OwnerLoginScreen, type OwnerLoginMode } from '@/ui/screens/owner/OwnerLoginScreen';
import { useToast } from '../../toast-context';

const demo = import.meta.env.VITE_DATA_SOURCE !== 'http';
/** Comptes de démonstration du prototype 3 : un actif avec ses comptes-rendus, un nouvel actif. */
const EXAMPLES = demo
  ? [
      { label: 'Jean-Marc Aka · SCI ITC', email: 'jm.aka@sci-itc.ci' },
      { label: 'Adjoua Brou · SCI Les Flamboyants', email: 'a.brou@sci-flamboyants.ci' },
    ]
  : null;

/**
 * E3.1 : l'e-mail de publication ou d'invitation mène ici avec l'adresse (`?email=`) et, le cas échéant, le
 * compte-rendu à ouvrir (`?report=`). Une adresse jamais activée arrive sur l'activation.
 */
export function OwnerLoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [params] = useSearchParams();
  const invited = params.get('email');
  const target = params.get('report') ? `/owner/reports/${encodeURIComponent(params.get('report') ?? '')}` : ((location.state as { from?: string } | null)?.from ?? '/owner');
  const access = useOwnerAccess(invited);
  const [email, setEmail] = useState(invited ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [chosen, setChosen] = useState<OwnerLoginMode | null>(null);
  const [linkMinutes, setLinkMinutes] = useState(15);
  const actions = useOwnerAuthActions();
  const mode: OwnerLoginMode = chosen ?? (invited && access.data && !access.data.activated ? 'activate' : 'login');
  const enter = () => void navigate(target, { replace: true });
  const failed = [actions.activate, actions.signIn, actions.requestLink, actions.openLink, actions.requestReset].find(m => m.isError);
  const resetErrors = () => [actions.activate, actions.signIn, actions.requestLink, actions.openLink, actions.requestReset].forEach(m => m.reset());

  return (
    <OwnerLoginScreen
      mode={mode}
      email={email}
      emailLocked={Boolean(invited && access.data)}
      sciName={access.data?.sciName ?? null}
      password={password}
      confirm={confirm}
      onEmail={value => {
        setEmail(value);
        resetErrors();
      }}
      onPassword={setPassword}
      onConfirm={setConfirm}
      onSubmit={() =>
        mode === 'activate'
          ? actions.activate.mutate({ email: email.trim(), password }, { onSuccess: () => { toast.notify({ tone: 'success', title: t('owner.login.activated') }); enter(); } })
          : actions.signIn.mutate({ email: email.trim(), password }, { onSuccess: enter })
      }
      onRequestLink={() =>
        actions.requestLink.mutate(email.trim(), {
          onSuccess: result => {
            setLinkMinutes(result.expiresInMinutes);
            setChosen('link-sent');
            toast.notify({ tone: 'info', title: t('owner.login.linkSent.toast', { email: email.trim() }) });
          },
        })
      }
      onOpenLink={() => actions.openLink.mutate(email.trim(), { onSuccess: enter })}
      onSwitch={next => {
        setChosen(next);
        setPassword('');
        setConfirm('');
        resetErrors();
      }}
      onForgot={() => actions.requestReset.mutate(email.trim(), { onSuccess: () => toast.notify({ tone: 'info', title: t('owner.login.resetSent', { email: email.trim() }) }) })}
      busy={[actions.activate, actions.signIn, actions.requestLink, actions.openLink].some(m => m.isPending)}
      error={failed ? errorMessage(failed.error) : access.isError ? errorMessage(access.error) : undefined}
      notice={(location.state as { reason?: string } | null)?.reason === 'session-lost' ? t('login.sessionLost') : undefined}
      linkMinutes={linkMinutes}
      examples={EXAMPLES}
      showDemoLink={demo}
    />
  );
}
