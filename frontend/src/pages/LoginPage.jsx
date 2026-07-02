import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { PageShell } from "../components/PageShell.jsx";
import { requestJson } from "../lib/api.js";
import { getHomePath } from "../lib/auth.js";

export default function LoginPage({ session, onLogin, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await requestJson("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
        fallbackMessage: "Login failed",
      });

      const nextSession = onLogin(data.access_token);
      if (!nextSession) {
        throw new Error("Login failed");
      }
      navigate(getHomePath(nextSession?.role), { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <section className="auth-layout">
        <h1>Login</h1>
        <p className="subtitle">Use your email and password to log in.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>

          <button type="submit" className="primary-link auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p className="status-text">{message}</p>}
        {error && <p className="status-text error-text">{error}</p>}

        <p className="auth-switch">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      </section>
    </PageShell>
  );
}
