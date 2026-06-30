import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { sampleRentalHistory } from "../../lib/demoData.js";

export default function UserHistoryPage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Customer" title="History" subtitle="Basic purchase and rental history.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">
            ← Back to user area
          </Link>
        </div>

        <section className="cars-grid">
          {sampleRentalHistory.map((item) => (
            <article className="car-card" key={item.id}>
              <div className="car-card-top">
                <span className="car-status">{item.status}</span>
                <span className="car-year">{item.id}</span>
              </div>

              <h2>{item.car}</h2>

              <div className="car-details">
                <p>
                  <span>Dates</span>
                  <strong>{item.dates}</strong>
                </p>
                <p>
                  <span>Total</span>
                  <strong>{item.total}</strong>
                </p>
              </div>
            </article>
          ))}
        </section>
      </PageSection>
    </PageShell>
  );
}