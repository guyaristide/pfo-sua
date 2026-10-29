// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockServices } from '../../src/mocks/create-mock-services';
import { sessionStore } from '../../src/services/http/session-store';
import { AppError } from '../../src/shared/errors';
import { reportsIn, totals } from '../../src/ui/screens/owner/owner-figures';

beforeEach(() => sessionStore.setToken(null));

describe('espace propriétaire', () => {
  it('active un accès avec un mot de passe de 8 caractères, puis ouvre une session propriétaire', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const access = await services.ownerAuth.getAccess('a.brou@sci-flamboyants.ci');
    expect(access.activated).toBe(false);
    const short = await services.ownerAuth.activate(access.email, 'court').catch(e => e as AppError);
    expect((short as AppError).kind).toBe('validation');
    const notYet = await services.ownerAuth.signIn(access.email, 'n’importe').catch(e => e as AppError);
    expect((notYet as AppError).kind).toBe('business');
    await services.ownerAuth.activate(access.email, 'flamboyants-2026');
    const session = await services.session.getSession();
    expect(session.user.role).toBe('owner');
    const home = await services.owner.getHome();
    expect(home.reports).toHaveLength(0);
    expect(home.profile.firstReportExpected).toBe('2027-01-15');
  });

  it('ouvre la session par un lien à usage unique', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const unknown = await services.ownerAuth.requestLink('intrus@exemple.ci').catch(e => e as AppError);
    expect((unknown as AppError).kind).toBe('validation');
    const { expiresInMinutes } = await services.ownerAuth.requestLink('jm.aka@sci-itc.ci');
    expect(expiresInMinutes).toBe(15);
    await services.ownerAuth.openLink('jm.aka@sci-itc.ci');
    const reused = await services.ownerAuth.openLink('jm.aka@sci-itc.ci').catch(e => e as AppError);
    expect((reused as AppError).kind).toBe('business');
    const reports = await services.owner.listReports();
    expect(reports.map(r => `T${r.quarter} ${r.year}`)).toEqual(['T3 2026', 'T2 2026', 'T1 2026', 'T4 2025']);
    const report = await services.owner.getReport(reports[0]!.id);
    expect(report.signatories).toHaveLength(4);
    const file = await services.owner.download(report.id);
    expect(file.fileName).toMatch(/\.pdf$/);
    expect(file.blob.size).toBeGreaterThan(200);
  });

  it('ferme l’espace propriétaire à l’équipe', async () => {
    sessionStore.setToken('mock:financeManager');
    const services = createMockServices({ latencyMs: 0 });
    const refused = await services.owner.getHome().catch(e => e as AppError);
    expect((refused as AppError).kind).toBe('forbidden');
  });

  it('cumule les comptes-rendus selon la période choisie', async () => {
    sessionStore.setToken('mock:ownerItc');
    const services = createMockServices({ latencyMs: 0 });
    const { reports } = await services.owner.getHome();
    expect(reportsIn(reports, { kind: 'report', index: 0 })).toHaveLength(1);
    expect(reportsIn(reports, { kind: 'year' })).toHaveLength(3);
    expect(totals(reportsIn(reports, { kind: 'all' })).payout).toBe(reports.reduce((sum, r) => sum + r.payout, 0));
  });
});
