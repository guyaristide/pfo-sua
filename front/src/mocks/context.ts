/**
 * Le contexte partagé des services simulés : options, session courante, état mutable (visible jusqu'au
 * rechargement) et règles communes. Chaque service reçoit ce contexte et n'en lit que ce qu'il utilise.
 */
import type { SettingVersion, StatementDetail, VersionedInput } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { sessionStore } from '@/services/http/session-store';
import { assets } from './fixtures/assets';
import { assetRecords } from './fixtures/asset-records';
import { statementItcSeptember, statementTroisJardinsSeptember } from './fixtures/statements';
import { tenantAccounts } from './fixtures/tenants';
import { notificationsAll } from './fixtures/notifications';
import { budgetDetail, capturesBgfiOctober, chequeDetailsAll, chequesAll, depositsAll, documentDetail, invoiceDetail, reportDetail } from './fixtures/details';
import { billingAll } from './fixtures/billing';
import { arrearsAll } from './fixtures/arrears';
import { reportsAll } from './fixtures/reports';
import { budgetAll } from './fixtures/budget';
import { documentsAll } from './fixtures/documents';
import { bankAccountsAll, billingItemsAll, calendarRulesAll, feesAll, reminderTemplatesAll, settingsAll, usersAll } from './fixtures/settings';
import { sessions, ownerSessions, defaultSessionKey } from './fixtures/session';
import { ownerSeeds } from './fixtures/owner';

export const MOCK_TOKEN_PREFIX = 'mock:';
export const DEMO_DOMAIN = 'pfo-immobilier.ci';
export const DEMO_CODE = '123456';
/** Quelle session simulée derrière quelle adresse (prénom ou initiale.nom). */
export const sessionEmails: Record<string, string[]> = {
  pmLead: ['elea', 'e.menard'],
  assetManager: ['elema', 'e.bosso'],
  financeManager: ['vincent', 'v.chapoutot'],
};

export interface MockOptions {
  latencyMs?: number;
  sessionKey?: string;
  /** Ouvre d'emblée la session simulée (confort de développement et captures) ; jamais par défaut. */
  autoSignIn?: boolean;
  /** Renvoie le code de connexion simulé dans la réponse, pour l'afficher à l'écran (règle 39 : faux par défaut). */
  exposeLoginCode?: boolean;
}

export function createMockContext(options: MockOptions = {}) {
const latency = options.latencyMs ?? 250;
const fallbackKey = options.sessionKey ?? defaultSessionKey;
if (options.autoSignIn && !sessionStore.getToken()) sessionStore.setToken(`${MOCK_TOKEN_PREFIX}${fallbackKey}`);
/** Le jeton simulé porte la clé de session : « mock:pmLead ». Sans jeton, pas de session. */
const sessionKeyFromToken = (): string | null => {
  const token = sessionStore.getToken();
  return token && token.startsWith(MOCK_TOKEN_PREFIX) ? token.slice(MOCK_TOKEN_PREFIX.length) : null;
};
const currentKey = () => sessionKeyFromToken() ?? fallbackKey;
const activeSession = () => sessions[currentKey()] ?? ownerSessions[currentKey()] ?? sessions[defaultSessionKey]!;
const byAsset = <Row extends { assetName: string }>(rows: Row[], assetId?: string): Row[] => {
  const name = assetName(assetId);
  return name ? rows.filter(row => row.assetName === name) : rows;
};
// État mutable de la simulation : les validations et enregistrements se voient jusqu'au rechargement.
const state = {
  statements: new Map<string, StatementDetail>([
    [statementItcSeptember.id, structuredClone(statementItcSeptember)],
    [statementTroisJardinsSeptember.id, structuredClone(statementTroisJardinsSeptember)],
  ]),
  chequeSequence: 45_822,
  assets: structuredClone(assets),
  assetRecords: structuredClone(assetRecords),
  notifications: structuredClone(notificationsAll),
  tenants: structuredClone(tenantAccounts),
  arrears: structuredClone(arrearsAll),
  invoices: billingAll.invoices.map(invoiceDetail),
  reports: reportsAll.rows.map(reportDetail),
  budgets: budgetAll.rows.map(budgetDetail),
  cheques: structuredClone(chequesAll),
  deposits: structuredClone(depositsAll),
  chequeDetails: structuredClone(chequeDetailsAll),
  captures: new Map<string, typeof capturesBgfiOctober>([['s-6', structuredClone(capturesBgfiOctober)]]),
  documents: documentsAll.map(documentDetail),
  users: structuredClone(usersAll),
  billingItems: structuredClone(billingItemsAll),
  calendarRules: structuredClone(calendarRulesAll),
  reminderTemplates: structuredClone(reminderTemplatesAll),
  bankAccounts: structuredClone(bankAccountsAll),
  fees: structuredClone(feesAll),
  /** Comptes de l'espace propriétaire : adresse, session, actif, mot de passe choisi à l'activation, lien en attente. */
  owners: [
    { email: ownerSeeds.itc.profile.email, sessionKey: 'ownerItc', seed: 'itc' as const, password: 'itc-2026!' as string | null, pendingLink: false },
    { email: ownerSeeds.flamboyants.profile.email, sessionKey: 'ownerFlamboyants', seed: 'flamboyants' as const, password: null as string | null, pendingLink: false },
  ],
};
const assetName = (assetId?: string) => (assetId ? state.assets.find(a => a.id === assetId)?.name : undefined);
const author = () => `${activeSession().user.firstName} ${activeSession().user.lastName}`;
const today = () => new Date().toISOString().slice(0, 10);
const requirePermission = (permission: string, userMessage: string) => {
  if (!activeSession().permissions.includes(permission)) throw new AppError('forbidden', { userMessage });
};
const requireAdmin = () => {
  if (!activeSession().permissions.includes('admin')) throw new AppError('forbidden', { userMessage: 'Seul un administrateur peut modifier les paramètres.' });
};
/** Ajoute une version et recalcule celle en vigueur : la plus récente dont la date d'effet est passée. */
const addVersion = <Value>(versions: SettingVersion<Value>[], input: VersionedInput<Value>) => {
  if (!input.effectiveFrom) throw new AppError('validation', { userMessage: 'La date d’effet est obligatoire.' });
  if (versions.some(v => v.effectiveFrom === input.effectiveFrom)) {
    throw new AppError('validation', { userMessage: `Une version prend déjà effet le ${input.effectiveFrom}. Choisissez une autre date d’effet.` });
  }
  const next: SettingVersion<Value> = {
    version: Math.max(0, ...versions.map(v => v.version)) + 1,
    effectiveFrom: input.effectiveFrom,
    createdAt: new Date().toISOString(),
    createdBy: author(),
    note: input.note,
    value: input.value,
  };
  const all = [next, ...versions].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version - a.version);
  const current = all.find(v => v.effectiveFrom <= today()) ?? all[all.length - 1]!;
  return { current, versions: all };
};
/** Les baux facturables pour une période : une seule règle pour l'aperçu et la génération. */
const billableTenants = (periodStart: string) => state.tenants.filter(tn => tn.status !== 'ending' || (tn.lease.end ?? '9999') >= periodStart);
const overview = () => ({
  sections: settingsAll.sections.map(section => {
    const counts: Record<string, number> = {
      users: state.users.length,
      'billing-items': state.billingItems.filter(item => item.active).length,
      calendar: state.calendarRules.length,
      'reminder-templates': state.reminderTemplates.length,
      'bank-accounts': state.bankAccounts.filter(account => account.active).length,
      fees: 1,
    };
    return { ...section, count: counts[section.key] ?? section.count };
  }),
});
  return { options, latency, fallbackKey, sessionKeyFromToken, currentKey, activeSession, byAsset, state, assetName, author, today, requirePermission, requireAdmin, addVersion, billableTenants, overview };
}

export type MockContext = ReturnType<typeof createMockContext>;
