import type { AccountEvent, TenantAccount, TenantService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { toTenantRow } from '../fixtures/tenants';
import { type MockContext } from '../context';

export function createTenantMock(ctx: MockContext): TenantService {
  const { latency, state, today } = ctx;
  return {
    getAccount: async id => {
      const account = state.tenants.find(tn => tn.id === id);
      if (!account) throw new AppError('resource-missing');
      return delay(account, latency);
    },
    sendReminder: async (id, input) => {
      const account = state.tenants.find(tn => tn.id === id);
      if (!account) throw new AppError('resource-missing');
      if (account.balance >= 0) throw new AppError('business', { userMessage: `${account.name} est à jour : aucune relance à envoyer.` });
      const event: AccountEvent = { id: `${id}-r-${Date.now()}`, date: today(), kind: 'reminder', label: `${input.subject}`, amount: null };
      const updated: TenantAccount = { ...account, reminderLevel: input.level, history: [event, ...account.history] };
      state.tenants = state.tenants.map(tn => (tn.id === id ? updated : tn));
      state.arrears = { ...state.arrears, rows: state.arrears.rows.map(row => (row.tenantId === id ? { ...row, reminderLevel: input.level } : row)) };
      return delay(updated, latency);
    },
    createFromLease: async (assetId, input) => {
      const record = state.assetRecords.find(a => a.id === assetId);
      if (!record) throw new AppError('resource-missing');
      const lot = record.lots.find(l => l.code === input.lotCode);
      if (!lot) throw new AppError('validation', { userMessage: `Le lot ${input.lotCode} n’existe pas dans cet actif.` });
      if (lot.status === 'occupied') throw new AppError('validation', { userMessage: `Le lot ${input.lotCode} est déjà occupé par ${lot.tenantName ?? ''}.` });
      const id = `tn-${Date.now()}`;
      const quarterly = (input.lease.monthlyRent + input.lease.monthlyCharges) * 3;
      const entry = input.lease.deposit + input.lease.keyMoney;
      const start = new Date(input.lease.start);
      const end = new Date(Date.UTC(start.getUTCFullYear() + input.lease.durationYears, start.getUTCMonth(), start.getUTCDate() - 1)).toISOString().slice(0, 10);
      const account: TenantAccount = {
        id,
        name: input.name,
        contactName: input.contactName,
        email: input.email,
        registration: input.registration || null,
        assetId,
        assetName: record.name,
        lotCodes: [input.lotCode],
        lease: { ...input.lease, end },
        balance: -entry,
        status: 'current',
        reminderLevel: 'none',
        schedule: [
          { id: `${id}-entry`, invoiceId: null, date: input.lease.start, label: 'Facture d’entrée', invoiced: entry, collected: 0, balance: -entry, status: 'due' },
          { id: `${id}-first`, invoiceId: null, date: input.lease.start, label: 'Premier avis d’échéance', invoiced: quarterly, collected: 0, balance: 0, status: 'upcoming' },
        ],
        ledger: [],
        history: [{ id: `${id}-h0`, date: today(), kind: 'invoice', label: 'Facture d’entrée émise', amount: entry }],
      };
      state.tenants = [...state.tenants, account];
      const lots = record.lots.map(l => (l.code === input.lotCode ? { ...l, status: 'occupied' as const, tenantName: input.name, monthlyRent: input.lease.monthlyRent } : l));
      const occupied = lots.filter(l => l.status === 'occupied').length;
      const updatedRecord = { ...record, lots, tenants: [...record.tenants, toTenantRow(account)], occupancyRate: lots.length ? occupied / lots.length : 0 };
      state.assetRecords = state.assetRecords.map(a => (a.id === assetId ? updatedRecord : a));
      state.assets = state.assets.map(a => (a.id === assetId ? { ...a, occupancyRate: updatedRecord.occupancyRate } : a));
      return delay(account, latency);
    },
    importRows: async (assetId, rows) => {
      const record = state.assetRecords.find(a => a.id === assetId);
      if (!record) throw new AppError('resource-missing');
      const created: string[] = [];
      for (const row of rows) {
        const lot = record.lots.find(l => l.code === row.lotCode);
        if (!lot) throw new AppError('validation', { userMessage: `Le lot ${row.lotCode} n’existe pas dans cet actif.` });
        if (lot.status === 'occupied') throw new AppError('validation', { userMessage: `Le lot ${row.lotCode} est déjà occupé.` });
      }
      for (const row of rows) {
        const id = `tn-${Date.now()}-${created.length}`;
        const account: TenantAccount = {
          id,
          name: row.name,
          contactName: row.contactName,
          email: row.email,
          registration: null,
          assetId,
          assetName: record.name,
          lotCodes: [row.lotCode],
          lease: { start: row.start, end: null, durationYears: 3, monthlyRent: row.monthlyRent, monthlyCharges: row.monthlyCharges, deposit: row.deposit, keyMoney: 0, periodicity: 'quarterly', indexation: '' },
          balance: 0,
          status: 'current',
          reminderLevel: 'none',
          schedule: [],
          ledger: [],
          history: [{ id: `${id}-h0`, date: today(), kind: 'note', label: 'Importé depuis l’état locatif', amount: null }],
        };
        state.tenants = [...state.tenants, account];
        created.push(id);
        const current = state.assetRecords.find(a => a.id === assetId)!;
        const lots = current.lots.map(l => (l.code === row.lotCode ? { ...l, status: 'occupied' as const, tenantName: row.name, monthlyRent: row.monthlyRent } : l));
        const occupied = lots.filter(l => l.status === 'occupied').length;
        const updatedRecord = { ...current, lots, tenants: [...current.tenants, toTenantRow(account)], occupancyRate: lots.length ? occupied / lots.length : 0 };
        state.assetRecords = state.assetRecords.map(a => (a.id === assetId ? updatedRecord : a));
        state.assets = state.assets.map(a => (a.id === assetId ? { ...a, occupancyRate: updatedRecord.occupancyRate } : a));
      }
      return delay({ created: created.length, tenantIds: created }, latency);
    },
  };
}
