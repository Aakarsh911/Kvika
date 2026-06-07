# ChronoFlow Infrastructure

CDK stack for the Bedrock Agent compose-email path.

## Resources

- Lambda for the Bedrock `compose_new_email` action
- Lambda execution role and CloudWatch Logs permissions
- Bedrock Agent execution role
- Bedrock Agent named `chronoflow-agent`
- `compose_email` action group as the first tool action
- Bedrock Agent alias
- Lambda invoke permission for Bedrock

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
```

## Existing Spike Resources

The earlier manually-created resources can keep running while this CDK stack is deployed. This stack intentionally lets CDK generate Lambda/IAM physical names and uses `chronoflow-agent` as the generic Bedrock Agent name so future action groups can be added under the same agent.

After the web app is cut over to the CDK stack outputs, delete the old spike resources:

- `chronoflow-compose-email-action`
- `chronoflow-compose-email-lambda-role`
- `chronoflow-compose-email-agent`
- `chronoflow-bedrock-agent-role`
