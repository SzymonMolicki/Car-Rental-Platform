import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";

const adminLinks = [
  { to: "/admin/cars", title: "Cars", description: "Manage the fleet." },
  { to: "/admin/users", title: "Users", description: "Review customer accounts." },
  { to: "/admin/reservations", title: "Reservations", description: "Follow upcoming and active bookings." },
  { to: "/admin/coupons", title: "Coupons", description: "Manage customer discounts." },
];

export default function AdminDashboardPage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Management"
        title="Admin dashboard"
        subtitle="Choose an area to manage fleet, customers, reservations, or discounts."
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
