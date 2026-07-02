import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

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
  );
}
