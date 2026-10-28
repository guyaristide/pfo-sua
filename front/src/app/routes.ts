import type { ObjectKey } from '@/shared/objects';

/** Les neuf entrées de la barre latérale validée par le client, dans son ordre. */
export const routes: { object: ObjectKey; path: string }[] = [
  { object: 'dashboard', path: '/' },
  { object: 'asset', path: '/assets' },
  { object: 'invoice', path: '/billing' },
  { object: 'collection', path: '/collections' },
  { object: 'arrears', path: '/arrears' },
  { object: 'report', path: '/reports' },
  { object: 'budget', path: '/budget' },
  { object: 'document', path: '/documents' },
  { object: 'settings', path: '/settings' },
];
