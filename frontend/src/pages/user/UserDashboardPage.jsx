import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

const userLinks = [
  { to: "/user/info", title: "Info", description: "Edit profile details." },
  { to: "/user/history", title: "History", description: "Review past purchases." },
  { to: "/user/rent/payment", title: "Rent payment", description: "Reserve and pay for a car." },
];

export default function UserDashboardPage({ session, onLogout }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.token || !session?.payload?.sub) {
        return;
      }

      try {
        const response = await apiFetch(`/user/${session?.payload?.sub ?? session?.sub}`, {
          token: session.token,
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load profile");
        }

        setProfile(data);
      } catch (error) {
        console.error("Failed to load customer profile:", error);
      }
    }

    loadProfile();
  }, [session]);

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Customer"
        title={profile ? `Welcome, ${profile.first_name}!` : "User area"}
        subtitle="From here the customer can manage account details and rentals."
      >
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