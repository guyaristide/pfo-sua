// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecordChequeScreen, emptyChequeForm, validateChequeForm, toChequeInput } from '../../src/ui/screens/RecordChequeScreen';
import { createFormatters } from '../../src/shared/format/formatters';
import { tenantsAll } from '../../src/mocks/fixtures/tenants';
import { fr } from '../../src/i18n/fr';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });
afterEach(cleanup);

const filled = { amount: '1200000', bank: 'BLCI', chequeNumber: '0045822', payee: 'SCI ITC', receivedOn: '2026-10-12', tenantId: tenantsAll[0]!.id };

describe('validateChequeForm', () => {
  it('exige chaque champ et un montant en chiffres', () => {
    expect(Object.keys(validateChequeForm(emptyChequeForm))).toHaveLength(6);
    expect(validateChequeForm({ ...filled, amount: '1 200 000' }).amount).toBe(fr['form.invalidAmount']);
    expect(validateChequeForm(filled)).toEqual({});
    expect(toChequeInput(filled).amount).toBe(1_200_000);
  });
});

describe('RecordChequeScreen', () => {
  it("n'envoie pas un formulaire incomplet et rend ses erreurs visibles à la tentative", () => {
    const onSubmit = vi.fn();
    const onDraftChange = vi.fn();
    render(
      <RecordChequeScreen
        tenants={tenantsAll}
        fmt={fmt}
        draft={{ step: 'check', form: { ...filled, bank: '' } }}
        onDraftChange={onDraftChange}
        onUseSample={() => {}}
        onSubmit={onSubmit}
        submitting={false}
        submitError={undefined}
        record={null}
        onAnother={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.queryByText(fr['form.errors.one'])).toBeNull();
    const confirm = screen.getByRole('button', { name: fr['cheque.action.confirm'] }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onDraftChange).toHaveBeenCalledWith(expect.objectContaining({ attempted: true }));
  });

  it('montre le locataire proposé et son dû quand le formulaire est complet', () => {
    render(
      <RecordChequeScreen
        tenants={tenantsAll}
        fmt={fmt}
        draft={{ step: 'check', form: filled }}
        onDraftChange={() => {}}
        onUseSample={() => {}}
        onSubmit={() => {}}
        submitting={false}
        submitError={undefined}
        record={null}
        onAnother={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getByText(tenantsAll[0]!.dueDetail)).toBeTruthy();
    expect(screen.getByText(fr['draft.saved'])).toBeTruthy();
  });
});
