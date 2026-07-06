export interface ComparisonRow {
  feature: string
  competitor: string
  kvika: string
}

export interface Alternative {
  slug: string
  tool: string              // "ClickUp"
  toolUrl: string           // competitor site for reference
  tagline: string           // one-line differentiator for H1
  titleTag: string
  metaDescription: string
  intro: string             // paragraph about what the tool does well
  comparison: ComparisonRow[]
  competitorExcels: string[]
  kvikaDifferent: string[]
  whoShouldSwitch: string[]
}

export const alternatives: Alternative[] = [
  {
    slug: "clickup",
    tool: "ClickUp",
    toolUrl: "https://clickup.com",
    tagline: "Calendar-First Alternative for Engineering Teams",
    titleTag: "Kvika vs ClickUp | Calendar-First Alternative for Engineering Teams",
    metaDescription:
      "Compare Kvika and ClickUp. Kvika unifies calendar, email, and tasks across Google and Microsoft with AI task extraction. Built for engineering teams.",
    intro:
      "ClickUp is one of the most feature-complete project management tools available. If you need whiteboards, Gantt charts, sprint planning, OKRs, and a docs system all under one roof, ClickUp has them. It's the choice for teams that want a single place to run complex projects across multiple departments.",
    comparison: [
      { feature: "Setup time", competitor: "Weeks — steep learning curve", kvika: "Minutes via OAuth" },
      { feature: "Pricing (AI included)", competitor: "$7/user/mo + $5–9/user/mo for AI", kvika: "$10/user/mo flat" },
      { feature: "Email inbox", competitor: "No", kvika: "Yes — Gmail + Outlook unified" },
      { feature: "Calendar sync", competitor: "ClickUp tasks only", kvika: "Google Calendar + Outlook" },
      { feature: "AI task extraction", competitor: "From ClickUp docs only", kvika: "From emails + Teams messages" },
      { feature: "Cross-provider scheduling", competitor: "No", kvika: "Google + Microsoft free/busy" },
      { feature: "Team availability", competitor: "Within ClickUp only", kvika: "Cross-provider, anonymous" },
      { feature: "Focus time", competitor: "No", kvika: "Yes — reshuffles when meetings move" },
      { feature: "Productivity analytics", competitor: "Limited", kvika: "Meeting load, focus hours, trends" },
      { feature: "Self-hosted option", competitor: "No", kvika: "Coming" },
    ],
    competitorExcels: [
      "Deep project management — sprints, Gantt charts, OKRs, whiteboards, docs",
      "1000+ integrations across every department and tool category",
      "Highly customizable views: list, board, calendar, table, mind map",
      "Better for non-engineering departments that need structured project tracking",
      "Strong reporting and goal-tracking at the portfolio level",
    ],
    kvikaDifferent: [
      "Kvika syncs your real calendar — Google Calendar and Outlook together, not just tasks you created inside a tool",
      "AI extracts action items from your inbox and Teams messages automatically. You don't have to paste anything into a doc.",
      "Team scheduling works across Google Workspace and Microsoft 365, so finding a slot doesn't require everyone to be on the same calendar system",
      "Setup is OAuth and done — you're not migrating projects or retraining a team",
      "No add-on pricing for AI — it's included at $10/user/month",
    ],
    whoShouldSwitch: [
      "Engineering teams that want one view of their day without migrating everything into a new project management system",
      "Teams split across Google Workspace and Microsoft 365 who need cross-provider scheduling",
      "Teams that want AI task extraction from email and chat without paying extra",
      "Anyone who's tried ClickUp and found the setup overhead wasn't worth it for a 5–15 person engineering team",
    ],
  },
  {
    slug: "lindy",
    tool: "Lindy",
    toolUrl: "https://lindy.ai",
    tagline: "Flat Pricing Alternative for Engineering Teams",
    titleTag: "Kvika vs Lindy.ai | Flat Pricing Alternative for Engineering Teams",
    metaDescription:
      "Compare Kvika and Lindy. No credit system, no surprise bills. Unified workspace for calendar, email, and tasks built for engineering teams.",
    intro:
      "Lindy is a general-purpose AI agent builder aimed at automating business workflows. If you want to build custom no-code automations — lead qualification pipelines, email responders, voice agents for calls — Lindy gives you 100+ integrations and a visual builder to wire them together.",
    comparison: [
      { feature: "Pricing model", competitor: "Credits — $49.99/mo for 5k credits", kvika: "$10/user/mo flat, unlimited" },
      { feature: "Predictable cost", competitor: "No — complex workflows burn credits fast", kvika: "Yes" },
      { feature: "Setup", competitor: "Build agents from scratch", kvika: "Connect OAuth, done" },
      { feature: "Calendar view", competitor: "No persistent dashboard", kvika: "Unified Google + Outlook calendar" },
      { feature: "Email inbox", competitor: "Trigger-based, not persistent", kvika: "Persistent Gmail + Outlook inbox" },
      { feature: "AI task extraction", competitor: "Build your own agent for this", kvika: "Runs automatically" },
      { feature: "Team scheduling", competitor: "No", kvika: "Cross-provider free/busy" },
      { feature: "Productivity analytics", competitor: "No", kvika: "Yes" },
      { feature: "Target audience", competitor: "Sales, HR, support, marketing", kvika: "Engineering teams" },
      { feature: "Self-hosted option", competitor: "No", kvika: "Coming" },
    ],
    competitorExcels: [
      "Flexible enough to automate almost any business workflow if you're willing to build it",
      "Voice agent (Gaia) for automated phone calls — Kvika doesn't have this",
      "100+ templates and integrations across sales, HR, support, and marketing",
      "Good choice if your use case is genuinely bespoke and off-the-shelf tools don't fit",
    ],
    kvikaDifferent: [
      "Kvika is a ready-to-use workspace, not a platform you build on. You don't wire together agents — you connect your accounts and it works.",
      "Flat pricing means no credit math. One workflow in Lindy can burn 275 credits; the Pro plan gives you 5,000 for $49.99/month. With Kvika, heavy usage doesn't cost more.",
      "Persistent dashboard — you open it every morning and see your calendar, inbox, and tasks together. Lindy doesn't have a daily-use interface.",
      "Built specifically for engineering teams. The AI task extraction is tuned for the way engineers actually work — reading Jira mentions in email, extracting action items from Teams threads.",
    ],
    whoShouldSwitch: [
      "Engineering teams that want a working product without building and maintaining agents",
      "Teams frustrated by credit-based pricing and unpredictable monthly bills",
      "Teams that need a persistent daily-use workspace, not one-off workflow runs",
      "Anyone who looked at Lindy and thought 'I shouldn't have to build this from scratch'",
    ],
  },
  {
    slug: "motion",
    tool: "Motion",
    toolUrl: "https://usemotion.com",
    tagline: "Team Scheduling Alternative for Engineering Teams",
    titleTag: "Kvika vs Motion | Team Scheduling Alternative for Engineering Teams",
    metaDescription:
      "Compare Kvika and Motion. Kvika offers cross-provider team scheduling, AI task extraction from email, and productivity analytics for engineering teams.",
    intro:
      "Motion is an AI-powered calendar and task scheduler that automatically fits your tasks into open slots on your calendar. It's well-regarded for individual productivity — if you have a list of tasks with deadlines and want an AI to find time for them without manual calendar management, Motion is good at that.",
    comparison: [
      { feature: "Pricing", competitor: "$34/mo individual, $20/user/mo team", kvika: "$10/user/mo" },
      { feature: "Calendar providers", competitor: "Primarily Google Calendar", kvika: "Google Calendar + Outlook" },
      { feature: "Email inbox", competitor: "No", kvika: "Gmail + Outlook unified" },
      { feature: "AI task extraction", competitor: "No — you add tasks manually", kvika: "Automatic from email + Teams" },
      { feature: "Team scheduling", competitor: "Within Motion, Google-only", kvika: "Cross-provider, Google + Microsoft" },
      { feature: "Anonymous free/busy", competitor: "No", kvika: "Yes — share without exposing details" },
      { feature: "Team analytics", competitor: "No", kvika: "Meeting load, focus hours, completion" },
      { feature: "Focus time reshuffling", competitor: "Yes", kvika: "Yes" },
      { feature: "Microsoft 365 support", competitor: "Limited", kvika: "Full — Calendar, Outlook, Teams" },
      { feature: "Self-hosted option", competitor: "No", kvika: "Coming" },
    ],
    competitorExcels: [
      "Auto-scheduling tasks into your calendar is polished and genuinely useful for individuals",
      "Good AI prioritization — Motion will move tasks around as your day changes",
      "Clean, focused interface without much configuration overhead",
      "Well-suited to solo users or small teams entirely on Google Workspace",
    ],
    kvikaDifferent: [
      "Kvika syncs both Google Calendar and Microsoft Outlook. Motion is built primarily for Google, which is a problem for teams where some people are on Outlook.",
      "Task extraction from email and Teams messages is automatic. You don't manually add tasks — Kvika reads your inbox and surfaces action items.",
      "Team scheduling in Kvika works across providers. Finding a free slot for someone on Google Workspace and someone on Microsoft 365 is something Kvika handles; Motion doesn't.",
      "Kvika includes productivity analytics at the team level. You can see meeting load across the team, not just your own calendar.",
      "Kvika is cheaper at the team tier: $10/user/month vs. Motion's $20/user/month.",
    ],
    whoShouldSwitch: [
      "Teams split across Google Workspace and Microsoft 365 — Motion doesn't handle this well",
      "Engineering managers who need visibility into team meeting load and focus time, not just individual scheduling",
      "Teams that want task extraction from email and chat, not just calendar optimization",
      "Teams where the $20/user/month Motion team price is hard to justify",
    ],
  },
  {
    slug: "reclaim",
    tool: "Reclaim.ai",
    toolUrl: "https://reclaim.ai",
    tagline: "Engineering Team Alternative with Email Integration",
    titleTag: "Kvika vs Reclaim.ai | Engineering Team Alternative with Email Integration",
    metaDescription:
      "Compare Kvika and Reclaim. Kvika adds unified email, AI task extraction, and cross-provider team scheduling to intelligent calendar management.",
    intro:
      "Reclaim is a smart scheduling tool built around habits, focus time, and tasks. It auto-schedules recurring habits (daily exercise, weekly planning) and tasks into your calendar, and it's good at protecting focus blocks by moving flexible events around meetings. It has a loyal following among individual knowledge workers who want their calendar managed automatically.",
    comparison: [
      { feature: "Pricing", competitor: "Free, then $10–15/user/mo", kvika: "$10/user/mo" },
      { feature: "Calendar providers", competitor: "Primarily Google Calendar", kvika: "Google Calendar + Outlook" },
      { feature: "Email inbox", competitor: "No", kvika: "Gmail + Outlook unified" },
      { feature: "AI task extraction from email", competitor: "No", kvika: "Yes — automatic" },
      { feature: "AI task extraction from Teams/Slack", competitor: "No", kvika: "Yes" },
      { feature: "Microsoft 365 support", competitor: "Limited", kvika: "Full" },
      { feature: "Team scheduling (cross-provider)", competitor: "No", kvika: "Yes" },
      { feature: "Focus time management", competitor: "Yes — core feature", kvika: "Yes — reshuffles automatically" },
      { feature: "Habit tracking", competitor: "Yes", kvika: "Not currently" },
      { feature: "Team analytics", competitor: "No", kvika: "Yes" },
      { feature: "Self-hosted option", competitor: "No", kvika: "Coming" },
    ],
    competitorExcels: [
      "Habit scheduling is Reclaim's strongest differentiator — blocking recurring time for daily habits",
      "Task auto-scheduling is mature and configurable with priority and deadline awareness",
      "Scheduling links (like Calendly) for external booking are built in",
      "Free tier is genuinely useful for individuals on Google Workspace",
    ],
    kvikaDifferent: [
      "Kvika includes a unified email inbox — Gmail and Outlook side by side. Reclaim doesn't touch email.",
      "AI task extraction runs automatically from your inbox and Teams messages. You don't have to manually create tasks in Kvika for things you were already emailed about.",
      "Full Microsoft 365 support: Calendar, Outlook, Teams. Reclaim's Microsoft support is limited and primarily focused on Google.",
      "Team scheduling across providers — find a time that works for people on both Google and Microsoft, with anonymous free/busy so no one exposes their full calendar.",
      "Team-level analytics: meeting load across the team, not just your own productivity.",
    ],
    whoShouldSwitch: [
      "Teams that need email integration alongside calendar management",
      "Teams on Microsoft 365 or mixed Google/Microsoft environments where Reclaim's Google focus is a problem",
      "Engineering managers who want team-level visibility — meeting load, focus time, and task completion across the team",
      "Teams where action items primarily come in via email and chat rather than manually created tasks",
    ],
  },
  {
    slug: "clockwise",
    tool: "Clockwise",
    toolUrl: "https://getclockwise.com",
    tagline: "Unified Workspace Alternative for Engineering Teams",
    titleTag: "Kvika vs Clockwise | Unified Workspace Alternative for Engineering Teams",
    metaDescription:
      "Compare Kvika and Clockwise. Kvika combines calendar optimization with unified email, AI task extraction, and team productivity analytics.",
    intro:
      "Clockwise is an AI calendar optimization tool that analyzes team calendars and moves flexible meetings to create longer blocks of uninterrupted focus time. It's particularly good at coordinating across a team — if everyone is on Clockwise, it can find optimal times for meetings that cause the least interruption across the group. It was acquired by Atlassian in 2024.",
    comparison: [
      { feature: "Pricing", competitor: "Free, Teams $6.75/user/mo", kvika: "$10/user/mo" },
      { feature: "Calendar providers", competitor: "Google Calendar (primarily)", kvika: "Google Calendar + Outlook" },
      { feature: "Email inbox", competitor: "No", kvika: "Gmail + Outlook unified" },
      { feature: "Task management", competitor: "No", kvika: "Yes — with AI extraction" },
      { feature: "AI task extraction", competitor: "No", kvika: "Yes — from email + Teams messages" },
      { feature: "Focus time management", competitor: "Yes — core feature", kvika: "Yes — reshuffles automatically" },
      { feature: "Cross-provider scheduling", competitor: "Google only", kvika: "Google + Microsoft" },
      { feature: "Team analytics", competitor: "Basic", kvika: "Meeting load, focus hours, completion" },
      { feature: "Microsoft 365 support", competitor: "Limited", kvika: "Full" },
      { feature: "Independent / self-hosted", competitor: "No — Atlassian-owned", kvika: "Independent, self-hosted coming" },
    ],
    competitorExcels: [
      "Focus time creation is Clockwise's core strength — it's genuinely good at protecting deep work blocks across a team",
      "Meeting optimization across a whole team, not just individual schedules",
      "Cheaper at the team tier for teams that only need calendar optimization",
      "Deep Google Calendar integration with strong signal about meeting flexibility",
    ],
    kvikaDifferent: [
      "Kvika is a full workspace — calendar, email, tasks, and team chat together. Clockwise only manages your calendar.",
      "Full Microsoft 365 support alongside Google. Clockwise is built around Google Calendar; Microsoft is an afterthought.",
      "AI task extraction from email and Teams messages. Clockwise doesn't read your inbox.",
      "Cross-provider team scheduling — find times that work for people on both Google Workspace and Microsoft 365.",
      "Kvika is independent. Clockwise was acquired by Atlassian in 2024; its future roadmap is uncertain.",
    ],
    whoShouldSwitch: [
      "Teams that need more than calendar optimization — email, tasks, and team scheduling in one place",
      "Teams on Microsoft 365 or mixed environments where Clockwise's Google focus is limiting",
      "Teams that want AI task extraction from email and chat alongside calendar management",
      "Anyone concerned about Clockwise's direction after the Atlassian acquisition",
    ],
  },
]

export function getAlternative(slug: string): Alternative | null {
  return alternatives.find((a) => a.slug === slug) ?? null
}

export function getAllAlternativeSlugs(): string[] {
  return alternatives.map((a) => a.slug)
}
