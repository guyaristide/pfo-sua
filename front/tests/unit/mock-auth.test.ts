// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockServices } from '../../src/mocks/create-mock-services';
import { sessionStore } from '../../src/services/http/session-store';
import { AppError } from '../../src/shared/errors';

beforeEach(() => sessionStore.setToken(null));

describe('authentification simulée', () => {
  it('refuse la session sans jeton, puis l’ouvre après le bon code, pour la bonne personne', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const closed = await services.session.getSession().catch(e => e as AppError);
    expect((closed as AppError).kind).toBe('unauthorized');

    const unknown = await services.auth.requestCode('x@ailleurs.ci').catch(e => e as AppError);
    expect((unknown as AppError).kind).toBe('validation');
    const request = await services.auth.requestCode('v.chapoutot@pfo-immobilier.ci');
    expect(request.demoCode).toBeTruthy();

    const wrong = await services.auth.verifyCode('v.chapoutot@pfo-immobilier.ci', '000000').catch(e => e as AppError);
    expect((wrong as AppError).kind).toBe('validation');
    await services.auth.verifyCode('v.chapoutot@pfo-immobilier.ci', request.demoCode!);
    const session = await services.session.getSession();
    expect(session.user.role).toBe('financeManager');

    await services.auth.signOut();
    const after = await services.session.getSession().catch(e => e as AppError);
    expect((after as AppError).kind).toBe('unauthorized');
  });
});
