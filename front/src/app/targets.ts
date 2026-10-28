import type { NavigationTarget, SearchKind } from '@/services/contracts';
import { routes } from './routes';

const targetObject: Record<NavigationTarget, (typeof routes)[number]['object']> = {
  asset: 'asset',
  invoice: 'invoice',
  collection: 'collection',
  arrears: 'arrears',
  report: 'report',
  budget: 'budget',
  document: 'document',
  settings: 'settings',
};

/** Une cible métier (tâche, échéance, notification) devient un chemin de l'application, en un seul endroit. */
export function targetPath(target: NavigationTarget): string {
  return routes.find(route => route.object === targetObject[target])?.path ?? '/';
}

export function searchResultPath(kind: SearchKind, id: string): string {
  switch (kind) {
    case 'asset':
      return `/assets/${encodeURIComponent(id)}`;
    case 'tenant':
      return `/tenants/${encodeURIComponent(id)}`;
    case 'invoice':
      return `/billing/invoices/${encodeURIComponent(id)}`;
    case 'document':
      return `/documents/${encodeURIComponent(id)}`;
  }
}
