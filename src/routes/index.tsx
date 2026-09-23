import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BrainCircuit,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  LogOut,
  Mail,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Scale,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthDialog } from "@/components/auth-dialog";
import {
  GroupChatView,
  LibraryView,
  MeetingView,
  PersonalChatView,
  SchedulesView,
} from "@/components/enterprise-views";
import { ManageWorkspacesDialog } from "@/components/manage-workspaces-dialog";
import { RoleBenchmarker } from "@/components/role-benchmarker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DrafterView,
  ScorecardView,
  type CandidateStatus,
  type MessageTone,
} from "@/components/workflow-panels";
import { generateCandidateEmail, generateScorecard } from "@/lib/talentflow.functions";
import {
  groupHistory,
  TalentFlowProvider,
  useTalentFlow,
  type HistoryItem,
} from "@/lib/talentflow-store";
import { cn } from "@/lib/utils";

type ViewId =
  | "benchmark"
  | "scorecard"
  | "drafter"
  | "personal"
  | "group"
  | "schedules"
  | "library"
  | "meeting";
type NavItem = { id: ViewId; label: string; icon: LucideIcon };

const notesSample = `Avery described building a weekly hiring health dashboard after noticing recruiters were using three separate spreadsheets. They partnered with analytics to standardize funnel definitions, trained hiring managers on evidence-based debriefs, and reduced time-to-slate by 18% over two quarters.

In the role-play, Avery asked clarifying questions before recommending process changes. They missed one edge case around regional approvals but quickly acknowledged it and proposed a compliance review step.`;

const communicationSample = `Panel was impressed by Avery's structured thinking, evidence-based process improvements, and stakeholder management. Please mention the next conversation will focus on compensation strategy and change management with the VP of People.`;

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace Workflows",
    items: [
      { id: "benchmark", label: "Role Benchmarker", icon: Scale },
      { id: "scorecard", label: "Interview Scorecard", icon: FileText },
      { id: "drafter", label: "Candidate Drafter", icon: Mail },
    ],
  },
  {
    label: "AI Collaboration & Chat",
    items: [
      { id: "personal", label: "Personal AI Copilot", icon: MessageSquare },
      { id: "group", label: "Hiring Panel Group Chat", icon: Users },
    ],
  },
  {
    label: "Operations & Assets",
    items: [
      { id: "schedules", label: "Schedules & Deadlines", icon: CalendarClock },
      { id: "library", label: "HR Asset Library", icon: BookOpen },
      { id: "meeting", label: "Live Meeting Copilot", icon: Video },
    ],
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentFlow — Enterprise Talent Operations Copilot" },
      {
        name: "description",
        content:
          "A secure AI workspace for role benchmarking, candidate evaluation, communications, panel collaboration, and hiring operations.",
      },
      { property: "og:title", content: "TalentFlow — Enterprise Talent Operations Copilot" },
      {
        property: "og:description",
        content: "Run structured, evidence-led talent operations with responsible AI safeguards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TalentFlowRoute,
});

function TalentFlowRoute() {
  return (
    <TalentFlowProvider>
      <TalentFlowApp />
    </TalentFlowProvider>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong while generating. Please try again.";
}

function TalentFlowApp() {
  const store = useTalentFlow();
  const [activeView, setActiveView] = useState<ViewId>("benchmark");
  const [authOpen, setAuthOpen] = useState(false);
  const [workspacesOpen, setWorkspacesOpen] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateRole, setCandidateRole] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [scorecardMarkdown, setScorecardMarkdown] = useState("");
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [status, setStatus] = useState<CandidateStatus>("Next Stage");
  const [tone, setTone] = useState<MessageTone>("Empathetic");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [emailMarkdown, setEmailMarkdown] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [reviewed, setReviewed] = useState({ scorecard: false, drafter: false });

  const workspaceId = store.workspaceId;

  // Workspace data isolation: clear all in-view workflow data when switching workspaces.
  useEffect(() => {
    setCandidateName("");
    setCandidateRole("");
    setInterviewNotes("");
    setScorecardMarkdown("");
    setDraftName("");
    setDraftRole("");
    setCandidateNotes("");
    setEmailMarkdown("");
    setReviewed({ scorecard: false, drafter: false });
  }, [workspaceId]);

  function sendToScorecard(candidate: { name: string; role: string; notes?: string }) {
    setCandidateName(candidate.name);
    setCandidateRole(candidate.role);
    if (candidate.notes) setInterviewNotes(candidate.notes);
    setActiveView("scorecard");
    toast.success(`${candidate.name} opened in Interview Scorecard`);
  }

  function newSession() {
    setCandidateName("");
    setCandidateRole("");
    setInterviewNotes("");
    setScorecardMarkdown("");
    setDraftName("");
    setDraftRole("");
    setCandidateNotes("");
    setEmailMarkdown("");
    setActiveView("benchmark");
    toast.success("New session started");
  }

  function restoreHistory(item: HistoryItem) {
    if (item.kind === "scorecard") {
      setCandidateName(item.payload["candidateName"] ?? "");
      setCandidateRole(item.payload["roleTitle"] ?? "");
      setInterviewNotes(item.payload["notes"] ?? "");
      setScorecardMarkdown(item.payload["markdown"] ?? "");
      setActiveView("scorecard");
    } else if (item.kind === "email") {
      setDraftName(item.payload["candidateName"] ?? "");
      setDraftRole(item.payload["roleTitle"] ?? "");
      setCandidateNotes(item.payload["notes"] ?? "");
      setEmailMarkdown(item.payload["markdown"] ?? "");
      setActiveView("drafter");
    } else if (item.kind === "chat") {
      setActiveView("personal");
    } else if (item.kind === "panel") {
      setActiveView("group");
    } else if (item.kind === "meeting") {
      setActiveView("meeting");
    } else {
      setActiveView("benchmark");
    }
    toast.success(`Restored: ${item.label}`);
  }

  async function generateAssessment() {
    setScorecardLoading(true);
    try {
      const result = await generateScorecard({
        data: {
          candidateName: candidateName || "Candidate",
          roleTitle: candidateRole,
          rawNotes: interviewNotes,
        },
      });
      setScorecardMarkdown(result.markdown);
      store.logHistory({
        kind: "scorecard",
        label: `${candidateName || "Candidate"} — scorecard`,
        status: candidateRole || "Evaluation",
        payload: {
          candidateName,
          roleTitle: candidateRole,
          notes: interviewNotes,
          markdown: result.markdown,
        },
      });
      toast.success("Scorecard generated");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setScorecardLoading(false);
    }
  }

  async function generateEmail() {
    setEmailLoading(true);
    try {
      const result = await generateCandidateEmail({
        data: {
          candidateName: draftName || "Candidate",
          roleTitle: draftRole || "the role",
          status,
          tone,
          notes: candidateNotes,
        },
      });
      setEmailMarkdown(result.markdown);
      store.logHistory({
        kind: "email",
        label: `${draftName || "Candidate"} — ${status.toLowerCase()} email`,
        status: tone,
        payload: {
          candidateName: draftName,
          roleTitle: draftRole,
          notes: candidateNotes,
          markdown: result.markdown,
        },
      });
      toast.success("Email draft generated");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setEmailLoading(false);
    }
  }

  async function copyText(text: string) {
    if (!text) {
      toast.error("Generate content before copying");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <SidebarProvider>
      <WorkspaceSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onRestore={restoreHistory}
        onNewSession={newSession}
        onAuthenticate={() => setAuthOpen(true)}
        onManageWorkspaces={() => setWorkspacesOpen(true)}
      />
      <SidebarInset className="min-w-0">
        <WorkspaceHeader
          activeView={activeView}
          onAuthenticate={() => setAuthOpen(true)}
          onManageWorkspaces={() => setWorkspacesOpen(true)}
        />
        <div className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl" key={workspaceId}>
            <ViewPanel active={activeView === "benchmark"}>
              <RoleBenchmarker onSendToScorecard={sendToScorecard} />
            </ViewPanel>
            <ViewPanel active={activeView === "scorecard"}>
              <ScorecardView
                candidateName={candidateName}
                candidateRole={candidateRole}
                interviewNotes={interviewNotes}
                markdown={scorecardMarkdown}
                loading={scorecardLoading}
                reviewed={reviewed.scorecard}
                onCandidateNameChange={setCandidateName}
                onCandidateRoleChange={setCandidateRole}
                onInterviewNotesChange={setInterviewNotes}
                onGenerate={generateAssessment}
                onReviewChange={(value) =>
                  setReviewed((current) => ({ ...current, scorecard: value }))
                }
                onLoadSample={() => {
                  setCandidateName("Avery Patel");
                  setCandidateRole("Senior People Operations Partner");
                  setInterviewNotes(notesSample);
                }}
                onCopy={copyText}
              />
            </ViewPanel>
            <ViewPanel active={activeView === "drafter"}>
              <DrafterView
                name={draftName}
                role={draftRole}
                status={status}
                tone={tone}
                notes={candidateNotes}
                markdown={emailMarkdown}
                loading={emailLoading}
                reviewed={reviewed.drafter}
                onNameChange={setDraftName}
                onRoleChange={setDraftRole}
                onStatusChange={setStatus}
                onToneChange={setTone}
                onNotesChange={setCandidateNotes}
                onGenerate={generateEmail}
                onReviewChange={(value) =>
                  setReviewed((current) => ({ ...current, drafter: value }))
                }
                onLoadSample={() => {
                  setDraftName("Avery Patel");
                  setDraftRole("Senior Frontend Engineer");
                  setStatus("Next Stage");
                  setTone("Empathetic");
                  setCandidateNotes(communicationSample);
                }}
                onCopy={copyText}
              />
            </ViewPanel>
            <ViewPanel active={activeView === "personal"}>
              <PersonalChatView />
            </ViewPanel>
            <ViewPanel active={activeView === "group"}>
              <GroupChatView />
            </ViewPanel>
            <ViewPanel active={activeView === "schedules"}>
              <SchedulesView />
            </ViewPanel>
            <ViewPanel active={activeView === "library"}>
              <LibraryView
                onOpenInWorkspace={(asset) => {
                  if (asset.category === "Email Templates") {
                    setCandidateNotes(asset.body);
                    setActiveView("drafter");
                  } else {
                    setInterviewNotes(asset.body);
                    setActiveView("scorecard");
                  }
                  toast.success(`${asset.name} opened in your workspace`);
                }}
              />
            </ViewPanel>
            <ViewPanel active={activeView === "meeting"}>
              <MeetingView onExportToScorecard={sendToScorecard} />
            </ViewPanel>
          </div>
        </div>
        <AuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          onAuthenticated={() => store.signIn("kelvin")}
        />
        <ManageWorkspacesDialog open={workspacesOpen} onOpenChange={setWorkspacesOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}

function WorkspaceSidebar({
  activeView,
  onViewChange,
  onRestore,
  onNewSession,
  onAuthenticate,
  onManageWorkspaces,
}: {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  onRestore: (item: HistoryItem) => void;
  onNewSession: () => void;
  onAuthenticate: () => void;
  onManageWorkspaces: () => void;
}) {
  const store = useTalentFlow();
  const { state, setOpenMobile } = useSidebar();
  const selectView = (view: ViewId) => {
    onViewChange(view);
    setOpenMobile(false);
  };
  const groups = groupHistory(store.history);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-12 w-full justify-start gap-3 px-2 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0"
            >
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                  {store.workspace.initials}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-bold">
                  {store.workspace.name.split(" — ")[0]}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {store.workspace.department}
                </span>
              </span>
              <ChevronDown className="size-4 group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {(store.allWorkspaces || []).map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  store.setWorkspaceId(workspace.id);
                  toast.success(`Switched to ${workspace.name}`);
                }}
              >
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {store.workspaceId === workspace.id && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onManageWorkspaces}>
              <Settings2 className="size-4" /> Manage workspaces
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          className="mt-2 w-full group-data-[collapsible=icon]:hidden"
          variant="outline"
          onClick={onNewSession}
        >
          <Plus /> New session
        </Button>
      </SidebarHeader>
      <SidebarContent>
        {(navGroups || []).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(group.items || []).map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={activeView === item.id}
                      onClick={() => selectView(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Session History</SidebarGroupLabel>
          <SidebarGroupContent>
            {groups.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                No activity yet in {store.workspace.name.split(" — ")[0]}.
              </p>
            ) : (
              (groups || []).map((group) => (
                <div key={group.label} className="mb-2">
                  <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
                    {group.label}
                  </p>
                  <SidebarMenu>
                    {(group.items || []).map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          className="h-auto items-start py-2"
                          onClick={() => {
                            onRestore(item);
                            setOpenMobile(false);
                          }}
                        >
                          <History className="mt-0.5" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{item.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.status ?? item.kind}
                            </span>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {store.authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 p-2 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {store.activeUser.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-sm font-bold">{store.activeUser.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {store.activeUser.title}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel>Switch account</DropdownMenuLabel>
              {(store.accounts || []).map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    store.switchUser(account.id);
                    toast.success(`Signed in as ${account.name}`);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {account.name} · {account.title}
                  </span>
                  {store.activeUser.id === account.id && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onManageWorkspaces}>
                <Settings2 className="size-4" /> Workspace settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  store.signOut();
                  toast.success("Logged out");
                }}
              >
                <LogOut className="size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="rounded-md border border-sidebar-border bg-surface-panel p-3 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-bold">Guest Mode</p>
              <p className="mt-1 text-xs text-muted-foreground">2/3 Free Runs Remaining</p>
            </div>
            <Button
              size={state === "collapsed" ? "icon" : "sm"}
              className="mt-3 w-full group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:size-8"
              onClick={onAuthenticate}
            >
              <UserRound />
              <span className="group-data-[collapsible=icon]:hidden">Sign up for free</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function WorkspaceHeader({
  activeView,
  onAuthenticate,
  onManageWorkspaces,
}: {
  activeView: ViewId;
  onAuthenticate: () => void;
  onManageWorkspaces: () => void;
}) {
  const store = useTalentFlow();
  const { state } = useSidebar();
  const label =
    navGroups.flatMap((group) => group.items).find((item) => item.id === activeView)?.label ??
    "TalentFlow";
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger
          className="size-9"
          aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
        >
          {state === "expanded" ? <PanelLeftClose /> : <PanelLeftOpen />}
        </SidebarTrigger>
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <BrainCircuit className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">
            TalentFlow{" "}
            <span className="hidden font-medium text-muted-foreground sm:inline">· {label}</span>
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block">{store.workspace.name}</p>
        </div>
        <Badge className="hidden gap-1 border-alert-border bg-alert text-alert-foreground hover:bg-alert lg:flex">
          <ShieldCheck className="size-4" /> Guardrails Active: PII & Bias Filter
        </Badge>
        {store.authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 rounded-full pl-1 pr-3">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                    {store.activeUser.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-semibold sm:inline">
                  {store.activeUser.name}
                </span>
                <CheckCircle2 className="size-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{store.activeUser.email}</DropdownMenuLabel>
              <DropdownMenuItem onClick={onManageWorkspaces}>
                <Settings2 className="size-4" /> Workspace settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  store.signOut();
                  toast.success("Logged out");
                }}
              >
                <LogOut className="size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="outline" size="sm" className="rounded-full" onClick={onAuthenticate}>
              Log in
            </Button>
            <Button size="sm" className="rounded-full" onClick={onAuthenticate}>
              Sign up for free
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

function ViewPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(!active && "hidden")} aria-hidden={!active}>
      {children}
    </div>
  );
}
