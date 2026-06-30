import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

export default function AdminUsersPage({ session, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await apiFetch("/admin/customers", { token: session?.token });
        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load users");
        }

        setUsers(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load users.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [session?.token]);

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Admin" title="Users" subtitle="Customer list from the backend.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/admin">
            ← Back to dashboard
          </Link>
        </div>

        {loading && <p className="status-text">Loading users...</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && users.length === 0 && <p className="status-text">No users found.</p>}

        {users.length > 0 && (
          <section className="cars-grid">
            {users.map((user) => (
              <article className="car-card" key={user.customer_id}>
                <h2>
                  {user.first_name} {user.last_name}
                </h2>
                <div className="car-details">
                  <p>
                    <span>Email</span>
                    <strong>{user.email}</strong>
                  </p>
                  <p>
                    <span>Phone</span>
                    <strong>{user.phone}</strong>
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </PageSection>
    </PageShell>
  );
}