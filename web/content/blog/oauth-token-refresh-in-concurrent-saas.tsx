import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "oauth-token-refresh-in-concurrent-saas",
  title: "OAuth Token Refresh in a Concurrent SaaS",
  description:
    "Multiple tabs, webhooks, cron, and user clicks hitting the same expired Microsoft or Google token — proactive refresh, fire-and-forget listeners, and reconnect UX when invalid_grant wins.",
  date: "2026-06-15",
  tags: ["oauth", "security", "engineering", "google", "microsoft-outlook"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "symptom", title: "Silent empty mail" },
    { id: "proactive", title: "Proactive refresh" },
    { id: "races", title: "Concurrent refresh races" },
    { id: "listeners", title: "Google token listeners" },
    { id: "ux", title: "needsReauth, not generic 401" },
  ],
  content: () => (
    <article>
      <P>
        Integration broke is the worst class of bug. Mail looks empty. Calendar freezes. No modal
        explains why. Logs show <code>invalid_grant</code> or expired access token from three hours
        ago. The user blames your product; the provider revoked or rotated credentials quietly.
      </P>
      <P>
        OAuth refresh in a SaaS with webhooks, polling, background extraction, and multi-tab users
        is not a single code path — it is a concurrency problem dressed as auth. This is how we
        handle it today and where it still hurts.
      </P>

      <H2 id="symptom">Silent empty mail</H2>
      <P>
        Microsoft access tokens expire in about an hour without refresh. Google clients can refresh
        mid-request via library callbacks. If refresh fails and you return an empty list instead of an
        error state, users think they have no mail — not that they need to reconnect.
      </P>

      <H2 id="proactive">Proactive refresh</H2>
      <P>
        Before Graph or Gmail API calls, check <code>integration.expiresAt</code>. If now ≥ expiry,
        refresh synchronously in that request path, update the Integration row, proceed with the new
        access token.
      </P>
      <P>
        Reactive-only refresh (wait for 401) feels fine until two requests hit the same expired token
        simultaneously — both refresh, both write, last write wins, refresh token rotation can
        invalidate the sibling session.
      </P>
      <Callout type="tip">
        Ideal: single-flight refresh per user+provider with a short distributed lock. Minimum viable:
        one canonical refresh path that others await or re-read from DB after.
      </Callout>

      <H2 id="races">Concurrent refresh races</H2>
      <P>
        Tab A and tab B both load the inbox. Both see expiry. Both POST to Microsoft token endpoint.
        Both update <code>Integration</code>. Intermittent auth failures follow — especially when
        Microsoft rotates refresh tokens on each use.
      </P>
      <P>
        We have not shipped full single-flight everywhere yet. Documenting the race helped support
        recognise the pattern: works after reload, fails again under parallel load.
      </P>

      <H2 id="listeners">Google token listeners</H2>
      <Codeblock language="typescript">{`oauth2Client.on('tokens', (tokens) => {
  void (async () => {
    try {
      if (tokens.access_token || tokens.refresh_token)
        await prisma.integration.update({ ... })
    } catch (e) {
      console.error('Failed to persist refreshed Gmail tokens', e)
    }
  })()
})`}</Codeblock>
      <P>
        Google&apos;s client emits tokens mid-flight. Fire-and-forget persistence is convenient;
        silent failure means memory has fresh tokens while DB has stale ones. Log persistence errors
        loudly — do not swallow.
      </P>

      <H2 id="ux">needsReauth, not generic 401</H2>
      <P>
        Map refresh failure to <code>{'{ needsReauth: true }'}</code> in JSON responses. UI shows
        reconnect on the integration card. Generic 401 sends users in circles through settings.
      </P>
      <P>
        Watch for env var inconsistency — some routes use <code>MICROSOFT_CLIENT_ID</code>, others{" "}
        <code>AZURE_AD_CLIENT_ID</code>. Refresh works in mail but fails in directory lookup; debugging
        that without a scope matrix wastes days.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/building-a-unified-gmail-outlook-inbox">unified inbox</A>
        {" · "}
        <A href="/blog/syncing-google-and-microsoft-calendars-programmatically">calendar OAuth</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
