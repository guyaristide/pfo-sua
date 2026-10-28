// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AssetSwitcher } from '../../src/ui/shell/AssetSwitcher';
import { fr } from '../../src/i18n/fr';

afterEach(cleanup);

const assets = [
  { id: 'itc', name: 'ITC', buildingCount: 4, lotCount: 86 },
  { id: 'tj', name: 'Les Trois Jardins', buildingCount: 2, lotCount: 64 },
];

describe('AssetSwitcher', () => {
  it('affiche « Tous les actifs » par défaut et ouvre un menu à la demande', () => {
    render(<AssetSwitcher assets={assets} selectedAssetId={undefined} onSelect={() => {}} />);
    expect(screen.getByText(fr['assetSwitcher.all'])).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(3);
  });

  it("remonte l'identifiant choisi, ou undefined pour « Tous les actifs », puis se referme", () => {
    const onSelect = vi.fn();
    render(<AssetSwitcher assets={assets} selectedAssetId="itc" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Les Trois Jardins'));
    expect(onSelect).toHaveBeenCalledWith('tj');
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(fr['assetSwitcher.all']));
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it('se ferme avec la touche Échap', () => {
    render(<AssetSwitcher assets={assets} selectedAssetId="itc" onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
