import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

const AUTH_ACTIVE_ROLE_KEY = "cardioshield.activeRole";
const AUTH_KEY_PREFIX = "cardioshield.auth";
const LEGACY_AUTH_KEY = "auth";

function getAuthStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return window.localStorage;
  }
}

function getAuthKey(role) {
  return `${AUTH_KEY_PREFIX}.${role || "default"}`;
}

export function saveAuth(authPayload) {
  const storage = getAuthStorage();
  const role = authPayload?.user?.role || "default";
  storage?.setItem(AUTH_ACTIVE_ROLE_KEY, role);
  storage?.setItem(getAuthKey(role), JSON.stringify(authPayload));
  storage?.setItem(LEGACY_AUTH_KEY, JSON.stringify(authPayload));
}

export function getAuth() {
  const storage = getAuthStorage();
  const activeRole = storage?.getItem(AUTH_ACTIVE_ROLE_KEY);
  const raw = activeRole ? storage?.getItem(getAuthKey(activeRole)) : storage?.getItem(LEGACY_AUTH_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    if (activeRole) {
      storage?.removeItem(getAuthKey(activeRole));
    }
    storage?.removeItem(LEGACY_AUTH_KEY);
    return null;
  }
}

export function clearAuth() {
  const storage = getAuthStorage();
  const activeRole = storage?.getItem(AUTH_ACTIVE_ROLE_KEY);
  if (activeRole) {
    storage?.removeItem(getAuthKey(activeRole));
  }
  storage?.removeItem(AUTH_ACTIVE_ROLE_KEY);
  storage?.removeItem(LEGACY_AUTH_KEY);
}

export async function downloadFromApi(url, filename) {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

api.interceptors.request.use((config) => {
  const auth = getAuth();
  const token = auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
