import { Link } from "react-router-dom";

import { PageShell } from "../components/PageShell.jsx";
import { getHomePath } from "../lib/auth.js";

export default function HomePage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <div className="home-layout">
        <p className="eyebrow">Car rental platform</p>
        <h1>MetroCars</h1>
        <p className="subtitle home-subtitle">Public landing page, customer booking area, and admin console in one flow.</p>

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