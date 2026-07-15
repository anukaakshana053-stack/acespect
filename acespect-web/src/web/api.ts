import type { Inspection, Role, User, InspectionStatus, SectionReviewStatus } from "./mockData";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "acespect_token";
const USER_KEY = "acespect_user";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export function getToken(): string | null {
  return typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}
export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function mapRole(r: string): Role {
  const x = (r || "").toLowerCase();
  return x === "admin" ? "admin" : x === "reviewer" ? "reviewer" : "inspector";
}

export interface ApiError extends Error {
  status?: number;
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* non-JSON */
    }
    const err: ApiError = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  async login(email: string, password: string): Promise<AuthUser> {
    const r = await req<{ accessToken: string; user: { id: string; email: string; name: string | null; role: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    const user: AuthUser = { id: r.user.id, email: r.user.email, name: r.user.name, role: mapRole(r.user.role) };
    setSession(r.accessToken, user);
    return user;
  },

  async me(): Promise<AuthUser> {
    const r = await req<{ user: { id: string; email: string; name: string | null; role: string } }>("/auth/me");
    return { id: r.user.id, email: r.user.email, name: r.user.name, role: mapRole(r.user.role) };
  },

  getInspections: () => req<{ inspections: Inspection[] }>("/web/inspections").then((d) => d.inspections),
  getInspection: (id: string) => req<{ inspection: Inspection }>(`/web/inspections/${id}`).then((d) => d.inspection),
  getUsers: () => req<{ users: User[] }>("/web/users").then((d) => d.users),

  updateSection: (
    id: string,
    patch: {
      reviewStatus?: SectionReviewStatus;
      reviewComment?: string;
      reportText?: string;
      fields?: Record<string, unknown>;
    },
  ) => req<{ section: unknown }>(`/web/sections/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  updateInspection: (id: string, patch: { status?: InspectionStatus; notes?: string; reviewerId?: string | null }) =>
    req<{ inspection: Inspection }>(`/web/inspections/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
};
