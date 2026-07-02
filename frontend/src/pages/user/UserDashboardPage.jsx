import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { requestJson } from "../../lib/api.js";
import { getUserPath } from "../../lib/auth.js";

export default function UserDashboardPage({ session, onLogout }) {
  const [profile, setProfile] = useState(null);
  const userLinks = [
    { to: getUserPath(session), title: "Info", description: "Update your personal and driving licence details." },
    { to: getUserPath(session, "/history"), title: "History", description: "See your past and upcoming rentals." },
  ];

  useEffect(() => {
    async function loadProfile() {
      if (!session?.token || !session?.payload?.sub) {
        return;
      }

      try {
        const data = await requestJson(`/user/${session?.payload?.sub ?? session?.sub}`, {
          token: session.token,
          fallbackMessage: "Failed to load profile",
        });
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
        eyebrow="Your account"
        title={profile ? `Welcome, ${profile.first_name}!` : "User area"}
        subtitle="Manage your profile, reservations, and invoices."
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
