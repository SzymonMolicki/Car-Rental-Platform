import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../components/PageShell.jsx";
import { featuredCars } from "../lib/demoData.js";

export default function CarsPage({ session, onLogout }) {
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
            <article className="car-card" key={car.id}>
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

              <div className="hero-actions">
                <Link className="back-link" to="/user/rent/payment">
                  Rent this car
                </Link>
              </div>
            </article>
          ))}
        </section>
      </PageSection>
    </PageShell>
  );
}