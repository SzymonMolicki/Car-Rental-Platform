export const API_URL = "http://localhost:8000";

export async function apiFetch(path, { token, headers, ...options } = {}) {
  const requestHeaders = new Headers(headers || {});

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: requestHeaders,
  });
}

export async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}