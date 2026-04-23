import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

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

export function saveAuth(authPayload) {
  const storage = getAuthStorage();
  storage?.setItem("auth", JSON.stringify(authPayload));
}

export function getAuth() {
  const storage = getAuthStorage();
  const raw = storage?.getItem("auth");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    storage?.removeItem("auth");
    return null;
  }
}

export function clearAuth() {
  const storage = getAuthStorage();
  storage?.removeItem("auth");
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
