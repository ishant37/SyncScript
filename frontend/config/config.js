const browserApiUrl =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : import.meta.env.DEV
      ? window.location.origin
      : `${window.location.protocol}//${window.location.hostname}:3000`;

export const API_URL = import.meta.env.VITE_API_URL || browserApiUrl;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_URL;