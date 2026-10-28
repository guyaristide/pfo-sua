import { fr, type MessageKey } from './fr';

type Params = Record<string, string | number>;

/** Lit un libellé du catalogue et remplace les {paramètres}. Une clé inconnue est une erreur de build (type MessageKey). */
export function t(key: MessageKey, params?: Params): string {
  const template: string = fr[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

export function hasMessage(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(fr, key);
}
