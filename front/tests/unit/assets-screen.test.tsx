// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { AssetsScreen } from '../../src/ui/screens/AssetsScreen';
import { createFormatters } from '../../src/shared/format/formatters';
import { assets } from '../../src/mocks/fixtures/assets';
import { fr } from '../../src/i18n/fr';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });

// Sans `globals: true`, Testing Library ne nettoie pas le DOM entre deux tests : le second trouvait deux listes.
afterEach(cleanup);

describe('AssetsScreen', () => {
  it('affiche les actifs reçus en props, avec le total des lots qui somme les lignes', () => {
    render(<AssetsScreen assets={assets} fmt={fmt} canCreate onOpenAsset={() => {}} onNew={() => {}} />);
    expect(screen.getByText('ITC')).toBeTruthy();
    const totalLots = assets.reduce((sum, a) => sum + a.lotCount, 0);
    expect(screen.getByText(String(totalLots))).toBeTruthy();
  });

  it("n'affiche « Nouvel actif » qu'avec le droit", () => {
    const { rerender } = render(<AssetsScreen assets={assets} fmt={fmt} canCreate={false} onOpenAsset={() => {}} onNew={() => {}} />);
    expect(screen.queryByText(fr['assets.new'])).toBeNull();
    rerender(<AssetsScreen assets={assets} fmt={fmt} canCreate onOpenAsset={() => {}} onNew={() => {}} />);
    expect(screen.getByText(fr['assets.new'])).toBeTruthy();
  });

  it('filtre dans la liste et propose un état vide avec explication', () => {
    render(<AssetsScreen assets={assets} fmt={fmt} canCreate onOpenAsset={() => {}} onNew={() => {}} />);
    fireEvent.change(screen.getByLabelText(fr['list.search.placeholder']), { target: { value: 'zzz' } });
    expect(screen.getByText(fr['assets.empty.title'])).toBeTruthy();
  });

  it('ouvre une fiche au clic sur le nom de l’actif', () => {
    const onOpen = vi.fn();
    render(<AssetsScreen assets={assets} fmt={fmt} canCreate onOpenAsset={onOpen} onNew={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: assets[0]!.name }));
    expect(onOpen).toHaveBeenCalledWith(assets[0]!.id);
  });
});
