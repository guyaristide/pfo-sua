import { describe, expect, it } from 'vitest';
import { listSources, offenders, scan } from './sources';

/**
 * Cliquets de forme UI (référentiel SLDS, §10.3) : une dérive corrigée ne doit pas revenir.
 * Les écrans composent des primitives ; le dessin vit dans src/ui/primitives et le thème.
 */
const sources = listSources();
const screens = sources.filter(f => (f.path.startsWith('ui/') || f.path.startsWith('app/')) && !f.path.startsWith('ui/primitives/'));
const styles = listSources(undefined, ['.css']);

describe('écrans', () => {
  it('aucun style en ligne hors des primitives', () => {
    // display: contents sur un <form> qui enveloppe une mise en page grille reste admis.
    const found = scan(screens, /style=\{\{/).filter(f => !/style=\{\{ display: 'contents' \}\}/.test(f.snippet));
    expect(found, offenders(found, 'Utilisez Stack, Inline, FormActions, RecordLayout ou une classe de primitives.css.')).toEqual([]);
  });

  it("aucune classe de bouton posée à la main", () => {
    const found = scan(screens, /className=["{`][^"]*\bbtn\b/);
    expect(found, offenders(found, 'Un bouton est un <Button> ; un choix de fichier est un <FileButton>.')).toEqual([]);
  });

  it('aucun champ fichier natif', () => {
    const found = scan(screens, /type="file"/);
    expect(found, offenders(found, 'Passez par FileButton ou FileDrop (focus, clavier, glisser-déposer).')).toEqual([]);
  });

  it('aucune classe empruntée ou retirée', () => {
    const retired = /\b(kpi-button|deposit-list|summary-list|check-list|line-panel|file-card|layout-two|table__primary)\b/;
    const found = scan(screens, retired);
    expect(found, offenders(found, 'Ces classes ont été remplacées par KpiRow, RelatedList, FieldGrid, Checklist, DetailPanel, RecordLayout et RecordLink.')).toEqual([]);
  });
});

describe('feuilles de style', () => {
  // Les jetons se définissent dans le thème ; l'écran de connexion reprend le prototype validé d'Elodie.
  const owners = new Set(['ui/theme/sua-tokens.css', 'ui/theme/backoffice.css', 'ui/screens/auth/login.css']);
  const sheets = styles.filter(f => !owners.has(f.path));

  it('aucune taille de police en pixels hors du thème', () => {
    const found = scan(sheets, /font-size:\s*\d+px/);
    expect(found, offenders(found, 'Utilisez --text-micro, --text-small, --text-body, --title-section, --title-page ou --title-modal.')).toEqual([]);
  });

  it('aucune ombre écrite en dur', () => {
    const found = scan(sheets, /box-shadow:\s*[^;]*rgba\(/).filter(f => !/inset/.test(f.snippet));
    expect(found, offenders(found, 'Utilisez --shadow-dropdown, --shadow-modal, --shadow-docked ou --card-shadow.')).toEqual([]);
  });
});
