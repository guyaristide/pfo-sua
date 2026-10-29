import { describe, expect, it } from 'vitest';
import { validateUserInvite, toUserInvitation, emptyUserInviteForm } from '../../src/ui/screens/settings/UserInviteScreen';
import { validateFees, toFeesInput, feesToForm } from '../../src/ui/screens/settings/FeesScreen';
import { validateCalendarRule, toCalendarRuleInput } from '../../src/ui/screens/settings/CalendarScreen';
import { validateBankAccount } from '../../src/ui/screens/settings/BankAccountsScreen';
import { feesAll } from '../../src/mocks/fixtures/settings';
import { fr } from '../../src/i18n/fr';

describe('invitation', () => {
  it('exige une adresse complète et au moins un actif quand le périmètre est restreint', () => {
    expect(validateUserInvite({ ...emptyUserInviteForm, firstName: 'A', lastName: 'B', email: 'a@b', role: 'owner' }).email).toBe(fr['form.email.invalid']);
    const errors = validateUserInvite({ firstName: 'A', lastName: 'B', email: 'a@b.ci', role: 'owner', scopeMode: 'some', scopeAssets: [] });
    expect(errors.scopeAssets).toBe(fr['users.field.scope.pick']);
    expect(toUserInvitation({ firstName: ' A ', lastName: 'B', email: 'A@B.CI', role: 'owner', scopeMode: 'all', scopeAssets: [] })).toEqual({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.ci',
      role: 'owner',
      assetScope: 'all',
    });
  });
});

describe('honoraires', () => {
  it('convertit le taux en pourcentage dans les deux sens et refuse une assiette vide', () => {
    const form = feesToForm(feesAll);
    expect(form.ratePercent).toBe('8');
    expect(toFeesInput({ ...form, ratePercent: '8,5', note: '  ' }).value.rate).toBeCloseTo(0.085);
    expect(toFeesInput({ ...form, ratePercent: '8,5', note: '  ' }).note).toBeNull();
    expect(validateFees({ ...form, effectiveFrom: '' }).effectiveFrom).toBe(fr['version.effectiveFrom.invalid']);
    expect(validateFees({ ...form, base: [] }).base).toBe(fr['fees.field.base.pick']);
    expect(validateFees({ ...form, ratePercent: '120' }).ratePercent).toBe(fr['fees.field.rate.invalid']);
  });
});

describe('calendrier', () => {
  it('ne demande que les champs de la fréquence', () => {
    const v = { effectiveFrom: '2027-01-01', note: '' };
    expect(validateCalendarRule({ ...v, dayOfMonth: '', month: '', offsetDays: '15', ownerRole: 'pmLead' }, 'after-event')).toEqual({});
    expect(validateCalendarRule({ ...v, dayOfMonth: '32', month: '', offsetDays: '', ownerRole: 'pmLead' }, 'monthly').dayOfMonth).toBe(fr['calendar.field.dayOfMonth.invalid']);
    expect(validateCalendarRule({ ...v, dayOfMonth: '5', month: '4', offsetDays: '', ownerRole: 'pmLead' }, 'quarterly').month).toBe(fr['calendar.field.quarterMonth.invalid']);
    expect(toCalendarRuleInput({ ...v, dayOfMonth: '20', month: '0', offsetDays: '', ownerRole: 'assetManager', note: 'Avenant' }, 'quarterly')).toEqual({
      value: { dayOfMonth: 20, month: 0, offsetDays: null, ownerRole: 'assetManager' },
      effectiveFrom: '2027-01-01',
      note: 'Avenant',
    });
  });
});

describe('compte bancaire', () => {
  it('exige un actif pour un compte de SCI et quatre chiffres', () => {
    const errors = validateBankAccount({ bank: 'SGCI', holder: 'sci', holderName: 'SCI X', assetName: '', lastDigits: '12', cadence: 'monthly' });
    expect(errors.assetName).toBe(fr['form.required']);
    expect(errors.lastDigits).toBe(fr['bankAccounts.field.accountLabel.invalid']);
    expect(validateBankAccount({ bank: 'SGCI', holder: 'pfo', holderName: 'PFO', assetName: '', lastDigits: '1234', cadence: 'daily' })).toEqual({});
  });
});
