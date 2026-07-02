export const API_URL = "http://localhost:8000";

export class ApiRequestError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.data = data;
  }
}

function notifyUnauthorized() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("metrocars:unauthorized"));
  }
}

export function getApiErrorMessage(data, fallback = "Request failed") {
  const detail = data?.detail ?? data;

  if (!detail) return fallback;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        const location = Array.isArray(item?.loc) ? item.loc.filter(Boolean).join(".") : "";
        const message = item?.msg || item?.message || item?.detail || JSON.stringify(item);
        return location ? `${location}: ${message}` : message;
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return detail.message || detail.error || JSON.stringify(detail);
  }

  return String(detail);
}

export async function apiFetch(path, { token, headers, ...options } = {}) {
  const requestHeaders = new Headers(headers || {});

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: requestHeaders,
  });

  if (token && response.status === 401) {
    notifyUnauthorized();
  }

  return response;
}

export async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  return null;
}

export async function requestJson(path, { fallbackMessage = "Request failed", ...options } = {}) {
  const response = await apiFetch(path, options);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new ApiRequestError(getApiErrorMessage(data, fallbackMessage), {
      status: response.status,
      data,
    });
  }

  return data;
}

export async function downloadBlob(path, { token, fallbackMessage = "Download failed" } = {}) {
  const response = await apiFetch(path, { token });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new ApiRequestError(getApiErrorMessage(data, fallbackMessage), {
      status: response.status,
      data,
    });
  }

  return response.blob();
}

export function saveBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
