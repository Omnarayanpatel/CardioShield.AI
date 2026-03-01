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
