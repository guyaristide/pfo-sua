import type { CodeRequestResult } from '@/services/contracts';
import { t } from '@/i18n/t';
import { BrandMark, Button, Field, TextInput } from '@/ui/primitives';
import './login.css';

export type LoginStep = 'email' | 'code';

interface LoginScreenProps {
  step: LoginStep;
  email: string;
  code: string;
  onEmailChange: (email: string) => void;
  onCodeChange: (code: string) => void;
  onRequestCode: () => void;
  onVerify: () => void;
  onChangeEmail: () => void;
  requesting: boolean;
  verifying: boolean;
  requestError: string | undefined;
  verifyError: string | undefined;
  /** Message d'accueil contextuel, par exemple après une session expirée. */
  notice: string | undefined;
  codeRequest: CodeRequestResult | null;
  /** Adresse proposée sur un environnement de démonstration ; absente en production. */
  exampleEmail: string | null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CODE_PATTERN = /^\d{6}$/;

/** Connexion par code e-mail (prototype d'Elodie) : l'adresse, puis les six chiffres. */
export function LoginScreen(props: LoginScreenProps) {
  const { step, email, code, onEmailChange, onCodeChange, onRequestCode, onVerify, onChangeEmail, requesting, verifying, requestError, verifyError, notice, codeRequest, exampleEmail } = props;
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const codeValid = CODE_PATTERN.test(code.trim());

  return (
    <div className="login">
      <div className="login__form">
        <div className="login__brand-row">
          <img src="/brand/pfo-immobilier-bleu.svg" alt="PFO Immobilier" />
          <span>
            {t('app.name')} · {t('app.tagline')}
          </span>
        </div>
        <div className="login__body">
          {step === 'email' ? (
            <form
              onSubmit={event => {
                event.preventDefault();
                if (emailValid && !requesting) onRequestCode();
              }}
              noValidate
              style={{ display: 'contents' }}
            >
              <h1 className="login__title">{t('login.title')}</h1>
              <p className="login__subtitle">{t('login.subtitle')}</p>
              {notice ? <p className="login__note">{notice}</p> : null}
              <Field id="login-email" label={t('login.email')} required error={requestError ?? (email && !emailValid ? t('login.email.invalid') : undefined)}>
                <TextInput id="login-email" type="email" autoComplete="email" autoFocus placeholder={t('login.email.placeholder')} value={email} invalid={!!requestError} onChange={e => onEmailChange(e.target.value)} />
              </Field>
              <Button variant="brand" type="submit" disabled={!emailValid || requesting}>
                {t('login.action.requestCode')}
              </Button>
              {exampleEmail ? (
                <div className="login__links">
                  <Button variant="base" iconLeading="user" onClick={() => onEmailChange(exampleEmail)}>
                    {t('login.action.useExample')}
                  </Button>
                </div>
              ) : null}
            </form>
          ) : (
            <form
              onSubmit={event => {
                event.preventDefault();
                if (codeValid && !verifying) onVerify();
              }}
              noValidate
              style={{ display: 'contents' }}
            >
              <h1 className="login__title">{t('login.code.title')}</h1>
              <p className="login__subtitle">{t('login.code.body', { email, minutes: codeRequest?.expiresInMinutes ?? 10 })}</p>
              {codeRequest?.demoCode ? (
                <div className="demo-mail" role="note">
                  <div className="demo-mail__title">{t('login.demoMail.title')}</div>
                  <div className="demo-mail__line">{t('login.demoMail.from')}</div>
                  <div className="demo-mail__line">{t('login.demoMail.subject')}</div>
                  <div className="demo-mail__code">{codeRequest.demoCode}</div>
                  <Button variant="neutral" onClick={() => onCodeChange(codeRequest.demoCode ?? '')}>
                    {t('login.demoMail.use')}
                  </Button>
                </div>
              ) : null}
              <Field id="login-code" label={t('login.code.label')} required error={verifyError ?? (code && !codeValid ? t('login.code.invalid') : undefined)} help={t('login.code.help')}>
                <TextInput
                  id="login-code"
                  className="login__code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={code}
                  invalid={!!verifyError}
                  onChange={e => onCodeChange(e.target.value.replace(/\D/g, ''))}
                />
              </Field>
              <Button variant="brand" type="submit" disabled={!codeValid || verifying}>
                {t('login.action.signIn')}
              </Button>
              <div className="login__links">
                <Button variant="base" onClick={onRequestCode} disabled={requesting}>
                  {t('login.action.resend')}
                </Button>
                <Button variant="base" onClick={onChangeEmail}>
                  {t('login.action.changeEmail')}
                </Button>
              </div>
            </form>
          )}
          <p className="login__note">{t('login.noAccess')}</p>
        </div>
      </div>
      <aside className="login__panel">
        <BrandMark size={220} />
        <p>{t('login.tagline')}</p>
      </aside>
    </div>
  );
}
