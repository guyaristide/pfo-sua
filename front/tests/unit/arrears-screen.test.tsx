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
    const rows = arrearsAll.rows.slice(0, 20);
    const menuOf = (index: number) => fireEvent.click(screen.getAllByRole('button', { name: fr['menu.rowActions'] })[index]!);
    const remindIn = (index: number) => {
      menuOf(index);
      const found = screen.queryByRole('menuitem', { name: fr['arrears.action.remind'] }) !== null;
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      return found;
    };
    render(<ArrearsScreen overview={arrearsAll} fmt={fmt} canRemind onRemind={() => {}} onOpen={() => {}} />);
    const remindable = rows.findIndex(r => r.reminderLevel !== 'pre-litigation');
    const blocked = rows.findIndex(r => r.reminderLevel === 'pre-litigation');
    expect(remindIn(remindable)).toBe(true);
    if (blocked >= 0) expect(remindIn(blocked)).toBe(false);
    cleanup();
    render(<ArrearsScreen overview={arrearsAll} fmt={fmt} canRemind={false} onRemind={() => {}} onOpen={() => {}} />);
    expect(remindIn(remindable)).toBe(false);
  });
});
