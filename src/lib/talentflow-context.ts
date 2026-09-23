import { createContext, useContext } from "react";

export type WorkspaceId = string;

export type Workspace = {
  id: WorkspaceId;
  name: string;
  subtitle: string;
  initials: string;
  department: string;
  region: string;
  members: number;
};

export type TeamMember = {
  name: string;
  role: "Admin" | "Reviewer" | "Interviewer";
  email: string;
};

export type ComplianceSettings = {
  piiRedaction: boolean;
  anonymizedReview: boolean;
  recordingConsent: boolean;
};

export type WorkspaceUser = {
  id: string;
  name: string;
  title: string;
  initials: string;
  email: string;
  admin?: boolean;
};

export type HistoryKind = "scorecard" | "benchmark" | "email" | "chat" | "panel" | "meeting";

export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  label: string;
  status?: string;
  at: number;
  payload: Record<string, string>;
};

export const workspaces: Workspace[] = [
  {
    id: "acme",
    name: "Acme Corp — Talent Operations",
    subtitle: "HQ & Corporate",
    initials: "AC",
    department: "Talent Operations",
    region: "Johannesburg, ZA",
    members: 12,
  },
  {
    id: "starktech",
    name: "StarkTech — Engineering Hiring",
    subtitle: "Software & Tech Teams",
    initials: "ST",
    department: "Engineering",
    region: "Cape Town, ZA",
    members: 8,
  },
  {
    id: "global-retail",
    name: "Global Retail — High-Volume Ops",
    subtitle: "Store & Regional Staff",
    initials: "GR",
    department: "Retail Operations",
    region: "Durban, ZA",
    members: 27,
  },
];

export const workspaceTeams: Record<string, TeamMember[]> = {
  acme: [
    { name: "Kelvin Mokoena", role: "Admin", email: "kelvin.talent@acme.com" },
    { name: "Priya Patel", role: "Interviewer", email: "priya@acme.com" },
    { name: "Sam Brooks", role: "Reviewer", email: "sam@acme.com" },
  ],
  starktech: [
    { name: "Kelvin Mokoena", role: "Reviewer", email: "kelvin.talent@acme.com" },
    { name: "Nadia Khan", role: "Admin", email: "nadia@starktech.io" },
  ],
  "global-retail": [
    { name: "Thabo Dlamini", role: "Admin", email: "thabo@globalretail.com" },
    { name: "Kelvin Mokoena", role: "Interviewer", email: "kelvin.talent@acme.com" },
  ],
};

export const accounts: WorkspaceUser[] = [
  {
    id: "kelvin",
    name: "Kelvin",
    title: "Talent Lead",
    initials: "KT",
    email: "kelvin.talent@acme.com",
    admin: true,
  },
  {
    id: "priya",
    name: "Priya Patel",
    title: "Lead Tech Interviewer",
    initials: "PP",
    email: "priya@acme.com",
  },
  { id: "sam", name: "Sam Brooks", title: "People Partner", initials: "SB", email: "sam@acme.com" },
];

export const guestUser: WorkspaceUser = {
  id: "guest",
  name: "Guest",
  title: "Guest Mode",
  initials: "G",
  email: "",
};

export const defaultCompliance: ComplianceSettings = {
  piiRedaction: true,
  anonymizedReview: false,
  recordingConsent: true,
};

export function safeRead<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeWrite(key: string, value: unknown) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep in-memory state only */
  }
}

export type StoreValue = {
  workspaceId: WorkspaceId;
  workspace: Workspace;
  allWorkspaces: Workspace[];
  setWorkspaceId: (id: WorkspaceId) => void;
  addWorkspace: (input: { name: string; department: string; region: string }) => void;
  compliance: ComplianceSettings;
  setCompliance: (next: ComplianceSettings) => void;
  team: TeamMember[];
  authenticated: boolean;
  activeUser: WorkspaceUser;
  accounts: WorkspaceUser[];
  signIn: (userId?: string) => void;
  signOut: () => void;
  switchUser: (userId: string) => void;
  history: HistoryItem[];
  logHistory: (item: Omit<HistoryItem, "id" | "at">) => void;
};

// Safe fallback so a hot-reload or a stray render outside the provider can never
// blank the screen; it behaves like an empty, read-only guest workspace.
const fallbackStore: StoreValue = {
  workspaceId: workspaces[0]!.id,
  workspace: workspaces[0]!,
  allWorkspaces: workspaces,
  setWorkspaceId: () => {},
  addWorkspace: () => {},
  compliance: defaultCompliance,
  setCompliance: () => {},
  team: workspaceTeams["acme"] ?? [],
  authenticated: false,
  activeUser: guestUser,
  accounts,
  signIn: () => {},
  signOut: () => {},
  switchUser: () => {},
  history: [],
  logHistory: () => {},
};

export const TalentFlowContext = createContext<StoreValue | null>(null);

export function useTalentFlow(): StoreValue {
  return useContext(TalentFlowContext) ?? fallbackStore;
}

export function groupHistory(items: HistoryItem[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const groups: { label: string; items: HistoryItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
  ];
  (items || []).forEach((item) => {
    if (item.at >= startOfToday) groups[0]!.items.push(item);
    else if (item.at >= startOfYesterday) groups[1]!.items.push(item);
    else groups[2]!.items.push(item);
  });
  return groups.filter((group) => group.items.length > 0);
}
