import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const SRC_ROOT = join(import.meta.dirname, '..', '..', 'src');

export interface SourceFile {
  /** Chemin relatif à `src/`, séparateur `/`. */
  path: string;
  text: string;
}

export function listSources(root = SRC_ROOT, extensions = ['.ts', '.tsx']): SourceFile[] {
  const files: SourceFile[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (extensions.some(ext => entry.endsWith(ext))) {
        files.push({ path: relative(root, full).split('\\').join('/'), text: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(root);
  return files;
}

/** Message d'échec qui nomme les fichiers fautifs (règle 1). */
export function offenders(found: { path: string; line: number; snippet: string }[], advice: string): string {
  const lines = found.slice(0, 15).map(f => `  ${f.path}:${f.line}  ${f.snippet.trim().slice(0, 90)}`);
  return `${found.length} occurrence(s). ${advice}\n${lines.join('\n')}`;
}

export function scan(files: SourceFile[], pattern: RegExp): { path: string; line: number; snippet: string }[] {
  const found: { path: string; line: number; snippet: string }[] = [];
  for (const file of files) {
    file.text.split('\n').forEach((snippet, index) => {
      if (pattern.test(snippet)) found.push({ path: file.path, line: index + 1, snippet });
    });
  }
  return found;
}
