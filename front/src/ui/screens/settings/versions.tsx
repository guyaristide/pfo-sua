import type { SettingVersion } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { Badge, Card, DataTable, Field, TextInput, type Column } from '@/ui/primitives';

/** Les deux champs communs à toute modification d'un paramètre : date d'effet et motif. */
export interface VersionFieldsValue {
  effectiveFrom: string;
  note: string;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateVersionFields(value: VersionFieldsValue): { effectiveFrom?: string } {
  return value.effectiveFrom ? {} : { effectiveFrom: t('version.effectiveFrom.invalid') };
}

interface VersionFieldsProps {
  value: VersionFieldsValue;
  error: string | undefined;
  onChange: (value: VersionFieldsValue) => void;
}

export function VersionFields({ value, error, onChange }: VersionFieldsProps) {
  return (
    <Card title={t('version.effectiveFrom')}>
      <div className="form-grid">
        <Field id="version-effectiveFrom" label={t('version.effectiveFrom')} required error={error} help={t('version.effectiveFrom.help')}>
          <TextInput id="version-effectiveFrom" type="date" value={value.effectiveFrom} invalid={!!error} onChange={e => onChange({ ...value, effectiveFrom: e.target.value })} />
        </Field>
        <Field id="version-note" label={t('version.note')}>
          <TextInput id="version-note" value={value.note} onChange={e => onChange({ ...value, note: e.target.value })} />
        </Field>
      </div>
    </Card>
  );
}

export function versionState(version: SettingVersion<unknown>, current: SettingVersion<unknown>): 'current' | 'scheduled' | 'replaced' {
  if (version.version === current.version) return 'current';
  return version.effectiveFrom > current.effectiveFrom ? 'scheduled' : 'replaced';
}

interface VersionHistoryProps<Value> {
  versions: SettingVersion<Value>[];
  current: SettingVersion<Value>;
  describe: (value: Value) => string;
  fmt: Formatters;
}

/** L'historique d'un paramètre : version, date d'effet, valeur résumée, auteur, état. */
export function VersionHistory<Value>({ versions, current, describe, fmt }: VersionHistoryProps<Value>) {
  const tone = { current: 'success', scheduled: 'info', replaced: 'neutral' } as const;
  const columns: Column<SettingVersion<Value>>[] = [
    { key: 'version', header: t('version.col.version'), numeric: true, render: v => v.version, width: '80px' },
    { key: 'from', header: t('version.col.effectiveFrom'), render: v => fmt.shortDate(v.effectiveFrom) },
    {
      key: 'value',
      header: t('version.col.value'),
      render: v => (
        <div>
          <div>{describe(v.value)}</div>
          {v.note ? <div className="table__secondary">{v.note}</div> : null}
        </div>
      ),
    },
    { key: 'author', header: t('version.col.author'), render: v => t('version.by', { name: v.createdBy, date: fmt.shortDate(v.createdAt) }) },
    {
      key: 'state',
      header: t('version.col.state'),
      render: v => {
        const state = versionState(v, current);
        return <Badge tone={tone[state]}>{t(`version.state.${state}`)}</Badge>;
      },
    },
  ];
  return (
    <Card title={t('version.history.title')} meta={t('version.total', { count: versions.length })} flush>
      <DataTable caption={t('version.history.title')} columns={columns} rows={versions} rowKey={v => String(v.version)} />
    </Card>
  );
}

/** Ligne « v3 · depuis le 01/07/2024 » affichée sous un paramètre dans les listes. */
export function sinceLabel(current: SettingVersion<unknown>, fmt: Formatters): string {
  return t('version.since', { version: current.version, date: fmt.shortDate(current.effectiveFrom) });
}
