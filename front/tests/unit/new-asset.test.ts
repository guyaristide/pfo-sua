import { describe, expect, it } from 'vitest';
import { emptyNewAssetDraft, validateStep, toNewAssetInput, type NewAssetDraft } from '../../src/ui/screens/NewAssetScreen';
import { createMockServices } from '../../src/mocks/create-mock-services';
import { sessionStore } from '../../src/services/http/session-store';
import { AppError } from '../../src/shared/errors';
import { fr } from '../../src/i18n/fr';

const complete: NewAssetDraft = {
  ...emptyNewAssetDraft,
  name: 'Les Flamboyants',
  location: 'Cocody',
  ownerName: 'SCI Les Flamboyants',
  registration: 'CI-ABJ-1',
  ownerAddress: 'Cocody',
  representative: 'PFO',
  mandateReference: 'MG-1',
  signedOn: '2026-11-01',
  durationYears: '3',
  rentAccountDigits: '1234',
  lots: [
    { key: 'a', building: 'A', code: 'A-101', type: 'offices', surface: '142', floor: '1' },
    { key: 'b', building: 'B', code: 'B-101', type: 'shops', surface: '64', floor: '' },
  ],
  billingItemCodes: ['LOY', 'CHG'],
};

describe('nouvel actif', () => {
  it('valide chaque étape séparément et signale un lot en double', () => {
    expect(Object.keys(validateStep(emptyNewAssetDraft, 'owner'))).toHaveLength(6);
    expect(validateStep(complete, 'owner')).toEqual({});
    expect(validateStep({ ...complete, durationYears: '40' }, 'mandate').durationYears).toBe(fr['newAsset.field.durationYears.invalid']);
    expect(validateStep({ ...complete, bankAccountOwner: 'pfo', rentAccountDigits: '' }, 'specifics')).toEqual({});
    const duplicate = { ...complete, lots: [complete.lots[0]!, { ...complete.lots[1]!, code: 'a-101' }] };
    expect(validateStep(duplicate, 'lots')['b.code']).toBe(fr['newAsset.lots.duplicate']);
    expect(toNewAssetInput(complete).lots[1]?.floor).toBeNull();
    expect(toNewAssetInput(complete).rentAccountLastDigits).toBe('1234');
  });

  it("crée l'actif dans le mock et le retrouve dans la liste et le sélecteur", async () => {
    try {
      sessionStore.setToken('mock:pmLead');
    } catch {
      // Hors navigateur : le mock retombe sur la session par défaut.
    }
    const services = createMockServices({ latencyMs: 0 });
    const before = await services.assets.listAssets();
    const created = await services.assets.createAsset(toNewAssetInput(complete));
    expect(created.lotCount).toBe(2);
    expect(created.buildingCount).toBe(2);
    const after = await services.assets.listAssets();
    expect(after).toHaveLength(before.length + 1);
    const record = await services.assets.getAssetRecord(created.id);
    expect(record.lots.every(lot => lot.status === 'vacant')).toBe(true);
    expect(record.mandate.endsOn).toBe('2029-10-31');
    const again = await services.assets.createAsset(toNewAssetInput(complete)).catch(e => e as AppError);
    expect((again as AppError).kind).toBe('validation');
  });
});
