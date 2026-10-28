import { describe, expect, it } from 'vitest';
import { createMockServices } from '../../src/mocks/create-mock-services';
import { AppError } from '../../src/shared/errors';

describe('mocks des paramètres', () => {
  it('refuse une modification sans le droit admin, avec un message adressé à la personne', async () => {
    const services = createMockServices({ latencyMs: 0, sessionKey: 'financeManager' });
    const failure = await services.settings.saveFees({ value: { rate: 0.1, base: ['rent'], vatApplicable: true }, effectiveFrom: '2027-01-01', note: null }).catch(e => e as AppError);
    expect(failure).toBeInstanceOf(AppError);
    expect((failure as AppError).kind).toBe('forbidden');
    expect((failure as AppError).userMessage).toBeTruthy();
  });

  it('enregistre et relit une rubrique, et refuse un code en doublon', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const before = await services.settings.listBillingItems();
    const created = await services.settings.saveBillingItem({ code: 'TEST', label: 'Test', value: { inReport: true, inFeeBase: false, vatApplicable: true, periodicity: 'once' }, effectiveFrom: '2026-10-28', note: null });
    const after = await services.settings.listBillingItems();
    expect(after).toHaveLength(before.length + 1);
    expect(after.find(item => item.id === created.id)?.active).toBe(true);
    const duplicate = await services.settings
      .saveBillingItem({ code: 'LOY', label: 'Doublon', value: { inReport: true, inFeeBase: false, vatApplicable: true, periodicity: 'once' }, effectiveFrom: '2026-10-28', note: null })
      .catch(e => e as AppError);
    expect((duplicate as AppError).kind).toBe('validation');
    const overview = await services.settings.getOverview();
    expect(overview.sections.find(section => section.key === 'billing-items')?.count).toBe(after.length);
  });

  it('invite un utilisateur en statut invité et masque les comptes bancaires', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const user = await services.settings.inviteUser({ firstName: 'Awa', lastName: 'K.', email: 'awa@pfo-immobilier.ci', role: 'operations', assetScope: ['ITC'] });
    expect(user.status).toBe('invited');
    const account = await services.settings.saveBankAccount({ bank: 'BACI', holder: 'sci', holderName: 'SCI Test', assetName: 'ITC', lastDigits: '9876', cadence: 'monthly' });
    expect(account.accountLabel.endsWith('9876')).toBe(true);
    expect(account.accountLabel).not.toContain('98765');
  });

  it('historise : une nouvelle version ne remplace pas la précédente, une date future reste programmée', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const before = await services.settings.getFees();
    const scheduled = await services.settings.saveFees({ value: { rate: 0.09, base: ['rent'], vatApplicable: true }, effectiveFrom: '2099-01-01', note: 'Test futur' });
    expect(scheduled.versions).toHaveLength(before.versions.length + 1);
    expect(scheduled.current.version).toBe(before.current.version);
    const applied = await services.settings.saveFees({ value: { rate: 0.1, base: ['rent'], vatApplicable: false }, effectiveFrom: '2026-01-01', note: null });
    expect(applied.current.value.rate).toBe(0.1);
    expect(applied.versions.map(v => v.version)).toContain(before.current.version);
    const sameDate = await services.settings.saveFees({ value: { rate: 0.11, base: ['rent'], vatApplicable: false }, effectiveFrom: '2026-01-01', note: null }).catch(e => e as AppError);
    expect((sameDate as AppError).kind).toBe('validation');
  });
});
