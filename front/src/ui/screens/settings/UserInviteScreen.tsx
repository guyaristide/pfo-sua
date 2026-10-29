import type { AssetSummary, RoleKey, UserInvitation } from '@/services/contracts';
import { roleKeys, roleLabelKey } from '@/shared/roles';
import { t } from '@/i18n/t';
import { isEmail } from '@/shared/validation';
import { Card, CheckboxField, Field, FormPage, RadioField, SelectInput, TextInput , useFormAttempted , issuesFrom } from '@/ui/primitives';
import { settingsCrumbs, type SettingsNavigation } from './crumbs';

export interface UserInviteForm {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleKey | '';
  scopeMode: 'all' | 'some';
  scopeAssets: string[];
}

export const emptyUserInviteForm: UserInviteForm = { firstName: '', lastName: '', email: '', role: '', scopeMode: 'all', scopeAssets: [] };

type Errors = Partial<Record<keyof UserInviteForm, string>>;

export function validateUserInvite(form: UserInviteForm): Errors {
  const errors: Errors = {};
  if (!form.firstName.trim()) errors.firstName = t('form.required');
  if (!form.lastName.trim()) errors.lastName = t('form.required');
  if (!form.email.trim()) errors.email = t('form.required');
  else if (!isEmail(form.email)) errors.email = t('form.email.invalid');
  if (!form.role) errors.role = t('form.required');
  if (form.scopeMode === 'some' && form.scopeAssets.length === 0) errors.scopeAssets = t('users.field.scope.pick');
  return errors;
}

export function toUserInvitation(form: UserInviteForm): UserInvitation {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    role: form.role as RoleKey,
    assetScope: form.scopeMode === 'all' ? 'all' : form.scopeAssets,
  };
}

interface UserInviteScreenProps extends SettingsNavigation {
  assets: AssetSummary[];
  form: UserInviteForm;
  onChange: (form: UserInviteForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
}

export function UserInviteScreen({ assets, form, onChange, onSubmit, submitting, submitError, onOpenSettings, onOpenSection }: UserInviteScreenProps) {
  const errors = validateUserInvite(form);
  const attempted = useFormAttempted();
  const set = (changes: Partial<UserInviteForm>) => onChange({ ...form, ...changes });
  const toggleAsset = (name: string, checked: boolean) =>
    set({ scopeAssets: checked ? [...form.scopeAssets, name] : form.scopeAssets.filter(a => a !== name) });

  return (
    <FormPage
      object="settings"
      breadcrumbs={settingsCrumbs({ onOpenSettings, onOpenSection }, t('users.title'))}
      eyebrow={t('users.invite.body')}
      title={t('users.invite.title')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => (key === 'scopeAssets' ? 'scope-some' : `invite-${key}`), key => t(key === 'scopeAssets' ? 'users.field.scope' : `users.field.${key}` as 'users.field.firstName'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onOpenSection}
      onSubmit={onSubmit}
      saveLabel={t('users.action.invite')}
    >
      <Card>
        <div className="form-grid">
          <Field id="invite-firstName" label={t('users.field.firstName')} required error={errors.firstName}>
            <TextInput id="invite-firstName" value={form.firstName} invalid={!!errors.firstName} onChange={e => set({ firstName: e.target.value })} />
          </Field>
          <Field id="invite-lastName" label={t('users.field.lastName')} required error={errors.lastName}>
            <TextInput id="invite-lastName" value={form.lastName} invalid={!!errors.lastName} onChange={e => set({ lastName: e.target.value })} />
          </Field>
          <Field id="invite-email" label={t('users.field.email')} required error={errors.email}>
            <TextInput id="invite-email" type="email" value={form.email} invalid={!!errors.email} onChange={e => set({ email: e.target.value })} />
          </Field>
          <Field id="invite-role" label={t('users.field.role')} required error={errors.role}>
            <SelectInput id="invite-role" value={form.role} invalid={!!errors.role} onChange={e => set({ role: e.target.value as RoleKey | '' })}>
              <option value="">{t('users.field.role.placeholder')}</option>
              {roleKeys.map(role => (
                <option key={role} value={role}>
                  {t(roleLabelKey[role])}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Card>
      <Card title={t('users.field.scope')}>
        <div className="checkbox-group">
          <RadioField id="scope-all" name="scope" label={t('users.field.scope.all')} checked={form.scopeMode === 'all'} onChange={() => set({ scopeMode: 'all' })} />
          <RadioField id="scope-some" name="scope" label={t('users.field.scope.some')} checked={form.scopeMode === 'some'} onChange={() => set({ scopeMode: 'some' })} />
          {form.scopeMode === 'some' ? (
            <div className="checkbox-group checkbox-group--nested">
              {assets.map(asset => (
                <CheckboxField key={asset.id} id={`scope-${asset.id}`} label={asset.name} checked={form.scopeAssets.includes(asset.name)} onChange={checked => toggleAsset(asset.name, checked)} />
              ))}
              {attempted && errors.scopeAssets ? <div className="field__error">{errors.scopeAssets}</div> : null}
            </div>
          ) : null}
        </div>
      </Card>
    </FormPage>
  );
}
