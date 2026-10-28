import type { NotificationItem } from '@/services/contracts';

export const notificationsAll: NotificationItem[] = [
  { id: 'n-1', title: 'Chèque rejeté · Afrik Logistique', detail: 'N° 0072214 · 3 250 000 · provision insuffisante', at: '2026-10-16T09:30:00Z', target: 'collection', read: false },
  { id: 'n-2', title: 'CRG T3 2026 · ITC en attente de relecture', detail: 'Préparé par Vincent, 3 signatures restantes', at: '2026-10-15T16:00:00Z', target: 'report', read: false },
  { id: 'n-3', title: 'Relevé SGCI · ITC · septembre reçu', detail: '24 lignes de crédit à rapprocher', at: '2026-10-03T08:10:00Z', target: 'collection', read: false },
  { id: 'n-4', title: 'Bail Optique Marcory : préavis dans 15 jours', detail: 'Échéance du bail le 31.01.2027', at: '2026-10-14T07:00:00Z', target: 'asset', read: true },
];
