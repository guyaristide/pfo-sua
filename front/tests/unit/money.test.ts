import { describe, expect, it } from 'vitest';
import { createFormatters } from '../../src/shared/format/formatters';

const fmt = createFormatters({ currency: 'XOF', locale: 'fr-CI', timeZone: 'Africa/Abidjan' });

describe('formatMoney', () => {
  it('affiche un montant entier avec sa devise, sans décimales', () => {
    const text = fmt.money(28_450_000);
    expect(text.replace(/ | /g, ' ')).toMatch(/^28 450 000 F ?CFA$/);
  });

  it('affiche un montant brut sans devise', () => {
    expect(fmt.moneyPlain(4_650_000).replace(/ | /g, ' ')).toBe('4 650 000');
  });

  it('affiche un pourcentage avec le nombre de décimales demandé', () => {
    expect(fmt.percent(0.92)).toMatch(/92/);
    expect(fmt.percent(0.055, 1)).toMatch(/5,5/);
  });

  it('signe toujours une variation en points', () => {
    expect(fmt.signedPoints(-1)).toBe('-1');
    expect(fmt.signedPoints(0.6)).toBe('+0,6');
  });
});

describe('dates', () => {
  it('rend une date courte dans le fuseau du client', () => {
    expect(fmt.shortDate('2026-10-16T07:00:00Z')).toBe('16/10/2026');
  });

  it('sépare jour et mois pour une échéance', () => {
    const { day, month } = fmt.dayMonth('2026-11-05');
    expect(day).toBe('05');
    expect(month.toLowerCase()).toMatch(/^nov/);
  });
});
