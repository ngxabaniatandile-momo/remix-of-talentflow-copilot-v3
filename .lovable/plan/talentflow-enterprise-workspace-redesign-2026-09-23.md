# TalentFlow Enterprise Workspace Redesign

## Goal
Replace the horizontal workflow tabs with a responsive, collapsible enterprise sidebar while preserving every existing workflow and its entered/generated state. Add interactive collaboration, operations, library, meeting, history, and guest verification experiences using local React state.

## Layout and navigation
- Build a full-height workspace shell with the existing TalentFlow brand, a collapsible desktop sidebar, an icon rail when collapsed, and a slide-over menu on smaller screens.
- Add the `Acme Corp — Talent Operations` workspace selector, grouped navigation, active-item styling, icon tooltips, and accessible keyboard/focus behavior.
- Keep a compact top bar for the current view, guardrail status, guest banner, sidebar toggle, and `Authenticate` action.
- Replace the old segmented tabs with sidebar-controlled panels. Keep workflow panels mounted and visually hidden when inactive so drafts, generated results, benchmark screening, chats, and checklists remain intact while navigating.

## Sidebar structure
- **Workspace Workflows:** Role Benchmarker, Interview Scorecard, Candidate Drafter.
- **AI Collaboration & Chat:** Personal AI Copilot and Hiring Panel Group Chat.
- **Operations & Assets:** Schedules & Deadlines, HR Asset Library, Live Meeting Copilot.
- **History & Recents:** Alex Chen, Morgan Lee, and Jordan Smith evaluations.
- Add a guest usage card in the footer; after verification, replace it with Kelvin’s avatar, name, and Talent Lead badge.

## New interactive views
- **Personal AI Copilot:** recruiter/AI message thread, typed composer, send action, and sample conversation loader.
- **Hiring Panel Group Chat:** panel-member conversation, AI consensus summary, typed composer, and sample loader.
- **Schedules & Deadlines:** reviewable pending emails, upcoming interview rows, and a prioritized checklist whose completion state is interactive; include sample loading/reset.
- **HR Asset Library:** filterable tabs for Job Descriptions, Interview Guides, Email Templates, and HR Compliance Policies with searchable/clickable assets.
- **Live Meeting Copilot:** Teams and Google Meet connection choices, a mandatory POPIA/GDPR consent dialog, and a simulated live session with question suggestions, tone checks, and objective follow-ups; include sample loading.
- Each view will use the existing semantic colors, shadcn controls, Lucide icons, restrained cards, and responsive sizing.

## History restoration
- Make each recent evaluation clickable.
- Selecting one will populate the Interview Scorecard candidate name, role, interview notes, and representative assessment, then open the Scorecard view.
- Existing Role Benchmarker “send to scorecard” behavior will use the same navigation path and updated sidebar terminology.

## Guest verification
- Add a two-step sign-in/sign-up dialog supporting email or cellphone entry.
- “Send AI Verification Code” advances to four accessible OTP boxes and starts a visible 15-minute countdown.
- Any four digits complete the simulated verification, close the dialog, switch the workspace to Kelvin’s verified account state, and show “Account Verified Successfully”.
- This remains an in-memory demo flow only; no real SMS/email is sent and refresh resets verification.

## Technical implementation
- Split the large page into focused workspace-shell and view components while retaining the current AI-backed scorecard/email functions unchanged.
- Lift shared navigation, authentication, scorecard, and history state to the page shell; keep self-contained view state inside panels that remain mounted.
- Reuse the existing Sidebar, Dialog, Input OTP, Avatar, Button, Badge, Tabs, and Tooltip components rather than introducing new dependencies.
- Update copy that refers to “Tab 2” so it reflects sidebar navigation.
- Preserve the existing route and route-specific metadata.

## Verification
- Exercise desktop expanded/collapsed navigation and mobile menu behavior.
- Confirm all sidebar destinations render, existing three workflows still work, and state survives switching views.
- Verify all sample loaders, chat sends, checklist actions, asset filters, consent gate, meeting simulation, history restoration, OTP countdown, any-four-digit verification, success toast, and verified footer state.
- Check for clipped or overlapping content at desktop and mobile widths, plus browser console errors.
