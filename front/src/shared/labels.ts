import type { MessageKey } from '@/i18n/fr';
import type { DocumentKind, InvoiceItemKind, LeasePeriodicity, LotType, ReminderChannel, SearchKind } from '@/services/contracts/types';
import type { ObjectKey } from './objects';
import { t } from '@/i18n/t';

/** Un concept, un libellé (règle 13) : les tables de libellés partagées par plusieurs écrans vivent ici. */

export const lotTypeKey: Record<LotType, MessageKey> = {
  offices: 'lot.type.offices',
  shops: 'lot.type.shops',
  villas: 'lot.type.villas',
  apartments: 'lot.type.apartments',
  land: 'lot.type.land',
  parking: 'lot.type.parking',
};

export const leasePeriodicityKey: Record<LeasePeriodicity, MessageKey> = {
  monthly: 'tenant.periodicity.monthly',
  quarterly: 'tenant.periodicity.quarterly',
  'half-yearly': 'tenant.periodicity.half-yearly',
  yearly: 'tenant.periodicity.yearly',
};

export const reminderChannelKey: Record<ReminderChannel, MessageKey> = {
  email: 'reminders.channel.email',
  letter: 'reminders.channel.letter',
  'registered-letter': 'reminders.channel.registeredLetter',
  file: 'reminders.channel.file',
};

/** Les rubriques d'une facture ou d'une part de règlement. */
export const invoiceItemKey: Record<InvoiceItemKind, MessageKey> = {
  rent: 'item.rent',
  charges: 'item.charges',
  sign: 'item.sign',
  parking: 'item.parking',
  deposit: 'item.deposit',
  penalties: 'item.penalties',
  advance: 'item.advance',
};

export const documentKindKey: Record<DocumentKind, MessageKey> = {
  lease: 'documents.kind.lease',
  report: 'documents.kind.report',
  invoice: 'documents.kind.invoice',
  statement: 'documents.kind.statement',
  minutes: 'documents.kind.minutes',
  other: 'documents.kind.other',
};

/** L'objet métier qui porte l'icône d'un résultat de recherche. */
export const searchKindObject: Record<SearchKind, ObjectKey> = { asset: 'asset', tenant: 'asset', invoice: 'invoice', document: 'document' };

/** Périmètre d'actifs d'un utilisateur ou d'une rubrique : tous, un seul, ou un nombre. */
export function assetScopeLabel(scope: 'all' | string[]): string {
  return scope === 'all' ? t('settings.scope.all') : scope.length === 1 ? scope[0]! : t('settings.scope.some', { count: scope.length });
}
