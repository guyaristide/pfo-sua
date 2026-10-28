import { describe, expect, it } from 'vitest';
import { listSources, offenders, scan } from './sources';
import { fr } from '../../src/i18n/fr';

/**
 * Cliquets de vocabulaire : technique en anglais, humain dans le catalogue (règles 6, 7, 13).
 */
const sources = listSources();
const rendering = sources.filter(f => f.path.startsWith('ui/') || f.path.startsWith('app/'));

describe('français en dur dans le rendu', () => {
  it('aucun texte en français dans un nœud JSX', () => {
    // Un nœud texte JSX contenant au moins deux lettres consécutives : >Texte< ou > Texte{
    const found = scan(rendering, />\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’ ]{2,}\s*(<|\{)/).filter(
      f => !/<(title|caption)/.test(f.snippet),
    );
    expect(found, offenders(found, 'Passez par t("clé") et ajoutez la clé au catalogue src/i18n/fr.ts.')).toEqual([]);
  });

  it('aucune chaîne accentuée hors du catalogue, des mocks et des commentaires', () => {
    const outside = sources.filter(f => !f.path.startsWith('i18n/') && !f.path.startsWith('mocks/'));
    const found = scan(outside, /['"`][^'"`]*[àâçéèêëîïôûùüÿœ][^'"`]*['"`]/i).filter(f => !/^\s*(\/\/|\*|\/\*)/.test(f.snippet));
    expect(found, offenders(found, 'Un libellé affiché vit dans src/i18n/fr.ts.')).toEqual([]);
  });
});

describe('devise', () => {
  it("le symbole monétaire n'est jamais écrit en dur", () => {
    const found = scan(sources, /FCFA|F CFA|XOF|€/).filter(
      f => !(f.path.startsWith('mocks/') && /currency:/.test(f.snippet)) && !/^\s*(\/\/|\*|\/\*)/.test(f.snippet),
    );
    expect(found, offenders(found, 'La devise vient de la session, via createFormatters (règle 6).')).toEqual([]);
  });
});

describe('nommage technique', () => {
  it('aucun nom de fichier en français', () => {
    const french = /(facture|locataire|bail|encaissement|impay|actif|proprietaire|utilisateur|tableau)/i;
    const found = sources.filter(f => french.test(f.path.split('/').pop() ?? ''));
    expect(found.map(f => f.path), 'Les noms de fichiers sont en anglais (règle 7).').toEqual([]);
  });

  it('aucun identifiant exporté en français', () => {
    const found = scan(
      sources,
      /export (const|function|interface|type|class) (get|use|set|create)?(Facture|Locataire|Bail|Encaissement|Impaye|Actif|Proprietaire|Utilisateur)/,
    );
    expect(found, offenders(found, 'Les symboles sont en anglais (règle 7).')).toEqual([]);
  });
});

describe('catalogue', () => {
  it('chaque clé appelée existe', () => {
    const keys = new Set(Object.keys(fr));
    const found: { path: string; line: number; snippet: string }[] = [];
    for (const file of sources) {
      file.text.split('\n').forEach((line, index) => {
        for (const match of line.matchAll(/\bt\(\s*'([^']+)'/g)) {
          if (!keys.has(match[1]!)) found.push({ path: file.path, line: index + 1, snippet: match[1]! });
        }
      });
    }
    expect(found, offenders(found, 'Ajoutez la clé à src/i18n/fr.ts.')).toEqual([]);
  });

  it("n'utilise ni tiret cadratin ni ornement", () => {
    const found = scan(sources, /—|→|✓|•/).filter(f => !/^\s*(\/\/|\*|\/\*)/.test(f.snippet) && !f.path.startsWith('mocks/'));
    expect(found, offenders(found, 'Sobriété : pas de tiret cadratin ni de pictogramme typographique.')).toEqual([]);
  });
});
