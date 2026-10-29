import type { BankAccount, BillingItem, CalendarRule, FeeSettings, ReminderTemplate, SettingsService, UserRow } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { rolesAll } from '../fixtures/settings';
import { type MockContext } from '../context';

export function createSettingsMock(ctx: MockContext): SettingsService {
  const { latency, state, requireAdmin, addVersion, overview } = ctx;
  return {
    getOverview: () => delay(overview(), latency),
    listUsers: () => delay(state.users, latency),
    listRoles: () => delay(rolesAll, latency),
    inviteUser: async input => {
      requireAdmin();
      if (state.users.some(user => user.email.toLowerCase() === input.email.toLowerCase())) {
        throw new AppError('validation', { userMessage: 'Cette adresse e-mail a déjà un compte.' });
      }
      const user: UserRow = { id: `u-${Date.now()}`, ...input, status: 'invited', lastSeenAt: null };
      state.users = [...state.users, user];
      return delay(user, latency);
    },
    listBillingItems: () => delay(state.billingItems, latency),
    saveBillingItem: async (input, id) => {
      requireAdmin();
      const duplicate = state.billingItems.find(item => item.code === input.code && item.id !== id);
      if (duplicate) throw new AppError('validation', { userMessage: `Le code ${input.code} est déjà utilisé par « ${duplicate.label} ».` });
      const existing = id ? state.billingItems.find(item => item.id === id) : undefined;
      if (id && !existing) throw new AppError('resource-missing');
      const item: BillingItem = {
        ...(existing ?? { id: `bi-${Date.now()}`, assetScope: 'all' as const, active: true }),
        code: input.code,
        label: input.label,
        ...addVersion(existing?.versions ?? [], input),
      };
      state.billingItems = existing ? state.billingItems.map(i => (i.id === id ? item : i)) : [...state.billingItems, item];
      return delay(item, latency);
    },
    listCalendarRules: () => delay(state.calendarRules, latency),
    saveCalendarRule: async (id, input) => {
      requireAdmin();
      const existing = state.calendarRules.find(rule => rule.id === id);
      if (!existing) throw new AppError('resource-missing');
      const rule: CalendarRule = { ...existing, ...addVersion(existing.versions, input) };
      state.calendarRules = state.calendarRules.map(r => (r.id === id ? rule : r));
      return delay(rule, latency);
    },
    listReminderTemplates: () => delay(state.reminderTemplates, latency),
    saveReminderTemplate: async (id, input) => {
      requireAdmin();
      const existing = state.reminderTemplates.find(template => template.id === id);
      if (!existing) throw new AppError('resource-missing');
      const template: ReminderTemplate = { ...existing, ...addVersion(existing.versions, input) };
      state.reminderTemplates = state.reminderTemplates.map(t => (t.id === id ? template : t));
      return delay(template, latency);
    },
    listBankAccounts: () => delay(state.bankAccounts, latency),
    saveBankAccount: async (input, id) => {
      requireAdmin();
      const existing = id ? state.bankAccounts.find(account => account.id === id) : undefined;
      if (id && !existing) throw new AppError('resource-missing');
      const { lastDigits, ...rest } = input;
      const accountLabel = `•••• ${lastDigits}`;
      const account: BankAccount = existing ? { ...existing, ...rest, accountLabel } : { id: `ba-${Date.now()}`, ...rest, accountLabel, active: true };
      state.bankAccounts = existing ? state.bankAccounts.map(a => (a.id === id ? account : a)) : [...state.bankAccounts, account];
      return delay(account, latency);
    },
    getFees: () => delay(state.fees, latency),
    saveFees: async input => {
      requireAdmin();
      const fees: FeeSettings = addVersion(state.fees.versions, input);
      state.fees = fees;
      return delay(fees, latency);
    },
  };
}
