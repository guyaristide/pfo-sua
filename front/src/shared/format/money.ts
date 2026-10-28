/**
 * Formateur unique des montants (règle 6 : la devise vient du client, jamais d'un littéral).
 * Les montants circulent en entiers dans l'unité principale de la devise (le franc CFA n'a pas de centimes).
 */
export interface MoneyFormatOptions {
  currency: string;
  locale: string;
  /** "compact" affiche 28,4 M ; "full" affiche 28 450 000 F CFA. */
  style?: 'full' | 'compact' | 'plain';
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(key: string, factory: () => Intl.NumberFormat): Intl.NumberFormat {
  let f = formatters.get(key);
  if (!f) {
    f = factory();
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number, options: MoneyFormatOptions): string {
  const { currency, locale, style = 'full' } = options;
  if (style === 'plain') {
    return formatter(`plain:${locale}`, () =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    ).format(amount);
  }
  if (style === 'compact') {
    return formatter(`compact:${locale}:${currency}`, () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    ).format(amount);
  }
  return formatter(`full:${locale}:${currency}`, () =>
    new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }),
  ).format(amount);
}

export function formatPercent(ratio: number, locale: string, fractionDigits = 0): string {
  return formatter(`pct:${locale}:${fractionDigits}`, () =>
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }),
  ).format(ratio);
}
