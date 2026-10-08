import { API_URL } from "../config/config";

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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
