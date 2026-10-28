import type {
  BankAccount,
  FeeValue,
  SettingVersion,
  BillingItem,
  CalendarRule,
  FeeSettings,
  ReminderTemplate,
  RoleDefinition,
  SettingsOverview,
  UserRow,
} from '@/services/contracts';

/** Référentiels de PFO (cadrage du 13/10/2026, procédures, offre technique §IX). Effectifs et dates indicatifs. */
export const settingsAll: SettingsOverview = {
  sections: [
    { key: 'users', count: 5, detail: 'Responsable PM, adjointe, gestionnaire financier, exploitation, administrateur' },
    { key: 'billing-items', count: 9, detail: 'Loyer, charges, enseigne, parking, réajustement, caution, travaux, hors CRG' },
    { key: 'calendar', count: 12, detail: 'Facturation le 20, échéance le 5, relevés le 5, impayés le 8, CRG à T+15' },
    { key: 'reminder-templates', count: 5, detail: 'Relances 15, 30 et 45 jours, mise en demeure, pré-contentieux' },
    { key: 'bank-accounts', count: 6, detail: 'SGCI, Stanbic, BOA, BGFI · comptes SCI et compte PFO' },
    { key: 'fees', count: 1, detail: '8 % sur loyers, enseignes et revenus complémentaires, hors charges' },
  ],
};

export const usersAll: UserRow[] = [
  { id: 'u-elea', firstName: 'Eléa', lastName: 'Ménard', email: 'e.menard@pfo-immobilier.ci', role: 'pmLead', assetScope: 'all', status: 'active', lastSeenAt: '2026-10-28T09:12:00Z' },
  { id: 'u-elema', firstName: 'Eléma', lastName: 'Bosso', email: 'e.bosso@pfo-immobilier.ci', role: 'assetManager', assetScope: 'all', status: 'active', lastSeenAt: '2026-10-28T08:40:00Z' },
  { id: 'u-vincent', firstName: 'Vincent', lastName: 'Chapoutot', email: 'v.chapoutot@pfo-immobilier.ci', role: 'financeManager', assetScope: 'all', status: 'active', lastSeenAt: '2026-10-27T17:05:00Z' },
  { id: 'u-carole', firstName: 'Carole', lastName: 'K.', email: 'c.k@pfo-immobilier.ci', role: 'operations', assetScope: ['ITC', 'Les Trois Jardins'], status: 'invited', lastSeenAt: null },
  { id: 'u-alain', firstName: 'Alain', lastName: 'D.', email: 'a.d@pfo-immobilier.ci', role: 'admin', assetScope: 'all', status: 'active', lastSeenAt: '2026-10-20T11:30:00Z' },
];

/** Matrice de l'offre technique §IX : C = création, R = lecture, M = modification. */
export const rolesAll: RoleDefinition[] = [
  { role: 'admin', access: { referentials: 'full', assets: 'full', leases: 'full', finance: 'full', documents: 'full', reporting: 'full', validation: 'full' } },
  { role: 'pmLead', access: { referentials: 'full', assets: 'full', leases: 'full', finance: 'full', documents: 'full', reporting: 'create', validation: 'full' } },
  { role: 'assetManager', access: { referentials: 'read', assets: 'full', leases: 'full', finance: 'read', documents: 'full', reporting: 'create', validation: 'workflow' } },
  { role: 'financeManager', access: { referentials: 'read', assets: 'read', leases: 'read', finance: 'full', documents: 'create', reporting: 'create', validation: 'full' } },
  { role: 'operations', access: { referentials: 'read', assets: 'read', leases: 'read', finance: 'read', documents: 'create', reporting: 'read', validation: 'none' } },
  { role: 'owner', access: { referentials: 'none', assets: 'read', leases: 'read', finance: 'read', documents: 'read', reporting: 'read', validation: 'none' } },
];

/** Une première version pour chaque paramètre repris des procédures : v1 au cadrage du 13/10/2026. */
function initial<Value>(value: Value, effectiveFrom = '2024-03-01', createdBy = 'Eléa M.', note: string | null = 'Reprise des procédures PFO au cadrage'): SettingVersion<Value> {
  return { version: 1, effectiveFrom, createdAt: '2026-10-13T10:00:00Z', createdBy, note, value };
}
function versioned<Value>(value: Value, effectiveFrom?: string): { current: SettingVersion<Value>; versions: SettingVersion<Value>[] } {
  const first = initial(value, effectiveFrom);
  return { current: first, versions: [first] };
}

export const billingItemsAll: BillingItem[] = [
  { id: 'bi-rent', code: 'LOY', label: 'Loyer', assetScope: 'all', active: true, ...versioned({ inReport: true, inFeeBase: true, vatApplicable: true, periodicity: 'quarterly' }) },
  { id: 'bi-charges', code: 'CHG', label: 'Provision pour charges locatives', assetScope: 'all', active: true, ...versioned({ inReport: true, inFeeBase: false, vatApplicable: true, periodicity: 'quarterly' }) },
  { id: 'bi-signage', code: 'ENS', label: 'Enseigne', assetScope: ['ITC', 'Boulevard Latrille'], active: true, ...versioned({ inReport: true, inFeeBase: true, vatApplicable: true, periodicity: 'quarterly' }) },
  { id: 'bi-parking', code: 'PKG', label: 'Parking', assetScope: ['ITC'], active: true, ...versioned({ inReport: true, inFeeBase: true, vatApplicable: true, periodicity: 'quarterly' }) },
  { id: 'bi-indexation', code: 'REA', label: 'Réajustement de loyer', assetScope: 'all', active: true, ...versioned({ inReport: true, inFeeBase: true, vatApplicable: true, periodicity: 'once' }) },
  { id: 'bi-deposit', code: 'DEP', label: 'Dépôt de garantie', assetScope: 'all', active: true, ...versioned({ inReport: false, inFeeBase: false, vatApplicable: false, periodicity: 'once' }) },
  { id: 'bi-keymoney', code: 'PDP', label: 'Pas-de-porte', assetScope: 'all', active: true, ...versioned({ inReport: true, inFeeBase: true, vatApplicable: true, periodicity: 'once' }) },
  { id: 'bi-works', code: 'TRV', label: 'Travaux refacturés', assetScope: 'all', active: true, ...versioned({ inReport: true, inFeeBase: false, vatApplicable: true, periodicity: 'once' }) },
  { id: 'bi-misc', code: 'HCRG', label: 'Frais divers hors CRG', assetScope: 'all', active: true, ...versioned({ inReport: false, inFeeBase: false, vatApplicable: true, periodicity: 'once' }) },
];

export const calendarRulesAll: CalendarRule[] = [
  { id: 'cal-invoice', label: 'Émission des factures du trimestre', frequency: 'quarterly', triggerLabel: null, nextOccurrence: '2026-12-20', ...versioned({ dayOfMonth: 20, month: 0, offsetDays: null, ownerRole: 'assetManager' }) },
  { id: 'cal-due', label: 'Échéance des factures', frequency: 'quarterly', triggerLabel: null, nextOccurrence: '2027-01-05', ...versioned({ dayOfMonth: 5, month: 1, offsetDays: null, ownerRole: 'financeManager' }) },
  { id: 'cal-statements', label: 'Réception des relevés bancaires', frequency: 'monthly', triggerLabel: null, nextOccurrence: '2026-11-05', ...versioned({ dayOfMonth: 5, month: null, offsetDays: null, ownerRole: 'financeManager' }) },
  { id: 'cal-arrears', label: 'Tableau des impayés pour la direction', frequency: 'monthly', triggerLabel: null, nextOccurrence: '2026-11-08', ...versioned({ dayOfMonth: 8, month: null, offsetDays: null, ownerRole: 'pmLead' }) },
  { id: 'cal-r1', label: 'Relance 1', frequency: 'after-event', triggerLabel: 'Échéance de la facture', nextOccurrence: null, ...versioned({ dayOfMonth: null, month: null, offsetDays: 15, ownerRole: 'financeManager' }) },
  { id: 'cal-r2', label: 'Relance 2', frequency: 'after-event', triggerLabel: 'Échéance de la facture', nextOccurrence: null, ...versioned({ dayOfMonth: null, month: null, offsetDays: 30, ownerRole: 'financeManager' }) },
  { id: 'cal-r3', label: 'Relance 3', frequency: 'after-event', triggerLabel: 'Échéance de la facture', nextOccurrence: null, ...versioned({ dayOfMonth: null, month: null, offsetDays: 45, ownerRole: 'assetManager' }) },
  { id: 'cal-monthly-file', label: 'Dossier mensuel du compte à la comptabilité', frequency: 'after-event', triggerLabel: 'Validation du rapprochement', nextOccurrence: null, ...versioned({ dayOfMonth: null, month: null, offsetDays: 5, ownerRole: 'financeManager' }) },
  { id: 'cal-report', label: 'Transmission du CRG au propriétaire', frequency: 'after-event', triggerLabel: 'Fin du trimestre', nextOccurrence: '2027-01-15', ...versioned({ dayOfMonth: null, month: null, offsetDays: 15, ownerRole: 'pmLead' }) },
  { id: 'cal-budget', label: 'Budget de charges initial', frequency: 'yearly', triggerLabel: null, nextOccurrence: '2026-10-31', ...versioned({ dayOfMonth: 31, month: 10, offsetDays: null, ownerRole: 'assetManager' }) },
  { id: 'cal-budget-re', label: 'Budget de charges réestimé', frequency: 'yearly', triggerLabel: null, nextOccurrence: '2027-07-31', ...versioned({ dayOfMonth: 31, month: 7, offsetDays: null, ownerRole: 'assetManager' }) },
  { id: 'cal-settlement', label: 'Reddition des charges', frequency: 'yearly', triggerLabel: null, nextOccurrence: '2027-04-15', ...versioned({ dayOfMonth: 15, month: 4, offsetDays: null, ownerRole: 'financeManager' }) },
];

export const reminderTemplatesAll: ReminderTemplate[] = [
  {
    id: 'rt-1',
    level: 'reminder-1',
    ...versioned(
      {
        delayDays: 15,
        channel: 'email',
        subject: 'Rappel : facture {facture} échue le {echeance}',
        body: 'Madame, Monsieur,\n\nSauf erreur de notre part, la facture {facture} d’un montant de {montant} reste impayée depuis le {echeance}. Nous vous remercions de régulariser sous huit jours.\n\nLe service Property Management',
      },
      '2026-09-22',
    ),
  },
  {
    id: 'rt-2',
    level: 'reminder-2',
    ...versioned(
      {
        delayDays: 30,
        channel: 'letter',
        subject: 'Deuxième rappel : facture {facture}',
        body: 'Madame, Monsieur,\n\nMalgré notre premier rappel, la facture {facture} ({montant}) reste impayée. Nous vous invitons à nous contacter sous huit jours pour convenir d’un règlement.\n\nLe service Property Management',
      },
      '2026-09-22',
    ),
  },
  {
    id: 'rt-3',
    level: 'reminder-3',
    ...versioned(
      {
        delayDays: 45,
        channel: 'letter',
        subject: 'Dernier rappel avant mise en demeure : {facture}',
        body: 'Madame, Monsieur,\n\nÀ ce jour, la somme de {montant} reste due au titre de la facture {facture}. Sans règlement sous huit jours, nous engagerons la procédure de mise en demeure prévue au bail.\n\nLe service Property Management',
      },
      '2026-09-22',
    ),
  },
  {
    id: 'rt-md',
    level: 'formal-notice',
    ...versioned(
      {
        delayDays: 52,
        channel: 'registered-letter',
        subject: 'Mise en demeure de payer : {facture}',
        body: 'Madame, Monsieur,\n\nPar la présente, nous vous mettons en demeure de régler la somme de {montant} sous sept jours, faute de quoi le dossier sera transmis au conseil de la SCI.\n\nLa direction',
      },
      '2026-07-07',
    ),
  },
  {
    id: 'rt-pc',
    level: 'pre-litigation',
    ...versioned(
      {
        delayDays: 60,
        channel: 'file',
        subject: 'Dossier précontentieux : {locataire}',
        body: 'Pièces à réunir : bail et avenants, factures impayées, relances et accusés, mise en demeure et accusé de réception, relevé de compte locataire.',
      },
      '2026-07-07',
    ),
  },
];

export const bankAccountsAll: BankAccount[] = [
  { id: 'ba-1', bank: 'SGCI', holder: 'sci', holderName: 'SCI ITC', assetName: 'ITC', accountLabel: '•••• 4471', cadence: 'monthly', active: true },
  { id: 'ba-2', bank: 'Stanbic', holder: 'sci', holderName: 'SCI Les Trois Jardins', assetName: 'Les Trois Jardins', accountLabel: '•••• 0218', cadence: 'monthly', active: true },
  { id: 'ba-3', bank: 'BOA', holder: 'sci', holderName: 'SCI Les Trois Villas', assetName: 'Badamier', accountLabel: '•••• 7730', cadence: 'monthly', active: true },
  { id: 'ba-4', bank: 'BGFI', holder: 'sci', holderName: 'SCI Le Boulevard Latrille', assetName: 'Boulevard Latrille', accountLabel: '•••• 5126', cadence: 'monthly', active: true },
  { id: 'ba-5', bank: 'SGCI', holder: 'pfo', holderName: 'PFO Immobilier', assetName: null, accountLabel: '•••• 9004', cadence: 'daily', active: true },
  { id: 'ba-6', bank: 'BGFI', holder: 'pfo', holderName: 'PFO Immobilier', assetName: null, accountLabel: '•••• 3382', cadence: 'daily', active: true },
];

/** Procédure CRG v3 du 22/09/2026 : 8 % sur loyers, enseignes et revenus complémentaires, hors charges locatives.
 * Deux versions pour montrer l'historique : 7 % au démarrage du service, 8 % depuis mars 2024. */
const feesV1: SettingVersion<FeeValue> = { version: 1, effectiveFrom: '2024-03-01', createdAt: '2024-03-01T08:00:00Z', createdBy: 'Thomas F.', note: 'Mandat de gestion initial', value: { rate: 0.07, base: ['rent', 'signage'], vatApplicable: true } };
const feesV2: SettingVersion<FeeValue> = { version: 2, effectiveFrom: '2024-07-01', createdAt: '2024-06-20T08:00:00Z', createdBy: 'Thomas F.', note: 'Avenant aux mandats : 8 %, revenus complémentaires inclus', value: { rate: 0.08, base: ['rent', 'signage', 'ancillary'], vatApplicable: true } };
export const feesAll: FeeSettings = { current: feesV2, versions: [feesV2, feesV1] };
