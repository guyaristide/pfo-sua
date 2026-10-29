// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LoginScreen } from '../../src/ui/screens/auth/LoginScreen';
import { fr } from '../../src/i18n/fr';

afterEach(cleanup);

function renderScreen(overrides: Partial<Parameters<typeof LoginScreen>[0]> = {}) {
  const props = {
    step: 'email' as const,
    email: '',
    code: '',
    onEmailChange: vi.fn(),
    onCodeChange: vi.fn(),
    onRequestCode: vi.fn(),
    onVerify: vi.fn(),
    onChangeEmail: vi.fn(),
    requesting: false,
    verifying: false,
    requestError: undefined,
    verifyError: undefined,
    notice: undefined,
    codeRequest: null,
    exampleEmail: 'demo@pfo-immobilier.ci',
    ...overrides,
  };
  render(<LoginScreen {...props} />);
  return props;
}

describe('LoginScreen', () => {
  it("n'envoie pas de code sans adresse complète", () => {
    const props = renderScreen({ email: 'elea@pfo' });
    const button = screen.getByRole('button', { name: fr['login.action.requestCode'] }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText(fr['form.email.invalid'])).toBeTruthy();
    expect(props.onRequestCode).not.toHaveBeenCalled();
  });

  it("propose l'adresse d'exemple et envoie le code avec une adresse valide", () => {
    const props = renderScreen({ email: 'elea.menard@pfo-immobilier.ci' });
    fireEvent.click(screen.getByRole('button', { name: fr['login.action.useExample'] }));
    expect(props.onEmailChange).toHaveBeenCalledWith('demo@pfo-immobilier.ci');
    fireEvent.click(screen.getByRole('button', { name: fr['login.action.requestCode'] }));
    expect(props.onRequestCode).toHaveBeenCalled();
  });

  it("montre l'e-mail de démonstration et exige six chiffres", () => {
    const props = renderScreen({ step: 'code', email: 'elea.menard@pfo-immobilier.ci', code: '123', codeRequest: { expiresInMinutes: 10, demoCode: '123456' } });
    expect(screen.getByText('123456')).toBeTruthy();
    const signIn = screen.getByRole('button', { name: fr['login.action.signIn'] }) as HTMLButtonElement;
    expect(signIn.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: fr['login.demoMail.use'] }));
    expect(props.onCodeChange).toHaveBeenCalledWith('123456');
  });
});
