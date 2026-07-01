import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";

import car1 from "../../assets/car1.svg";
import car2 from "../../assets/car2.svg";
import car3 from "../../assets/car3.svg";
import { getHomePath } from "../lib/auth.js";

function navLinkClass({ isActive }) {
  return isActive ? "top-link top-link-active" : "top-link";
}

const stripCars = [car1, car2, car2, car3, car2, car1, car1, car3, car1, car2, car3, car2, car3];
const loopStripCars = [...stripCars, ...stripCars];

function CarMotionStrip({ side, direction = 1 }) {
  const trackRef = useRef(null);

  useEffect(() => {
    if (!trackRef.current) return undefined;

    const track = trackRef.current;
    let animationFrame = 0;

    function updatePosition() {
      const loopHeight = track.scrollHeight / 2;

      if (!loopHeight) return;

      const travel = (window.scrollY * 0.35 * direction) % loopHeight;
      const offset = travel < 0 ? travel + loopHeight : travel;

      track.style.transform = `translate3d(0, ${-offset}px, 0)`;
    }

    function handleScroll() {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updatePosition);
    }

    updatePosition();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updatePosition);
    window.addEventListener("load", updatePosition);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("load", updatePosition);
    };
  }, []);

  return (
    <div className={`cars-motion-strip cars-motion-strip-${side}`} aria-hidden="true">
      <div
        className={`cars-motion-strip-track cars-motion-strip-track-${direction > 0 ? "forward" : "reverse"}`}
        ref={trackRef}
      >
        {loopStripCars.map((car, index) => (
          <img className="strip-car" key={`${car}-${index}`} src={car} alt="" />
        ))}
      </div>
    </div>
  );
}

export function PageShell({ session, onLogout, children }) {
  const showCarStrips = session?.role === "customer" || session?.role === "admin";

  return (
    <main className="page">
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
            {!session && (
              <>
                <NavLink className={navLinkClass} to="/login">
                  Login
                </NavLink>
                <NavLink className={navLinkClass} to="/signup">
                  Sign up
                </NavLink>
              </>
            )}

            {session?.role === "customer" && (
              <>
                <NavLink className={navLinkClass} to="/cars">
                  Cars
                </NavLink>
                <NavLink className={navLinkClass} to="/user">
                  User
                </NavLink>
                <button type="button" className="top-link logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            )}

            {session?.role === "admin" && (
              <>
                <NavLink className={navLinkClass} to={getHomePath(session.role)} end>
                  Admin
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/cars">
                  Cars
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/users">
                  Users
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/reservations">
                  Reservations
                </NavLink>
                <NavLink className={navLinkClass} to="/admin/coupons">
                  Coupons
                </NavLink>
                <button type="button" className="top-link logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {showCarStrips && <CarMotionStrip side="left" direction={1} />}

      {children}

      {showCarStrips && <CarMotionStrip side="right" direction={1} />}
    </main>
  );
}

export function PageSection({ eyebrow, title, subtitle, actions, children }) {
  return (
    <section className="cars-layout">
      <header className="cars-header">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {actions && <div className="hero-actions">{actions}</div>}
      </header>

      {children}
    </section>
  );
}