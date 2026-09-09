import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "building-for-mixed-google-microsoft-teams",
  title: "Building for Mixed Google and Microsoft Teams",
  description: "Product architecture when you cannot pick one stack — dual integrations as default, not edge case.",
  date: "2026-08-11",
  tags: ["product","engineering","google-calendar","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "default",
      "title": "Mixed is default"
    },
    {
      "id": "test",
      "title": "Test matrix"
    }
  ],
  content: () => (
    <article>
      <P>Product architecture when you cannot pick one stack — dual integrations as default, not edge case.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="default">Mixed is default</H2>
      <P>Post-acquisition, agency + client, personal + work — dual connect is normal path.</P>
      <P>Single-provider mode is optimisation, not assumption.</P>

      <H2 id="test">Test matrix</H2>
      <P>QA four combos: G only, M only, both, neither. Feature flags per integration presence.</P>
      <P>Scheduling defaults from availableProviders object.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/security-of-server-side-oauth-tokens">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
