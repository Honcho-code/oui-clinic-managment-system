import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StaffShell.css';

const LINKS = [
  { to: '/clinic', label: 'Overview', end: true },
  { to: '/clinic/students', label: 'Students & Records' },
  { to: '/clinic/appointments', label: 'Appointments' },
  { to: '/clinic/messages', label: 'Messages' },
  { to: '/clinic/reports', label: 'Reports' },
];

export default function StaffShell() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="staff-shell">
      <header className="staff-topbar">
        <button
          className={`staff-menu-toggle ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="staff-topbar-brand">
          <span className="staff-sidebar-brand-mark">OUI</span> Clinic
        </div>
      </header>

      {menuOpen && <div className="staff-menu-backdrop" onClick={closeMenu} />}

      <aside className={`staff-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="staff-sidebar-brand">
          <span className="staff-sidebar-brand-mark">OUI</span>
          <span className="staff-sidebar-brand-sub">Clinic</span>
        </div>

        <nav className="staff-nav">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMenu}
              className={({ isActive }) => `staff-nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="staff-sidebar-footer">
          <div className="staff-user">
            <div className="staff-user-name">{user?.full_name}</div>
            <div className="staff-user-role muted small">
              {user?.role === 'admin' ? 'Administrator' : 'Nurse'} · {user?.identifier}
            </div>
          </div>
          <button className="staff-signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="staff-main">
        <Outlet />
      </main>
    </div>
  );
}
