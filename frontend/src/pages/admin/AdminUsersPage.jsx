import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EntityDetailsModal from "../../components/EntityDetailsModal.jsx";
import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "N/A";
}

function formatDateOnly(value) {
  return value ? new Date(value).toLocaleDateString() : "N/A";
}

export default function AdminUsersPage({ session, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

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
              <article
                className="car-card car-card-clickable"
                key={user.customer_id}
                onClick={() => setSelectedUser(user)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedUser(user);
                  }
                }}
              >
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

                <div className="car-card-hint">Click for full details</div>
              </article>
            ))}
          </section>
        )}
      </PageSection>

      {selectedUser && (
        <EntityDetailsModal
          title={`${selectedUser.first_name} ${selectedUser.last_name}`}
          description="Customer account details"
          badges={[{ label: "Customer", value: selectedUser.customer_id }]}
          details={[
            { label: "Email", value: selectedUser.email },
            { label: "Phone", value: selectedUser.phone },
            { label: "Date of birth", value: formatDateOnly(selectedUser.date_of_birth) },
            { label: "Driver license no.", value: selectedUser.driver_license_no },
            { label: "License expiry", value: formatDateOnly(selectedUser.license_expiry_date) },
            { label: "Customer ID", value: selectedUser.customer_id, monospace: true },
            { label: "Address ID", value: selectedUser.address_id, monospace: true },
            { label: "Created", value: formatDate(selectedUser.created_at) },
            { label: "Updated", value: formatDate(selectedUser.updated_at) },
          ]}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </PageShell>
  );
}