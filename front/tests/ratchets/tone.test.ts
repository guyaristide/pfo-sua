import { describe, expect, it } from 'vitest';
import { fr } from '../../src/i18n/fr';

/**
 * Cliquet de ton : un libellé d'application est court et ne commente pas le fonctionnement du logiciel.
 * Retour du responsable (28/10/2026) : « le wording est souvent trop robotique ».
 */
const MAX_LENGTH = 90;
/** Textes validés avec le prototype d'Elodie, volontairement plus longs. */
const allowed = new Set<string>([
  'login.code.body',
  'login.noAccess',
  'login.tagline',
  'reconcile.explainer.1.body',
  'reconcile.explainer.2.body',
  'reconcile.explainer.3.body',
  'cheque.capture.body',
  'state.error.body',
]);
const robotic = [/\bSUA vous\b/i, /\bchaque modification\b/i, /\ble serveur\b/i, /\brègle \d/i, /\boffre technique\b/i, /\bs’écrase\b|\bs'écrase\b/i];

describe('ton des libellés', () => {
  it('aucun libellé au-delà de 90 caractères hors textes du prototype', () => {
    const long = Object.entries(fr)
      .filter(([key, value]) => value.length > MAX_LENGTH && !allowed.has(key))
      .map(([key, value]) => `${key} (${value.length})`);
    expect(long, 'Raccourcissez : un libellé explique en une ligne, sans discours.').toEqual([]);
  });

  it('aucun libellé ne parle du logiciel à la place de la personne', () => {
    const found = Object.entries(fr)
      .filter(([, value]) => robotic.some(pattern => pattern.test(value)))
      .map(([key, value]) => `${key}: ${value}`);
    expect(found, 'Dites ce que la personne fait ou obtient, pas comment le logiciel marche.').toEqual([]);
  });
});
