import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { NavigationTarget, NotificationItem, SearchKind, SearchResult, SearchScope } from '@/services/contracts';
import { GlobalSearch } from './GlobalSearch';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { Button, Icon, IconButton } from '@/ui/primitives';

interface GlobalHeaderProps {
  userInitials: string;
  userName: string;
  userRoleLabel: string;
  notifications: NotificationItem[];
  fmt: Formatters;
  search: {
    query: string;
    scope: SearchScope;
    results: SearchResult[];
    recent: SearchResult[];
    onQueryChange: (query: string) => void;
    onScopeChange: (scope: SearchScope) => void;
    onOpen: (kind: SearchKind, id: string, result: SearchResult) => void;
    onSeeAll: () => void;
  };
  onOpenNotification: (target: NavigationTarget | null) => void;
  onMarkNotificationsRead: () => void;
  onOpenHelp: () => void;
  onSignOut: () => void;
}


/** Un menu déroulant de l'en-tête : fermé au clic extérieur et à la touche Échap. */
function HeaderMenu({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);
  return (
    <div className="profile" ref={ref}>
      {children}
    </div>
  );
}

/** En-tête global 48 px (SLDS §2) : marque, recherche globale avec portée, notifications, aide, profil. */
export function GlobalHeader(props: GlobalHeaderProps) {
  const { userInitials, userName, userRoleLabel, notifications, fmt, search, onOpenNotification, onMarkNotificationsRead, onOpenHelp, onSignOut } = props;
  const [menu, setMenu] = useState<'none' | 'profile' | 'notifications'>('none');
  const unread = notifications.filter(n => !n.read).length;
  const close = () => setMenu('none');

  return (
    <header className="global-header">
      <div className="global-header__brand">
        <img src="/brand/pfo-immobilier-bleu.svg" alt="PFO Immobilier" />
        <span className="global-header__app">
          {t('app.name')} <span>{t('app.tagline')}</span>
        </span>
      </div>
      <GlobalSearch {...search} />
      <div className="global-header__tools">
        <HeaderMenu open={menu === 'notifications'} onClose={close}>
          <span className="notification-badge-anchor">
            <IconButton
              icon="bell"
              variant="base"
              label={`${t('header.notifications')} (${unread})`}
              aria-haspopup="menu"
              aria-expanded={menu === 'notifications'}
              onClick={() => setMenu(menu === 'notifications' ? 'none' : 'notifications')}
            />
            {unread > 0 ? <span className="notification-badge" aria-hidden="true">{unread}</span> : null}
          </span>
          {menu === 'notifications' ? (
            <div className="profile__menu profile__menu--wide" role="menu" aria-label={t('header.notifications.panel')}>
              <div className="profile__identity" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="profile__name">{t('header.notifications.panel')}</span>
                {unread > 0 ? (
                  <Button variant="base" onClick={onMarkNotificationsRead}>
                    {t('header.notifications.markRead')}
                  </Button>
                ) : null}
              </div>
              {notifications.length === 0 ? (
                <div className="profile__identity profile__role">{t('header.notifications.empty')}</div>
              ) : (
                notifications.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={item.read ? 'notification' : 'notification notification--unread'}
                    onClick={() => {
                      close();
                      onOpenNotification(item.target);
                    }}
                  >
                    <span className="notification__title">{item.title}</span>
                    <span className="notification__detail">
                      {item.detail} · {fmt.shortDate(item.at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </HeaderMenu>
        <IconButton icon="help" variant="base" label={t('header.help')} onClick={onOpenHelp} />
        <HeaderMenu open={menu === 'profile'} onClose={close}>
          <button
            type="button"
            className="avatar profile__button"
            aria-haspopup="menu"
            aria-expanded={menu === 'profile'}
            aria-label={t('header.profile', { name: userName })}
            onClick={() => setMenu(menu === 'profile' ? 'none' : 'profile')}
          >
            {userInitials}
          </button>
          {menu === 'profile' ? (
            <div className="profile__menu" role="menu" aria-label={t('header.profile.menu')}>
              <div className="profile__identity">
                <div className="profile__name">{userName}</div>
                <div className="profile__role">{userRoleLabel}</div>
              </div>
              <button type="button" role="menuitem" className="profile__item" onClick={onSignOut}>
                <Icon name="lock" />
                {t('header.signOut')}
              </button>
            </div>
          ) : null}
        </HeaderMenu>
      </div>
    </header>
  );
}
