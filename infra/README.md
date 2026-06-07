# ChronoFlow Infrastructure

CDK stack for the ChronoFlow Bedrock Agent and tool Lambdas.

## Resources

- `GmailActionsLambda` — `compose_new_email` and `reply_to_email`
- `JiraActionsLambda` — `create_jira_ticket` draft preparation
- Bedrock Agent execution role
- Bedrock Agent named `chronoflow-agent`
- Action groups:
  - `gmail` — compose + reply (draft only)
  - `jira` — Jira ticket draft preparation
- Bedrock Agent alias
- Lambda invoke permissions for Bedrock

## Deploy

The stack needs the public ChronoFlow URL that Lambda can call and the same internal secret used by the web app.

For local ngrok testing:

```bash
cd infra
npm install
npx cdk bootstrap
npx cdk deploy \
  --parameters ChronoFlowInternalBaseUrl=https://your-ngrok-url.ngrok-free.app \
  --parameters InternalAgentSecret="$INTERNAL_AGENT_SECRET"
```

For production, use the deployed ChronoFlow app URL instead of ngrok.

After deploy, copy the stack outputs into `web/.env` or your hosting environment:

```bash
BEDROCK_AGENT_ID=<BedrockAgentId output>
BEDROCK_AGENT_ALIAS_ID=<BedrockAgentAliasId output>
BEDROCK_MODEL_ID=<BedrockModelId output>
NEXT_PUBLIC_USE_BEDROCK_AGENT=true
INTERNAL_AGENT_SECRET=<same secret used in CDK deploy>
```

## Architecture

One Bedrock Agent orchestrates all chat tools. Each action group maps to one Lambda:

- `gmail` → `gmail-actions.mjs`
- `jira` → `jira-actions.mjs`

Lambdas call secret-protected internal APIs in the web app:

- `/api/internal/ai/compose-email`
- `/api/internal/ai/reply-email`
- `/api/internal/ai/prepare-jira-ticket`

The web app invokes the agent through `/api/ai/agent` when `NEXT_PUBLIC_USE_BEDROCK_AGENT=true`.
