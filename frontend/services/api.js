import { API_URL } from "../config/config";

const REQUEST_TIMEOUT = 10000;

export function getStoredToken() {
  return localStorage.getItem("syncscript_token");
}

export function setStoredToken(token) {
  localStorage.setItem("syncscript_token", token);
}

export function clearStoredToken() {
  localStorage.removeItem("syncscript_token");
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || REQUEST_TIMEOUT,
  );

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The request timed out. Check that the SyncScript backend is running and try again.",
        { cause: error },
      );
    }
    throw new Error(
      "Unable to reach the SyncScript backend. Check your connection and try again.",
      { cause: error },
    );
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}
