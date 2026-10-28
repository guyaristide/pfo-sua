// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ArrearsScreen } from '../../src/ui/screens/ArrearsScreen';
import { createFormatters } from '../../src/shared/format/formatters';
import { arrearsAll } from '../../src/mocks/fixtures/arrears';
import { fr } from '../../src/i18n/fr';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });
afterEach(cleanup);

describe('ArrearsScreen', () => {
  it('filtre par tranche et recalcule le total sur les lignes affichées', () => {
    render(<ArrearsScreen overview={arrearsAll} fmt={fmt} canRemind onRemind={() => {}} onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: fr['status.bucket.over90'] }));
    const over90 = arrearsAll.rows.filter(r => r.bucket === 'over-90');
    expect(screen.getByText(fr['arrears.total'].replace('{count}', String(over90.length)))).toBeTruthy();
  });

  it("ne propose « Relancer » qu'avec le droit, jamais sur un dossier en pré-contentieux", () => {
    render(<ArrearsScreen overview={arrearsAll} fmt={fmt} canRemind onRemind={() => {}} onOpen={() => {}} />);
    const remindable = arrearsAll.rows.filter(r => r.reminderLevel !== 'pre-litigation').length;
    expect(screen.getAllByText(fr['arrears.action.remind'])).toHaveLength(remindable);
    cleanup();
    render(<ArrearsScreen overview={arrearsAll} fmt={fmt} canRemind={false} onRemind={() => {}} onOpen={() => {}} />);
    expect(screen.queryByText(fr['arrears.action.remind'])).toBeNull();
  });
});
