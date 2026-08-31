import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StudentShell.css';

export default function StudentShell() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="student-shell">
      <header className="student-topnav">
        <div className="student-topnav-brand">
          <span className="student-brand-mark">OUI</span> Clinic
        </div>

        <nav className={`student-topnav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/portal" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
            Overview
          </NavLink>
          <NavLink to="/portal/appointments" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
            Appointments
          </NavLink>
          <NavLink to="/portal/messages" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
            Messages
          </NavLink>
          <NavLink to="/portal/record" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
            My Health Record
          </NavLink>
          <div className="student-topnav-links-mobile-footer">
            <span className="muted small">{user?.full_name}</span>
            <button className="student-signout" onClick={logout}>Sign out</button>
          </div>
        </nav>

        <div className="student-topnav-user">
          <span className="muted small">{user?.full_name}</span>
          <button className="student-signout" onClick={logout}>Sign out</button>
        </div>

        <button
          className={`student-menu-toggle ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && <div className="student-menu-backdrop" onClick={closeMenu} />}

      <main className="student-main">
        <Outlet />
      </main>
    </div>
  );
}
