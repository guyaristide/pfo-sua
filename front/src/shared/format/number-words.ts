/**
 * Montant en toutes lettres (français), pour contrôler qu'un chèque porte le même montant en chiffres
 * et en lettres (E2.6). Pas de devise : elle s'ajoute à l'affichage.
 */
const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function below100(value: number): string {
  if (value <= 16) return UNITS[value]!;
  if (value < 20) return `dix-${UNITS[value - 10]}`;
  const tens = Math.floor(value / 10);
  const unit = value % 10;
  if (tens === 7 || tens === 9) {
    const base = tens === 7 ? 'soixante' : 'quatre-vingt';
    return `${base}${unit === 1 && tens === 7 ? ' et ' : '-'}${below100(10 + unit)}`;
  }
  if (tens === 8) return `quatre-vingt${unit ? `-${UNITS[unit]}` : 's'}`;
  return `${TENS[tens]}${unit === 1 ? ' et un' : unit ? `-${UNITS[unit]}` : ''}`;
}

function below1000(value: number, last: boolean): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  let text = '';
  if (hundreds) text = `${hundreds > 1 ? `${UNITS[hundreds]} ` : ''}cent${hundreds > 1 && !rest && last ? 's' : ''}`;
  if (rest) text += `${text ? ' ' : ''}${below100(rest)}`;
  // « quatre-vingt mille » : le « s » tombe quand un autre nombre suit.
  return last ? text : text.replace(/quatre-vingts$/, 'quatre-vingt');
}

export function amountInWords(amount: number): string {
  const value = Math.floor(Math.abs(amount));
  if (value === 0) return '';
  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor(value / 1000) % 1000;
  const units = value % 1000;
  const parts: string[] = [];
  if (millions) parts.push(`${below1000(millions, false)} million${millions > 1 ? 's' : ''}`);
  if (thousands) parts.push(thousands === 1 ? 'mille' : `${below1000(thousands, false)} mille`);
  if (units) parts.push(below1000(units, true));
  return parts.join(' ');
}

/** Forme comparable d'un montant en lettres : sans accents, majuscules, tirets ni mention de devise. */
export function normalizeWords(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(francs?|f|cfa|fcfa)\b/g, ' ')
    .replace(/[-\s]+/g, ' ')
    .trim();
}

export const wordsMatchAmount = (words: string, amount: number): boolean => normalizeWords(words) === normalizeWords(amountInWords(amount));
