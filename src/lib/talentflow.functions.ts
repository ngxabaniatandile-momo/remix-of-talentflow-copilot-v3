import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateText } from "./ai-gateway.server";

const ScorecardInput = z.object({
  candidateName: z.string().trim().min(1, "Candidate name is required"),
  roleTitle: z.string().trim().min(1, "Role is required"),
  rawNotes: z.string().trim().min(20, "Add interview notes before generating a scorecard"),
});

const scorecardSystemPrompt = `[ROLE]
You are an objective Talent Acquisition Specialist trained strictly in evidence-based candidate assessment and structured interviewing.

[TASK]
Synthesize the provided unstructured interview notes into a standardized, unbiased candidate evaluation scorecard.

[CONTEXT]
Hiring managers often write rushed, fragmented notes during interviews. Your goal is to separate facts from subjective assumptions, mitigate unconscious bias, and highlight actionable hiring recommendations.

[CONSTRAINTS & GUARDRAILS]
1. Grounded Output: Rate competencies strictly using direct evidence present in the raw notes. Do not hallucinate or assume technical expertise not stated.
2. Bias Shield: Completely disregard any references to gender, age, personal appearance, background, or accent.
3. Data Gaps: If the interviewer did not collect evidence for a category, explicitly state "[Insufficient Evidence in Notes]" instead of inventing a score.
4. Output Tone: Professional, analytical, and executive-ready.

[FORMAT]
Provide the response strictly in Markdown with the following layout:

### Candidate Assessment: {{candidate_name}}
**Position Target**: {{role_title}}

**Executive Summary**: (Max 3 concise sentences assessing role fit based on notes)

| Competency Area | Observed Evidence / Quote | Assessment (1-5) |
| :--- | :--- | :--- |
| Technical Competence | [Direct observation from notes] | [1-5] |
| Problem Solving & Logic | [Direct observation from notes] | [1-5] |
| Team Collaboration & Fit | [Direct observation from notes] | [1-5] |

- **Primary Strengths**: (Up to 3 evidence-backed bullet points)
- **Growth Areas / Gaps**: (Up to 2 evidence-backed bullet points)
- **Hiring Recommendation**: [Advance to Final Stage / Hold / Do Not Proceed]`;

export const generateScorecard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScorecardInput.parse(input))
  .handler(async ({ data }) => {
    const markdown = await generateText({
      system: scorecardSystemPrompt,
      user: [
        `Candidate Name: ${data.candidateName}`,
        `Role Applied: ${data.roleTitle}`,
        `Raw Notes: ${data.rawNotes}`,
      ].join("\n\n"),
    });

    return { markdown };
  });

const EmailInput = z.object({
  candidateName: z.string().trim().min(1, "Candidate name is required"),
  roleTitle: z.string().trim().min(1, "Role title is required"),
  status: z.enum(["Offer", "Rejection", "Next Stage"]),
  tone: z.enum(["Empathetic", "Direct", "Executive"]),
  notes: z.string().trim().default(""),
});

const emailStatusLabels: Record<string, string> = {
  Offer: "Offer",
  Rejection: "Empathetic Rejection",
  "Next Stage": "Next Round Invitation",
};

const emailSystemPrompt = `[ROLE]
You are an Executive Talent Communications Director specialized in high-empathy candidate engagement and employment brand management.

[TASK]
Draft a personalized, professional candidate update email based on the interview stage and outcome.

[CONTEXT]
Delivering hiring outcomes requires precision: rejections must preserve candidate dignity and brand reputation, while offers must be clear and motivating. The candidate details, decision status, tone preference, and key feedback are provided in the user message.

[CONSTRAINTS & GUARDRAILS]
1. Rejection Standards: Never use cold, dismissive clichés (e.g., "we received many qualified applicants"). Include genuine appreciation for their preparation and reference one specific positive trait from the feedback notes.
2. Offer Standards: Place all sensitive variables (salary, start date, benefits) inside bracketed placeholders (e.g., "[Annual Base: $X]", "[Start Date: Date]").
3. Compliance: Do not include language that touches on protected demographic characteristics or opens legal liability.
4. Word Count: Keep the email body between 150 and 220 words.
5. Tone: Match the requested tone preference exactly (Empathetic, Direct, or Executive).

[FORMAT]
Return strictly in Markdown:

**Subject**: [Clear, personalized subject line with candidate name and role]

[Email Body]

[Professional Sign-off and Signature Placeholder]`;

export const generateCandidateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const markdown = await generateText({
      system: emailSystemPrompt,
      effort: "low",
      user: [
        `Candidate Name: ${data.candidateName}`,
        `Role Title: ${data.roleTitle}`,
        `Decision Status: ${emailStatusLabels[data.status] ?? data.status} (Options: Offer / Empathetic Rejection / Next Round Invitation)`,
        `Tone Preference: ${data.tone} (Options: Empathetic, Direct, Executive)`,
        `Key Feedback Provided: ${data.notes || "[No feedback notes provided]"}`,
      ].join("\n\n"),
    });

    return { markdown };
  });

const CopilotInput = z.object({
  question: z.string().trim().min(1, "Ask a question first"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .default([]),
  workspaceName: z.string().trim().default("this workspace"),
  workspaceContext: z.string().trim().default(""),
});

const copilotSystemPrompt = `[ROLE]
You are TalentFlow Copilot, a hybrid assistant inside an enterprise talent operations workspace.

[BEHAVIOUR]
1. General knowledge, science, maths, philosophy, definitions or casual conversation: answer accurately, directly and conversationally. Never force these into an HR or interview template.
2. Greetings and small talk: reply naturally and briefly. Never echo the user's words back.
3. HR, recruitment, role rubric, interview design, candidate evaluation or hiring policy questions: answer with structured, evidence-grounded guidance (short headings or bullets).
4. Questions about the workspace's own candidates, scorecards, drafts or past sessions: answer strictly from the WORKSPACE CONTEXT block supplied in the user message. If the context does not contain the answer, say clearly that the workspace has no record of it. Never invent candidate data, scores or outcomes.
5. Never reference gender, age, appearance, accent or other protected characteristics when assessing people.

[STYLE]
Concise Markdown. No preamble about being an AI. Keep answers under 250 words unless the user asks for more detail.`;

export const askCopilot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CopilotInput.parse(input))
  .handler(async ({ data }) => {
    const transcript = (data.history || [])
      .map((entry) => `${entry.role === "user" ? "User" : "Copilot"}: ${entry.content}`)
      .join("\n");

    const answer = await generateText({
      system: copilotSystemPrompt,
      effort: "low",
      user: [
        `WORKSPACE: ${data.workspaceName}`,
        `WORKSPACE CONTEXT (candidates, scorecards, drafts and recent sessions saved in this workspace):\n${
          data.workspaceContext || "[No saved workspace records yet]"
        }`,
        transcript ? `CONVERSATION SO FAR:\n${transcript}` : "",
        `USER MESSAGE: ${data.question}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    return { answer };
  });
