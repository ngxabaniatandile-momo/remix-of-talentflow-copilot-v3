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
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MarkdownView } from "@/components/markdown-view";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { askCopilot } from "@/lib/talentflow.functions";
import { useTalentFlow, type SessionMessage } from "@/lib/talentflow-store";
import { cn } from "@/lib/utils";

function messageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function titleFrom(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || "New conversation";
}

const personalSample: SessionMessage[] = [
  {
    id: "p1",
    role: "user",
    author: "You",
    content: "Help me design a rubric for a senior platform engineer.",
    at: Date.now(),
  },
  {
    id: "p2",
    role: "assistant",
    author: "TalentFlow AI",
    content:
      "**Senior Platform Engineer rubric**\n\n- **Architecture trade-offs** — can justify caching, indexing and failure-mode decisions with data.\n- **Production ownership** — evidence of on-call, incident recovery and postmortems.\n- **Mentoring impact** — a named engineer who grew into a defined responsibility.\n- **Reliability outcomes** — a measured before/after figure.\n\nWant me to turn this into three behavioural questions?",
    at: Date.now(),
  },
  {
    id: "p3",
    role: "user",
    author: "You",
    content: "Yes, and keep them evidence-seeking.",
    at: Date.now(),
  },
  {
    id: "p4",
    role: "assistant",
    author: "TalentFlow AI",
    content:
      "1. Walk me through a scaling decision where the data contradicted your instinct. What changed after release, and over what period?\n2. Describe the last high-severity incident you owned. Which actions were yours alone?\n3. Tell me about an engineer you mentored. What did they own before, and what do they own now?",
    at: Date.now(),
  },
];

const channels = [
  { id: "senior-full-stack", label: "#senior-full-stack" },
  { id: "frontend-lead", label: "#frontend-lead" },
  { id: "sales-hiring", label: "#sales-hiring" },
];

function groupSample(channelLabel: string): SessionMessage[] {
  const now = Date.now();
  return [
    {
      id: "g1",
      role: "user",
      author: "Kelvin · Talent",
      content: `Opening the ${channelLabel} debrief. Share evidence only, no impressions.`,
      at: now,
    },
    {
      id: "g2",
      role: "user",
      author: "Priya · Engineering",
      content:
        "Strong API depth — traced a missing index and added a performance budget. I still want clearer evidence of incident ownership.",
      at: now,
    },
    {
      id: "g3",
      role: "user",
      author: "Sam · People",
      content:
        "Mentoring example was specific and measurable: one engineer now owns the caching layer after a paired design review.",
      at: now,
    },
    {
      id: "g4",
      role: "user",
      author: "Kelvin · Talent",
      content: "Trade-off is depth in backend versus limited exposure to our data pipeline.",
      at: now,
    },
    {
      id: "g5",
      role: "user",
      author: "Priya · Engineering",
      content: "Pipeline gap is trainable. The architecture reasoning is not.",
      at: now,
    },
    {
      id: "g6",
      role: "assistant",
      author: "TalentFlow AI",
      content:
        "**Panel consensus (draft)**\n\nEvidence supports advancing. Strengths: architecture reasoning, measured reliability improvement, documented mentoring. Open gap: data pipeline exposure — assess with one scoped scenario in the final stage rather than treating it as a blocker.",
      at: now,
    },
  ];
}

function panelReplies(prompt: string, channelLabel: string): SessionMessage[] {
  const now = Date.now();
  const focus = prompt.trim().slice(0, 80);
  return [
    {
      id: `${now}-priya`,
      role: "user",
      author: "Priya Patel · Engineering",
      content: `On the technical side: I'd want one more artefact behind "${focus}" — the design doc or the query plan — before we score it.`,
      at: now,
    },
    {
      id: `${now}-sam`,
      role: "user",
      author: "Sam Brooks · People",
      content:
        "From the collaboration angle, that matches what the panel saw: they name the people they worked with and separate their own actions from team outcomes.",
      at: now + 1,
    },
    {
      id: `${now}-ai`,
      role: "assistant",
      author: "TalentFlow AI",
      content: `**Consensus summary — ${channelLabel}**\n\nThe panel is aligned on the observed evidence. Recommended next step: one scoped follow-up question that isolates individual contribution, then score against the benchmark before any decision is communicated.`,
      at: now + 2,
    },
  ];
}

function workspaceContextFrom(history: { kind: string; label: string; payload: Record<string, string> }[]) {
  const lines = (history || []).slice(0, 15).map((item) => {
    if (item.kind === "scorecard") {
      return `SCORECARD — candidate: ${item.payload["candidateName"] || "Unknown"}; role: ${
        item.payload["roleTitle"] || "Unknown"
      }; assessment: ${(item.payload["markdown"] || "").slice(0, 700)}`;
    }
    if (item.kind === "email") {
      return `CANDIDATE EMAIL — candidate: ${item.payload["candidateName"] || "Unknown"}; role: ${
        item.payload["roleTitle"] || "Unknown"
      }; draft: ${(item.payload["markdown"] || "").slice(0, 400)}`;
    }
    return `SESSION — ${item.kind}: ${item.label}`;
  });
  return lines.join("\n\n").slice(0, 8000);
}

type ChatProps = { restoreId?: string | null; group?: boolean };

function ChatView({ restoreId = null, group = false }: ChatProps) {
  const store = useTalentFlow();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [channelId, setChannelId] = useState(channels[0]!.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const timers = useRef<number[]>([]);

  const channelLabel = channels.find((item) => item.id === channelId)?.label ?? channels[0]!.label;
  const history = store.history;
  const workspaceName = store.workspace.name;
  const logHistory = store.logHistory;
  const updateSession = store.updateSession;

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  // Restore a full thread when the sidebar opens a saved session.
  useEffect(() => {
    if (!restoreId) return;
    const item = (history || []).find((entry) => entry.id === restoreId);
    if (!item) return;
    setSessionId(item.id);
    setMessages(item.messages || []);
    if (item.channel) setChannelId(item.channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  // Persist the whole thread as one session object whenever it changes.
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    updateSession(sessionId, { messages, channel: group ? channelId : undefined });
  }, [messages, sessionId, channelId, group, updateSession]);

  const ensureSession = useCallback(
    (firstPrompt: string, initial: SessionMessage[]) => {
      if (sessionId) return sessionId;
      const id = logHistory({
        kind: group ? "panel" : "chat",
        label: titleFrom(firstPrompt),
        status: group ? channelLabel : "Copilot",
        payload: { module: group ? "panel" : "copilot" },
        messages: initial,
        channel: group ? channelId : undefined,
      });
      setSessionId(id);
      return id;
    },
    [sessionId, logHistory, group, channelLabel, channelId],
  );

  const runAssistant = useCallback(
    async (thread: SessionMessage[]) => {
      const last = [...thread].reverse().find((item) => item.role === "user");
      if (!last) return;
      setTyping(true);

      if (group) {
        const replies = panelReplies(last.content, channelLabel);
        [1000, 2500, 4000].forEach((delay, index) => {
          const timer = window.setTimeout(() => {
            setMessages((current) => [...current, replies[index]!]);
            if (index === 2) setTyping(false);
          }, delay);
          timers.current.push(timer);
        });
        return;
      }

      try {
        const result = await askCopilot({
          data: {
            question: last.content,
            history: thread
              .slice(-10, -1)
              .map((item) => ({ role: item.role, content: item.content })),
            workspaceName,
            workspaceContext: workspaceContextFrom(history),
          },
        });
        setMessages((current) => [
          ...current,
          {
            id: messageId(),
            role: "assistant",
            author: "TalentFlow AI",
            content: result.answer || "I couldn't produce an answer for that. Try rephrasing.",
            at: Date.now(),
          },
        ]);
      } catch (error) {
        const detail =
          error instanceof Error && error.message
            ? error.message
            : "The copilot is unavailable right now.";
        toast.error(detail);
        setMessages((current) => [
          ...current,
          {
            id: messageId(),
            role: "assistant",
            author: "TalentFlow AI",
            content: `I couldn't reach the AI service. ${detail}`,
            at: Date.now(),
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [group, channelLabel, workspaceName, history],
  );

  function sendMessage() {
    const body = draft.trim();
    if (!body || typing) return;
    const userMessage: SessionMessage = {
      id: messageId(),
      role: "user",
      author: group ? `${store.activeUser.name} · Talent` : "You",
      content: body,
      at: Date.now(),
    };
    const next = [...messages, userMessage];
    setMessages(next);
    setDraft("");
    ensureSession(body, next);
    void runAssistant(next);
  }

  function submitEdit(id: string) {
    const body = editValue.trim();
    if (!body) return;
    const index = messages.findIndex((item) => item.id === id);
    if (index < 0) return;
    const truncated = [...messages.slice(0, index), { ...messages[index]!, content: body }];
    setMessages(truncated);
    setEditingId(null);
    setEditValue("");
    if (!sessionId) ensureSession(body, truncated);
    void runAssistant(truncated);
    toast.success("Prompt updated — regenerating response");
  }

  function newConversation() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setSessionId(null);
    setMessages([]);
    setTyping(false);
    setDraft("");
    setEditingId(null);
    inputRef.current?.focus();
    toast.success("New conversation started");
  }

  function loadSample() {
    const sample = group ? groupSample(channelLabel) : personalSample;
    setMessages(sample);
    const id = ensureSession(
      group ? `${channelLabel} panel deliberation` : "Rubric design conversation",
      sample,
    );
    updateSession(id, { messages: sample });
  }

  return (
    <ViewFrame
      icon={group ? Users : MessageSquare}
      title={group ? "Hiring Panel Group Chat" : "Personal AI Copilot"}
      description={
        group
          ? "A shared decision room for panel evidence, scoring, and final hiring consensus."
          : "Ask anything — general questions, role design, or questions about this workspace's candidates and scorecards."
      }
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={newConversation}>
            <Plus /> New conversation
          </Button>
          <Button variant="outline" onClick={loadSample}>
            <Sparkles /> Load Sample Data
          </Button>
        </div>
      }
    >
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">
              {group ? channelLabel : "Private conversation"}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {group &&
                channels.map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={item.id === channelId ? "secondary" : "ghost"}
                    onClick={() => {
                      if (item.id === channelId) return;
                      setChannelId(item.id);
                      setSessionId(null);
                      setMessages([]);
                      toast.success(`Switched to ${item.label}`);
                    }}
                  >
                    {item.label}
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
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {group
                      ? "Share evidence with the panel and TalentFlow will summarise consensus."
                      : "Ask a general question, design a rubric, or ask what this workspace knows about a candidate."}
                  </p>
                </div>
              </div>
            ) : (
              (messages || []).map((message) => {
                const mine = message.role === "user";
                const editing = editingId === message.id;
                return (
                  <div
                    key={message.id}
                    className={cn("group flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("flex max-w-2xl items-start gap-2", mine && "flex-row-reverse")}>
                      {mine && !editing ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit message"
                          className="mt-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => {
                            setEditingId(message.id);
                            setEditValue(message.content);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      ) : null}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-3",
                          mine ? "bg-primary text-primary-foreground" : "bg-surface-panel",
                        )}
                      >
                        <p className="mb-1 text-xs font-bold opacity-75">{message.author}</p>
                        {editing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editValue}
                              onChange={(event) => setEditValue(event.target.value)}
                              className="min-h-24 bg-card text-foreground"
                              aria-label="Edit prompt"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => submitEdit(message.id)}>
                                Save & regenerate
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : mine ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        ) : (
                          <MarkdownView markdown={message.content} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {typing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> TalentFlow AI is{" "}
                {group ? "building consensus" : "thinking"}…
              </div>
            )}
          </div>
          <div className="flex items-end gap-2 border-t border-border p-4">
            <Textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              className="max-h-40 min-h-11 resize-none"
              placeholder={group ? "Share evidence with the panel…" : "Ask your AI copilot…"}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              aria-label="Send message"
              disabled={!draft.trim() || typing}
            >
              <Send />
            </Button>
          </div>
        </CardContent>
      </Card>
    </ViewFrame>
  );
}

export function PersonalChatView({ restoreId = null }: { restoreId?: string | null }) {
  return <ChatView restoreId={restoreId} />;
}
export function GroupChatView({ restoreId = null }: { restoreId?: string | null }) {
  return <ChatView restoreId={restoreId} group />;
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
              store.logHistory({
                kind: "meeting",
                label: "Loaded daily talent operations plan",
                status: "Planner",
                payload: {},
              });
            }}
            variant="outline"
          >
            <Sparkles /> Load Sample Data
          </Button>
        </div>
      }
    >
      {!loaded ? (
        <EmptyPanel
          icon={CalendarClock}
          title="No schedule loaded"
          body="Load sample data to populate today’s talent operations plan."
        />
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
                      setReviewedEmails((current) =>
                        current.includes(email) ? current : [...current, email],
                      );
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
              <Interview
                candidate="Alex Chen"
                role="Senior Full-Stack Engineer"
                time="Today · 14:00"
              />
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
                <label
                  key={task.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3"
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={(checked) =>
                      setTasks((current) =>
                        (current || []).map((item) =>
                          item.id === task.id ? { ...item, done: checked === true } : item,
                        ),
                      )
                    }
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        task.done && "text-muted-foreground line-through",
                      )}
                    >
                      {task.text}
                    </span>
                    <Badge
                      variant={task.priority === "High" ? "default" : "secondary"}
                      className="mt-2"
                    >
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

export type Asset = { name: string; category: string; body: string };

const assetList: Asset[] = [
  {
    name: "Senior Full-Stack Engineer",
    category: "Job Descriptions",
    body: "Own customer-facing services end to end: RESTful API design, PostgreSQL tuning, AWS/Docker operations, and mentorship of mid-level engineers.\n\nKey requirements:\n- Design and ship documented RESTful APIs\n- Strong PostgreSQL indexing and query tuning\n- Architecture ownership for scalability and reliability\n- Mentor mid-level engineers and raise review quality",
  },
  {
    name: "People Operations Partner",
    category: "Job Descriptions",
    body: "Partner with leaders on hiring plans, performance cycles, and POPIA-aligned employee data practices.\n\nKey requirements:\n- Workforce planning with hiring managers\n- Evidence-based debrief facilitation\n- Employee data handling under POPIA/GDPR",
  },
  {
    name: "Enterprise Account Executive",
    category: "Job Descriptions",
    body: "Own enterprise pipeline generation, multi-stakeholder discovery, and disciplined forecast hygiene.",
  },
  {
    name: "Architecture & Scale",
    category: "Interview Guides",
    body: "Competencies: System Architecture, Data Modelling, Reliability.\n\nProbe trade-offs under load: caching strategy, indexing decisions, failure modes, and measurable reliability outcomes.",
  },
  {
    name: "Leadership Behaviors",
    category: "Interview Guides",
    body: "Competencies: Mentorship, Conflict Resolution, Decision Making.\n\nExplore mentorship evidence, conflict resolution, and decisions made with incomplete information.",
  },
  {
    name: "Customer Discovery",
    category: "Interview Guides",
    body: "Competencies: Questioning Discipline, Qualification, Pipeline Impact.\n\nAssess evidence of measurable pipeline impact and structured qualification.",
  },
  {
    name: "Next Round Invitation",
    category: "Email Templates",
    body: "Subject: Next conversation for the [Role] role\n\nHi [Name], the panel valued your specific examples and would like to continue the conversation with [Interviewer] on [Date].",
  },
  {
    name: "Empathetic Rejection",
    category: "Email Templates",
    body: "Subject: Update on your [Role] application\n\nHi [Name], thank you for the preparation you brought to every conversation. The panel especially noted [Specific Positive Trait].",
  },
  {
    name: "Offer Letter — Executive",
    category: "Email Templates",
    body: "Subject: Offer for the [Role] role\n\nHi [Name], we are delighted to offer you the position. [Annual Base: $X] · [Start Date: Date] · [Benefits Summary].",
  },
  {
    name: "POPIA Candidate Data Handling",
    category: "HR Compliance Policies",
    body: "Candidate personal information is processed only for the stated hiring purpose, minimized at capture, and redacted before AI analysis.",
  },
  {
    name: "GDPR Retention Standard",
    category: "HR Compliance Policies",
    body: "Candidate records are retained for 12 months post-decision unless consent for a longer talent-pool period is explicitly captured.",
  },
  {
    name: "Fair Hiring & AI Review",
    category: "HR Compliance Policies",
    body: "Every AI-generated evaluation requires documented human review before any hiring decision is communicated.",
  },
];

const assetCategories = [
  "Job Descriptions",
  "Interview Guides",
  "Email Templates",
  "HR Compliance Policies",
];

export function LibraryView({ onOpenInWorkspace }: { onOpenInWorkspace?: (asset: Asset) => void }) {
  const store = useTalentFlow();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(assetCategories[0]!);
  const [selected, setSelected] = useState<Asset | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (assetList || []).filter(
      (asset) =>
        asset.category === category &&
        (term === "" ||
          asset.name.toLowerCase().includes(term) ||
          asset.category.toLowerCase().includes(term) ||
          asset.body.toLowerCase().includes(term)),
    );
  }, [query, category]);

  async function copyAsset(asset: Asset) {
    try {
      await navigator.clipboard.writeText(`${asset.name}\n\n${asset.body}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <ViewFrame
      icon={BookOpen}
      title="HR Asset Library"
      description="Controlled templates, guidance, and compliance references for consistent talent operations."
    >
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="px-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the HR library"
              aria-label="Search the HR library"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface-panel"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <div className="mb-5 flex flex-wrap gap-2">
            {(assetCategories || []).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={item === category ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyPanel
              icon={Search}
              title="No matching assets"
              body="Try a different search term or category."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((asset) => (
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
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              <Badge variant="secondary" className="mr-2">
                {selected?.category}
              </Badge>
              Updated this quarter · Approved by Legal · {store.workspace.name}
            </DialogDescription>
          </DialogHeader>
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-panel p-4 text-sm leading-6">
            {selected?.body}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => selected && copyAsset(selected)}>
              <Copy /> Copy Template
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                onOpenInWorkspace?.(selected);
                store.logHistory({
                  kind: "benchmark",
                  label: `Opened ${selected.name}`,
                  status: selected.category,
                  payload: { asset: selected.name },
                });
                setSelected(null);
              }}
            >
              Open in Workspace
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
  {
    interviewer: "Tell me about a performance problem you personally diagnosed.",
    candidate:
      "I reduced API response time by tracing a missing database index, then added a performance budget to our release checks.",
  },
  {
    interviewer: "What happened when that change did not hold under load?",
    candidate:
      "When the incident escalated, I took the pager, isolated the failing service, and wrote the postmortem the same week.",
  },
  {
    interviewer: "How do you grow the engineers around you?",
    candidate:
      "I mentor two mid-level engineers; one now owns our caching layer after we paired on the design review.",
  },
];

export function MeetingView({
  onExportToScorecard,
}: {
  onExportToScorecard?: (candidate: { name: string; role: string; notes: string }) => void;
}) {
  const store = useTalentFlow();
  const [provider, setProvider] = useState<"Microsoft Teams" | "Google Meet">("Microsoft Teams");
  const [consented, setConsented] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const [candidateName, setCandidateName] = useState(meetingCandidates[0]!.name);
  const [customCandidate, setCustomCandidate] = useState("");
  const [live, setLive] = useState(false);
  const [turn, setTurn] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const candidate = useMemo(() => {
    if (candidateName === "custom") {
      return { name: customCandidate.trim() || "Candidate", role: "Custom pipeline entry" };
    }
    return meetingCandidates.find((item) => item.name === candidateName) ?? meetingCandidates[0]!;
  }, [candidateName, customCandidate]);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [live]);

  function startSession() {
    if (!consented) return;
    setLive(true);
    setTurn(0);
    setSeconds(0);
    toast.success(`${provider} copilot connected`);
    store.logHistory({
      kind: "meeting",
      label: `Live session · ${candidate.name}`,
      status: provider,
      payload: { candidate: candidate.name, room: roomUrl },
    });
  }

  function endSession() {
    setLive(false);
    setConsented(false);
    setTurn(0);
    setSeconds(0);
  }

  const current = transcriptTurns[turn] ?? transcriptTurns[0]!;
  const clock = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(
    Math.floor(seconds / 60) % 60,
  ).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const suggestions = [
    {
      title: "Suggested question",
      body:
        turn === 0
          ? "What evidence showed the index was the root cause rather than caching?"
          : turn === 1
            ? "Which decisions were yours alone during the incident?"
            : "What behaviour changed for the mentee after the pairing?",
    },
    {
      title: "Tone & bias check",
      body: "Balanced and objective. Allow the candidate time to elaborate on incident recovery.",
      positive: true,
    },
    {
      title: "Objective follow-up",
      body: "Ask how the improvement was measured after release, and over what period.",
    },
  ];

  function transcriptText(upTo: number) {
    return transcriptTurns
      .slice(0, upTo + 1)
      .map((entry) => `Interviewer: ${entry.interviewer}\n${candidate.name}: ${entry.candidate}`)
      .join("\n\n");
  }

  return (
    <ViewFrame
      icon={Video}
      title="Live Meeting Copilot"
      description="Consent-led support for structured interviews across Microsoft Teams and Google Meet."
      action={
        live ? (
          <Button variant="outline" onClick={endSession}>
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
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Platform</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["Microsoft Teams", "Google Meet"] as const).map((item) => (
                  <Button
                    key={item}
                    variant={provider === item ? "default" : "outline"}
                    className="h-20 justify-start"
                    onClick={() => setProvider(item)}
                  >
                    <Video className="size-5" />
                    <span className="text-left">
                      <span className="block font-bold">{item}</span>
                      <span className="text-xs opacity-75">
                        {provider === item ? "Selected" : "Select platform"}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-url">Meeting URL or Room ID</Label>
              <Input
                id="room-url"
                value={roomUrl}
                onChange={(event) => setRoomUrl(event.target.value)}
                placeholder="https://teams.microsoft.com/l/meetup-join/…"
              />
            </div>
            <div className="space-y-2">
              <Label>Select candidate from pipeline</Label>
              <Select value={candidateName} onValueChange={setCandidateName}>
                <SelectTrigger aria-label="Select candidate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meetingCandidates.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name} · {item.role}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom candidate…</SelectItem>
                </SelectContent>
              </Select>
              {candidateName === "custom" ? (
                <Input
                  value={customCandidate}
                  onChange={(event) => setCustomCandidate(event.target.value)}
                  placeholder="Candidate full name"
                  aria-label="Custom candidate name"
                />
              ) : null}
            </div>
            <label className="flex items-start justify-between gap-4 rounded-md border border-alert-border bg-alert p-4 text-sm text-alert-foreground">
              <span>
                Candidate has been notified and provided POPIA/GDPR consent for AI-assisted note
                taking and evaluation.
              </span>
              <Switch
                checked={consented}
                onCheckedChange={(value) => setConsented(value === true)}
                aria-label="Confirm candidate consent"
              />
            </label>
            <Button disabled={!consented} onClick={startSession}>
              <Video className="size-4" /> Connect & Launch Live Copilot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden shadow-sm">
            <div className="flex min-h-72 items-center justify-center bg-brand-ink p-8 text-primary-foreground">
              <div className="text-center">
                <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-2xl font-bold">
                  {candidate.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <p className="mt-4 text-lg font-bold">{candidate.name}</p>
                <p className="mt-1 text-sm opacity-75">
                  {provider} · {candidate.role} · {clock}
                </p>
                {roomUrl.trim() !== "" && (
                  <p className="mt-1 max-w-sm truncate text-xs opacity-60">{roomUrl}</p>
                )}
                <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold">
                  <Circle className="size-2 animate-pulse fill-current" /> Live consent confirmed
                </div>
              </div>
            </div>
            <CardContent className="space-y-3 border-t p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Live transcript · turn {turn + 1}/{transcriptTurns.length}
              </p>
              <div className="max-h-52 space-y-3 overflow-y-auto rounded-md bg-surface-panel p-4">
                {transcriptTurns.slice(0, turn + 1).map((entry) => (
                  <div key={entry.interviewer}>
                    <p className="text-sm leading-6">
                      <span className="font-bold">Interviewer: </span>
                      {entry.interviewer}
                    </p>
                    <p className="text-sm leading-6">
                      <span className="font-bold">{candidate.name}: </span>
                      {entry.candidate}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Latest: “{current.candidate}”</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTurn((value) => Math.min(transcriptTurns.length - 1, value + 1))}
                  disabled={turn >= transcriptTurns.length - 1}
                >
                  <RefreshCw /> Next Transcript Turn
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const notes = transcriptText(turn);
                    onExportToScorecard?.({ name: candidate.name, role: candidate.role, notes });
                    endSession();
                    toast.success(`${candidate.name} exported to Interview Scorecard`);
                  }}
                >
                  End Meeting & Export Transcript to Scorecard
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {(suggestions || []).map((item) => (
              <Insight
                key={item.title}
                title={item.title}
                body={item.body}
                positive={item.positive === true}
              />
            ))}
            <Card className="border-alert-border bg-alert shadow-sm">
              <CardContent className="flex gap-3 p-4">
                <AlertTriangle className="size-5 shrink-0 text-alert-foreground" />
                <p className="text-xs leading-6 text-alert-foreground">
                  AI guidance is decision support only. A human reviewer confirms every hiring
                  outcome.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </ViewFrame>
  );
}

function Insight({
  title,
  body,
  positive = false,
}: {
  title: string;
  body: string;
  positive?: boolean;
}) {
  return (
    <Card className={cn("shadow-sm", positive && "border-primary/30 bg-accent")}>
      <CardContent className="p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
          {positive ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Sparkles className="size-4 text-primary" />
          )}
          {title}
        </p>
        <p className="mt-2 text-sm leading-6">{body}</p>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof CalendarClock;
  title: string;
  body: string;
}) {
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
