import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Benchmark = {
  technical: string[];
  behavioral: string[];
  questions: string[];
};

type Applicant = {
  name: string;
  role: string;
  score: number;
  verdict: string;
  tier: "high" | "mid" | "low";
  snippet: string;
  matched: number;
};

const sampleJob = {
  title: "Senior Full-Stack Engineer",
  department: "Engineering | 3-5 Years",
  description: `We are hiring a Senior Full-Stack Engineer to own customer-facing services end to end.

Key requirements:
- Design and ship well-documented RESTful APIs used by web and mobile clients
- Strong PostgreSQL skills including query tuning, indexing strategy and migrations
- Own system architecture decisions for scalability, caching and reliability
- Comfortable operating services on AWS with Docker-based deployments
- Partner cross-functionally with product, design and data teams
- Mentor mid-level engineers and raise code review quality
- Evidence-based problem solving with clear written trade-off analysis`,
};

const benchmarkResult: Benchmark = {
  technical: ["RESTful APIs", "PostgreSQL / Indexing", "System Architecture", "AWS / Docker"],
  behavioral: [
    "Cross-functional Collaboration",
    "Mentorship",
    "Evidence-based Problem Solving",
    "Ownership Under Ambiguity",
  ],
  questions: [
    "Walk me through an API you designed that had to scale. What indexing or caching decisions did you make, and what data told you they worked?",
    "Describe a time you mentored an engineer through a difficult architecture change. How did you measure their growth?",
    "Tell me about a production incident on AWS or Docker you diagnosed. What evidence led you to the root cause, and what did you change afterwards?",
  ],
};

const applicants: Applicant[] = [
  {
    name: "Alex Chen",
    role: "Senior Full-Stack Engineer",
    score: 94,
    verdict: "94% Match — Highly Recommended for Interview",
    tier: "high",
    snippet:
      "Applied via email with 4 years API design and caching experience in production...",
    matched: 4,
  },
  {
    name: "Morgan Lee",
    role: "Senior Full-Stack Engineer",
    score: 72,
    verdict: "72% Match — Borderline / Review Required",
    tier: "mid",
    snippet: "Front-end heavy resume with React and Tailwind; limited backend DB exposure.",
    matched: 2,
  },
  {
    name: "Jordan Smith",
    role: "Senior Full-Stack Engineer",
    score: 38,
    verdict: "38% Match — Low Alignment",
    tier: "low",
    snippet:
      "Sales and account management background; lacks required software engineering stack.",
    matched: 0,
  },
];

const ingestSteps = [
  "Reading email resumes...",
  "Applying PII shield...",
  "Comparing against benchmark...",
];

const tierStyles: Record<Applicant["tier"], string> = {
  high: "border-transparent bg-success text-success-foreground hover:bg-success",
  mid: "border-alert-border bg-alert text-alert-foreground hover:bg-alert",
  low: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive",
};

async function copyToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    toast.error("Clipboard is not available in this preview.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Benchmark copied to clipboard");
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

function benchmarkToText(title: string, department: string, benchmark: Benchmark) {
  return [
    `Competency Benchmark — ${title || "Target role"}`,
    department ? `Department / Seniority: ${department}` : "",
    "",
    "Core Technical Competencies:",
    ...benchmark.technical.map((item) => `- ${item}`),
    "",
    "Behavioral & Operational Competencies:",
    ...benchmark.behavioral.map((item) => `- ${item}`),
    "",
    "Structured Interview Guide:",
    ...benchmark.questions.map((question, index) => `${index + 1}. ${question}`),
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function RoleBenchmarker({
  onSendToScorecard,
  seedTitle = "",
  seedDescription = "",
  seedNonce = 0,
}: {
  onSendToScorecard: (candidate: { name: string; role: string }) => void;
  seedTitle?: string;
  seedDescription?: string;
  seedNonce?: number;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);

  const [ingesting, setIngesting] = useState(false);
  const [ingestStep, setIngestStep] = useState(0);
  const [screened, setScreened] = useState<Applicant[]>([]);

  // A library job description opened in this workspace pre-populates the intake form.
  useEffect(() => {
    if (!seedNonce) return;
    if (seedTitle) setJobTitle(seedTitle);
    if (seedDescription) setDescription(seedDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedNonce]);

  const loadSample = () => {
    setJobTitle(sampleJob.title);
    setDepartment(sampleJob.department);
    setDescription(sampleJob.description);
    toast.success("Sample job description loaded");
  };

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setBenchmark(benchmarkResult);
      setAnalyzing(false);
      toast.success("Role benchmark ready — Stage 2 unlocked");
    }, 1000);
  };

  const ingest = () => {
    setIngesting(true);
    setScreened([]);
    setIngestStep(0);
    const timers = [
      setTimeout(() => setIngestStep(1), 600),
      setTimeout(() => setIngestStep(2), 1200),
      setTimeout(() => {
        setScreened(applicants);
        setIngesting(false);
        toast.success("3 applications screened against the benchmark");
      }, 1900),
    ];
    return () => timers.forEach(clearTimeout);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale aria-hidden="true" className="size-5 text-primary" /> Stage 1 — Benchmark input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-job-title">Target Job Title</Label>
              <Input
                id="target-job-title"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Senior Full-Stack Engineer"
                className="bg-surface-quiet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-seniority">Department / Seniority</Label>
              <Input
                id="department-seniority"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="Engineering | 3-5 Years"
                className="bg-surface-quiet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description / Key Requirements</Label>
              <Textarea
                id="job-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Paste the job description and key requirements."
                className="min-h-60 resize-none bg-surface-quiet"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={analyze}
                disabled={analyzing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {analyzing ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Sparkles aria-hidden="true" className="size-4" />
                )}
                {analyzing ? "Benchmarking…" : "🚀 Analyze & Benchmark Role"}
              </Button>
              <Button type="button" variant="secondary" onClick={loadSample}>
                <RefreshCw aria-hidden="true" className="size-4" /> ⚡ Load Sample Job Description
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 aria-hidden="true" className="size-5 text-primary" /> Benchmark results
            </CardTitle>
            {benchmark ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(benchmarkToText(jobTitle, department, benchmark))}
              >
                <Copy aria-hidden="true" className="size-4" /> Copy Benchmark
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {analyzing ? (
              <div className="flex items-center gap-3 rounded-lg bg-surface-panel p-5 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
                Extracting competencies from the job description…
              </div>
            ) : null}

            {!analyzing && !benchmark ? (
              <p className="rounded-lg border border-dashed border-border bg-surface-quiet p-5 text-sm leading-6 text-muted-foreground">
                Add a target role and job description, then select “Analyze &amp; Benchmark Role” to
                extract the competency framework and unlock inbox screening.
              </p>
            ) : null}

            {!analyzing && benchmark ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-surface-quiet p-4">
                    <h3 className="mb-3 text-sm font-bold text-foreground">
                      Core Technical Competencies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {benchmark.technical.map((item) => (
                        <Badge
                          key={item}
                          className="border-transparent bg-success text-success-foreground hover:bg-success"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-quiet p-4">
                    <h3 className="mb-3 text-sm font-bold text-foreground">
                      Behavioral &amp; Operational Competencies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {benchmark.behavioral.map((item) => (
                        <Badge key={item} variant="outline" className="border-border text-muted-foreground">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold text-foreground">Structured Interview Guide</h3>
                  <ol className="space-y-3">
                    {benchmark.questions.map((question, index) => (
                      <li
                        key={question}
                        className="flex gap-3 rounded-lg bg-surface-panel p-4 text-sm leading-6 text-muted-foreground"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail aria-hidden="true" className="size-5 text-primary" /> Connected Recruitment Inbox
            </CardTitle>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              careers@talentflow-enterprise.internal
            </p>
          </div>
          <Badge className="w-fit gap-2 border-transparent bg-success text-success-foreground hover:bg-success">
            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-primary" />● Live
            Sync: 3 Inbound Applications Detected
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {!benchmark ? (
            <p className="rounded-lg border border-dashed border-border bg-surface-quiet p-5 text-sm leading-6 text-muted-foreground">
              Stage 2 unlocks once a role benchmark is generated above.
            </p>
          ) : (
            <Button type="button" onClick={ingest} disabled={ingesting}>
              {ingesting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Mail aria-hidden="true" className="size-4" />
              )}
              {ingesting ? "Screening…" : "📥 Ingest & Screen Applications Against Benchmark"}
            </Button>
          )}

          {ingesting ? (
            <div className="rounded-lg bg-surface-panel p-5">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {ingestSteps[ingestStep]}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(ingestStep + 1) * 33}%` }}
                />
              </div>
            </div>
          ) : null}

          {screened.length > 0 ? (
            <div className="space-y-4">
              {screened.map((applicant, index) => (
                <div
                  key={applicant.name}
                  className="rounded-lg border border-border bg-surface-quiet p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                        Rank {index + 1}
                      </p>
                      <h3 className="text-base font-extrabold text-foreground">{applicant.name}</h3>
                    </div>
                    <Badge className={`w-fit ${tierStyles[applicant.tier]}`}>{applicant.verdict}</Badge>
                  </div>
                  <p className="mt-3 rounded-md bg-card p-3 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">Ingested email snippet: </span>
                    {applicant.snippet}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Matched Skills: {applicant.matched}/4 Core Technical Competencies met.
                    </p>
                    {applicant.tier === "high" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          onSendToScorecard({ name: applicant.name, role: applicant.role })
                        }
                      >
                        Open in Interview Scorecard
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex gap-3 rounded-lg border border-alert-border bg-alert p-4">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-alert-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <p className="text-sm leading-6 text-alert-foreground">
              ✓ POPIA &amp; GDPR Email Ingestion Guard: All candidate personal phone numbers, physical
              addresses, and demographic attributes are automatically scrubbed before semantic
              matching.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-alert-border bg-alert shadow-sm">
        <CardContent className="flex gap-3 p-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-alert-foreground">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-alert-foreground">Ethical Safeguard</h3>
            <p className="mt-1 text-sm leading-6 text-alert-foreground">
              Match scores are decision support only. A human reviewer must confirm every advance or
              decline before candidates are contacted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
