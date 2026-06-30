import { useState } from "react";
import { Link } from "react-router-dom";

import CarModal from "../components/CarModal.jsx";
import { PageShell, PageSection } from "../components/PageShell.jsx";
import { featuredCars } from "../lib/demoData.js";

export default function CarsPage({ session, onLogout }) {
  const [selectedCar, setSelectedCar] = useState(null);

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Customer view"
        title="Available cars"
        subtitle="Basic car browsing page for logged-in users."
        actions={<Link className="primary-link" to="/user/rent/payment">Book a car</Link>}
      >
        <section className="cars-grid">
          {featuredCars.map((car) => (
            <article
              className="car-card car-card-clickable"
              key={car.id}
              onClick={() => setSelectedCar(car)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedCar(car)}
            >
              <div className="car-card-top">
                <span className="car-status">{car.status}</span>
                <span className="car-year">{car.year}</span>
              </div>

              <h2>
                {car.brand} {car.model}
              </h2>

              <div className="car-details">
                <p>
                  <span>Daily rate</span>
                  <strong>{car.rate} zł</strong>
                </p>
                <p>
                  <span>Car id</span>
                  <strong>{car.id}</strong>
                </p>
              </div>

              <div className="hero-actions" style={{ marginTop: 14 }}>
                <Link
                  className="back-link"
                  to="/user/rent/payment"
                  state={{ car }}
                  onClick={(event) => event.stopPropagation()}
                >
                  Rent this car
                </Link>
              </div>

              <div className="car-card-hint">Click for full details</div>
            </article>
          ))}
        </section>
      </PageSection>

      {selectedCar && (
        <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </PageShell>
  );
}
