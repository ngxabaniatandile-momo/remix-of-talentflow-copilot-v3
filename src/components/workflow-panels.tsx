import { AlertTriangle, Clipboard, FileText, Loader2, Mail, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownView } from "@/components/markdown-view";

export type CandidateStatus = "Offer" | "Rejection" | "Next Stage";
export type MessageTone = "Empathetic" | "Direct" | "Executive";

type ScorecardProps = {
  candidateName: string;
  candidateRole: string;
  interviewNotes: string;
  markdown: string;
  loading: boolean;
  reviewed: boolean;
  onCandidateNameChange: (value: string) => void;
  onCandidateRoleChange: (value: string) => void;
  onInterviewNotesChange: (value: string) => void;
  onGenerate: () => void;
  onReviewChange: (checked: boolean) => void;
  onLoadSample: () => void;
  onCopy: (text: string) => void;
};

export function ScorecardView(props: ScorecardProps) {
  return (
    <WorkflowFrame icon={FileText} title="Interview Scorecard" description="Turn raw panel notes into a structured, evidence-only assessment and action recommendation.">
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-border shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="size-5 text-primary" /> Interview notes input</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><Field id="candidate-name" label="Candidate Name" value={props.candidateName} placeholder="Avery Patel" onChange={props.onCandidateNameChange} /><Field id="candidate-role" label="Role" value={props.candidateRole} placeholder="People Operations Partner" onChange={props.onCandidateRoleChange} /></div>
          <div className="space-y-2"><Label htmlFor="interview-notes">Raw Interview Notes</Label><Textarea id="interview-notes" value={props.interviewNotes} onChange={(event) => props.onInterviewNotesChange(event.target.value)} placeholder="Paste unstructured interviewer notes, observations, and panel feedback." className="min-h-72 resize-none bg-surface-quiet" /></div>
          <div className="flex flex-wrap gap-2"><Button onClick={props.onGenerate} disabled={props.loading}>{props.loading ? <Loader2 className="animate-spin" /> : <FileText />}{props.loading ? "Generating…" : "Generate Scorecard"}</Button><Button variant="secondary" onClick={props.onLoadSample}><Sparkles /> Load Sample Data</Button></div>
        </CardContent></Card>
        <div className="space-y-5"><OutputCard title="Candidate Assessment Scorecard" icon={Clipboard} copyText={props.markdown} onCopy={props.onCopy}><GeneratedOutput markdown={props.markdown} loading={props.loading} emptyState="Add the candidate, role and raw interview notes, then generate an evidence-only assessment." /></OutputCard><Safeguard checked={props.reviewed} onChange={props.onReviewChange} findings="Evaluation language is anchored to observable behavior. Personal identifiers are minimized and unsupported sentiment is removed." /></div>
      </div>
    </WorkflowFrame>
  );
}

type DrafterProps = {
  name: string; role: string; status: CandidateStatus; tone: MessageTone; notes: string; markdown: string; loading: boolean; reviewed: boolean;
  onNameChange: (value: string) => void; onRoleChange: (value: string) => void; onStatusChange: (value: CandidateStatus) => void; onToneChange: (value: MessageTone) => void; onNotesChange: (value: string) => void; onGenerate: () => void; onReviewChange: (checked: boolean) => void; onLoadSample: () => void; onCopy: (text: string) => void;
};

export function DrafterView(props: DrafterProps) {
  return (
    <WorkflowFrame icon={Mail} title="Candidate Drafter" description="Prepare dignified, personalized candidate updates with human review built into the workflow.">
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-border shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Mail className="size-5 text-primary" /> Candidate communication input</CardTitle></CardHeader><CardContent className="space-y-4">
          <Field id="draft-name" label="Candidate Name" value={props.name} placeholder="Avery Patel" onChange={props.onNameChange} /><Field id="draft-role" label="Role Title" value={props.role} placeholder="Senior Frontend Engineer" onChange={props.onRoleChange} />
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Status</Label><Select value={props.status} onValueChange={props.onStatusChange}><SelectTrigger className="bg-surface-quiet"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Offer">Offer</SelectItem><SelectItem value="Rejection">Rejection</SelectItem><SelectItem value="Next Stage">Next Stage</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Tone</Label><Select value={props.tone} onValueChange={props.onToneChange}><SelectTrigger className="bg-surface-quiet"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Empathetic">Empathetic</SelectItem><SelectItem value="Direct">Direct</SelectItem><SelectItem value="Executive">Executive</SelectItem></SelectContent></Select></div></div>
          <div className="space-y-2"><Label htmlFor="candidate-notes">Notes</Label><Textarea id="candidate-notes" value={props.notes} onChange={(event) => props.onNotesChange(event.target.value)} placeholder="Add panel notes, next steps, timing, or feedback to include." className="min-h-56 resize-none bg-surface-quiet" /></div>
          <div className="flex flex-wrap gap-2"><Button onClick={props.onGenerate} disabled={props.loading}>{props.loading ? <Loader2 className="animate-spin" /> : <Mail />}{props.loading ? "Drafting…" : "Draft Communication"}</Button><Button variant="secondary" onClick={props.onLoadSample}><Sparkles /> Load Sample Data</Button></div>
        </CardContent></Card>
        <div className="space-y-5"><OutputCard title="Email Draft" icon={Mail} copyText={props.markdown} onCopy={props.onCopy}><GeneratedOutput markdown={props.markdown} loading={props.loading} emptyState="Add candidate details, status, tone, and notes to create a tailored, bias-screened message." /></OutputCard><Safeguard checked={props.reviewed} onChange={props.onReviewChange} findings="Message avoids demographic assumptions, keeps feedback job-related, and flags final language for human approval." /></div>
      </div>
    </WorkflowFrame>
  );
}

function Field({ id, label, value, placeholder, onChange }: { id: string; label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="bg-surface-quiet" /></div>; }

function WorkflowFrame({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) { return <section><div className="mb-6"><div className="mb-3 grid size-10 place-items-center rounded-md bg-accent text-accent-foreground"><Icon className="size-5" /></div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{children}</section>; }

function OutputCard({ title, icon: Icon, copyText, onCopy, children }: { title: string; icon: LucideIcon; copyText: string; onCopy: (text: string) => void; children: ReactNode }) { return <Card className="border-border shadow-sm"><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-lg"><Icon className="size-5 text-primary" /> {title}</CardTitle><Button variant="outline" size="sm" onClick={() => onCopy(copyText)}><Clipboard /> Copy to Clipboard</Button></CardHeader><CardContent>{children}</CardContent></Card>; }

function GeneratedOutput({ markdown, loading, emptyState }: { markdown: string; loading: boolean; emptyState: string }) { if (loading) return <div className="flex items-center gap-3 rounded-lg bg-surface-panel p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-primary" /> Analyzing with evidence-based guardrails…</div>; if (!markdown) return <p className="rounded-lg border border-dashed border-border bg-surface-quiet p-5 text-sm leading-6 text-muted-foreground">{emptyState}</p>; return <div className="rounded-lg bg-surface-quiet p-5"><MarkdownView markdown={markdown} /></div>; }

function Safeguard({ checked, onChange, findings }: { checked: boolean; onChange: (checked: boolean) => void; findings: string }) { return <Card className="border-alert-border bg-alert shadow-sm"><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div className="flex gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-alert-foreground"><AlertTriangle className="size-5" /></div><div><h3 className="font-bold text-alert-foreground">Ethical Safeguard Card</h3><p className="mt-1 text-sm leading-6 text-alert-foreground">{findings}</p></div></div><Badge className="w-fit gap-1 bg-card text-alert-foreground hover:bg-card"><ShieldCheck className="size-4" /> Bias check passed</Badge></div><Separator className="my-4 bg-alert-border" /><label className="flex cursor-pointer items-start gap-3"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} /><span className="text-sm font-medium leading-6 text-alert-foreground">Mandatory human review completed before use</span></label></CardContent></Card>; }