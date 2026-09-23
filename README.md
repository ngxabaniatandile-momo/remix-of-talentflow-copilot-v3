# Remix of TalentFlow Copilot V3

[ROLE]

You are a Senior Full-Stack React Engineer specializing in clean enterprise SaaS dashboards, accessible UI/UX, and Tailwind CSS.

[TASK]

Build a complete, responsive, single-page web application called "TalentFlow: AI Workplace Productivity Copilot".

[CONTEXT]

TalentFlow automates HR operational bottlenecks across three key workflows: benchmarking roles, converting messy notes into objective scorecards, and generating tailored candidate communications[cite: 1]. The app is being evaluated on practical functionality, clean UI, and built-in responsible AI safeguards[cite: 1].

[CONSTRAINTS & GUARDRAILS]

1. Theme & Styling: Modern enterprise palette using Tailwind CSS. Canvas: slate-50; cards: pure white with border-slate-200; primary text: slate-900; primary accent: emerald-600 (signaling objectivity/approval); alert badges: amber-50/amber-700. Typography: Inter or Plus Jakarta Sans.

2. Structure: 

   - Sticky top bar with app title, subtitle, and an active badge: "✓ Guardrails Active: PII & Bias Filter".

   - Centered 3-tab segmented navigation: (Tab 1) Role Bench marker, (Tab 2) Interview Scorecard, (Tab 3) Candidate Drafter[cite: 1].

3. Tab 1 Features: Text input for Job Description -> Outputs a Competency Framework and 3 Behavioral Questions[cite: 1].

4. Tab 2 Features: Inputs for Candidate Name, Role, and large Textarea for "Raw Interview Notes" -> Outputs an Executive Summary, Evidence Matrix Table, and Action Recommendation[cite: 1].

5. Tab 3 Features: Inputs for Candidate Name, Status dropdown (Offer, Rejection, Next Stage), Tone dropdown (Empathetic, Direct, Executive), and Notes -> Outputs an email draft with subject line[cite: 1].

6. Usability Requirements: 

   - Every tab must include a "Load Sample Data" button that auto-populates realistic text for live demos.

   - Every output card must feature a "Copy to Clipboard" button with a toast notification.

   - Include an "Ethical Safeguard Card" below outputs with an automated bias-check indicator and a mandatory human review checkbox[cite: 1].

[FORMAT]

Deploy directly as an interactive React SPA utilizing Lucide React icons, accessible shadcn/ui components, and clean component-level state management.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/984d18d3-cbd4-4b76-9c57-d961caff5cd9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
