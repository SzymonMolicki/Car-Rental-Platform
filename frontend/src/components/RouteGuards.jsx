import { Navigate } from "react-router-dom";

import { getHomePath, isSessionExpired } from "../lib/auth.js";

export function AppRouteGuard({ session, allowedRoles, children }) {
  if (!session || isSessionExpired(session)) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={getHomePath(session.role)} replace />;
  }

  return children;
}

export function GuestRoute({ session, redirectTo = "/", children }) {
  if (session && !isSessionExpired(session)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
