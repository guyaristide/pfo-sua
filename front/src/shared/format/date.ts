/** Dates ISO (AAAA-MM-JJ ou horodatage) → libellés. Le fuseau et la locale viennent du client. */
export interface DateFormatOptions {
  locale: string;
  timeZone: string;
}

export function formatLongDate(iso: string, { locale, timeZone }: DateFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone }).format(new Date(iso));
}

export function formatShortDate(iso: string, { locale, timeZone }: DateFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone }).format(
    new Date(iso),
  );
}

export function formatMonthYear(iso: string, { locale, timeZone }: DateFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone }).format(new Date(iso));
}

export function formatDayAndMonth(iso: string, { locale, timeZone }: DateFormatOptions): { day: string; month: string } {
  const date = new Date(iso);
  return {
    day: new Intl.DateTimeFormat(locale, { day: '2-digit', timeZone }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone }).format(date),
  };
}

/** Nombre de jours entiers entre deux dates ISO, positif quand `to` est après `from`. */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}
