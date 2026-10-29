import { t } from '@/i18n/t';
import { isEmail } from '@/shared/validation';
import { BrandMark, Button, Field, Notice, TextInput } from '@/ui/primitives';
import '../auth/login.css';

export type OwnerLoginMode = 'activate' | 'login' | 'link-sent';

export const OWNER_PASSWORD_MIN = 8;

interface OwnerLoginScreenProps {
  mode: OwnerLoginMode;
  email: string;
  /** L'adresse vient de l'e-mail reçu : elle n'est pas modifiable. */
  emailLocked: boolean;
  sciName: string | null;
  password: string;
  confirm: string;
  onEmail: (email: string) => void;
  onPassword: (password: string) => void;
  onConfirm: (confirm: string) => void;
  onSubmit: () => void;
  onRequestLink: () => void;
  onOpenLink: () => void;
  onSwitch: (mode: 'activate' | 'login') => void;
  onForgot: () => void;
  busy: boolean;
  error: string | undefined;
  notice: string | undefined;
  linkMinutes: number;
  /** Comptes de démonstration ; absents en production. */
  examples: { label: string; email: string }[] | null;
  /** Démonstration : le lien que l'e-mail aurait porté s'ouvre ici. */
  showDemoLink: boolean;
}

/** E3.1 : activer son accès (mot de passe saisi deux fois, ou lien sans mot de passe), puis se connecter. */
export function OwnerLoginScreen(props: OwnerLoginScreenProps) {
  const { mode, email, emailLocked, sciName, password, confirm, onEmail, onPassword, onConfirm, onSubmit, onRequestLink, onOpenLink, onSwitch, onForgot, busy, error, notice, linkMinutes, examples, showDemoLink } = props;
  const emailValid = isEmail(email);
  const tooShort = mode === 'activate' && password.length > 0 && password.length < OWNER_PASSWORD_MIN;
  const mismatch = mode === 'activate' && confirm.length > 0 && confirm !== password;
  const canSubmit = emailValid && (mode === 'activate' ? password.length >= OWNER_PASSWORD_MIN && confirm === password : password.length > 0);
  const title = mode === 'link-sent' ? t('owner.login.linkSent.title') : mode === 'activate' ? t('owner.login.activate.title') : t('owner.login.title');

  return (
    <div className="login">
      <div className="login__form">
        <div className="login__brand-row">
          <img src="/brand/pfo-immobilier-bleu.svg" alt="PFO Immobilier" />
          <span>{t('owner.space')}</span>
        </div>
        <div className="login__body">
          <h1 className="login__title">{title}</h1>
          {mode === 'activate' ? <p className="login__subtitle">{t('owner.login.activate.lead', { sci: sciName ?? t('owner.login.yourSci') })}</p> : null}
          {notice ? <p className="login__note">{notice}</p> : null}
          {mode === 'link-sent' ? (
            <>
              <p className="login__subtitle">{t('owner.login.linkSent.body', { email, minutes: linkMinutes })}</p>
              {showDemoLink ? (
                <div className="demo-mail" role="note">
                  <div className="demo-mail__title">{t('login.demoMail.title')}</div>
                  <div className="demo-mail__line">{t('owner.login.demoMail.from')}</div>
                  <div className="demo-mail__line">{t('owner.login.demoMail.subject')}</div>
                  <Button variant="brand" disabled={busy} onClick={onOpenLink}>
                    {t('owner.login.action.openLink')}
                  </Button>
                </div>
              ) : null}
              {error ? <Notice tone="danger" title={error} /> : null}
              <div className="login__links">
                <Button variant="base" disabled={busy} onClick={onRequestLink}>
                  {t('owner.login.action.resendLink')}
                </Button>
                <Button variant="base" onClick={() => onSwitch('login')}>
                  {t('owner.login.action.usePassword')}
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={event => {
                event.preventDefault();
                if (canSubmit && !busy) onSubmit();
              }}
              noValidate
              style={{ display: 'contents' }}
            >
              <Field id="owner-email" label={t('owner.login.email')} required error={email && !emailValid ? t('form.email.invalid') : undefined}>
                <TextInput id="owner-email" type="email" autoComplete="email" value={email} disabled={emailLocked} onChange={e => onEmail(e.target.value)} />
              </Field>
              <Field id="owner-password" label={mode === 'activate' ? t('owner.login.password.new') : t('owner.login.password')} required error={tooShort ? t('owner.login.password.short', { count: OWNER_PASSWORD_MIN - password.length }) : undefined}>
                <TextInput id="owner-password" type="password" autoComplete={mode === 'activate' ? 'new-password' : 'current-password'} value={password} invalid={tooShort} onChange={e => onPassword(e.target.value)} />
              </Field>
              {mode === 'activate' ? (
                <Field id="owner-confirm" label={t('owner.login.password.confirm')} required error={mismatch ? t('owner.login.password.mismatch') : undefined}>
                  <TextInput id="owner-confirm" type="password" autoComplete="new-password" value={confirm} invalid={mismatch} onChange={e => onConfirm(e.target.value)} />
                </Field>
              ) : null}
              {error ? <Notice tone="danger" title={error} /> : null}
              <Button variant="brand" type="submit" disabled={!canSubmit || busy}>
                {mode === 'activate' ? t('owner.login.action.activate') : t('login.action.signIn')}
              </Button>
              <div className="login__links">
                <Button variant="base" disabled={!emailValid || busy} onClick={onRequestLink}>
                  {mode === 'activate' ? t('owner.login.action.linkInstead') : t('owner.login.action.link')}
                </Button>
                {mode === 'login' ? (
                  <Button variant="base" disabled={!emailValid || busy} onClick={onForgot}>
                    {t('owner.login.action.forgot')}
                  </Button>
                ) : null}
                {emailLocked ? null : (
                  <Button variant="base" onClick={() => onSwitch(mode === 'activate' ? 'login' : 'activate')}>
                    {mode === 'activate' ? t('owner.login.action.haveAccess') : t('owner.login.action.firstVisit')}
                  </Button>
                )}
              </div>
              {examples && !emailLocked ? (
                <div className="login__links">
                  {examples.map(example => (
                    <Button key={example.email} variant="base" iconLeading="user" onClick={() => onEmail(example.email)}>
                      {example.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </form>
          )}
          <p className="login__note">
            <a href="/login">{t('owner.login.team')}</a>
          </p>
        </div>
      </div>
      <aside className="login__panel">
        <BrandMark />
        <p>{t('owner.login.tagline')}</p>
      </aside>
    </div>
  );
}
