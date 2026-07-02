import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearSession, getStoredUser, getToken, type AuthUser } from "./api";
import type { Inspection, SectionReviewStatus, User } from "./mockData";

interface AppData {
  currentUser: AuthUser | null;
  loading: boolean;
  inspections: Inspection[];
  users: User[];
  getInspectionById: (id: string) => Inspection | undefined;
  getInspectionsByInspector: (inspectorId: string) => Inspection[];
  getInspectionsForReviewer: (reviewerId: string) => Inspection[];
  getUser: (id: string) => User | undefined;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
  patchSection: (
    inspectionId: string,
    sectionId: string,
    patch: { reviewStatus?: SectionReviewStatus; reviewComment?: string; reportText?: string },
  ) => Promise<void>;
  patchInspection: (id: string, patch: { status?: Inspection["status"]; notes?: string }) => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [ins, us] = await Promise.all([
      api.getInspections().catch(() => [] as Inspection[]),
      api.getUsers().catch(() => [] as User[]), // 403 for inspectors — fine
    ]);
    setInspections(ins);
    setUsers(us);
  }, []);

  // On mount: if a token exists, validate it and load data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const u = await api.me();
        if (cancelled) return;
        setCurrentUser(u);
        await loadData();
      } catch {
        clearSession();
        setCurrentUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await api.login(email, password);
      setCurrentUser(u);
      setLoading(true);
      await loadData();
      setLoading(false);
      return u;
    },
    [loadData],
  );

  const logout = useCallback(() => {
    clearSession();
    setCurrentUser(null);
    setInspections([]);
    setUsers([]);
  }, []);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const replaceInspection = useCallback(async (id: string) => {
    const fresh = await api.getInspection(id);
    setInspections((prev) => prev.map((i) => (i.id === id ? fresh : i)));
  }, []);

  const patchSection = useCallback<AppData["patchSection"]>(
    async (inspectionId, sectionId, patch) => {
      await api.updateSection(sectionId, patch);
      await replaceInspection(inspectionId);
    },
    [replaceInspection],
  );

  const patchInspection = useCallback<AppData["patchInspection"]>(
    async (id, patch) => {
      await api.updateInspection(id, patch);
      await replaceInspection(id);
    },
    [replaceInspection],
  );

  const value: AppData = {
    currentUser,
    loading,
    inspections,
    users,
    getInspectionById: (id) => inspections.find((i) => i.id === id),
    getInspectionsByInspector: (inspectorId) => inspections.filter((i) => i.inspectorId === inspectorId),
    getInspectionsForReviewer: (reviewerId) =>
      inspections.filter((i) => i.reviewerId === reviewerId && i.status !== "draft"),
    getUser: (id) => users.find((u) => u.id === id),
    login,
    logout,
    refresh,
    patchSection,
    patchInspection,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
