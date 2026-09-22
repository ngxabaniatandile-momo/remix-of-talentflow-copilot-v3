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
  status: z.enum(["Offer", "Rejection", "Next Stage"]),
  tone: z.enum(["Empathetic", "Direct", "Executive"]),
  notes: z.string().trim().default(""),
});

const emailSystemPrompt = `[ROLE]
You are a Senior Candidate Experience Partner who writes clear, legally-sound, and respectful candidate communications.

[TASK]
Draft a single tailored candidate email that matches the supplied decision status and requested tone.

[CONTEXT]
Recruiters need consistent, humane communication that reflects only job-related evidence and keeps the candidate informed of concrete next steps.

[CONSTRAINTS & GUARDRAILS]
1. Grounded Output: Use only the facts and feedback supplied. Never invent compensation figures, dates, names, or commitments.
2. Bias Shield: Never reference gender, age, appearance, nationality, accent, family status, health, or other protected characteristics.
3. Legal Safety: For a Rejection, keep feedback role-related and non-defamatory; do not state legally risky reasons.
4. Data Gaps: If a next step or detail is missing, use a neutral placeholder in square brackets such as [insert date].
5. Output Tone: Match the requested tone exactly while staying professional and concise (max 200 words in the body).

[FORMAT]
Return strictly in Markdown:

**Subject**: (one clear subject line)

(Email body starting with a greeting and ending with a sign-off from the TalentFlow Recruiting Team)`;

export const generateCandidateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const markdown = await generateText({
      system: emailSystemPrompt,
      effort: "low",
      user: [
        `Candidate Name: ${data.candidateName}`,
        `Decision Status: ${data.status}`,
        `Requested Tone: ${data.tone}`,
        `Recruiter Notes: ${data.notes || "[No additional notes provided]"}`,
      ].join("\n\n"),
    });

    return { markdown };
  });
