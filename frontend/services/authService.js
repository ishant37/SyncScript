import { apiRequest, clearStoredToken, setStoredToken } from "./api";

export async function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  setStoredToken(data.token);
  return data.user;
}

export async function getCurrentUser() {
  const data = await apiRequest("/api/auth/me");
  return data.user;
}

export function logoutUser() {
  clearStoredToken();
}
