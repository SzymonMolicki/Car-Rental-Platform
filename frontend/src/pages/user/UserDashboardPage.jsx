import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";

const userLinks = [
  { to: "/user/info", title: "Info", description: "Edit profile details." },
  { to: "/user/history", title: "History", description: "Review past purchases." },
  { to: "/user/rent/payment", title: "Rent payment", description: "Reserve and pay for a car." },
];

export default function UserDashboardPage({ session, onLogout }) {
  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Customer" title="User area" subtitle="From here the customer can manage account details and rentals.">
        <section className="cars-grid">
          {userLinks.map((item) => (
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