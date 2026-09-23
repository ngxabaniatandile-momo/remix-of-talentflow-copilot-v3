import {
  AlertTriangle,
  BookOpen,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Mail,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatMessage = { sender: string; body: string; ai?: boolean };

const personalSample: ChatMessage[] = [
  { sender: "Kelvin", body: "Help me define evidence signals for a senior platform engineer." },
  {
    sender: "TalentFlow AI",
    body: "Prioritize architecture trade-offs, production ownership, mentoring impact, and measurable reliability improvements. I can turn these into an interview rubric next.",
    ai: true,
  },
];

const groupSample: ChatMessage[] = [
  { sender: "Priya · Engineering", body: "Alex showed strong API depth, but I want clearer evidence on incident ownership." },
  { sender: "Sam · People", body: "Agreed. Their mentoring example was specific and measurable." },
  {
    sender: "TalentFlow AI",
    body: "Consensus is trending positive. Suggested follow-up: ask Alex to walk through a high-severity incident and separate personal actions from team outcomes.",
    ai: true,
  },
];

function ChatView({ group = false }: { group?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const sample = group ? groupSample : personalSample;

  function sendMessage() {
    const body = draft.trim();
    if (!body) return;
    setMessages((current) => [
      ...current,
      { sender: "Kelvin", body },
      {
        sender: "TalentFlow AI",
        body: group
          ? "I’ve added that perspective to the panel discussion and updated the emerging consensus."
          : "I’ve captured that. I recommend converting it into one observable interview signal and one structured follow-up question.",
        ai: true,
      },
    ]);
    setDraft("");
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
      action={<Button variant="outline" onClick={() => setMessages(sample)}><Sparkles /> Load Sample Data</Button>}
    >
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">{group ? "# senior-full-stack-panel" : "Private conversation"}</CardTitle>
            <Badge variant="secondary" className="gap-1"><Circle className="size-2 fill-primary text-primary" /> AI online</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-h-80 space-y-4 p-5">
            {messages.length === 0 ? (
              <div className="grid min-h-72 place-items-center text-center">
                <div className="max-w-sm">
                  <Bot className="mx-auto mb-3 size-9 text-primary" />
                  <p className="font-semibold">Start a focused conversation</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Ask about hiring criteria, policy, interview design, or panel evidence.</p>
                </div>
              </div>
            ) : messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={cn("flex", message.ai ? "justify-start" : "justify-end")}>
                <div className={cn("max-w-2xl rounded-lg px-4 py-3", message.ai ? "bg-surface-panel" : "bg-primary text-primary-foreground")}>
                  <p className="mb-1 text-xs font-bold opacity-75">{message.sender}</p>
                  <p className="text-sm leading-6">{message.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border p-4">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder={group ? "Share evidence with the panel…" : "Ask your AI copilot…"} />
            <Button size="icon" onClick={sendMessage} aria-label="Send message"><Send /></Button>
          </div>
        </CardContent>
      </Card>
    </ViewFrame>
  );
}

export function PersonalChatView() { return <ChatView />; }
export function GroupChatView() { return <ChatView group />; }

const initialTasks = [
  { id: 1, text: "Review Morgan Lee’s borderline evidence", priority: "High", done: false },
  { id: 2, text: "Approve next-round email for Alex Chen", priority: "High", done: false },
  { id: 3, text: "Refresh Backend Engineer interview guide", priority: "Medium", done: false },
];

export function SchedulesView() {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [reviewedEmails, setReviewedEmails] = useState<string[]>([]);
  const emails = ["Alex Chen · Next round invitation", "Morgan Lee · Panel follow-up"];

  return (
    <ViewFrame icon={CalendarClock} title="Schedules & Deadlines" description="A prioritized operating view for candidate communication, interviews, and hiring tasks." action={<Button variant="outline" onClick={() => { setLoaded(true); setTasks(initialTasks); }}><Sparkles /> Load Sample Data</Button>}>
      {!loaded ? <EmptyPanel icon={CalendarClock} title="No schedule loaded" body="Load sample data to populate today’s talent operations plan." /> : (
        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="size-4 text-primary" /> Pending Emails to Send</CardTitle></CardHeader><CardContent className="space-y-3">{emails.map((email) => <div key={email} className="rounded-md border border-border p-3"><p className="text-sm font-semibold">{email}</p><Button size="sm" variant={reviewedEmails.includes(email) ? "secondary" : "outline"} className="mt-3" onClick={() => { setReviewedEmails((current) => current.includes(email) ? current : [...current, email]); toast.success("Email marked reviewed"); }}>{reviewedEmails.includes(email) ? <Check /> : <FileText />}{reviewedEmails.includes(email) ? "Reviewed" : "One-click review"}</Button></div>)}</CardContent></Card>
          <Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="size-4 text-primary" /> Upcoming Interviews</CardTitle></CardHeader><CardContent className="space-y-3"><Interview candidate="Alex Chen" role="Senior Full-Stack Engineer" time="Today · 14:00" /><Interview candidate="Morgan Lee" role="Frontend Lead" time="Tomorrow · 09:30" /><Interview candidate="Jordan Smith" role="Junior Sales" time="Thu · 11:00" /></CardContent></Card>
          <Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-primary" /> Prioritized Work Checklist</CardTitle></CardHeader><CardContent className="space-y-3">{tasks.map((task) => <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3"><Checkbox checked={task.done} onCheckedChange={(checked) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: checked === true } : item))} /><span className="min-w-0"><span className={cn("block text-sm font-medium", task.done && "text-muted-foreground line-through")}>{task.text}</span><Badge variant={task.priority === "High" ? "default" : "secondary"} className="mt-2">{task.priority}</Badge></span></label>)}</CardContent></Card>
        </div>
      )}
    </ViewFrame>
  );
}

function Interview({ candidate, role, time }: { candidate: string; role: string; time: string }) {
  return <div className="rounded-md bg-surface-panel p-3"><p className="text-sm font-bold">{candidate}</p><p className="mt-1 text-xs text-muted-foreground">{role}</p><p className="mt-2 text-xs font-semibold text-primary">{time}</p></div>;
}

const assets = {
  "Job Descriptions": ["Senior Full-Stack Engineer", "People Operations Partner", "Enterprise Account Executive"],
  "Interview Guides": ["Architecture & Scale", "Leadership Behaviors", "Customer Discovery"],
  "Email Templates": ["Next Round Invitation", "Empathetic Rejection", "Executive Offer"],
  "HR Compliance Policies": ["POPIA Candidate Data Handling", "GDPR Retention Standard", "Fair Hiring & AI Review"],
};

export function LibraryView() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  return (
    <ViewFrame icon={BookOpen} title="HR Asset Library" description="Controlled templates, guidance, and compliance references for consistent talent operations.">
      <Card className="shadow-sm"><CardContent className="p-5"><div className="relative mb-5"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the HR library" /></div>
        <Tabs defaultValue="Job Descriptions"><TabsList className="h-auto w-full justify-start overflow-x-auto bg-surface-panel">{Object.keys(assets).map((category) => <TabsTrigger key={category} value={category}>{category}</TabsTrigger>)}</TabsList>{Object.entries(assets).map(([category, items]) => <TabsContent key={category} value={category} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.filter((item) => item.toLowerCase().includes(query.toLowerCase())).map((item) => <button key={item} type="button" onClick={() => setSelected(item)} className={cn("rounded-md border p-4 text-left transition-colors hover:bg-surface-panel", selected === item ? "border-primary bg-accent" : "border-border bg-card")}><FileText className="mb-3 size-5 text-primary" /><p className="font-semibold">{item}</p><p className="mt-1 text-xs text-muted-foreground">Updated this quarter · Approved</p></button>)}</TabsContent>)}</Tabs>
      </CardContent></Card>
    </ViewFrame>
  );
}

export function MeetingView() {
  const [consentOpen, setConsentOpen] = useState(false);
  const [provider, setProvider] = useState<"Microsoft Teams" | "Google Meet" | null>(null);
  const [consented, setConsented] = useState(false);
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function requestConnection(next: "Microsoft Teams" | "Google Meet") { setProvider(next); setConsentOpen(true); }
  function startSession() { if (!consented) return; setConsentOpen(false); setLive(true); toast.success(`${provider} meeting copilot connected`); }

  return (
    <ViewFrame icon={Video} title="Live Meeting Copilot" description="Consent-led support for structured interviews across Microsoft Teams and Google Meet." action={<Button variant="outline" onClick={() => { setLoaded(true); setLive(true); setProvider("Microsoft Teams"); }}><Sparkles /> Load Sample Data</Button>}>
      {!live ? <Card className="shadow-sm"><CardHeader><CardTitle className="text-base">Connect your interview room</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Button variant="outline" className="h-20 justify-start" onClick={() => requestConnection("Microsoft Teams")}><Video className="size-5 text-primary" /><span className="text-left"><span className="block font-bold">Microsoft Teams</span><span className="text-xs text-muted-foreground">Connect meeting</span></span></Button><Button variant="outline" className="h-20 justify-start" onClick={() => requestConnection("Google Meet")}><Video className="size-5 text-primary" /><span className="text-left"><span className="block font-bold">Google Meet</span><span className="text-xs text-muted-foreground">Connect meeting</span></span></Button></CardContent></Card> : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]"><Card className="overflow-hidden shadow-sm"><div className="flex min-h-96 items-center justify-center bg-brand-ink p-8 text-primary-foreground"><div className="text-center"><div className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-2xl font-bold">AC</div><p className="mt-4 text-lg font-bold">Alex Chen</p><p className="mt-1 text-sm opacity-75">{provider ?? "Microsoft Teams"} · Interview in progress</p><div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold"><Circle className="size-2 fill-current" /> Live consent confirmed</div></div></div><CardContent className="border-t p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Live transcript signal</p><p className="mt-2 text-sm leading-6">“I reduced API response time by tracing a missing database index, then added a performance budget to our release checks…”</p></CardContent></Card>
          <div className="space-y-4"><Insight title="Suggested question" body="What evidence showed the index was the root cause rather than application caching?" /><Insight title="Tone check" body="Balanced and specific. Allow the candidate space to complete the technical sequence." positive /><Insight title="Objective follow-up" body="Ask which part Alex owned directly and how the improvement was measured after release." />{loaded && <Insight title="Sample signal" body="Mentorship claim detected — request a concrete before-and-after behavior from the mentee." positive />}</div></div>
      )}
      <Dialog open={consentOpen} onOpenChange={setConsentOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-alert-foreground" /> Consent & Transparency Required</DialogTitle><DialogDescription className="leading-6">TalentFlow requires participant confirmation before initiating live transcription and real-time behavioral guidance. Compliant with POPIA/GDPR.</DialogDescription></DialogHeader><label className="flex items-start gap-3 rounded-md bg-alert p-4 text-sm text-alert-foreground"><Checkbox checked={consented} onCheckedChange={(checked) => setConsented(checked === true)} /> I confirm every participant has been informed and has consented to transcription and AI assistance.</label><DialogFooter><Button variant="outline" onClick={() => setConsentOpen(false)}>Cancel</Button><Button disabled={!consented} onClick={startSession}>Confirm & Connect</Button></DialogFooter></DialogContent></Dialog>
    </ViewFrame>
  );
}

function Insight({ title, body, positive = false }: { title: string; body: string; positive?: boolean }) { return <Card className={cn("shadow-sm", positive && "border-primary/30 bg-accent")}><CardContent className="p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">{positive ? <CheckCircle2 className="size-4 text-primary" /> : <Sparkles className="size-4 text-primary" />}{title}</p><p className="mt-2 text-sm leading-6">{body}</p></CardContent></Card>; }

function EmptyPanel({ icon: Icon, title, body }: { icon: typeof CalendarClock; title: string; body: string }) { return <Card className="border-dashed shadow-none"><CardContent className="grid min-h-72 place-items-center p-6 text-center"><div><Icon className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-bold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{body}</p></div></CardContent></Card>; }

function ViewFrame({ icon: Icon, title, description, action, children }: { icon: typeof CalendarClock; title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-3 grid size-10 place-items-center rounded-md bg-accent text-accent-foreground"><Icon className="size-5" /></div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>{children}</section>;
}