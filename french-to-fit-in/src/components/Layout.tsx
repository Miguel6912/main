import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-wordmark">
          French to Fit In<span className="app-wordmark-tm">&trade;</span>
        </NavLink>
        <nav className="app-nav" aria-label="Main navigation">
          <NavLink to="/course-map" className={({ isActive }) => (isActive ? 'active' : '')}>
            Course Map
          </NavLink>
          <NavLink to="/pilot" className={({ isActive }) => (isActive ? 'active' : '')}>
            Pilot
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
