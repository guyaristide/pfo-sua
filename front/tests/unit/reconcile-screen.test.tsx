// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReconcileStatementScreen, initialReconcileDraft, type ReconcileDraft } from '../../src/ui/screens/ReconcileStatementScreen';
import { buildDecisions, emptyWork, imputeBlock, proposeAmounts, type LineWork } from '../../src/ui/screens/collections/reconcile/work';
import { createFormatters } from '../../src/shared/format/formatters';
import { statementItcSeptember, statementTenantsItc } from '../../src/mocks/fixtures/statements';
import { fr } from '../../src/i18n/fr';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });
afterEach(cleanup);

function renderScreen(draft: Partial<ReconcileDraft>, overrides: Partial<Parameters<typeof ReconcileStatementScreen>[0]> = {}) {
  const onDraftChange = vi.fn();
  render(
    <ReconcileStatementScreen
      statement={statementItcSeptember}
      fmt={fmt}
      draft={{ ...initialReconcileDraft, explainerDismissed: true, ...draft }}
      onDraftChange={onDraftChange}
      onValidate={() => {}}
      validating={false}
      validationError={undefined}
      result={null}
      canValidate
      canApprove={false}
      fileBusy={false}
      fileError={undefined}
      onApprove={() => {}}
      onReturn={() => {}}
      onReopen={() => {}}
      reopening={false}
      reopenError={undefined}
      onRecordCheque={() => {}}
      onBack={() => {}}
      {...overrides}
    />,
  );
  return { onDraftChange };
}

const open = statementItcSeptember.lines.filter(line => ['ready', 'to-check', 'unrecognised'].includes(line.state));
const lineById = (id: string) => statementItcSeptember.lines.find(line => line.id === id)!;
const proofOf = (id: string) => lineById(id).availableProof ?? lineById(id).proof ?? { kind: 'file' as const, name: 'preuve.pdf', source: 'upload' as const };
/** Un brouillon où chaque ligne ouverte est imputée avec sa preuve et sa proposition, et chaque écartée qualifiée. */
function allTreated(): Record<string, LineWork> {
  const works: Record<string, LineWork> = {};
  for (const line of open) {
    works[line.id] = { ...emptyWork, tenantId: line.tenantId ?? 'tn-afrik', proof: proofOf(line.id), decision: 'impute' };
    if (line.tenantId === null) works[line.id] = { ...works[line.id]!, amounts: { 'fa-0612-r': line.amount } };
  }
  works['l-09'] = { ...emptyWork, qualification: { reason: 'internal-transfer', note: null } };
  return works;
}

describe('ReconcileStatementScreen', () => {
  it("propose d'importer le relevé tant qu'il ne l'est pas, puis de continuer", () => {
    const { onDraftChange } = renderScreen({ step: 'import' });
    expect(screen.queryByRole('button', { name: fr['reconcile.action.continue'] })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: fr['reconcile.action.import'] }));
    expect(onDraftChange).toHaveBeenCalledWith(expect.objectContaining({ imported: true }));
    cleanup();
    renderScreen({ step: 'import', imported: true });
    expect(screen.getByRole('button', { name: fr['reconcile.action.continue'] })).toBeTruthy();
  });

  it('impute les lignes prêtes qui ont leur preuve et garde celles qui attendent un justificatif', () => {
    const ready = statementItcSeptember.lines.filter(line => line.state === 'ready');
    const works: Record<string, LineWork> = { 'l-05': { ...emptyWork, proof: lineById('l-05').availableProof } };
    const { onDraftChange } = renderScreen({ step: 'reconcile', imported: true, tab: 'ready', works });
    expect(screen.getByText(fr['reconcile.lines.remaining'].replace('{count}', String(open.length)))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: fr['reconcile.action.imputeReady'].replace('{count}', '1') }));
    const next = onDraftChange.mock.calls[0]![0] as ReconcileDraft;
    expect(next.works['l-05']?.decision).toBe('impute');
    expect(next.works['l-06']?.decision).toBeUndefined();
    expect(ready).toHaveLength(2);
  });

  it('refuse d’imputer sans preuve, sans locataire ou sans ventilation complète', () => {
    expect(imputeBlock(lineById('l-05'), emptyWork, statementTenantsItc)).toBe('no-proof');
    expect(imputeBlock(lineById('l-10'), emptyWork, statementTenantsItc)).toBe('no-tenant');
    expect(imputeBlock(lineById('l-09'), emptyWork, statementTenantsItc)).toBe('internal');
    const withProof: LineWork = { ...emptyWork, proof: proofOf('l-05') };
    expect(imputeBlock(lineById('l-05'), withProof, statementTenantsItc)).toBeNull();
    expect(imputeBlock(lineById('l-05'), { ...withProof, amounts: { 'fa-0915-r': 1_000_000, 'fa-0915-c': 0 } }, statementTenantsItc)).toBe('remaining');
    expect(imputeBlock(lineById('l-05'), { ...withProof, amounts: { 'fa-0915-r': 1_000_000, 'fa-0915-c': 0 }, offAccount: { amount: 4_100_000, reason: '' } }, statementTenantsItc)).toBe('off-reason');
  });

  it('propose les factures les plus anciennes d’abord (Q17) et passe le surplus en réglé d’avance', () => {
    const afrik = statementTenantsItc.find(tn => tn.id === 'tn-afrik')!;
    expect(proposeAmounts(afrik.invoices, 6_000_000)).toEqual({ 'fa-0612-r': 6_000_000, 'fa-0612-c': 0, 'fa-0912-r': 0, 'fa-0912-c': 0 });
    const pharma = lineById('l-05');
    const decisions = buildDecisions({ ...statementItcSeptember, lines: [{ ...pharma, amount: 5_600_000 }] }, { 'l-05': { ...emptyWork, proof: proofOf('l-05'), decision: 'impute' } });
    expect(decisions[0]?.action === 'impute' && decisions[0].allocations.find(a => a.kind === 'advance')?.amount).toBe(500_000);
  });

  it('bloque la validation tant qu’une ligne écartée reste à qualifier, puis l’ouvre', () => {
    const works = allTreated();
    delete works['l-09'];
    const { onDraftChange } = renderScreen({ step: 'reconcile', imported: true, works });
    expect(screen.getByText(fr['reconcile.lines.toQualify'].replace('{count}', '1'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: fr['reconcile.action.qualify'] }));
    expect(onDraftChange).toHaveBeenCalledWith(expect.objectContaining({ tab: 'excluded', selected: 'l-09' }));
    cleanup();
    renderScreen({ step: 'reconcile', imported: true, works: allTreated() });
    expect(screen.getByText(fr['reconcile.lines.allDone'])).toBeTruthy();
    expect((screen.getByRole('button', { name: fr['reconcile.step.validate'] }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('ouvre la fenêtre récapitulative avant de valider, et refuse sans le droit', () => {
    const onValidate = vi.fn();
    renderScreen({ step: 'validate', imported: true, works: allTreated() }, { onValidate });
    fireEvent.click(screen.getByRole('button', { name: fr['reconcile.action.validate'] }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: fr['reconcile.action.validate'] }).at(-1)!);
    expect(onValidate).toHaveBeenCalledTimes(1);
    cleanup();
    renderScreen({ step: 'validate', imported: true, works: allTreated() }, { canValidate: false });
    expect(screen.queryByRole('button', { name: fr['reconcile.action.validate'] })).toBeNull();
    expect(screen.getByText(fr['reconcile.validate.noRight'])).toBeTruthy();
  });

  it('montre le dossier mensuel soumis et ses actions au gestionnaire de patrimoine', () => {
    const validated = { ...statementItcSeptember, status: 'validated' as const, file: { version: 1, status: 'submitted' as const, validatedAt: '2026-10-28T10:00:00Z', validatedBy: 'Vincent C.', submittedTo: 'Eléma B.', approvedAt: null, approvedBy: null, sentAt: null, comment: null, collectedAmount: 1, imputedCount: 9, excludedCount: 2, ignoredCount: 0, changes: 0 } };
    const onApprove = vi.fn();
    renderScreen({}, { statement: validated, canApprove: true, onApprove });
    fireEvent.click(screen.getByRole('button', { name: fr['file.action.approve'] }));
    expect(onApprove).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: fr['file.action.approve'] }).at(-1)!);
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(fr['status.file.submitted']).length).toBeGreaterThan(0);
  });
});
