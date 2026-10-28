import { describe, expect, it } from 'vitest';
import { listSources, offenders, scan } from './sources';

/**
 * Cliquet : un seul loader, le loader PFO, rendu par `LoadingState` et nulle part ailleurs (règle 2).
 */
const sources = listSources();

describe('chargement', () => {
  it('QueryState rend LoadingState', () => {
    const helper = sources.find(f => f.path === 'app/query-state.tsx');
    expect(helper && /<LoadingState\b/.test(helper.text)).toBe(true);
  });

  it('le composant Loader ne se rend que dans LoadingState', () => {
    const outside = sources.filter(f => f.path !== 'ui/primitives/States.tsx' && f.path !== 'ui/primitives/Loader.tsx');
    const found = scan(outside, /<Loader\b|from ['"]\.\/Loader['"]|primitives\/Loader['"]/);
    expect(found, offenders(found, 'Affichez <LoadingState /> ; le loader PFO est dedans.')).toEqual([]);
  });

  it("aucun spinner maison en plus du loader PFO", () => {
    const found = scan(sources, /className=["'][^"']*\bspinner\b|animation:\s*spin\b/);
    expect(found, offenders(found, 'Un seul état de chargement : <LoadingState />.')).toEqual([]);
  });

  it('chaque page qui attend une requête rend LoadingState', () => {
    // Une page qui lit des données (useGet*, useList*) ; une mutation seule montre son attente sur le bouton.
    const pages = sources.filter(f => f.path.startsWith('app/pages/') && /\buse(Get|List)\w*\(/.test(f.text));
    const missing = pages.filter(f => !/<LoadingState\b|<QueryState\b/.test(f.text)).map(f => f.path);
    expect(missing, 'Une attente se montre avec <LoadingState /> ou <QueryState>, jamais avec un rendu vide.').toEqual([]);
  });
});
