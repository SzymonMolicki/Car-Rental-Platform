import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import car1 from "../assets/car1.svg";
import car2 from "../assets/car2.svg";
import car3 from "../assets/car3.svg";

const API_URL = "http://localhost:8000";

function TopPanel({ isLoggedIn, onLogout }) {
  return (
    <header className="site-top-panel">
      <div className="site-top-panel-inner">
        <Link className="brand-link" to="/">
          <svg className="brand-car-svg" viewBox="0 0 120 56" aria-hidden="true">
            <rect x="20" y="18" width="80" height="20" rx="9" ry="9"></rect>
            <path d="M34 18 L44 8 H78 L92 18" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"></path>
            <circle cx="38" cy="42" r="8"></circle>
            <circle cx="82" cy="42" r="8"></circle>
          </svg>
          MetroCars
        </Link>

        <nav className="top-panel-links">
          {!isLoggedIn && (
            <>
              <Link className="top-link" to="/login">
                Login
              </Link>
              <Link className="top-link top-link-accent" to="/signup">
                Sign up
              </Link>
            </>
          )}

          {isLoggedIn && (
            <button type="button" className="top-link logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function SecondaryMenu({ isLoggedIn }) {
  if (!isLoggedIn) {
    return null;
  }

  return (
    <nav className="secondary-menu">
      <div className="secondary-menu-inner">
        <Link className="menu-button" to="/cars">
          Cars
        </Link>
        <Link className="menu-button" to="/user">
          User Hub
        </Link>
      </div>
    </nav>
  );
}

function HomePage({ isLoggedIn, onLogout }) {
  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <SecondaryMenu isLoggedIn={isLoggedIn} />

      <div className="home-layout">
        <h1>MetroCars</h1>

        <p className="subtitle home-subtitle">Easy city rentals with modern booking.</p>

        <div className="hero-actions">
          <Link className="primary-link" to="/cars">
            Browse
          </Link>
        </div>
      </div>
    </main>
  );
}

function CarsMotionStrip() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    function onScroll() {
      setScrollY(window.scrollY || 0);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const offset = (scrollY * 0.45) % 360;
  const stripCars = [
    car1, car2, car3,
    car1, car2, car3,
    car1, car2, car3,
    car1, car2, car3,
    car1, car2, car3,
    car1, car2, car3,
    car1, car2, car3,
  ];

  return (
    <div className="cars-motion-strip" aria-hidden="true">
      <div className="cars-motion-strip-track" style={{ transform: `translateX(${offset}px)` }}>
        {stripCars.map((carSrc, index) => (
          <img className="strip-car" src={carSrc} alt="" key={`strip-car-${index}`} />
        ))}
      </div>
    </div>
  );
}

function CarsPage({ isLoggedIn, onLogout }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await fetch(`${API_URL}/cars`);

        if (!response.ok) {
          throw new Error("Failed to fetch cars");
        }

        const data = await response.json();
        setCars(data);
      } catch (err) {
        setError("Could not load cars.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <SecondaryMenu isLoggedIn={isLoggedIn} />

      <div className="cars-layout">
        <header className="cars-header">          
          <p className="eyebrow">MetroCars</p>
          <h1>Available cars</h1>
          <CarsMotionStrip />
          <p className="subtitle">
            Browse the current fleet.
          </p>
        </header>

        {loading && <p className="status-text">Loading cars...</p>}

        {error && <p className="status-text error-text">{error}</p>}

        {!loading && !error && cars.length === 0 && (
          <p className="status-text">No cars found.</p>
        )}

        {!loading && !error && cars.length > 0 && (
          <section className="cars-grid">
            {cars.map((car) => (
              <article className="car-card" key={car.id}>
                <div className="car-card-top">
                  <span className="car-status">{car.status}</span>
                  <span className="car-year">{car.production_year}</span>
                </div>

                <h2>
                  {car.brand} {car.model}
                </h2>

                <div className="car-details">
                  <p>
                    <span>Daily rate</span>
                    <strong>{Number(car.daily_rate).toFixed(2)} zł</strong>
                  </p>
                  <p>
                    <span>ID</span>
                    <strong>{car.id}</strong>
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function LoginPage({ isLoggedIn, onLogin, onLogout }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      onLogin(data.access_token, email);
      setMessage("Login successful.");
      navigate("/cars");
    } catch (err) {
      setError(err.message || "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />

      <section className="auth-layout">
        <h1>Login</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Login
            <input type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder='[ex. "alexconnor@mail.com"]' autoComplete="username" required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
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
    </main>
  );
}

function UserHubPage({ isLoggedIn, onLogout, authToken }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${API_URL}/user`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");
        setUser(await response.json());
      } catch (err) {
        setError(err.message || "Could not load user data.");
      } finally {
        setLoading(false);
      }
    }

    if (isLoggedIn && authToken) {
      fetchUser();
    }
  }, [isLoggedIn, authToken]);

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <SecondaryMenu isLoggedIn={isLoggedIn} />

      <div className="user-hub-layout">
        <h1>User Hub</h1>

        {loading && <p className="status-text">Loading user data...</p>}
        {error && <p className="status-text error-text">{error}</p>}

        {user && !loading && (
          <div className="user-hub-grid">
            <section className="user-hub-card">
              <h2>📋 Profile</h2>
              <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || "N/A"}</p>
              <Link className="primary-link" to="/user/edit">
                Edit Profile
              </Link>
            </section>

            <section className="user-hub-card">
              <h2>🚗 Rental History</h2>
              <Link className="primary-link" to="/user/rentals">
                View Rentals
              </Link>
            </section>

            <section className="user-hub-card">
              <h2>💳 Payments</h2>
              <Link className="primary-link" to="/user/payments">
                View Payments
              </Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function UserEditPage({ isLoggedIn, onLogout, authToken }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${API_URL}/user`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch user data");
        const user = await response.json();
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone: user.phone || "",
        });
      } catch (err) {
        setError(err.message);
      }
    }
    if (isLoggedIn && authToken) fetchUser();
  }, [isLoggedIn, authToken]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      setMessage("Profile updated successfully!");
      setTimeout(() => navigate("/user"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <SecondaryMenu isLoggedIn={isLoggedIn} />

      <section className="auth-layout">
        <h1>Edit Profile</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            First name
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+48123123123"
            />
          </label>
          <button type="submit" className="primary-link auth-submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
        {message && <p className="status-text">{message}</p>}
        {error && <p className="status-text error-text">{error}</p>}
      </section>
    </main>
  );
}

function UserRentalsPage({ isLoggedIn, onLogout, authToken }) {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRentals() {
      try {
        const response = await fetch(`${API_URL}/user/rentals`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch rentals");
        setRentals(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (isLoggedIn && authToken) fetchRentals();
  }, [isLoggedIn, authToken]);

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <SecondaryMenu isLoggedIn={isLoggedIn} />

      <div className="cars-layout">
        <h1>Rental History</h1>
        <Link className="back-link" to="/user">← Back</Link>

        {loading && <p className="status-text">Loading rentals...</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && rentals.length === 0 && <p className="status-text">No rentals found.</p>}

        {rentals.length > 0 && (
          <section className="cars-grid" style={{ marginTop: "24px" }}>
            {rentals.map((rental) => (
              <article className="car-card" key={rental.id}>
                <h2>Rental #{rental.id}</h2>
                <p><strong>Car:</strong> {rental.car?.brand} {rental.car?.model}</p>
                <p><strong>Start:</strong> {rental.start_date}</p>
                <p><strong>End:</strong> {rental.end_date}</p>
                <p><strong>Status:</strong> {rental.status}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function UserPaymentsPage({ isLoggedIn, onLogout, authToken }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await fetch(`${API_URL}/user/payments`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch payments");
        setPayments(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (isLoggedIn && authToken) fetchPayments();
  }, [isLoggedIn, authToken]);

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <SecondaryMenu isLoggedIn={isLoggedIn} />

      <div className="cars-layout">
        <h1>Payments</h1>
        <Link className="back-link" to="/user">← Back</Link>

        {loading && <p className="status-text">Loading payments...</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && payments.length === 0 && <p className="status-text">No payments found.</p>}

        {payments.length > 0 && (
          <section className="cars-grid" style={{ marginTop: "24px" }}>
            {payments.map((payment) => (
              <article className="car-card" key={payment.id}>
                <h2>Payment #{payment.id}</h2>
                <p><strong>Amount:</strong> {payment.amount} zł</p>
                <p><strong>Date:</strong> {payment.date}</p>
                <p><strong>Status:</strong> {payment.status}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function SignUpPage({ isLoggedIn, onLogout }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords must match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setMessage(data.message || "Registration successful.");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
      });
    } catch (err) {
      setError(err.message || "Could not register.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <TopPanel isLoggedIn={isLoggedIn} onLogout={onLogout} />

      <section className="auth-layout">
        <h1>Sign up</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            First name
            <input type="text" value={formData.first_name} onChange={(event) => updateField("first_name", event.target.value)} required />
          </label>

          <label>
            Last name
            <input type="text" value={formData.last_name} onChange={(event) => updateField("last_name", event.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} required />
          </label>

          <label>
            Phone
            <input type="tel" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+48123123123" required />
          </label>

          <label>
            Password
            <input type="password" value={formData.password} onChange={(event) => updateField("password", event.target.value)} minLength={8} required />
          </label>

          <label>
            Confirm password
            <input type="password" value={formData.confirm_password} onChange={(event) => updateField("confirm_password", event.target.value)} minLength={8} required />
          </label>

          <button type="submit" className="primary-link auth-submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && <p className="status-text">{message}</p>}
        {error && <p className="status-text error-text">{error}</p>}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("access_token") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("user_email") || "");

  function handleLogin(token, email) {
    setAuthToken(token);
    setUserEmail(email);
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_email", email);
  }

  function handleLogout() {
    setAuthToken("");
    setUserEmail("");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
  }

  const isLoggedIn = Boolean(authToken && userEmail);

  return (
    <Routes>
      <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
      <Route path="/cars" element={isLoggedIn ? <CarsPage isLoggedIn={isLoggedIn} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/cars" replace /> : <LoginPage isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout} />} />
      <Route path="/signup" element={isLoggedIn ? <Navigate to="/cars" replace /> : <SignUpPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      <Route path="/user" element={isLoggedIn ? <UserHubPage isLoggedIn={isLoggedIn} onLogout={handleLogout} authToken={authToken} /> : <Navigate to="/login" replace />} />
      <Route path="/user/edit" element={isLoggedIn ? <UserEditPage isLoggedIn={isLoggedIn} onLogout={handleLogout} authToken={authToken} /> : <Navigate to="/login" replace />} />
      <Route path="/user/rentals" element={isLoggedIn ? <UserRentalsPage isLoggedIn={isLoggedIn} onLogout={handleLogout} authToken={authToken} /> : <Navigate to="/login" replace />} />
      <Route path="/user/payments" element={isLoggedIn ? <UserPaymentsPage isLoggedIn={isLoggedIn} onLogout={handleLogout} authToken={authToken} /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}