import {
  AlertTriangle,
  BookOpen,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTalentFlow } from "@/lib/talentflow-store";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; sender: string; body: string; ai?: boolean };

const personalSample: ChatMessage[] = [
  { id: "p1", sender: "You", body: "Help me define evidence signals for a senior platform engineer." },
  {
    id: "p2",
    sender: "TalentFlow AI",
    body: "Prioritize architecture trade-offs, production ownership, mentoring impact, and measurable reliability improvements. I can turn these into an interview rubric next.",
    ai: true,
  },
];

const groupSample: ChatMessage[] = [
  { id: "g1", sender: "Priya · Engineering", body: "Alex showed strong API depth, but I want clearer evidence on incident ownership." },
  { id: "g2", sender: "Sam · People", body: "Agreed. Their mentoring example was specific and measurable." },
  {
    id: "g3",
    sender: "TalentFlow AI",
    body: "Consensus is trending positive. Suggested follow-up: ask Alex to walk through a high-severity incident and separate personal actions from team outcomes.",
    ai: true,
  },
];

const channels = ["senior-full-stack-panel", "frontend-lead-panel", "sales-hiring-panel"];

function aiReply(prompt: string, group: boolean) {
  const trimmed = prompt.trim();
  if (group) {
    return `Captured for the panel: “${trimmed.slice(0, 90)}”. Emerging consensus — keep scoring evidence-based, and ask one follow-up that separates individual contribution from team outcome before the final decision.`;
  }
  if (/question/i.test(trimmed)) {
    return `Here are two structured questions you can use:\n1. Walk me through a decision where the data contradicted your instinct.\n2. What measurable outcome followed, and what would you change now?`;
  }
  if (/policy|popia|gdpr|compliance/i.test(trimmed)) {
    return "Under POPIA/GDPR you may only process candidate data for the stated hiring purpose, retain it for the published period, and must redact identifiers before AI analysis. TalentFlow applies the redaction automatically.";
  }
  return `Noted: “${trimmed.slice(0, 90)}”. I'd convert that into one observable interview signal and one structured follow-up question so scoring stays evidence-based.`;
}

function ChatView({ group = false }: { group?: boolean }) {
  const store = useTalentFlow();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [channel, setChannel] = useState(channels[0]!);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sample = group ? groupSample : personalSample;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage() {
    const body = draft.trim();
    if (!body) return;
    const id = `${Date.now()}`;
    setMessages((current) => [...current, { id, sender: store.activeUser.name, body }]);
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: `${id}-ai`, sender: "TalentFlow AI", body: aiReply(body, group), ai: true }]);
      setTyping(false);
    }, 900);
    store.logHistory({
      kind: group ? "panel" : "chat",
      label: body.slice(0, 48),
      status: group ? `#${channel}` : "Copilot",
      payload: { prompt: body },
    });
  }

  return (
    <ViewFrame
      icon={group ? Users : MessageSquare}
      title={group ? "Hiring Panel Group Chat" : "Personal AI Copilot"}
      description={
        group
          ? "A shared decision room for panel evidence, scoring, and final hiring consensus."
          : "Your private workspace for role criteria, interview questions, and HR policy guidance."
      }
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setMessages([])}>
            <Plus /> New conversation
          </Button>
          <Button variant="outline" onClick={() => setMessages(sample)}>
            <Sparkles /> Load Sample Data
          </Button>
        </div>
      }
    >
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">{group ? `# ${channel}` : "Private conversation"}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {group &&
                channels.map((item) => (
                  <Button key={item} size="sm" variant={item === channel ? "secondary" : "ghost"} onClick={() => setChannel(item)}>
                    #{item.replace("-panel", "")}
                  </Button>
                ))}
              <Badge variant="secondary" className="gap-1">
                <Circle className="size-2 fill-primary text-primary" /> AI online
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={scrollRef} className="max-h-[28rem] min-h-80 space-y-4 overflow-y-auto p-5">
            {(messages || []).length === 0 && !typing ? (
              <div className="grid min-h-72 place-items-center text-center">
                <div className="max-w-sm">
                  <Bot className="mx-auto mb-3 size-9 text-primary" />
                  <p className="font-semibold">Start a focused conversation</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Ask about hiring criteria, policy, interview design, or panel evidence.</p>
                </div>
              </div>
            ) : (
              (messages || []).map((message) => (
                <div key={message.id} className={cn("flex", message.ai || message.sender !== store.activeUser.name ? "justify-start" : "justify-end")}>
                  <div
                    className={cn(
                      "max-w-2xl rounded-lg px-4 py-3",
                      message.ai || message.sender !== store.activeUser.name ? "bg-surface-panel" : "bg-primary text-primary-foreground",
                    )}
                  >
                    <p className="mb-1 text-xs font-bold opacity-75">{message.sender}</p>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  </div>
                </div>
              ))
            )}
            {typing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> TalentFlow AI is {group ? "building consensus" : "thinking"}…
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-border p-4">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              placeholder={group ? "Share evidence with the panel…" : "Ask your AI copilot…"}
            />
            <Button size="icon" onClick={sendMessage} aria-label="Send message" disabled={!draft.trim()}>
              <Send />
            </Button>
          </div>
        </CardContent>
      </Card>
    </ViewFrame>
  );
}

export function PersonalChatView() {
  return <ChatView />;
}
export function GroupChatView() {
  return <ChatView group />;
}

const initialTasks = [
  { id: 1, text: "Review Morgan Lee’s borderline evidence", priority: "High", done: false },
  { id: 2, text: "Approve next-round email for Alex Chen", priority: "High", done: false },
  { id: 3, text: "Refresh Backend Engineer interview guide", priority: "Medium", done: false },
];

export function SchedulesView() {
  const store = useTalentFlow();
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [reviewedEmails, setReviewedEmails] = useState<string[]>([]);
  const emails = ["Alex Chen · Next round invitation", "Morgan Lee · Panel follow-up"];
  const completed = (tasks || []).filter((task) => task.done).length;

  return (
    <ViewFrame
      icon={CalendarClock}
      title="Schedules & Deadlines"
      description="A prioritized operating view for candidate communication, interviews, and hiring tasks."
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTasks(initialTasks);
              setReviewedEmails([]);
              toast.success("Planner reset");
            }}
          >
            <RefreshCw /> Reset
          </Button>
          <Button
            onClick={() => {
              setLoaded(true);
              setTasks(initialTasks);
              store.logHistory({ kind: "meeting", label: "Loaded daily talent operations plan", status: "Planner", payload: {} });
            }}
            variant="outline"
          >
            <Sparkles /> Load Sample Data
          </Button>
        </div>
      }
    >
      {!loaded ? (
        <EmptyPanel icon={CalendarClock} title="No schedule loaded" body="Load sample data to populate today’s talent operations plan." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-primary" /> Pending Emails to Send
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(emails || []).map((email) => (
                <div key={email} className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold">{email}</p>
                  <Button
                    size="sm"
                    variant={reviewedEmails.includes(email) ? "secondary" : "outline"}
                    className="mt-3"
                    onClick={() => {
                      setReviewedEmails((current) => (current.includes(email) ? current : [...current, email]));
                      toast.success("Email marked reviewed");
                    }}
                  >
                    {reviewedEmails.includes(email) ? <Check /> : <FileText />}
                    {reviewedEmails.includes(email) ? "Reviewed" : "One-click review"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="size-4 text-primary" /> Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Interview candidate="Alex Chen" role="Senior Full-Stack Engineer" time="Today · 14:00" />
              <Interview candidate="Morgan Lee" role="Frontend Lead" time="Tomorrow · 09:30" />
              <Interview candidate="Jordan Smith" role="Junior Sales" time="Thu · 11:00" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-primary" /> Prioritized Work Checklist
                <Badge variant="secondary" className="ml-auto">
                  {completed}/{(tasks || []).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(tasks || []).map((task) => (
                <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={(checked) =>
                      setTasks((current) => (current || []).map((item) => (item.id === task.id ? { ...item, done: checked === true } : item)))
                    }
                  />
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-medium", task.done && "text-muted-foreground line-through")}>{task.text}</span>
                    <Badge variant={task.priority === "High" ? "default" : "secondary"} className="mt-2">
                      {task.priority}
                    </Badge>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </ViewFrame>
  );
}

function Interview({ candidate, role, time }: { candidate: string; role: string; time: string }) {
  return (
    <div className="rounded-md bg-surface-panel p-3">
      <p className="text-sm font-bold">{candidate}</p>
      <p className="mt-1 text-xs text-muted-foreground">{role}</p>
      <p className="mt-2 text-xs font-semibold text-primary">{time}</p>
    </div>
  );
}

type Asset = { name: string; category: string; body: string };

const assetList: Asset[] = [
  { name: "Senior Full-Stack Engineer", category: "Job Descriptions", body: "Own customer-facing services end to end: RESTful API design, PostgreSQL tuning, AWS/Docker operations, and mentorship of mid-level engineers." },
  { name: "People Operations Partner", category: "Job Descriptions", body: "Partner with leaders on hiring plans, performance cycles, and POPIA-aligned employee data practices." },
  { name: "Enterprise Account Executive", category: "Job Descriptions", body: "Own enterprise pipeline generation, multi-stakeholder discovery, and disciplined forecast hygiene." },
  { name: "Architecture & Scale", category: "Interview Guides", body: "Probe trade-offs under load: caching strategy, indexing decisions, failure modes, and measurable reliability outcomes." },
  { name: "Leadership Behaviors", category: "Interview Guides", body: "Explore mentorship evidence, conflict resolution, and decisions made with incomplete information." },
  { name: "Customer Discovery", category: "Interview Guides", body: "Assess questioning discipline, qualification frameworks, and evidence of measurable pipeline impact." },
  { name: "Next Round Invitation", category: "Email Templates", body: "Subject: Next conversation for the [Role] role\n\nHi [Name], the panel valued your specific examples and would like to continue..." },
  { name: "Empathetic Rejection", category: "Email Templates", body: "Subject: Update on your [Role] application\n\nHi [Name], thank you for the preparation you brought to every conversation..." },
  { name: "Executive Offer", category: "Email Templates", body: "Subject: Offer for the [Role] role\n\nHi [Name], we are delighted to offer you the position. [Annual Base: $X] · [Start Date: Date]..." },
  { name: "POPIA Candidate Data Handling", category: "HR Compliance Policies", body: "Candidate personal information is processed only for the stated hiring purpose, minimized at capture, and redacted before AI analysis." },
  { name: "GDPR Retention Standard", category: "HR Compliance Policies", body: "Candidate records are retained for 12 months post-decision unless consent for a longer talent-pool period is explicitly captured." },
  { name: "Fair Hiring & AI Review", category: "HR Compliance Policies", body: "Every AI-generated evaluation requires documented human review before any hiring decision is communicated." },
];

const assetCategories = ["Job Descriptions", "Interview Guides", "Email Templates", "HR Compliance Policies"];

export function LibraryView({ onOpenInWorkspace }: { onOpenInWorkspace?: (asset: { name: string; category: string; body: string }) => void }) {
  const store = useTalentFlow();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);

  const filtered = useMemo(
    () => (assetList || []).filter((asset) => asset.name.toLowerCase().includes(query.toLowerCase()) || asset.body.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  async function copyAsset(asset: Asset) {
    try {
      await navigator.clipboard.writeText(`${asset.name}\n\n${asset.body}`);
      toast.success("Asset copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <ViewFrame icon={BookOpen} title="HR Asset Library" description="Controlled templates, guidance, and compliance references for consistent talent operations.">
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the HR library" />
          </div>
          <Tabs defaultValue={assetCategories[0]}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto bg-surface-panel">
              {(assetCategories || []).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            {(assetCategories || []).map((category) => {
              const items = filtered.filter((asset) => asset.category === category);
              return (
                <TabsContent key={category} value={category} className="mt-5">
                  {items.length === 0 ? (
                    <EmptyPanel icon={Search} title="No matching assets" body="Try a different search term for this category." />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((asset) => (
                        <button
                          key={asset.name}
                          type="button"
                          onClick={() => setSelected(asset)}
                          className="rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-surface-panel"
                        >
                          <FileText className="mb-3 size-5 text-primary" />
                          <p className="font-semibold">{asset.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{asset.body}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.category} · {store.workspace.name}
            </DialogDescription>
          </DialogHeader>
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-panel p-4 text-sm leading-6">{selected?.body}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => selected && copyAsset(selected)}>
              <Copy /> Copy
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                onOpenInWorkspace?.(selected);
                store.logHistory({ kind: "benchmark", label: `Opened ${selected.name}`, status: selected.category, payload: { asset: selected.name } });
                setSelected(null);
              }}
            >
              Open in workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ViewFrame>
  );
}

const meetingCandidates = [
  { name: "Alex Chen", role: "Senior Full-Stack Engineer" },
  { name: "Morgan Lee", role: "Frontend Lead" },
  { name: "Jordan Smith", role: "Junior Sales" },
];

const transcriptTurns = [
  "I reduced API response time by tracing a missing database index, then added a performance budget to our release checks.",
  "When the incident escalated, I took the pager, isolated the failing service, and wrote the postmortem the same week.",
  "I mentor two mid-level engineers; one now owns our caching layer after we paired on the design review.",
];

export function MeetingView({ onExportToScorecard }: { onExportToScorecard?: (candidate: { name: string; role: string; notes: string }) => void }) {
  const store = useTalentFlow();
  const [provider, setProvider] = useState<"Microsoft Teams" | "Google Meet" | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const [candidate, setCandidate] = useState(meetingCandidates[0]!);
  const [live, setLive] = useState(false);
  const [turn, setTurn] = useState(0);

  function requestConnection(next: "Microsoft Teams" | "Google Meet") {
    setProvider(next);
    setConsentOpen(true);
  }

  function startSession() {
    if (!consented) return;
    setConsentOpen(false);
    setLive(true);
    setTurn(0);
    toast.success(`${provider ?? "Meeting"} copilot connected`);
    store.logHistory({ kind: "meeting", label: `Live session · ${candidate.name}`, status: provider ?? "Meeting", payload: { candidate: candidate.name } });
  }

  const currentTranscript = transcriptTurns[turn] ?? transcriptTurns[0]!;
  const suggestions = [
    { title: "Suggested question", body: turn === 0 ? "What evidence showed the index was the root cause rather than caching?" : turn === 1 ? "Which decisions were yours alone during the incident?" : "What behaviour changed for the mentee after the pairing?" },
    { title: "Tone check", body: "Balanced and specific. Allow the candidate space to complete the technical sequence.", positive: true },
    { title: "Bias check", body: "No demographic or non-job-related language detected in this segment.", positive: true },
    { title: "Objective follow-up", body: "Ask how the improvement was measured after release, and over what period." },
  ];

  return (
    <ViewFrame
      icon={Video}
      title="Live Meeting Copilot"
      description="Consent-led support for structured interviews across Microsoft Teams and Google Meet."
      action={
        live ? (
          <Button
            variant="outline"
            onClick={() => {
              setLive(false);
              setConsented(false);
              setProvider(null);
              setTurn(0);
            }}
          >
            <Trash2 /> End session
          </Button>
        ) : undefined
      }
    >
      {!live ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Connect your interview room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Candidate</p>
              <div className="flex flex-wrap gap-2">
                {(meetingCandidates || []).map((item) => (
                  <Button key={item.name} size="sm" variant={item.name === candidate.name ? "default" : "outline"} onClick={() => setCandidate(item)}>
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Meeting link or room ID</p>
              <Input value={roomUrl} onChange={(event) => setRoomUrl(event.target.value)} placeholder="https://teams.microsoft.com/l/meetup-join/…" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-20 justify-start" onClick={() => requestConnection("Microsoft Teams")}>
                <Video className="size-5 text-primary" />
                <span className="text-left">
                  <span className="block font-bold">Microsoft Teams</span>
                  <span className="text-xs text-muted-foreground">Connect meeting</span>
                </span>
              </Button>
              <Button variant="outline" className="h-20 justify-start" onClick={() => requestConnection("Google Meet")}>
                <Video className="size-5 text-primary" />
                <span className="text-left">
                  <span className="block font-bold">Google Meet</span>
                  <span className="text-xs text-muted-foreground">Connect meeting</span>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden shadow-sm">
            <div className="flex min-h-80 items-center justify-center bg-brand-ink p-8 text-primary-foreground">
              <div className="text-center">
                <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-2xl font-bold">
                  {candidate.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <p className="mt-4 text-lg font-bold">{candidate.name}</p>
                <p className="mt-1 text-sm opacity-75">
                  {provider ?? "Microsoft Teams"} · {candidate.role}
                </p>
                {roomUrl.trim() !== "" && <p className="mt-1 max-w-sm truncate text-xs opacity-60">{roomUrl}</p>}
                <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold">
                  <Circle className="size-2 fill-current" /> Live consent confirmed
                </div>
              </div>
            </div>
            <CardContent className="space-y-3 border-t p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">Live transcript signal · turn {turn + 1}/{transcriptTurns.length}</p>
              <p className="text-sm leading-6">“{currentTranscript}”</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setTurn((value) => Math.min(transcriptTurns.length - 1, value + 1))} disabled={turn >= transcriptTurns.length - 1}>
                  <RefreshCw /> Next transcript turn
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const notes = transcriptTurns.slice(0, turn + 1).join("\n\n");
                    onExportToScorecard?.({ name: candidate.name, role: candidate.role, notes });
                    toast.success(`${candidate.name} exported to Interview Scorecard`);
                  }}
                >
                  Export to scorecard
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {(suggestions || []).map((item) => (
              <Insight key={item.title} title={item.title} body={item.body} positive={item.positive === true} />
            ))}
          </div>
        </div>
      )}

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-alert-foreground" /> Consent & Transparency Required
            </DialogTitle>
            <DialogDescription className="leading-6">
              TalentFlow requires participant confirmation before initiating live transcription and real-time behavioral guidance. Compliant with POPIA/GDPR.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 rounded-md bg-alert p-4 text-sm text-alert-foreground">
            <Checkbox checked={consented} onCheckedChange={(checked) => setConsented(checked === true)} /> I confirm every participant has been informed and has
            consented to transcription and AI assistance.
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!consented} onClick={startSession}>
              Confirm & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ViewFrame>
  );
}

function Insight({ title, body, positive = false }: { title: string; body: string; positive?: boolean }) {
  return (
    <Card className={cn("shadow-sm", positive && "border-primary/30 bg-accent")}>
      <CardContent className="p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
          {positive ? <CheckCircle2 className="size-4 text-primary" /> : <Sparkles className="size-4 text-primary" />}
          {title}
        </p>
        <p className="mt-2 text-sm leading-6">{body}</p>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ icon: Icon, title, body }: { icon: typeof CalendarClock; title: string; body: string }) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="grid min-h-60 place-items-center p-6 text-center">
        <div>
          <Icon className="mx-auto mb-3 size-9 text-muted-foreground" />
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ViewFrame({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: typeof CalendarClock;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 grid size-10 place-items-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
