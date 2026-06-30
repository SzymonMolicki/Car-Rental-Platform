import { Link } from "react-router-dom";

import { PageShell } from "../components/PageShell.jsx";

export default function NotFoundPage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <div className="home-layout">
        <p className="eyebrow">Not found</p>
        <h1>404</h1>
        <p className="subtitle home-subtitle">The requested page does not exist.</p>
        <div className="hero-actions">
          <Link className="primary-link" to="/">
            Go home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}