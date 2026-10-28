// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockServices } from '../../src/mocks/create-mock-services';
import { sessionStore } from '../../src/services/http/session-store';
import { AppError } from '../../src/shared/errors';

beforeEach(() => sessionStore.setToken('mock:pmLead'));

describe('parcours simulés', () => {
  it('contrôle puis distribue une facture, et refuse la distribution d’un brouillon', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const draft = await services.billing.getInvoice('f-12');
    const refused = await services.billing.recordDelivery(draft.id, { date: '2026-10-28', mode: 'deposit', proof: 'x' }).catch(e => e as AppError);
    expect((refused as AppError).kind).toBe('business');
    const issued = await services.billing.markChecked(draft.id);
    expect(issued.status).toBe('issued');
    const delivered = await services.billing.recordDelivery(draft.id, { date: '2026-10-28', mode: 'courier', proof: 'Bordereau' });
    expect(delivered.status).toBe('delivered');
    expect(delivered.deliveryDetail).toContain('Bordereau');
  });

  it('prépare une campagne une seule fois et émet les factures contrôlées', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const preview = await services.billing.previewCampaign({ year: 2027, quarter: 1 });
    expect(preview.alreadyPrepared).toBe(false);
    const created = await services.billing.prepareCampaign({ year: 2027, quarter: 1 });
    expect(created.created).toBe(preview.leaseCount);
    const again = await services.billing.prepareCampaign({ year: 2027, quarter: 1 }).catch(e => e as AppError);
    expect((again as AppError).kind).toBe('business');
    const issued = await services.billing.issueChecked();
    expect(issued.issued).toBeGreaterThanOrEqual(created.created);
  });

  it('fait avancer un CRG de la relecture à la signature et refuse un saut', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const skip = await services.reports.transition('r-1', 'sign', null).catch(e => e as AppError);
    expect((skip as AppError).kind).toBe('business');
    const validated = await services.reports.transition('r-1', 'validate', 'OK');
    expect(validated.status).toBe('validated');
    const signed = await services.reports.transition('r-1', 'sign', null);
    expect(signed.status).toBe('signed');
    expect(signed.signatories.every(s => s.signedOn !== null)).toBe(true);
  });

  it('rejette un chèque et répercute le montant sur le compte du locataire', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const before = await services.tenants.getAccount('tn-clinique');
    const rejected = await services.collections.rejectCheque('chq-7', 'insufficient-funds', null);
    expect(rejected.status).toBe('rejected');
    const after = await services.tenants.getAccount('tn-clinique');
    expect(after.balance).toBe(before.balance - rejected.amount);
    expect(after.history[0]?.kind).toBe('note');
  });

  it('rattache les captures seulement quand toutes les lignes sont renseignées', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const lines = await services.collections.getCaptures('s-6');
    const partial = await services.collections.attachCaptures('s-6', [{ lineId: lines[0]!.id, assetId: 'badamier', tenantId: 'tn-clinique' }]).catch(e => e as AppError);
    expect((partial as AppError).kind).toBe('business');
    await services.collections.attachCaptures('s-6', lines.map(line => ({ lineId: line.id, assetId: 'badamier', tenantId: 'tn-clinique' })));
    const overview = await services.collections.getOverview();
    expect(overview.statements.find(st => st.id === 's-6')?.status).toBe('validated');
  });

  it('dépose un document puis une nouvelle version', async () => {
    const services = createMockServices({ latencyMs: 0 });
    const doc = await services.documents.upload({ name: 'Test', kind: 'other', assetId: 'itc', tenantId: null, note: null, replacesId: null });
    expect(doc.version).toBe(1);
    const next = await services.documents.upload({ name: 'Test', kind: 'other', assetId: null, tenantId: null, note: 'v2', replacesId: doc.id });
    expect(next.version).toBe(2);
    expect(next.versions).toHaveLength(2);
    const blob = await services.documents.download(doc.id);
    expect(blob.size).toBeGreaterThan(0);
  });
});
