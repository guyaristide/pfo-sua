import { describe, expect, it } from 'vitest';
import { listSources, offenders, scan } from './sources';

/**
 * Cliquets d'architecture : la séparation UI ↔ services ↔ mocks est vérifiée par ces tests,
 * sinon elle se délite en trois sprints (règle 1).
 */
const sources = listSources();
const inDir = (prefix: string) => sources.filter(f => f.path.startsWith(prefix));
const importOf = (segment: string) => new RegExp(`from ['"][^'"]*(^|/)${segment}(/|['"])`);

describe('couche ui', () => {
  const ui = inDir('ui/');

  it("n'importe jamais services/hooks, services/http ni mocks", () => {
    const found = [
      ...scan(ui, /from ['"]@\/services\/(hooks|http|service-context)/),
      ...scan(ui, /from ['"]@\/mocks/),
    ];
    expect(found, offenders(found, "L'interface reçoit ses données en props depuis src/app/pages.")).toEqual([]);
  });

  it("n'appelle pas le réseau", () => {
    const found = scan(ui, /\bfetch\(|XMLHttpRequest|axios/);
    expect(found, offenders(found, 'Les appels réseau vivent dans src/services/http uniquement.')).toEqual([]);
  });
});

describe('couche services', () => {
  const services = inDir('services/');

  it("n'importe ni ui ni mocks", () => {
    const found = [...scan(services, /from ['"]@\/ui/), ...scan(services, /from ['"]@\/mocks/)];
    expect(found, offenders(found, 'Les services ne connaissent ni le rendu ni les données simulées.')).toEqual([]);
  });
});

describe('mocks', () => {
  it('ne sont importés que par la composition (src/app/services-factory.ts)', () => {
    const outside = sources.filter(f => !f.path.startsWith('mocks/') && f.path !== 'app/services-factory.ts');
    const found = scan(outside, importOf('mocks'));
    expect(found, offenders(found, 'Seul app/services-factory.ts choisit entre mocks et http.')).toEqual([]);
  });
});

describe('réseau et session', () => {
  it('fetch ne se trouve que dans services/http', () => {
    const outside = sources.filter(f => !f.path.startsWith('services/http/'));
    const found = scan(outside, /\bfetch\(/);
    expect(found, offenders(found, 'Un seul client HTTP, dans src/services/http (règle 17).')).toEqual([]);
  });

  it('le jeton ne se lit que dans services/http/session-store.ts', () => {
    const outside = sources.filter(f => f.path !== 'services/http/session-store.ts');
    const found = scan(outside, /localStorage/);
    expect(found, offenders(found, 'Une seule couche connaît le jeton (règle 16).')).toEqual([]);
  });

  it('les brouillons ne se rangent que dans services/storage/draft-store.ts', () => {
    const outside = sources.filter(f => f.path !== 'services/storage/draft-store.ts');
    const found = scan(outside, /sessionStorage/);
    expect(found, offenders(found, 'Passez par useDraft (règle 9).')).toEqual([]);
  });
});

describe('habilitations', () => {
  it('les constantes de permission ne sont référencées que dans shared/auth et les pages', () => {
    const allowed = (p: string) => p.startsWith('shared/auth/') || p.startsWith('app/pages/') || p.startsWith('mocks/');
    const found = scan(
      sources.filter(f => !allowed(f.path)),
      /PERMISSIONS\.|['"](asset|tenant|lease|invoice|collection|report|budget)\.(read|write|issue|record|validate)['"]/,
    );
    expect(found, offenders(found, 'Passez par CanAccess ou usePermission (règle 14).')).toEqual([]);
  });
});
