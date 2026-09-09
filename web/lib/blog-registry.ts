import type { BlogPost } from "@/lib/blog"

export const postModules: Record<string, () => Promise<{ default: BlogPost }>> = {
  "scheduling-across-google-and-microsoft-teams": () =>
    import("@/content/blog/scheduling-across-google-and-microsoft-teams"),
  "stop-losing-action-items-in-your-inbox": () =>
    import("@/content/blog/stop-losing-action-items-in-your-inbox"),
  "syncing-google-and-microsoft-calendars-programmatically": () =>
    import("@/content/blog/syncing-google-and-microsoft-calendars-programmatically"),
  "building-a-unified-gmail-outlook-inbox": () =>
    import("@/content/blog/building-a-unified-gmail-outlook-inbox"),
  "sync-cursors-and-ai-pipelines": () =>
    import("@/content/blog/sync-cursors-and-ai-pipelines"),
  "bidirectional-calendar-sync-without-losing-edits": () =>
    import("@/content/blog/bidirectional-calendar-sync-without-losing-edits"),
  "resolving-colleagues-by-name-not-email": () =>
    import("@/content/blog/resolving-colleagues-by-name-not-email"),
  "when-findmeetingtimes-returns-empty": () =>
    import("@/content/blog/when-findmeetingtimes-returns-empty"),
  "realtime-mail-without-melting-api-quotas": () =>
    import("@/content/blog/realtime-mail-without-melting-api-quotas"),
  "batch-ai-task-extraction-from-email": () =>
    import("@/content/blog/batch-ai-task-extraction-from-email"),
  "bedrock-agents-calling-your-nextjs-api": () =>
    import("@/content/blog/bedrock-agents-calling-your-nextjs-api"),
  "deduplicating-bedrock-agent-trace-results": () =>
    import("@/content/blog/deduplicating-bedrock-agent-trace-results"),
  "extracting-tasks-from-teams-chat": () =>
    import("@/content/blog/extracting-tasks-from-teams-chat"),
  "llm-meeting-times-without-timezone-bugs": () =>
    import("@/content/blog/llm-meeting-times-without-timezone-bugs"),
  "product-analytics-without-new-tables": () =>
    import("@/content/blog/product-analytics-without-new-tables"),
  "oauth-token-refresh-in-concurrent-saas": () =>
    import("@/content/blog/oauth-token-refresh-in-concurrent-saas"),
  "which-calendar-events-can-move": () =>
    import("@/content/blog/which-calendar-events-can-move"),
  "multi-tool-ai-agent-requests": () =>
    import("@/content/blog/multi-tool-ai-agent-requests"),
  "year-building-mixed-stack-productivity": () =>
    import("@/content/blog/year-building-mixed-stack-productivity"),
}
