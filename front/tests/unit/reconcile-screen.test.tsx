// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReconcileStatementScreen, type ReconcileDraft } from '../../src/ui/screens/ReconcileStatementScreen';
import { createFormatters } from '../../src/shared/format/formatters';
import { statementItcSeptember } from '../../src/mocks/fixtures/statements';
import { fr } from '../../src/i18n/fr';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });
afterEach(cleanup);

function renderScreen(draft: ReconcileDraft, overrides: Partial<Parameters<typeof ReconcileStatementScreen>[0]> = {}) {
  const onDraftChange = vi.fn();
  render(
    <ReconcileStatementScreen
      statement={statementItcSeptember}
      fmt={fmt}
      draft={draft}
      onDraftChange={onDraftChange}
      onValidate={() => {}}
      validating={false}
      validationError={undefined}
      result={null}
      canValidate
      onRecordCheque={() => {}}
      onBack={() => {}}
      {...overrides}
    />,
  );
  return { onDraftChange };
}

const pending = statementItcSeptember.lines.filter(line => ['ready', 'to-check', 'unrecognised'].includes(line.state));

describe('ReconcileStatementScreen', () => {
  it("bloque « Continuer » tant que le relevé n'est pas importé, puis le libère", () => {
    const { onDraftChange } = renderScreen({ step: 'import', imported: false, decisions: {}, explainerDismissed: true });
    const next = screen.getByRole('button', { name: fr['reconcile.action.continue'] }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: fr['reconcile.action.import'] }));
    expect(onDraftChange).toHaveBeenCalledWith(expect.objectContaining({ imported: true }));
  });

  it('confirme toutes les lignes prêtes en un geste et compte ce qui reste', () => {
    const { onDraftChange } = renderScreen({ step: 'reconcile', imported: true, decisions: {}, explainerDismissed: true });
    expect(screen.getByText(fr['reconcile.lines.remaining'].replace('{count}', String(pending.length)))).toBeTruthy();
    const ready = statementItcSeptember.lines.filter(line => line.state === 'ready');
    fireEvent.click(screen.getByRole('button', { name: fr['reconcile.action.confirmAllReady'].replace('{count}', String(ready.length)) }));
    const next = onDraftChange.mock.calls[0]![0] as ReconcileDraft;
    expect(Object.keys(next.decisions)).toHaveLength(ready.length);
    expect(Object.values(next.decisions).every(action => action === 'confirm')).toBe(true);
  });

  it("n'ouvre la validation qu'une fois chaque ligne traitée", () => {
    const decisions = Object.fromEntries(pending.map(line => [line.id, line.tenantName ? 'confirm' : 'exclude'])) as ReconcileDraft['decisions'];
    renderScreen({ step: 'reconcile', imported: true, decisions, explainerDismissed: true });
    expect(screen.getByText(fr['reconcile.lines.allDone'])).toBeTruthy();
    const validate = screen.getByRole('button', { name: fr['reconcile.step.validate'] }) as HTMLButtonElement;
    expect(validate.disabled).toBe(false);
  });

  it('refuse la validation sans le droit', () => {
    const decisions = Object.fromEntries(pending.map(line => [line.id, 'exclude'])) as ReconcileDraft['decisions'];
    renderScreen({ step: 'validate', imported: true, decisions, explainerDismissed: true }, { canValidate: false });
    const validate = screen.getByRole('button', { name: fr['reconcile.action.validate'] }) as HTMLButtonElement;
    expect(validate.disabled).toBe(true);
  });
});
