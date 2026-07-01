import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";

const adminLinks = [
  { to: "/admin/cars", title: "Cars", description: "Manage the fleet." },
  { to: "/admin/users", title: "Users", description: "Inspect customer accounts." },
  { to: "/admin/reservations", title: "Reservations", description: "Track bookings." },
  { to: "/admin/coupons", title: "Coupons", description: "View and create discount codes." },
];

export default function AdminDashboardPage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Admin view"
        title="Admin dashboard"
        subtitle="Special view shown after an admin login."
      >
        <section className="cars-grid">
          {adminLinks.map((item) => (
            <article className="car-card" key={item.to}>
              <h2>{item.title}</h2>
              <p className="subtitle">{item.description}</p>
              <div className="hero-actions">
                <Link className="back-link" to={item.to}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </section>
      </PageSection>
    </PageShell>
  );
}