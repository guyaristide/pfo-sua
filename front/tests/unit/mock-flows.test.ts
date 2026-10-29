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

  it('rapproche un relevé : preuve et qualification exigées, comptes crédités, dossier soumis puis approuvé', async () => {
    sessionStore.setToken('mock:financeManager');
    const services = createMockServices({ latencyMs: 0 });
    const statement = await services.collections.getStatement('s-1');
    const pharma = statement.lines.find(line => line.id === 'l-05')!;
    const proof = pharma.availableProof!;
    const impute = (lineId: string, tenantId: string, allocations: { invoiceId: string; amount: number }[]) =>
      ({ lineId, action: 'impute' as const, tenantId, allocations: allocations.map(a => ({ kind: 'invoice' as const, tenantId, invoiceId: a.invoiceId, amount: a.amount })), offAccount: null, proof });
    const decisions = [
      impute('l-05', 'tn-pharma', [{ invoiceId: 'fa-0915-r', amount: 4_350_000 }, { invoiceId: 'fa-0915-c', amount: 750_000 }]),
      impute('l-06', 'tn-cafe', [{ invoiceId: 'fa-0940-r', amount: 3_600_000 }, { invoiceId: 'fa-0940-c', amount: 600_000 }]),
      impute('l-07', 'tn-savane', [{ invoiceId: 'fa-0927-r', amount: 2_800_000 }, { invoiceId: 'fa-0927-c', amount: 400_000 }]),
      impute('l-08', 'tn-afrik', [{ invoiceId: 'fa-0612-r', amount: 6_000_000 }]),
      impute('l-10', 'tn-afrik', [{ invoiceId: 'fa-0612-c', amount: 950_000 }]),
      impute('l-11', 'tn-sni', [{ invoiceId: 'fa-0605-r', amount: 2_000_000 }]),
    ];
    const unqualified = await services.collections.validateReconciliation('s-1', decisions).catch(e => e as AppError);
    expect((unqualified as AppError).kind).toBe('business');
    const noProof = await services.collections
      .validateReconciliation('s-1', [...decisions.slice(1), { ...decisions[0]!, proof: null as never }, { lineId: 'l-09', action: 'exclude', qualification: { reason: 'internal-transfer', note: null } }])
      .catch(e => e as AppError);
    expect((noProof as AppError).kind).toBe('business');
    const result = await services.collections.validateReconciliation('s-1', [...decisions, { lineId: 'l-09', action: 'exclude', qualification: { reason: 'internal-transfer', note: null } }]);
    expect(result.matchedCount).toBe(9);
    expect(result.file.status).toBe('submitted');
    const pharmacy = await services.tenants.getAccount('tn-pharma');
    expect(pharmacy.balance).toBe(0);
    expect(pharmacy.history[0]?.kind).toBe('payment');
    const forbidden = await services.collections.approveMonthlyFile('s-1').catch(e => e as AppError);
    expect((forbidden as AppError).kind).toBe('forbidden');
    sessionStore.setToken('mock:assetManager');
    const approved = await services.collections.approveMonthlyFile('s-1');
    expect(approved.file?.status).toBe('sent-to-accounting');
    const overview = await services.collections.getOverview();
    expect(overview.inbox.some(item => item.statementId === 's-1')).toBe(false);
  });

  it('renvoie un dossier mensuel avec commentaire et le signale dans « À traiter »', async () => {
    sessionStore.setToken('mock:assetManager');
    const services = createMockServices({ latencyMs: 0 });
    const notSubmitted = await services.collections.returnMonthlyFile('s-1', 'Ligne du 18.09 au mauvais locataire').catch(e => e as AppError);
    expect((notSubmitted as AppError).kind).toBe('business');
  });

  it('remet des chèques en banque en deux temps : liste au coursier, puis un bordereau par chèque', async () => {
    sessionStore.setToken('mock:financeManager');
    const services = createMockServices({ latencyMs: 0 });
    const mixed = await services.collections.prepareDeposit(['chq-1', 'chq-4']).catch(e => e as AppError);
    expect((mixed as AppError).kind).toBe('business');
    const deposit = await services.collections.prepareDeposit(['chq-1', 'chq-2']);
    expect(deposit.status).toBe('at-courier');
    expect(deposit.total).toBe(3_960_000);
    const incomplete = await services.collections.completeDeposit(deposit.id, { 'chq-1': { kind: 'received', name: 'b1.pdf' } }).catch(e => e as AppError);
    expect((incomplete as AppError).kind).toBe('business');
    const done = await services.collections.completeDeposit(deposit.id, { 'chq-1': { kind: 'received', name: 'b1.pdf' }, 'chq-2': { kind: 'missing' } });
    expect(done.status).toBe('deposited');
    expect(done.reference).not.toBeNull();
    const cheques = await services.collections.listCheques();
    expect(cheques.find(c => c.id === 'chq-1')?.status).toBe('deposited');
    expect(cheques.find(c => c.id === 'chq-2')?.note).toContain('manquant');
  });

  it('refuse un chèque non conforme et le rend au locataire avec la demande de nouveau règlement', async () => {
    sessionStore.setToken('mock:financeManager');
    const services = createMockServices({ latencyMs: 0 });
    const cheque = { tenantId: 'tn-pharma', amount: 1_250_000, amountInWords: 'Un million deux cent mille', bank: 'BLCI', chequeNumber: '0045821', payee: 'SCI ITC', receivedOn: '2026-10-12', signed: true };
    const refused = await services.collections.recordCheque(cheque).catch(e => e as AppError);
    expect((refused as AppError).kind).toBe('business');
    const returned = await services.collections.returnCheque({ cheque, issues: ['amount-mismatch'], message: { to: 'pharmacie.centre@exemple.ci', subject: 'Nouveau règlement', body: 'Merci de régler à nouveau.' } });
    expect(returned.sentTo).toBe('pharmacie.centre@exemple.ci');
    const account = await services.tenants.getAccount('tn-pharma');
    expect(account.history[0]?.label).toContain('0045821');
    const ok = await services.collections.recordCheque({ ...cheque, amount: 1_200_000 });
    expect(ok.chequeNumber).toBe('0045821');
  });

  it('rouvre un rapprochement validé avec motif, réimpute une ligne et produit la version 2 du dossier', async () => {
    sessionStore.setToken('mock:financeManager');
    const services = createMockServices({ latencyMs: 0 });
    const tooShort = await services.collections.reopenReconciliation('s-2', 'ok').catch(e => e as AppError);
    expect((tooShort as AppError).kind).toBe('validation');
    const reopened = await services.collections.reopenReconciliation('s-2', 'Observation d’Eléma sur la ligne du 18.09');
    expect(reopened.status).toBe('reopened');
    const line = reopened.lines.find(l => l.id === 'tj-03')!;
    const result = await services.collections.validateReconciliation('s-2', [
      { lineId: 'tj-03', action: 'impute', tenantId: 'tn-ehui', allocations: [{ kind: 'invoice', tenantId: 'tn-ehui', invoiceId: 'fa-0981-r', amount: 1_650_000 }, { kind: 'invoice', tenantId: 'tn-ehui', invoiceId: 'fa-0981-c', amount: 300_000 }], offAccount: null, proof: line.proof! },
    ]);
    expect(result.file.version).toBe(2);
    expect(result.file.changes).toBe(1);
    const after = await services.collections.getStatement('s-2');
    expect(after.fileVersions).toHaveLength(1);
    expect(after.lines.find(l => l.id === 'tj-03')?.tenantName).toBe('M. Patrick Ehui');
    expect(after.journal.map(j => j.kind)).toEqual(['validated', 'approved', 'observation', 'reopened', 'validated']);
  });

  it('rapproche un chèque non repéré avec le crédit candidat et note les démarches', async () => {
    sessionStore.setToken('mock:financeManager');
    const services = createMockServices({ latencyMs: 0 });
    const detail = await services.collections.getCheque('chq-4');
    expect(detail.cheque.status).toBe('late');
    const noted = await services.collections.addChequeFollowUp('chq-4', { date: '2026-10-28', who: 'Agence Stanbic Plateau', reply: 'Remise en cours de recherche' });
    expect(noted.followUps).toHaveLength(1);
    const candidate = detail.candidates[0]!;
    const matched = await services.collections.matchChequeCredit('chq-4', candidate.statementId, candidate.lineId);
    expect(matched.cheque.status).toBe('collected');
    const overview = await services.collections.getOverview();
    expect(overview.inbox.some(item => item.chequeId === 'chq-4')).toBe(false);
    const account = await services.tenants.getAccount('tn-optique');
    expect(account.balance).toBe(0);
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
