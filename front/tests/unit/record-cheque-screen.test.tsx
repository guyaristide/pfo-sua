// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecordChequeScreen, chequeIssues, emptyChequeForm, validateChequeForm, toChequeInput } from '../../src/ui/screens/RecordChequeScreen';
import { amountInWords, wordsMatchAmount } from '../../src/shared/format/number-words';
import { createFormatters } from '../../src/shared/format/formatters';
import { tenantsAll } from '../../src/mocks/fixtures/tenants';
import { fr } from '../../src/i18n/fr';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });
afterEach(cleanup);

const filled = { amount: '1200000', amountInWords: 'Un million deux cent mille', bank: 'BLCI', chequeNumber: '0045822', payee: `SCI ${tenantsAll[0]!.assetName}`, receivedOn: '2026-10-12', tenantId: tenantsAll[0]!.id, signed: true };

describe('validateChequeForm', () => {
  it('exige chaque champ et un montant en chiffres', () => {
    expect(Object.keys(validateChequeForm(emptyChequeForm))).toHaveLength(6);
    expect(validateChequeForm({ ...filled, amount: '1 200 000' }).amount).toBe(fr['form.invalidAmount']);
    expect(validateChequeForm(filled)).toEqual({});
    expect(toChequeInput(filled).amount).toBe(1_200_000);
  });

  it('écrit les montants en lettres et compare sans accents ni devise', () => {
    expect(amountInWords(1_200_000)).toBe('un million deux cent mille');
    expect(amountInWords(3_450_000)).toBe('trois millions quatre cent cinquante mille');
    expect(amountInWords(780_000)).toBe('sept cent quatre-vingt mille');
    expect(amountInWords(2_071)).toBe('deux mille soixante et onze');
    expect(wordsMatchAmount('Un million deux cent mille francs CFA', 1_200_000)).toBe(true);
    expect(wordsMatchAmount('Un million deux cent mille', 1_250_000)).toBe(false);
  });

  it('bloque un chèque dont les contrôles échouent (E2.6)', () => {
    const asset = tenantsAll[0]!.payeeName;
    expect(chequeIssues(filled, asset)).toEqual([]);
    expect(chequeIssues({ ...filled, amount: '1250000' }, asset)).toEqual(['amount-mismatch']);
    expect(chequeIssues({ ...filled, payee: '' }, asset)).toEqual(['payee-missing']);
    expect(chequeIssues({ ...filled, payee: 'PFO Immobilier', signed: false }, asset)).toEqual(['payee-wrong', 'unsigned']);
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
        onReturn={() => {}}
        onSendReturn={() => {}}
        returning={false}
        returnError={undefined}
        returned={null}
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
        onReturn={() => {}}
        onSendReturn={() => {}}
        returning={false}
        returnError={undefined}
        returned={null}
        onAnother={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getByText(tenantsAll[0]!.dueDetail)).toBeTruthy();
    expect(screen.getByText(fr['draft.saved'])).toBeTruthy();
  });
});
