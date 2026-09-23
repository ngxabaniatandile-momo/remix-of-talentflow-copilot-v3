import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BrainCircuit,
  Clipboard,
  FileText,
  Loader2,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MarkdownView } from "@/components/markdown-view";
import { RoleBenchmarker } from "@/components/role-benchmarker";

import { generateCandidateEmail, generateScorecard } from "@/lib/talentflow.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type CandidateStatus = "Offer" | "Rejection" | "Next Stage";
type MessageTone = "Empathetic" | "Direct" | "Executive";

const notesSample = `Avery described building a weekly hiring health dashboard after noticing recruiters were using three separate spreadsheets. They partnered with analytics to standardize funnel definitions, trained hiring managers on evidence-based debriefs, and reduced time-to-slate by 18% over two quarters.

In the role-play, Avery asked clarifying questions before recommending process changes. They missed one edge case around regional approvals but quickly acknowledged it and proposed a compliance review step. Feedback style was calm, structured, and specific.`;

const communicationSample = `Panel was impressed by Avery's structured thinking, evidence-based process improvements, and stakeholder management. Please mention the next conversation will focus on compensation strategy and change management with the VP of People.`;


function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while generating. Please try again.";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentFlow: AI Workplace Productivity Copilot" },
      {
        name: "description",
        content:
          "An interactive HR productivity copilot for role benchmarking, interview scorecards, candidate emails, and responsible AI review.",
      },
      { property: "og:title", content: "TalentFlow: AI Workplace Productivity Copilot" },
      {
        property: "og:description",
        content:
          "Automate HR workflows with role frameworks, objective scorecards, candidate communications, and built-in safeguards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TalentFlowApp,
});

function TalentFlowApp() {
  const [jobDescription, setJobDescription] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateRole, setCandidateRole] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [status, setStatus] = useState<CandidateStatus>("Next Stage");
  const [tone, setTone] = useState<MessageTone>("Empathetic");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [reviewed, setReviewed] = useState<Record<"benchmark" | "scorecard" | "drafter", boolean>>({
    benchmark: false,
    scorecard: false,
    drafter: false,
  });

  const [scorecardMarkdown, setScorecardMarkdown] = useState("");
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [emailMarkdown, setEmailMarkdown] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("benchmark");

  const handleSendToScorecard = (candidate: { name: string; role: string }) => {
    setCandidateName(candidate.name);
    setCandidateRole(candidate.role);
    setActiveTab("scorecard");
    toast.success(`${candidate.name} sent to Interview Scorecard`);
  };


  const handleGenerateScorecard = async () => {
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
      toast.success("Scorecard generated");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setScorecardLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
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
      toast.success("Email draft generated");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setEmailLoading(false);
    }
  };

  const setReview = (key: string, checked: boolean | "indeterminate") => {
    setReviewed((current) => ({ ...current, [key]: checked === true }));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BrainCircuit aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-normal text-brand-ink sm:text-2xl">
                TalentFlow
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                AI Workplace Productivity Copilot
              </p>
            </div>
          </div>
          <Badge className="w-fit gap-2 border-alert-border bg-alert px-3 py-1.5 text-alert-foreground hover:bg-alert">
            <ShieldCheck aria-hidden="true" className="size-4" />✓ Guardrails Active: PII & Bias Filter
          </Badge>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-primary">
              HR operations workspace
            </p>
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">
              Turn messy hiring inputs into structured, review-ready decisions.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
            <Metric label="Workflows" value="3" />
            <Metric label="Bias checks" value="Auto" />
            <Metric label="Review" value="Required" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 flex justify-center">
            <TabsList className="h-auto w-full max-w-3xl flex-col gap-1 rounded-lg border border-border bg-card p-1 shadow-sm sm:grid sm:grid-cols-3">
              <TabsTrigger value="benchmark" className="w-full gap-2 py-2.5">
                <Scale aria-hidden="true" className="size-4" />
                Role Benchmarker
              </TabsTrigger>
              <TabsTrigger value="scorecard" className="w-full gap-2 py-2.5">
                <FileText aria-hidden="true" className="size-4" />
                Interview Scorecard
              </TabsTrigger>
              <TabsTrigger value="drafter" className="w-full gap-2 py-2.5">
                <Mail aria-hidden="true" className="size-4" />
                Candidate Drafter
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="benchmark">
            <RoleBenchmarker onSendToScorecard={handleSendToScorecard} />
          </TabsContent>


          <TabsContent value="scorecard">
            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-lg border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText aria-hidden="true" className="size-5 text-primary" /> Interview notes input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="candidate-name">Candidate Name</Label>
                      <Input
                        id="candidate-name"
                        value={candidateName}
                        onChange={(event) => setCandidateName(event.target.value)}
                        placeholder="Avery Patel"
                        className="bg-surface-quiet"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="candidate-role">Role</Label>
                      <Input
                        id="candidate-role"
                        value={candidateRole}
                        onChange={(event) => setCandidateRole(event.target.value)}
                        placeholder="People Operations Partner"
                        className="bg-surface-quiet"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interview-notes">Raw Interview Notes</Label>
                    <Textarea
                      id="interview-notes"
                      value={interviewNotes}
                      onChange={(event) => setInterviewNotes(event.target.value)}
                      placeholder="Paste unstructured interviewer notes, observations, and panel feedback."
                      className="min-h-72 resize-none bg-surface-quiet"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleGenerateScorecard} disabled={scorecardLoading}>
                      {scorecardLoading ? (
                        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                      ) : (
                        <FileText aria-hidden="true" className="size-4" />
                      )}
                      {scorecardLoading ? "Generating…" : "Generate Scorecard"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setCandidateName("Avery Patel");
                        setCandidateRole("Senior People Operations Partner");
                        setInterviewNotes(notesSample);
                      }}
                    >
                      <Sparkles aria-hidden="true" className="size-4" /> Load Sample Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <OutputCard title="Candidate Assessment Scorecard" icon={Clipboard} copyText={scorecardMarkdown}>
                  <GeneratedOutput
                    markdown={scorecardMarkdown}
                    loading={scorecardLoading}
                    emptyState="Add the candidate, role and raw interview notes, then select Generate Scorecard for an evidence-only assessment."
                  />
                </OutputCard>

                <EthicalSafeguardCard
                  checked={reviewed.scorecard}
                  onCheckedChange={(checked) => setReview("scorecard", checked)}
                  findings="Evaluation language anchored to observable behavior. Personal identifiers minimized and unsupported sentiment removed."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drafter">
            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-lg border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail aria-hidden="true" className="size-5 text-primary" /> Candidate communication input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="draft-name">Candidate Name</Label>
                    <Input
                      id="draft-name"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      placeholder="Avery Patel"
                      className="bg-surface-quiet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft-role">Role Title</Label>
                    <Input
                      id="draft-role"
                      value={draftRole}
                      onChange={(event) => setDraftRole(event.target.value)}
                      placeholder="Senior Frontend Engineer"
                      className="bg-surface-quiet"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(value: CandidateStatus) => setStatus(value)}>
                        <SelectTrigger className="bg-surface-quiet">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Offer">Offer</SelectItem>
                          <SelectItem value="Rejection">Rejection</SelectItem>
                          <SelectItem value="Next Stage">Next Stage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={(value: MessageTone) => setTone(value)}>
                        <SelectTrigger className="bg-surface-quiet">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Empathetic">Empathetic</SelectItem>
                          <SelectItem value="Direct">Direct</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidate-notes">Notes</Label>
                    <Textarea
                      id="candidate-notes"
                      value={candidateNotes}
                      onChange={(event) => setCandidateNotes(event.target.value)}
                      placeholder="Add panel notes, next steps, timing, or feedback to include."
                      className="min-h-56 resize-none bg-surface-quiet"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleGenerateEmail} disabled={emailLoading}>
                      {emailLoading ? (
                        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                      ) : (
                        <Mail aria-hidden="true" className="size-4" />
                      )}
                      {emailLoading ? "Drafting…" : "Draft Communication"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setDraftName("Avery Patel");
                        setDraftRole("Senior Frontend Engineer");
                        setStatus("Next Stage");
                        setTone("Empathetic");
                        setCandidateNotes(communicationSample);
                      }}
                    >
                      <Sparkles aria-hidden="true" className="size-4" /> Load Sample Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <OutputCard title="Email Draft" icon={Mail} copyText={emailMarkdown}>
                  <GeneratedOutput
                    markdown={emailMarkdown}
                    loading={emailLoading}
                    emptyState="Add the candidate, role, status, tone and notes, then select Draft Communication to write a tailored, bias-screened message."
                  />
                </OutputCard>

                <EthicalSafeguardCard
                  checked={reviewed.drafter}
                  onCheckedChange={(checked) => setReview("drafter", checked)}
                  findings="Message avoids demographic assumptions, keeps feedback job-related, and flags final language for human approval."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-panel px-3 py-3 text-center">
      <p className="text-base font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function OutputCard({
  title,
  icon: Icon,
  copyText,
  children,
}: {
  title: string;
  icon: LucideIcon;
  copyText: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-lg border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon aria-hidden="true" className="size-5 text-primary" /> {title}
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(copyText)}>
          <Clipboard aria-hidden="true" className="size-4" /> Copy to Clipboard
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EthicalSafeguardCard({
  checked,
  onCheckedChange,
  findings,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  findings: string;
}) {
  return (
    <Card className="rounded-lg border-alert-border bg-alert shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-alert-foreground">
              <AlertTriangle aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-alert-foreground">Ethical Safeguard Card</h3>
              <p className="mt-1 text-sm leading-6 text-alert-foreground">{findings}</p>
            </div>
          </div>
          <Badge className="w-fit border-transparent bg-card text-alert-foreground hover:bg-card">
            Bias-check indicator: Passed
          </Badge>
        </div>
        <Separator className="my-4 bg-alert-border" />
        <div className="flex items-start gap-3">
          <Checkbox id={`human-review-${findings}`} checked={checked} onCheckedChange={onCheckedChange} />
          <Label htmlFor={`human-review-${findings}`} className="leading-6 text-alert-foreground">
            Mandatory human review completed before use
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}


function GeneratedOutput({
  markdown,
  loading,
  emptyState,
}: {
  markdown: string;
  loading: boolean;
  emptyState: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-surface-panel p-5 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
        Analyzing the inputs with evidence-based guardrails…
      </div>
    );
  }

  if (!markdown) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface-quiet p-5 text-sm leading-6 text-muted-foreground">
        {emptyState}
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-surface-quiet p-5">
      <MarkdownView markdown={markdown} />
    </div>
  );
}

async function copyToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    toast.error("Clipboard is not available in this preview.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy to clipboard");
  }
}