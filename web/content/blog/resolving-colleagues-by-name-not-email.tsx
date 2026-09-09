import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "resolving-colleagues-by-name-not-email",
  title: "Resolving Colleagues by Name, Not Email",
  description:
    "Users say 'email Sarah' — not sarah@company.com. A three-tier directory lookup across Teams, past calendar attendees, and org search, with fuzzy scoring and graceful degradation when admin consent blocks directory APIs.",
  date: "2025-09-15",
  tags: ["microsoft-teams", "email", "scheduling", "engineering", "ux"],
  author: "Kvika Team",
  readTime: "8 min",
  sections: [
    { id: "ux", title: "Why email addresses break the flow" },
    { id: "tiers", title: "Three tiers of lookup" },
    { id: "calendar-contacts", title: "Contacts from past meetings" },
    { id: "scoring", title: "Fuzzy scoring and thresholds" },
    { id: "failures", title: "When resolution fails" },
  ],
  content: () => (
    <article>
      <P>
        Natural language breaks the moment your compose form requires an email address. Users say
        &quot;schedule with Kinshuok&quot; or &quot;email Sarah about the review.&quot; An AI agent
        passes those strings through. If your backend rejects anything without an @ symbol, the agent
        asks the user for an address — and the magic dies.
      </P>
      <P>
        Name resolution has to happen server-side with the user&apos;s OAuth token, not in the model.
        We built a tiered directory in Kvika that resolves names to emails for compose, meeting
        prep, and typeahead pickers — without requiring admin-consented directory scopes on every
        tenant.
      </P>

      <H2 id="ux">Why email addresses break the flow</H2>
      <P>
        OpenAPI schemas that mark the <code>to</code> field as <code>format: email</code> cause
        Bedrock action groups to reject valid name inputs before your code runs. Remove that
        constraint. Validate on the server after resolution.
      </P>
      <P>
        The agent prompt explicitly says: pass raw names; Kvika resolves them. Compose and meeting
        prep share one function — <code>resolveAttendees</code> — so behaviour is consistent across
        email drafts and scheduler cards.
      </P>

      <H2 id="tiers">Three tiers of lookup</H2>
      <P>
        For each attendee string, the resolver runs in order:
      </P>
      <P>
        <strong>1. Pass-through.</strong> If the string matches an email regex, use it directly.
      </P>
      <P>
        <strong>2. Local directory.</strong> Merge colleagues from Microsoft Teams (up to five joined
        teams, members fetched with the user&apos;s token) plus contacts mined from calendar history.
        Score every candidate against the query.
      </P>
      <P>
        <strong>3. Live org search.</strong> If local score is below threshold, query Graph:{" "}
        <code>/users?$search=&quot;displayName:name&quot;</code> with{" "}
        <code>ConsistencyLevel: eventual</code>. If $search is denied, fall back to{" "}
        <code>startswith(displayName, ...)</code> and <code>/me/people</code>.
      </P>
      <Codeblock language="typescript">{`for (const query of attendees) {
  if (isEmail(query)) return { email: query, matched: true }

  const local = bestScore(localDirectory, query)
  if (local.score >= 50) return { email: local.email, matched: true }

  const org = await searchOrgDirectory(accessToken, query)
  if (org) return { email: org.email, matched: true }

  return { email: null, matched: false } // UI must let user fix
}`}</Codeblock>

      <H2 id="calendar-contacts">Contacts from past meetings</H2>
      <P>
        Teams directory APIs fail in tenants without admin consent for{" "}
        <code>User.ReadBasic.All</code>. Calendar read often already exists. We build a secondary
        directory from the last 400 synced calendar events: extract attendee JSON, dedupe by email,
        keep display names.
      </P>
      <P>
        These are people the user has actually met with — high precision for scheduling and compose.
        New hires with no meeting history will not appear here until the first invite; that is when
        org search or manual picker kicks in.
      </P>
      <Callout type="info">
        This needs no extra Graph scopes beyond calendar data you already store. It is the best
        fallback when directory search is blocked.
      </Callout>

      <H2 id="scoring">Fuzzy scoring and thresholds</H2>
      <P>
        Exact string match is not enough. &quot;Sarah&quot; must match &quot;Sarah Chen.&quot; We
        tokenise display names and score:
      </P>
      <P>
        Full string equal → 100. Exact token match → 90. Token prefix → 70. Substring → 50. Email
        local-part match → 95/75. Accept at ≥ 50; below that, return{" "}
        <code>matched: false</code> and show a person picker.
      </P>
      <P>
        Common first names at score 50 can wrong-match. Low confidence must never auto-send email.
        The compose UI uses the same <code>searchPeople</code> typeahead as the meeting scheduler —
        parallel fetch of all three sources, dedupe by email, return top eight by score.
      </P>

      <H2 id="failures">When resolution fails</H2>
      <P>
        <strong>No Microsoft integration.</strong> Teams and org search unavailable; calendar contacts
        may still work from Google-sourced events if attendees were stored on sync.
      </P>
      <P>
        <strong>Expired client secret.</strong> Token refresh fails; directory calls return empty.
        Surface reconnect — not &quot;person not found.&quot;
      </P>
      <P>
        <strong>Agent emits bracket syntax.</strong> Models sometimes pass <code>[aakarsh]</code> as
        an attendee. Strip brackets and quotes before resolution in meeting draft normalisation.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/scheduling-across-google-and-microsoft-teams">mixed-stack scheduling</A>
        {" · "}
        <A href="/blog/when-findmeetingtimes-returns-empty">findMeetingTimes fallback</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
