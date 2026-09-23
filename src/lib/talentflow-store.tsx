import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  accounts,
  defaultCompliance,
  guestUser,
  safeRead,
  safeWrite,
  TalentFlowContext,
  workspaces,
  workspaceTeams,
  type ComplianceSettings,
  type HistoryItem,
  type StoreValue,
  type Workspace,
  type WorkspaceId,
} from "@/lib/talentflow-context";

export {
  accounts,
  groupHistory,
  guestUser,
  useTalentFlow,
  workspaces,
  workspaceTeams,
  type ComplianceSettings,
  type HistoryItem,
  type HistoryKind,
  type TeamMember,
  type Workspace,
  type WorkspaceId,
  type WorkspaceUser,
} from "@/lib/talentflow-context";

export function TalentFlowProvider({ children }: { children: ReactNode }) {
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>(workspaces);
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId>("acme");
  const [complianceMap, setComplianceMap] = useState<Record<string, ComplianceSettings>>({});
  const [authenticated, setAuthenticated] = useState(false);
  const [activeUserId, setActiveUserId] = useState("kelvin");
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryItem[]>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHistoryMap(safeRead<Record<string, HistoryItem[]>>("talentflow:history", {}));
    setComplianceMap(safeRead<Record<string, ComplianceSettings>>("talentflow:compliance", {}));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) safeWrite("talentflow:history", historyMap);
  }, [historyMap, hydrated]);

  useEffect(() => {
    if (hydrated) safeWrite("talentflow:compliance", complianceMap);
  }, [complianceMap, hydrated]);

  const logHistory = useCallback(
    (item: Omit<HistoryItem, "id" | "at">) => {
      setHistoryMap((current) => {
        const existing = current[workspaceId] || [];
        const next: HistoryItem = {
          ...item,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          at: Date.now(),
        };
        return { ...current, [workspaceId]: [next, ...existing].slice(0, 40) };
      });
    },
    [workspaceId],
  );

  const value = useMemo<StoreValue>(() => {
    const workspace = workspaceList.find((item) => item.id === workspaceId) || workspaceList[0]!;
    return {
      workspaceId,
      workspace,
      allWorkspaces: workspaceList,
      setWorkspaceId,
      addWorkspace: (input) =>
        setWorkspaceList((current) => [
          ...current,
          {
            id: `custom-${Date.now()}`,
            name: input.name,
            subtitle: input.department,
            initials: input.name.slice(0, 2).toUpperCase(),
            department: input.department,
            region: input.region,
            members: 1,
          },
        ]),
      compliance: complianceMap[workspaceId] || defaultCompliance,
      setCompliance: (next) => setComplianceMap((current) => ({ ...current, [workspaceId]: next })),
      team: workspaceTeams[workspaceId] || [],
      authenticated,
      activeUser: authenticated
        ? accounts.find((user) => user.id === activeUserId) || accounts[0]!
        : guestUser,
      accounts,
      signIn: (userId = "kelvin") => {
        setActiveUserId(userId);
        setAuthenticated(true);
      },
      signOut: () => setAuthenticated(false),
      switchUser: (userId: string) => setActiveUserId(userId),
      history: historyMap[workspaceId] || [],
      logHistory,
    };
  }, [
    workspaceList,
    workspaceId,
    complianceMap,
    authenticated,
    activeUserId,
    historyMap,
    logHistory,
  ]);

  return <TalentFlowContext.Provider value={value}>{children}</TalentFlowContext.Provider>;
}
