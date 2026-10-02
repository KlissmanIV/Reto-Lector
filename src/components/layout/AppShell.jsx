import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM, STREAK_ITEM } from './navItems';
import StreakChip, { StreakCount } from '../streak/StreakChip';
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
  const { currentUser } = useAppData();
  if (!currentUser) return null;
  return (
    <NavLink
      to={`/perfil/${currentUser.id}`}
      className={`user-switch ${compact ? 'is-compact' : ''}`}
      aria-label={`Sesión de ${currentUser.shortName}. Ver mi perfil`}
    >
      <Avatar user={currentUser} size={compact ? 30 : 34} />
      {!compact && (
        <span className="user-switch-text">
          <span className="user-switch-label">Sesión iniciada</span>
          <span className="user-switch-name">{currentUser.shortName}</span>
        </span>
      )}
    </NavLink>
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
          {[...NAV_ITEMS.slice(0, 3), STREAK_ITEM, ...NAV_ITEMS.slice(3), SETTINGS_ITEM].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
              {to === STREAK_ITEM.to && <StreakCount />}
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
          <StreakChip />
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
