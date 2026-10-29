import { saveBlob } from './save-file';
/**
 * Export tableur : CSV en UTF-8 avec BOM, séparateur point-virgule (Excel en français), une ligne d'en-tête.
 * Les écrans exportent ce qu'ils affichent, filtré comme à l'écran (règle 10).
 */
export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => string | number | null | undefined;
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<Row>(columns: CsvColumn<Row>[], rows: Row[]): string {
  const lines = [columns.map(c => cell(c.header)).join(';'), ...rows.map(row => columns.map(c => cell(c.value(row))).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}

export function downloadCsv(filename: string, content: string): void {
  saveBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function exportCsv<Row>(filename: string, columns: CsvColumn<Row>[], rows: Row[]): void {
  downloadCsv(filename, toCsv(columns, rows));
}
