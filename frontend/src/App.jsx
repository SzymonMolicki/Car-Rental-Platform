import { Link, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

function HomePage() {
  return (
    <main className="page">
      <div className="home-layout">
        <h1>MetroCars</h1>

        <div className="hero-actions">
          <Link className="primary-link" to="/cars">
            Browse
          </Link>
        </div>
      </div>
    </main>
  );
}

function CarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await fetch("http://localhost:8000/cars");

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
      <div className="cars-layout">
        <header className="cars-header">
          <div className="topbar">
            <Link className="back-link" to="/">
              ← Home
            </Link>
          </div>

          <p className="eyebrow">MetroCars</p>
          <h1>Available cars</h1>
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cars" element={<CarsPage />} />
    </Routes>
  );
}