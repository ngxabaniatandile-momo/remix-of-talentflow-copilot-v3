import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  accounts as seedAccounts,
  DEFAULT_WORKSPACE_PIN,
  defaultCompliance,
  formatStartDate,
  guestUser,
  safeRead,
  safeWrite,
  TalentFlowContext,
  workspaces,
  workspaceTeams,
  type ComplianceSettings,
  type HistoryItem,
  type StoreValue,
  type TeamMember,
  type TeamRole,
  type Workspace,
  type WorkspaceCredential,
  type WorkspaceId,
  type WorkspaceUser,
} from "@/lib/talentflow-context";

export {
  accounts,
  DEFAULT_WORKSPACE_PIN,
  fallbackStore,
  formatStartDate,
  groupHistory,
  guestUser,
  passwordScore,
  teamRoles,
  useTalentFlow,
  validatePassword,
  validatePin,
  workspaces,
  workspaceTeams,
  type ComplianceSettings,
  type HistoryItem,
  type HistoryKind,
  type SessionMessage,
  type TeamMember,
  type TeamRole,
  type Workspace,
  type WorkspaceCredential,
  type WorkspaceId,
  type WorkspaceUser,
} from "@/lib/talentflow-context";

const seedCredentials: Record<string, WorkspaceCredential> = {
  starktech: { type: "pin", value: DEFAULT_WORKSPACE_PIN },
  "global-retail": { type: "pin", value: DEFAULT_WORKSPACE_PIN },
  momo: { type: "pin", value: DEFAULT_WORKSPACE_PIN },
};

export function TalentFlowProvider({ children }: { children: ReactNode }) {
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>(workspaces);
  const [workspaceId, setWorkspaceIdState] = useState<WorkspaceId>("acme");
  const [credentials, setCredentials] = useState<Record<string, WorkspaceCredential>>({});
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [complianceMap, setComplianceMap] = useState<Record<string, ComplianceSettings>>({});
  const [teamMap, setTeamMap] = useState<Record<string, TeamMember[]>>({});
  const [accountList, setAccountList] = useState<WorkspaceUser[]>(seedAccounts);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeUserId, setActiveUserId] = useState("kelvin");
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryItem[]>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHistoryMap(safeRead<Record<string, HistoryItem[]>>("talentflow:history", {}));
    setComplianceMap(safeRead<Record<string, ComplianceSettings>>("talentflow:compliance", {}));
    setTeamMap(safeRead<Record<string, TeamMember[]>>("talentflow:teams", {}));
    setUnlocked(safeRead<string[]>("talentflow:unlocked", []));
    setCredentials(safeRead<Record<string, WorkspaceCredential>>("talentflow:credentials", {}));
    setWorkspaceList(safeRead<Workspace[]>("talentflow:workspaces", workspaces));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) safeWrite("talentflow:history", historyMap);
  }, [historyMap, hydrated]);
  useEffect(() => {
    if (hydrated) safeWrite("talentflow:compliance", complianceMap);
  }, [complianceMap, hydrated]);
  useEffect(() => {
    if (hydrated) safeWrite("talentflow:teams", teamMap);
  }, [teamMap, hydrated]);
  useEffect(() => {
    if (hydrated) safeWrite("talentflow:unlocked", unlocked);
  }, [unlocked, hydrated]);
  useEffect(() => {
    if (hydrated) safeWrite("talentflow:credentials", credentials);
  }, [credentials, hydrated]);
  useEffect(() => {
    if (hydrated) safeWrite("talentflow:workspaces", workspaceList);
  }, [workspaceList, hydrated]);

  const logHistory = useCallback(
    (item: Omit<HistoryItem, "id" | "at"> & { id?: string }) => {
      const id = item.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setHistoryMap((current) => {
        const existing = current[workspaceId] || [];
        const next: HistoryItem = { ...item, id, at: Date.now() };
        return { ...current, [workspaceId]: [next, ...existing].slice(0, 60) };
      });
      return id;
    },
    [workspaceId],
  );

  const updateSession = useCallback(
    (id: string, patch: Partial<Omit<HistoryItem, "id">>) => {
      setHistoryMap((current) => {
        const existing = current[workspaceId] || [];
        return {
          ...current,
          [workspaceId]: existing.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        };
      });
    },
    [workspaceId],
  );

  const removeSession = useCallback(
    (id: string) => {
      setHistoryMap((current) => ({
        ...current,
        [workspaceId]: (current[workspaceId] || []).filter((item) => item.id !== id),
      }));
    },
    [workspaceId],
  );

  const clearHistory = useCallback(() => {
    setHistoryMap((current) => ({ ...current, [workspaceId]: [] }));
  }, [workspaceId]);

  const value = useMemo<StoreValue>(() => {
    const list = workspaceList || workspaces;
    const workspace = list.find((item) => item.id === workspaceId) || list[0]!;
    const allCredentials = { ...seedCredentials, ...credentials };
    const isUnlocked = (id: WorkspaceId) => {
      const target = list.find((item) => item.id === id);
      if (!target || !target.locked) return true;
      return (unlocked || []).includes(id);
    };

    return {
      workspaceId,
      workspace,
      allWorkspaces: list,
      setWorkspaceId: (id) => {
        if (isUnlocked(id)) setWorkspaceIdState(id);
      },
      isUnlocked,
      unlockWorkspace: (id, secret) => {
        const credential = allCredentials[id];
        const expected = credential?.value ?? DEFAULT_WORKSPACE_PIN;
        if (secret.trim() !== expected) return false;
        setUnlocked((current) => (current.includes(id) ? current : [...current, id]));
        setWorkspaceIdState(id);
        return true;
      },
      addWorkspace: (input) => {
        const id = `custom-${Date.now()}`;
        setWorkspaceList((current) => [
          ...current,
          {
            id,
            name: input.name,
            subtitle: input.department,
            initials: input.name.slice(0, 2).toUpperCase(),
            department: input.department,
            region: input.region,
            members: 1,
            locked: true,
          },
        ]);
        setCredentials((current) => ({ ...current, [id]: input.credential }));
        setUnlocked((current) => [...current, id]);
      },
      compliance: complianceMap[workspaceId] || defaultCompliance,
      setCompliance: (next) => setComplianceMap((current) => ({ ...current, [workspaceId]: next })),
      team: teamMap[workspaceId] || workspaceTeams[workspaceId] || [],
      addMember: (input) => {
        const created: TeamMember = {
          id: `${input.email}-${Date.now()}`,
          name: input.name,
          email: input.email,
          role: input.role,
          startDate: formatStartDate(),
        };
        setTeamMap((current) => ({
          ...current,
          [workspaceId]: [
            ...(current[workspaceId] || workspaceTeams[workspaceId] || []),
            created,
          ],
        }));
        return created;
      },
      updateMemberRole: (id: string, role: TeamRole) =>
        setTeamMap((current) => ({
          ...current,
          [workspaceId]: (current[workspaceId] || workspaceTeams[workspaceId] || []).map((entry) =>
            entry.id === id ? { ...entry, role } : entry,
          ),
        })),
      authenticated,
      activeUser: authenticated
        ? accountList.find((user) => user.id === activeUserId) || accountList[0]!
        : guestUser,
      accounts: accountList,
      addAccount: (input) => {
        const id = `user-${Date.now()}`;
        const initials =
          input.name
            .split(" ")
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase() || "NU";
        setAccountList((current) => [
          ...current,
          { id, name: input.name, title: input.title, email: input.email, initials },
        ]);
        setActiveUserId(id);
        setAuthenticated(true);
      },
      signIn: (userId = "kelvin") => {
        setActiveUserId(userId);
        setAuthenticated(true);
      },
      signOut: () => setAuthenticated(false),
      switchUser: (userId: string) => setActiveUserId(userId),
      history: historyMap[workspaceId] || [],
      logHistory,
      updateSession,
      removeSession,
      clearHistory,
    };
  }, [
    workspaceList,
    workspaceId,
    credentials,
    unlocked,
    complianceMap,
    teamMap,
    accountList,
    authenticated,
    activeUserId,
    historyMap,
    logHistory,
    updateSession,
    removeSession,
    clearHistory,
  ]);

  return <TalentFlowContext.Provider value={value}>{children}</TalentFlowContext.Provider>;
}
