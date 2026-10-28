import { formatMoney, formatPercent } from './money';
import { formatDayAndMonth, formatLongDate, formatMonthYear, formatShortDate } from './date';

/**
 * Les formateurs liés au client (devise, locale, fuseau). Construits une fois depuis la session et
 * passés aux écrans en props : l'interface ne connaît ni la devise ni la locale.
 */
export interface Formatters {
  money(amount: number): string;
  moneyPlain(amount: number): string;
  moneyCompact(amount: number): string;
  percent(ratio: number, fractionDigits?: number): string;
  longDate(iso: string): string;
  shortDate(iso: string): string;
  monthYear(iso: string): string;
  dayMonth(iso: string): { day: string; month: string };
  /** Symbole ou code de la devise, tel que la locale l'écrit (unité des champs de montant). */
  currencyLabel: string;
  /** Nom du mois (1 à 12) dans la langue du client. */
  monthName(month: number): string;
  signedPoints(delta: number): string;
}

export interface TenantFormatSettings {
  currency: string;
  locale: string;
  timeZone: string;
}

export function createFormatters({ currency, locale, timeZone }: TenantFormatSettings): Formatters {
  const dateOptions = { locale, timeZone };
  const points = new Intl.NumberFormat(locale, { signDisplay: 'always', maximumFractionDigits: 1 });
  const currencyLabel = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0).find(part => part.type === 'currency')?.value ?? currency;
  return {
    money: amount => formatMoney(amount, { currency, locale, style: 'full' }),
    moneyPlain: amount => formatMoney(amount, { currency, locale, style: 'plain' }),
    moneyCompact: amount => formatMoney(amount, { currency, locale, style: 'compact' }),
    percent: (ratio, fractionDigits = 0) => formatPercent(ratio, locale, fractionDigits),
    longDate: iso => formatLongDate(iso, dateOptions),
    shortDate: iso => formatShortDate(iso, dateOptions),
    monthYear: iso => formatMonthYear(iso, dateOptions),
    dayMonth: iso => formatDayAndMonth(iso, dateOptions),
    monthName: month => new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, month - 1, 15))),
    signedPoints: delta => points.format(delta),
    currencyLabel,
  };
}
