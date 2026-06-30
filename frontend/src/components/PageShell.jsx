import { Link, NavLink } from "react-router-dom";

import { getHomePath } from "../lib/auth.js";

function navLinkClass({ isActive }) {
  return isActive ? "top-link top-link-active" : "top-link";
}

export function PageShell({ session, onLogout, children }) {
  return (
    <main className="page">
      <header className="site-top-panel">
        <div className="site-top-panel-inner">
          <Link className="brand-link" to="/">
            <svg className="brand-car-svg" viewBox="0 0 120 56" aria-hidden="true">
              <rect x="20" y="18" width="80" height="20" rx="9" ry="9"></rect>
              <path d="M34 18 L44 8 H78 L92 18" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"></path>
              <circle cx="38" cy="42" r="8"></circle>
              <circle cx="82" cy="42" r="8"></circle>
            </svg>
            MetroCars
          </Link>

          <nav className="top-panel-links">
            {!session && (
              <>
                <NavLink className={navLinkClass} to="/login">
                  Login
                </NavLink>
                <NavLink className={navLinkClass} to="/signup">
                  Sign up
                </NavLink>
              </>
            )}

            {session?.role === "customer" && (
              <>
                <NavLink className={navLinkClass} to="/cars">
                  Cars
                </NavLink>
                <NavLink className={navLinkClass} to="/user">
                  User
                </NavLink>
                <button type="button" className="top-link logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            )}

            {session?.role === "admin" && (
              <>
                <NavLink className={navLinkClass} to={getHomePath(session.role)} end>
                  Admin
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/cars">
                  Cars
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/users">
                  Users
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/reservations">
                  Reservations
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/addcoupon">
                  Add coupon
                </NavLink>
                <button type="button" className="top-link logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {children}
    </main>
  );
}

export function PageSection({ eyebrow, title, subtitle, actions, children }) {
  return (
    <section className="cars-layout">
      <header className="cars-header">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {actions && <div className="hero-actions">{actions}</div>}
      </header>

      {children}
    </section>
  );
}