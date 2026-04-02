import { clearToken, getToken, setToken } from "@/lib/auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const parseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }
  } catch {
    // ignore JSON parsing errors and use fallback
  }
  return fallbackMessage;
};

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "client" | "owner" | "admin";
  phone: string;
  photo_url: string;
  tax_nif: string;
  tax_stat: string;
  is_certified: boolean;
  verification_status: "VERIFIED" | "PENDING";
}

export const registerUser = async (payload: {
  username: string;
  email: string;
  password: string;
  role: "client" | "owner" | "admin";
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Inscription impossible"));
  const data = await response.json();
  setToken(data.token);
  return data.user as SessionUser;
};

export const loginUser = async (identifier: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: identifier, password }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Connexion impossible"));
  const data = await response.json();
  setToken(data.token);
  return data.user as SessionUser;
};

export const logoutUser = async () => {
  const token = getToken();
  if (token) {
    await fetch(`${API_BASE_URL}/auth/logout/`, { method: "POST", headers: { Authorization: `Token ${token}` } });
  }
  clearToken();
};

export const fetchMe = async (): Promise<SessionUser | null> => {
  const token = getToken();
  if (!token) return null;
  const response = await fetch(`${API_BASE_URL}/auth/me/`, { headers: { Authorization: `Token ${token}` } });
  if (!response.ok) {
    clearToken();
    return null;
  }
  return response.json();
};

export const updateMe = async (payload: Partial<SessionUser> | FormData) => {
  const token = getToken();
  if (!token) throw new Error("Connexion requise");
  const isFormData = payload instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: "PATCH",
    headers: isFormData ? { Authorization: `Token ${token}` } : { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Impossible d'enregistrer le profil"));
  return response.json() as Promise<SessionUser>;
};
