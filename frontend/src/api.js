import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export function saveAuth(authPayload) {
  localStorage.setItem("auth", JSON.stringify(authPayload));
}

export function getAuth() {
  const raw = localStorage.getItem("auth");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("auth");
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
