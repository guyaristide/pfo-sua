import { describe, expect, it } from 'vitest';
import { reportStatus, statementStatus } from '../../src/shared/status';
import { fr } from '../../src/i18n/fr';

/** Le mappage des statuts vers leurs libellés et couleurs est une règle, pas de l'affichage : il se teste. */
describe('statuts', () => {
  it('chaque statut de relevé a un libellé au catalogue et un ton', () => {
    for (const [value, definition] of Object.entries(statementStatus)) {
      expect(fr[definition.labelKey], value).toBeTruthy();
      expect(['neutral', 'info', 'success', 'warning', 'danger', 'inverse']).toContain(definition.tone);
    }
  });

  it('un CRG signé ou validé est en succès, un brouillon en attente', () => {
    expect(reportStatus.signed.tone).toBe('success');
    expect(reportStatus.validated.tone).toBe('success');
    expect(reportStatus.draft.tone).toBe('neutral');
  });
});
