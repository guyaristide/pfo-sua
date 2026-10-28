import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useRequestCode } from '@/services/hooks/use-request-code';
import { useVerifyCode } from '@/services/hooks/use-verify-code';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { LoginScreen, type LoginStep } from '@/ui/screens/auth/LoginScreen';

/** Adresse proposée sur l'environnement de démonstration (données simulées) ; jamais en production. */
const EXAMPLE_EMAIL = import.meta.env.VITE_DATA_SOURCE === 'http' ? null : 'elea.menard@pfo-immobilier.ci';

interface LocationState {
  from?: string;
  reason?: 'session-lost';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const request = useRequestCode();
  const verify = useVerifyCode();

  const message = (error: unknown) => {
    const appError = AppError.from(error);
    return appError.userMessage ?? t('state.error.body', { reference: appError.reference });
  };

  return (
    <LoginScreen
      step={step}
      email={email}
      code={code}
      onEmailChange={value => {
        setEmail(value);
        request.reset();
      }}
      onCodeChange={value => {
        setCode(value);
        verify.reset();
      }}
      onRequestCode={() =>
        request.mutate(email.trim(), {
          onSuccess: () => {
            setCode('');
            setStep('code');
          },
        })
      }
      onVerify={() =>
        verify.mutate(
          { email: email.trim(), code: code.trim() },
          { onSuccess: () => void navigate(state.from && state.from !== '/login' ? state.from : '/', { replace: true }) },
        )
      }
      onChangeEmail={() => {
        setStep('email');
        setCode('');
        verify.reset();
      }}
      requesting={request.isPending}
      verifying={verify.isPending}
      requestError={request.isError ? message(request.error) : undefined}
      verifyError={verify.isError ? message(verify.error) : undefined}
      notice={state.reason === 'session-lost' ? t('login.sessionLost') : undefined}
      codeRequest={request.data ?? null}
      exampleEmail={EXAMPLE_EMAIL}
    />
  );
}
