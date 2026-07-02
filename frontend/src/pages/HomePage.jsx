import { Link } from "react-router-dom";

import metrocarLogo from "../../assets/metrocar_logo.svg?raw";
import { PageShell } from "../components/PageShell.jsx";
import { getHomePath } from "../lib/auth.js";

export default function HomePage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <div className="home-layout">
        <div
              aria-hidden="true"
              className="home-hero-logo"
              dangerouslySetInnerHTML={{ __html: MetrocarLogo }}
            />
        <p className="eyebrow">Car rental platform</p>
        <h1>MetroCars</h1>
        <p className="subtitle home-subtitle">Find a car, book your dates, and manage your rentals in one place.</p>

        <div className="hero-actions">
          {session ? (
            <Link className="primary-link" to={getHomePath(session.role)}>
              Continue
            </Link>
          ) : (
            <>
              <Link className="primary-link" to="/login">
                Login
              </Link>
              <Link className="primary-link" to="/signup" style={{ marginLeft: 12 }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
