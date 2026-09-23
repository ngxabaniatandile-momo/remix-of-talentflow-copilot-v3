import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  LockKeyhole,
  Mail,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  ShieldCheck,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
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
import { RoleBenchmarker } from "@/components/role-benchmarker";
import {
  GroupChatView,
  LibraryView,
  MeetingView,
  PersonalChatView,
  SchedulesView,
} from "@/components/enterprise-views";
import {
  DrafterView,
  ScorecardView,
  type CandidateStatus,
  type MessageTone,
} from "@/components/workflow-panels";
import { generateCandidateEmail, generateScorecard } from "@/lib/talentflow.functions";
import { cn } from "@/lib/utils";

type ViewId = "benchmark" | "scorecard" | "drafter" | "personal" | "group" | "schedules" | "library" | "meeting";
type NavItem = { id: ViewId; label: string; icon: LucideIcon };

const notesSample = `Avery described building a weekly hiring health dashboard after noticing recruiters were using three separate spreadsheets. They partnered with analytics to standardize funnel definitions, trained hiring managers on evidence-based debriefs, and reduced time-to-slate by 18% over two quarters.

In the role-play, Avery asked clarifying questions before recommending process changes. They missed one edge case around regional approvals but quickly acknowledged it and proposed a compliance review step.`;

const communicationSample = `Panel was impressed by Avery's structured thinking, evidence-based process improvements, and stakeholder management. Please mention the next conversation will focus on compensation strategy and change management with the VP of People.`;

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Workspace Workflows", items: [{ id: "benchmark", label: "Role Benchmarker", icon: Scale }, { id: "scorecard", label: "Interview Scorecard", icon: FileText }, { id: "drafter", label: "Candidate Drafter", icon: Mail }] },
  { label: "AI Collaboration & Chat", items: [{ id: "personal", label: "Personal AI Copilot", icon: MessageSquare }, { id: "group", label: "Hiring Panel Group Chat", icon: Users }] },
  { label: "Operations & Assets", items: [{ id: "schedules", label: "Schedules & Deadlines", icon: CalendarClock }, { id: "library", label: "HR Asset Library", icon: BookOpen }, { id: "meeting", label: "Live Meeting Copilot", icon: Video }] },
];

const recentEvaluations = [
  { name: "Alex Chen", role: "Senior Full-Stack Engineer", result: "Strong Hire", notes: "Designed high-volume REST APIs, improved PostgreSQL query latency through indexing, and led an AWS incident review. Panel evidence supports strong architecture and mentorship capability.", score: "## Executive Summary\nAlex demonstrated strong evidence across architecture, data performance, and production ownership.\n\n## Action Recommendation\n**Strong Hire** — advance to final leadership conversation." },
  { name: "Morgan Lee", role: "Frontend Lead", result: "Borderline", notes: "Strong React delivery and collaboration examples. Backend architecture evidence remains limited and requires a focused follow-up.", score: "## Executive Summary\nMorgan showed strong frontend leadership with incomplete evidence for backend ownership.\n\n## Action Recommendation\n**Borderline** — conduct a focused architecture follow-up." },
  { name: "Jordan Smith", role: "Junior Sales", result: "Not Progressing", notes: "Communication was clear, but examples did not demonstrate the required prospecting discipline or evidence-based pipeline management.", score: "## Executive Summary\nJordan did not yet demonstrate the role's required pipeline and discovery evidence.\n\n## Action Recommendation\n**Not Progressing** — close with respectful, specific feedback." },
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "TalentFlow — Enterprise Talent Operations Copilot" },
    { name: "description", content: "A secure AI workspace for role benchmarking, candidate evaluation, communications, panel collaboration, and hiring operations." },
    { property: "og:title", content: "TalentFlow — Enterprise Talent Operations Copilot" },
    { property: "og:description", content: "Run structured, evidence-led talent operations with responsible AI safeguards." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TalentFlowApp,
});

function errorMessage(error: unknown) { return error instanceof Error && error.message ? error.message : "Something went wrong while generating. Please try again."; }

function TalentFlowApp() {
  const [activeView, setActiveView] = useState<ViewId>("benchmark");
  const [verified, setVerified] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
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

  function sendToScorecard(candidate: { name: string; role: string }) { setCandidateName(candidate.name); setCandidateRole(candidate.role); setActiveView("scorecard"); toast.success(`${candidate.name} opened in Interview Scorecard`); }
  function restoreHistory(index: number) { const item = recentEvaluations[index]; if (!item) return; setCandidateName(item.name); setCandidateRole(item.role); setInterviewNotes(item.notes); setScorecardMarkdown(item.score); setActiveView("scorecard"); toast.success(`${item.name}'s evaluation restored`); }

  async function generateAssessment() { setScorecardLoading(true); try { const result = await generateScorecard({ data: { candidateName: candidateName || "Candidate", roleTitle: candidateRole, rawNotes: interviewNotes } }); setScorecardMarkdown(result.markdown); toast.success("Scorecard generated"); } catch (error) { toast.error(errorMessage(error)); } finally { setScorecardLoading(false); } }
  async function generateEmail() { setEmailLoading(true); try { const result = await generateCandidateEmail({ data: { candidateName: draftName || "Candidate", roleTitle: draftRole || "the role", status, tone, notes: candidateNotes } }); setEmailMarkdown(result.markdown); toast.success("Email draft generated"); } catch (error) { toast.error(errorMessage(error)); } finally { setEmailLoading(false); } }
  async function copyText(text: string) { if (!text) { toast.error("Generate content before copying"); return; } try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); } catch { toast.error("Could not copy to clipboard"); } }

  return <SidebarProvider><WorkspaceSidebar activeView={activeView} onViewChange={setActiveView} onHistory={restoreHistory} verified={verified} onAuthenticate={() => setAuthOpen(true)} /><SidebarInset className="min-w-0"><WorkspaceHeader activeView={activeView} verified={verified} onAuthenticate={() => setAuthOpen(true)} /><div className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <ViewPanel active={activeView === "benchmark"}><RoleBenchmarker onSendToScorecard={sendToScorecard} /></ViewPanel>
    <ViewPanel active={activeView === "scorecard"}><ScorecardView candidateName={candidateName} candidateRole={candidateRole} interviewNotes={interviewNotes} markdown={scorecardMarkdown} loading={scorecardLoading} reviewed={reviewed.scorecard} onCandidateNameChange={setCandidateName} onCandidateRoleChange={setCandidateRole} onInterviewNotesChange={setInterviewNotes} onGenerate={generateAssessment} onReviewChange={(value) => setReviewed((current) => ({ ...current, scorecard: value }))} onLoadSample={() => { setCandidateName("Avery Patel"); setCandidateRole("Senior People Operations Partner"); setInterviewNotes(notesSample); }} onCopy={copyText} /></ViewPanel>
    <ViewPanel active={activeView === "drafter"}><DrafterView name={draftName} role={draftRole} status={status} tone={tone} notes={candidateNotes} markdown={emailMarkdown} loading={emailLoading} reviewed={reviewed.drafter} onNameChange={setDraftName} onRoleChange={setDraftRole} onStatusChange={setStatus} onToneChange={setTone} onNotesChange={setCandidateNotes} onGenerate={generateEmail} onReviewChange={(value) => setReviewed((current) => ({ ...current, drafter: value }))} onLoadSample={() => { setDraftName("Avery Patel"); setDraftRole("Senior Frontend Engineer"); setStatus("Next Stage"); setTone("Empathetic"); setCandidateNotes(communicationSample); }} onCopy={copyText} /></ViewPanel>
    <ViewPanel active={activeView === "personal"}><PersonalChatView /></ViewPanel><ViewPanel active={activeView === "group"}><GroupChatView /></ViewPanel><ViewPanel active={activeView === "schedules"}><SchedulesView /></ViewPanel><ViewPanel active={activeView === "library"}><LibraryView /></ViewPanel><ViewPanel active={activeView === "meeting"}><MeetingView /></ViewPanel>
  </div></div><AuthDialog open={authOpen} onOpenChange={setAuthOpen} onVerified={() => setVerified(true)} /></SidebarInset></SidebarProvider>;
}

function WorkspaceSidebar({ activeView, onViewChange, onHistory, verified, onAuthenticate }: { activeView: ViewId; onViewChange: (view: ViewId) => void; onHistory: (index: number) => void; verified: boolean; onAuthenticate: () => void }) {
  const { state, setOpenMobile } = useSidebar();
  const selectView = (view: ViewId) => { onViewChange(view); setOpenMobile(false); };
  return <Sidebar collapsible="icon"><SidebarHeader className="border-b border-sidebar-border p-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-12 w-full justify-start gap-3 px-2 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0"><Avatar className="size-8 rounded-md"><AvatarFallback className="rounded-md bg-primary text-primary-foreground">AC</AvatarFallback></Avatar><span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm font-bold">Acme Corp</span><span className="block truncate text-xs text-muted-foreground">Talent Operations</span></span><ChevronDown className="size-4 group-data-[collapsible=icon]:hidden" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-60"><DropdownMenuItem>Acme Corp — Talent Operations</DropdownMenuItem><DropdownMenuItem>Manage workspaces</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarHeader><SidebarContent>
    {navGroups.map((group) => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{group.items.map((item) => <SidebarMenuItem key={item.id}><SidebarMenuButton tooltip={item.label} isActive={activeView === item.id} onClick={() => selectView(item.id)}><item.icon /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>)}
    <SidebarSeparator /><SidebarGroup><SidebarGroupLabel>History & Recents</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{recentEvaluations.map((item, index) => <SidebarMenuItem key={item.name}><SidebarMenuButton tooltip={`${item.name} — ${item.result}`} onClick={() => { onHistory(index); setOpenMobile(false); }} className="h-auto items-start py-2"><History className="mt-0.5" /><span><span className="block truncate font-medium">{item.name}</span><span className="block truncate text-xs text-muted-foreground">{item.role} · {item.result}</span></span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
  </SidebarContent><SidebarFooter className="border-t border-sidebar-border">{verified ? <div className="flex items-center gap-3 rounded-md p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"><Avatar className="size-8"><AvatarFallback className="bg-accent text-accent-foreground">KT</AvatarFallback></Avatar><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-bold">Kelvin</p><Badge variant="secondary" className="mt-1">Talent Lead</Badge></div></div> : <div className="rounded-md border border-sidebar-border bg-surface-panel p-3 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"><div className="group-data-[collapsible=icon]:hidden"><p className="text-sm font-bold">Guest Mode</p><p className="mt-1 text-xs text-muted-foreground">2/3 Free Runs Remaining</p></div><Button size={state === "collapsed" ? "icon" : "sm"} className="mt-3 w-full group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:size-8" onClick={onAuthenticate}><LockKeyhole /><span className="group-data-[collapsible=icon]:hidden">Create Free Account / Sign In</span></Button></div>}</SidebarFooter><SidebarRail /></Sidebar>;
}

function WorkspaceHeader({ activeView, verified, onAuthenticate }: { activeView: ViewId; verified: boolean; onAuthenticate: () => void }) { const { state } = useSidebar(); const label = navGroups.flatMap((group) => group.items).find((item) => item.id === activeView)?.label ?? "TalentFlow"; return <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur"><div className="flex min-h-16 items-center gap-3 px-4 sm:px-6"><SidebarTrigger className="size-9" aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}>{state === "expanded" ? <PanelLeftClose /> : <PanelLeftOpen />}</SidebarTrigger><div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><BrainCircuit className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">TalentFlow <span className="hidden font-medium text-muted-foreground sm:inline">· {label}</span></p><p className="hidden text-xs text-muted-foreground sm:block">AI Workplace Productivity Copilot</p></div><Badge className="hidden gap-1 border-alert-border bg-alert text-alert-foreground hover:bg-alert lg:flex"><ShieldCheck className="size-4" /> Guardrails Active: PII & Bias Filter</Badge>{verified ? <Badge className="gap-1 bg-success text-success-foreground hover:bg-success"><CheckCircle2 className="size-4" /> Verified</Badge> : <><span className="hidden text-xs font-medium text-muted-foreground md:inline">Guest Mode · 2/3 runs</span><Button size="sm" onClick={onAuthenticate}>Authenticate</Button></>}</div></header>; }

function AuthDialog({ open, onOpenChange, onVerified }: { open: boolean; onOpenChange: (open: boolean) => void; onVerified: () => void }) {
  const [step, setStep] = useState<"contact" | "otp">("contact"); const [contact, setContact] = useState(""); const [otp, setOtp] = useState(""); const [seconds, setSeconds] = useState(900);
  useEffect(() => { if (!open || step !== "otp") return; const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [open, step]);
  useEffect(() => { if (otp.length !== 4) return; onVerified(); onOpenChange(false); setStep("contact"); setOtp(""); setSeconds(900); toast.success("Account Verified Successfully"); }, [otp, onOpenChange, onVerified]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) { setStep("contact"); setOtp(""); setSeconds(900); } }}><DialogContent><DialogHeader><DialogTitle>{step === "contact" ? "Create Free Account / Sign In" : "Enter Verification Code"}</DialogTitle><DialogDescription>{step === "contact" ? "Verify your work email or cellphone number to unlock the full workspace." : `Enter the 4-digit code sent to ${contact || "your contact"}.`}</DialogDescription></DialogHeader>{step === "contact" ? <div className="space-y-2"><Label htmlFor="auth-contact">Email Address or Cellphone Number</Label><Input id="auth-contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="kelvin@acme.com or +27 82 000 0000" /></div> : <div className="space-y-4"><InputOTP maxLength={4} value={otp} onChange={setOtp} containerClassName="justify-center"><InputOTPGroup><InputOTPSlot index={0} className="size-12 text-lg" /><InputOTPSlot index={1} className="size-12 text-lg" /><InputOTPSlot index={2} className="size-12 text-lg" /><InputOTPSlot index={3} className="size-12 text-lg" /></InputOTPGroup></InputOTP><p className="text-center text-sm text-muted-foreground">Code expires in {time} minutes (AI-generated secure PIN)</p></div>}<DialogFooter>{step === "otp" && <Button variant="outline" onClick={() => { setStep("contact"); setOtp(""); }}>Back</Button>}<Button disabled={step === "contact" && !contact.trim()} onClick={() => { if (step === "contact") { setStep("otp"); setSeconds(900); toast.success("Verification code sent"); } }}>{step === "contact" ? "Send AI Verification Code" : "Enter any 4 digits"}</Button></DialogFooter></DialogContent></Dialog>;
}

function ViewPanel({ active, children }: { active: boolean; children: React.ReactNode }) { return <div className={cn(!active && "hidden")} aria-hidden={!active}>{children}</div>; }