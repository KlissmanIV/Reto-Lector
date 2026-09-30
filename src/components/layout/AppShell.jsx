import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM } from './navItems';
import { Avatar } from '../common/ui';
import { useAppData } from '../../context/AppDataContext';
import { useUi } from '../../context/UiContext';

function Brand() {
  return (
    <NavLink to="/" className="brand" aria-label="Duelo Lector, inicio">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      <span className="brand-name">Reader Challenge</span>
    </NavLink>
  );
}

function UserSwitch({ compact = false }) {
  const { users, currentUser, actions } = useAppData();
  if (!currentUser || users.length < 2) return null;
  const other = users.find((u) => u.id !== currentUser.id);
  return (
    <button
      type="button"
      className={`user-switch ${compact ? 'is-compact' : ''}`}
      onClick={() => actions.updateSettings({ activeUserId: other.id })}
      aria-label={`Usando la app como ${currentUser.shortName}. Cambiar a ${other.shortName}`}
      title={`Cambiar a ${other.shortName}`}
    >
      <Avatar user={currentUser} size={compact ? 30 : 34} />
      {!compact && (
        <span className="user-switch-text">
          <span className="user-switch-label">Usando como</span>
          <span className="user-switch-name">{currentUser.shortName}</span>
        </span>
      )}
    </button>
  );
}

export default function AppShell() {
  const { openBookForm } = useUi();
  const location = useLocation();

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Saltar al contenido</a>

      <aside className="sidebar" aria-label="Navegación principal">
        <Brand />
        <button type="button" className="btn btn-primary btn-block sidebar-cta" onClick={() => openBookForm()}>
          <Plus size={18} aria-hidden="true" /> Añadir libro
        </button>
        <nav className="side-nav">
          {[...NAV_ITEMS, SETTINGS_ITEM].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <UserSwitch />
        </div>
      </aside>

      <header className="mobile-bar">
        <Brand />
        <div className="mobile-bar-actions">
          <UserSwitch compact />
          <NavLink to={SETTINGS_ITEM.to} className="icon-btn" aria-label="Ajustes">
            <Settings size={20} />
          </NavLink>
        </div>
      </header>

      <main id="main" className="app-main" tabIndex={-1}>
        <div className="page" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <button type="button" className="fab" onClick={() => openBookForm()} aria-label="Añadir libro">
        <Plus size={24} />
      </button>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-link">
            <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
