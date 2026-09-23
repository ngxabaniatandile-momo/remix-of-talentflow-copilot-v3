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
  locked: boolean;
};

export type TeamRole = "Admin" | "Interviewer" | "Reviewer" | "Hiring Manager";

export const teamRoles: TeamRole[] = ["Admin", "Interviewer", "Reviewer", "Hiring Manager"];

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  startDate: string;
};

export type WorkspaceCredential = { type: "pin" | "password"; value: string };

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

export type SessionMessage = {
  id: string;
  role: "user" | "assistant";
  author: string;
  content: string;
  at: number;
};

export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  label: string;
  status?: string | undefined;
  at: number;
  payload: Record<string, string>;
  messages?: SessionMessage[] | undefined;
  channel?: string | undefined;
};

export const DEFAULT_WORKSPACE_PIN = "849201";

export const workspaces: Workspace[] = [
  {
    id: "acme",
    name: "Acme Corp — Talent Operations",
    subtitle: "HQ & Corporate",
    initials: "AC",
    department: "Talent Operations",
    region: "Johannesburg, ZA",
    members: 12,
    locked: false,
  },
  {
    id: "starktech",
    name: "StarkTech — Engineering Hiring",
    subtitle: "Software & Tech Teams",
    initials: "ST",
    department: "Engineering",
    region: "Cape Town, ZA",
    members: 8,
    locked: true,
  },
  {
    id: "global-retail",
    name: "Global Retail — High-Volume Ops",
    subtitle: "Store & Regional Staff",
    initials: "GR",
    department: "Retail Operations",
    region: "Durban, ZA",
    members: 27,
    locked: true,
  },
  {
    id: "momo",
    name: "Momo — Real Estate",
    subtitle: "Property & Agency Hiring",
    initials: "MO",
    department: "Real Estate",
    region: "Sandton, ZA",
    members: 6,
    locked: true,
  },
];

function member(
  name: string,
  email: string,
  role: TeamRole,
  startDate = "Jan 12, 2026",
): TeamMember {
  return { id: email, name, email, role, startDate };
}

export const workspaceTeams: Record<string, TeamMember[]> = {
  acme: [
    member("Kelvin Mokoena", "kelvin.talent@acme.com", "Admin"),
    member("Priya Patel", "priya@acme.com", "Interviewer", "Feb 03, 2026"),
    member("Sam Brooks", "sam@acme.com", "Reviewer", "Mar 18, 2026"),
  ],
  starktech: [
    member("Kelvin Mokoena", "kelvin.talent@acme.com", "Reviewer"),
    member("Nadia Khan", "nadia@starktech.io", "Admin", "Feb 20, 2026"),
  ],
  "global-retail": [
    member("Thabo Dlamini", "thabo@globalretail.com", "Admin"),
    member("Kelvin Mokoena", "kelvin.talent@acme.com", "Interviewer"),
  ],
  momo: [member("Lerato Nkosi", "lerato@momo-realestate.co.za", "Admin", "Apr 02, 2026")],
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

export function formatStartDate(date = new Date()) {
  try {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return date.toDateString();
  }
}

export type StoreValue = {
  workspaceId: WorkspaceId;
  workspace: Workspace;
  allWorkspaces: Workspace[];
  setWorkspaceId: (id: WorkspaceId) => void;
  isUnlocked: (id: WorkspaceId) => boolean;
  unlockWorkspace: (id: WorkspaceId, secret: string) => boolean;
  addWorkspace: (input: {
    name: string;
    department: string;
    region: string;
    credential: WorkspaceCredential;
  }) => void;
  compliance: ComplianceSettings;
  setCompliance: (next: ComplianceSettings) => void;
  team: TeamMember[];
  addMember: (input: { name: string; email: string; role: TeamRole }) => TeamMember;
  updateMemberRole: (id: string, role: TeamRole) => void;
  authenticated: boolean;
  activeUser: WorkspaceUser;
  accounts: WorkspaceUser[];
  addAccount: (input: { name: string; title: string; email: string }) => void;
  signIn: (userId?: string) => void;
  signOut: () => void;
  switchUser: (userId: string) => void;
  history: HistoryItem[];
  logHistory: (item: Omit<HistoryItem, "id" | "at"> & { id?: string }) => string;
  updateSession: (id: string, patch: Partial<Omit<HistoryItem, "id">>) => void;
  removeSession: (id: string) => void;
  clearHistory: () => void;
};

// Safe fallback so a hot-reload or a stray render outside the provider can never
// blank the screen; it behaves like an empty, read-only guest workspace.
export const fallbackStore: StoreValue = {
  workspaceId: workspaces[0]!.id,
  workspace: workspaces[0]!,
  allWorkspaces: workspaces,
  setWorkspaceId: () => {},
  isUnlocked: (id) => id === workspaces[0]!.id,
  unlockWorkspace: () => false,
  addWorkspace: () => {},
  compliance: defaultCompliance,
  setCompliance: () => {},
  team: workspaceTeams["acme"] ?? [],
  addMember: (input) => ({
    id: input.email,
    name: input.name,
    email: input.email,
    role: input.role,
    startDate: formatStartDate(),
  }),
  updateMemberRole: () => {},
  authenticated: false,
  activeUser: guestUser,
  accounts,
  addAccount: () => {},
  signIn: () => {},
  signOut: () => {},
  switchUser: () => {},
  history: [],
  logHistory: () => "",
  updateSession: () => {},
  removeSession: () => {},
  clearHistory: () => {},
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

export function validatePin(pin: string) {
  if (!/^\d{6}$/.test(pin)) return "PIN must be exactly 6 digits";
  if (/^(\d)\1{5}$/.test(pin)) return "PIN cannot repeat a single digit";
  if ("0123456789".includes(pin) || "9876543210".includes(pin))
    return "PIN cannot be a simple sequence";
  return null;
}

export function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*]/.test(password)) score += 1;
  return score;
}

export function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Add at least 1 uppercase letter";
  if (!/\d/.test(password)) return "Add at least 1 number";
  if (!/[!@#$%^&*]/.test(password)) return "Add at least 1 special character (!@#$%^&*)";
  return null;
}
