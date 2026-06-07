import { NextRequest } from "next/server"

export function isInternalAgentAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_AGENT_SECRET
  if (!secret) return false

  const provided = request.headers.get("x-chronoflow-agent-secret")
  return provided === secret
}
