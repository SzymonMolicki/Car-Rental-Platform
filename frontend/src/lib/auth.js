function decodeBase64Url(value) {
  const paddedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedLength = paddedValue.length + ((4 - (paddedValue.length % 4)) % 4);
  const normalizedValue = paddedValue.padEnd(paddedLength, "=");
  return atob(normalizedValue);
}

export function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function getHomePath(role) {
  return role === "admin" ? "/admin" : "/cars";
}

export function getSessionUserId(session) {
  return session?.payload?.sub ?? session?.sub ?? "";
}

export function getUserPath(session, suffix = "") {
  const userId = getSessionUserId(session);
  return userId ? `/user/${userId}${suffix}` : "/user";
}

export function isJwtPayloadExpired(payload) {
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

export function isSessionExpired(session) {
  return isJwtPayloadExpired(session?.payload);
}

export function getStoredSession() {
  const token = localStorage.getItem("access_token") || "";

  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);

  if (!payload || isJwtPayloadExpired(payload)) {
    clearStoredSession();
    return null;
  }

  const role = payload.role === "admin" || payload.account_type === "admin" ? "admin" : "customer";
  const label = payload.username || payload.email || payload.sub || "Guest";

  return {
    token,
    role,
    label,
    email: payload.email || "",
    payload,
  };
}

export function persistSession(token) {
  const payload = decodeJwtPayload(token);

  if (!payload || isJwtPayloadExpired(payload)) {
    clearStoredSession();
    return null;
  }

  const role = payload?.role === "admin" || payload?.account_type === "admin" ? "admin" : "customer";
  const label = payload?.username || payload?.email || payload?.sub || "Guest";

  localStorage.setItem("access_token", token);
  localStorage.setItem("user_role", role);
  localStorage.setItem("user_label", label);

  return {
    token,
    role,
    label,
    email: payload?.email || "",
    payload: payload || {},
  };
}

export function clearStoredSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_label");
}
