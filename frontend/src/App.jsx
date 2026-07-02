import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import carBg1 from "../assets/car-bg1.svg";
import carBg2 from "../assets/car-bg2.svg";
import carBg3 from "../assets/car-bg3.svg";
import carBg4 from "../assets/car-bg4.svg";
import metrocarLogo from "../assets/metrocar_logo.svg";
import { AppRouteGuard, GuestRoute } from "./components/RouteGuards.jsx";
import { clearStoredSession, getHomePath, getStoredSession, isSessionExpired, persistSession } from "./lib/auth.js";
import AdminAddCouponPage from "./pages/admin/AdminAddCouponPage.jsx";
import AdminCarsPage from "./pages/admin/AdminCarsPage.jsx";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import CarsPage from "./pages/CarsPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import UserDashboardPage from "./pages/user/UserDashboardPage.jsx";
import UserHistoryPage from "./pages/user/UserHistoryPage.jsx";
import UserInfoPage from "./pages/user/UserInfoPage.jsx";
import UserRentPaymentPage from "./pages/user/UserRentPaymentPage.jsx";

const boardAssets = [carBg1, carBg2, carBg3, carBg4];
const boardTileSize = 168;

function getBoardDimensions() {
  if (typeof window === "undefined") {
    return { columns: 0, rows: 0 };
  }

  return {
    columns: Math.ceil(window.innerWidth / boardTileSize) + 2,
    rows: Math.ceil(window.innerHeight / boardTileSize) + 2,
  };
}

function pickBoardAsset(row, column) {
  return boardAssets[(row * 7 + column * 5) % boardAssets.length];
}

function BoardBackdrop() {
  const [dimensions, setDimensions] = useState(() => getBoardDimensions());

  useEffect(() => {
    function handleResize() {
      setDimensions(getBoardDimensions());
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cells = [];
  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let column = 0; column < dimensions.columns; column += 1) {
      const isCenterTile = row % 3 === 1 && column % 3 === 1;
      const isCarTile = row % 3 === 1 || column % 3 === 1;

      cells.push(
        <div
          className={`site-backdrop-cell ${isCenterTile ? "site-backdrop-cell-center" : isCarTile ? "site-backdrop-cell-car" : "site-backdrop-cell-empty"}`}
          key={`${row}-${column}`}
        >
          {isCarTile && !isCenterTile && (
            <img className="site-backdrop-art" src={pickBoardAsset(row, column)} alt="" aria-hidden="true" />
          )}
          {isCenterTile && <img className="site-backdrop-logo" src={metrocarLogo} alt="" aria-hidden="true" />}
        </div>,
      );
    }
  }

  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="site-backdrop-grid" style={{ gridTemplateColumns: `repeat(${dimensions.columns}, ${boardTileSize}px)` }}>
        {cells}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());

  function handleLogin(token) {
    const nextSession = persistSession(token);
    setSession(nextSession);
    return nextSession;
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
  }

  useEffect(() => {
    if (isSessionExpired(session)) {
      handleLogout();
      return undefined;
    }

    function handleUnauthorized() {
      handleLogout();
    }

    window.addEventListener("metrocars:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("metrocars:unauthorized", handleUnauthorized);
  }, [session]);

  const homePath = session ? getHomePath(session.role) : "/";

  return (
    <>
      <BoardBackdrop />
      <Routes>
        <Route path="/" element={<HomePage session={session} onLogout={handleLogout} />} />
        <Route
          path="/login"
          element={
            <GuestRoute session={session} redirectTo={homePath}>
              <LoginPage session={session} onLogin={handleLogin} onLogout={handleLogout} />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute session={session} redirectTo={homePath}>
              <SignUpPage session={session} onLogout={handleLogout} />
            </GuestRoute>
          }
        />
        <Route
          path="/cars"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer", "admin"]}>
              <CarsPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AppRouteGuard session={session} allowedRoles={["admin"]}>
              <AdminDashboardPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/admin/cars"
          element={
            <AppRouteGuard session={session} allowedRoles={["admin"]}>
              <AdminCarsPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AppRouteGuard session={session} allowedRoles={["admin"]}>
              <AdminUsersPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/admin/reservations"
          element={
            <AppRouteGuard session={session} allowedRoles={["admin"]}>
              <AdminReservationsPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AppRouteGuard session={session} allowedRoles={["admin"]}>
              <AdminCouponsPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/admin/addcoupon"
          element={
            <AppRouteGuard session={session} allowedRoles={["admin"]}>
              <AdminAddCouponPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserDashboardPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user/info"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserInfoPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user/:userId"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserInfoPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user/history"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserHistoryPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user/:userId/history"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserHistoryPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user/rent/payment"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserRentPaymentPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route
          path="/user/:userId/rent/payment"
          element={
            <AppRouteGuard session={session} allowedRoles={["customer"]}>
              <UserRentPaymentPage session={session} onLogout={handleLogout} />
            </AppRouteGuard>
          }
        />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="*" element={<NotFoundPage session={session} onLogout={handleLogout} />} />
      </Routes>
    </>
  );
}
