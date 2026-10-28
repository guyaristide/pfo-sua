import { t } from '@/i18n/t';
import { objects, type ObjectKey } from '@/shared/objects';
import { Icon } from '@/ui/primitives';
import { AssetSwitcher, type AssetOption } from './AssetSwitcher';

export interface NavEntry {
  object: ObjectKey;
  href: string;
  active: boolean;
}

interface SidebarProps {
  entries: NavEntry[];
  assets: AssetOption[];
  selectedAssetId: string | undefined;
  onSelectAsset: (assetId: string | undefined) => void;
  user: { initials: string; name: string; roleLabel: string };
  renderLink: (entry: NavEntry, children: React.ReactNode, className: string) => React.ReactNode;
}

/**
 * Barre latérale validée par le client : sélecteur d'actif, neuf entrées, trame de carrés PFO dans l'espace
 * restant, utilisateur en pied.
 */
export function Sidebar({ entries, assets, selectedAssetId, onSelectAsset, user, renderLink }: SidebarProps) {
  return (
    <aside className="sidebar">
      <AssetSwitcher assets={assets} selectedAssetId={selectedAssetId} onSelect={onSelectAsset} />
      <nav className="nav" aria-label={t('app.name')}>
        {entries.map(entry => {
          const definition = objects[entry.object];
          const className = entry.active ? 'nav__item nav__item--active' : 'nav__item';
          return (
            <span key={entry.object}>
              {renderLink(
                entry,
                <>
                  <Icon name={definition.icon} />
                  {t(definition.labelKey)}
                </>,
                className,
              )}
            </span>
          );
        })}
      </nav>
      <div className="sidebar__trame" aria-hidden="true">
        <span className="sidebar__trame-accent sidebar__trame-accent--strong" />
        <span className="sidebar__trame-accent sidebar__trame-accent--light" />
      </div>
      <div className="sidebar__user">
        <span className="avatar">{user.initials}</span>
        <div>
          <div className="sidebar__user-name">{user.name}</div>
          <div className="sidebar__user-role">{user.roleLabel}</div>
        </div>
      </div>
    </aside>
  );
}
