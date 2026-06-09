import * as path from "path"
import * as fs from "fs"
import * as crypto from "crypto"
import * as cdk from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"

export class ChronoFlowBedrockAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const chronoflowInternalBaseUrl = new cdk.CfnParameter(this, "ChronoFlowInternalBaseUrl", {
      type: "String",
      default: "https://chronoflow.work",
      description: "Public base URL that Lambda can use to call ChronoFlow (production deploy).",
      allowedPattern: "https://.+",
      constraintDescription: "Must be an HTTPS URL.",
    })

    const internalAgentSecret = new cdk.CfnParameter(this, "InternalAgentSecret", {
      type: "String",
      noEcho: true,
      minLength: 32,
      description:
        "Shared secret sent by Lambda in x-chronoflow-agent-secret. Must match the web app INTERNAL_AGENT_SECRET.",
    })

    const foundationModel = new cdk.CfnParameter(this, "FoundationModelId", {
      type: "String",
      default: "openai.gpt-oss-120b-1:0",
      description: "Bedrock foundation model ID used by the ChronoFlow Bedrock Agent.",
    })

    const agentName = new cdk.CfnParameter(this, "AgentName", {
      type: "String",
      default: "chronoflow-agent",
      description: "Bedrock Agent name.",
    })

    const aliasName = new cdk.CfnParameter(this, "AgentAliasName", {
      type: "String",
      default: "dev",
      description: "Bedrock Agent alias name used by the web app.",
    })

    const repoRoot = path.join(process.cwd(), "..")
    const bedrockAgentAssetPath = path.join(repoRoot, "web", "aws", "bedrock-agent")
    const gmailApiSchemaPayload = fs.readFileSync(
      path.join(bedrockAgentAssetPath, "gmail-actions.openapi.json"),
      "utf8",
    )
    const jiraApiSchemaPayload = fs.readFileSync(
      path.join(bedrockAgentAssetPath, "jira-actions.openapi.json"),
      "utf8",
    )
    const meetingApiSchemaPayload = fs.readFileSync(
      path.join(bedrockAgentAssetPath, "meeting-actions.openapi.json"),
      "utf8",
    )

    const lambdaEnvironment = {
      CHRONOFLOW_INTERNAL_BASE_URL: chronoflowInternalBaseUrl.valueAsString,
      INTERNAL_AGENT_SECRET: internalAgentSecret.valueAsString,
    }

    // Keep ComposeEmailActionLambda id so CDK updates the existing Lambda in place.
    const gmailActionsLambda = new lambda.Function(this, "ComposeEmailActionLambda", {
      description: "ChronoFlow Bedrock Agent Gmail actions: compose_new_email and reply_to_email.",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "gmail-actions.handler",
      code: lambda.Code.fromAsset(bedrockAgentAssetPath),
      timeout: cdk.Duration.seconds(45),
      memorySize: 256,
      environment: lambdaEnvironment,
    })

    const jiraActionsLambda = new lambda.Function(this, "JiraActionsLambda", {
      description: "ChronoFlow Bedrock Agent Jira action: create_jira_ticket draft preparation.",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "jira-actions.handler",
      code: lambda.Code.fromAsset(bedrockAgentAssetPath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
    })

    const meetingActionsLambda = new lambda.Function(this, "MeetingActionsLambda", {
      description: "ChronoFlow Bedrock Agent meeting action: schedule_meeting draft preparation.",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "meeting-actions.handler",
      code: lambda.Code.fromAsset(bedrockAgentAssetPath),
      timeout: cdk.Duration.seconds(45),
      memorySize: 256,
      environment: lambdaEnvironment,
    })

    const bedrockAgentRole = new iam.Role(this, "BedrockAgentRole", {
      description: "Execution role for ChronoFlow Bedrock Agent.",
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: {
        ChronoFlowBedrockAgentModelInvoke: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
              // Allow any foundation model / inference profile so swapping the
              // agent model never leaves a published alias version pointing at a
              // model the role can no longer invoke (which surfaces as AccessDenied).
              resources: [
                cdk.Fn.sub("arn:${AWS::Partition}:bedrock:*::foundation-model/*"),
                cdk.Fn.sub("arn:${AWS::Partition}:bedrock:*:${AWS::AccountId}:inference-profile/*"),
              ],
            }),
          ],
        }),
      },
    })

    const allowBedrockInvokeGmail = new lambda.CfnPermission(this, "AllowBedrockInvokeComposeEmail", {
      action: "lambda:InvokeFunction",
      functionName: gmailActionsLambda.functionName,
      principal: "bedrock.amazonaws.com",
      sourceAccount: this.account,
    })

    const allowBedrockInvokeJira = new lambda.CfnPermission(this, "AllowBedrockInvokeJiraActions", {
      action: "lambda:InvokeFunction",
      functionName: jiraActionsLambda.functionName,
      principal: "bedrock.amazonaws.com",
      sourceAccount: this.account,
    })

    const allowBedrockInvokeMeeting = new lambda.CfnPermission(this, "AllowBedrockInvokeMeetingActions", {
      action: "lambda:InvokeFunction",
      functionName: meetingActionsLambda.functionName,
      principal: "bedrock.amazonaws.com",
      sourceAccount: this.account,
    })

    const agentInstruction = `You are ChronoFlow's productivity assistant for email, tasks, and work planning.

Session memory:
- You remember the full conversation in this session across follow-up turns.
- Each user message may include "Selected email in ChronoFlow UI" with emailId and provider — use those for reply_to_email.

Critical rules:
- Never output <thinking>, <reasoning>, or hidden chain-of-thought.
- Ask follow-up questions in plain natural language when required fields are missing.
- As soon as you have enough information, CALL THE TOOL immediately. Do not ask for confirmation first.
- Tools draft content only — never send email or create Jira issues directly.
- If the user requests multiple actions in one message, call every needed tool in a sensible order. ChronoFlow can render multiple draft actions for the user to review.
- Use the provided User time context when parsing natural dates and times. If a timezone is provided, interpret times like "5pm" in that timezone.

Gmail tools (draft only):
- compose_new_email — user wants a new email. Required: to (recipient), context (what to say). Ask for anything missing, then call the tool.
- reply_to_email — user wants to reply. Required: emailId and provider from selected-email context. If missing, tell the user to select an email in ChronoFlow and return:
{"message":"Please select an email to reply to.","clientAction":{"type":"show_email_selector"}}
- After compose_new_email or reply_to_email succeeds, briefly confirm what you drafted in natural language. ChronoFlow reads the tool result automatically.

Jira tool:
- create_jira_ticket — user wants a Jira ticket. Required: title. If the user gives only a title or asks you to write the description, write a concise description yourself and call create_jira_ticket with title, description, and priority (High/Medium/Low).
- Do not ask for a description if you can write one from context.
- After create_jira_ticket succeeds, briefly tell the user to review the draft. ChronoFlow reads the tool result automatically.

Meeting tool:
- schedule_meeting — user wants to schedule/set up a meeting or calendar event. Required: title and a start time. Optional: attendees, durationMinutes (default 30), description, location.
- Pass attendees as a list of names OR emails exactly as the user said them (e.g. "sarah", "john@acme.com"). ChronoFlow resolves names to your teammates' emails automatically — do NOT ask the user for an email if they only gave a name.
- Parse natural times like "tomorrow at 2pm" into an ISO 8601 startTime; if the user gives no date assume the next occurrence of that time.
- Do not ask which calendar (Google or Teams) — the user picks that in the ChronoFlow UI.
- After schedule_meeting succeeds, briefly tell the user to review and confirm the meeting. ChronoFlow reads the tool result automatically.

For normal conversation without a tool, answer naturally in plain text without JSON.`

    const bedrockAgent = new cdk.CfnResource(this, "ChronoFlowAgent", {
      type: "AWS::Bedrock::Agent",
      properties: {
        AgentName: agentName.valueAsString,
        Description: "ChronoFlow AI assistant with Gmail, Jira, and meeting action groups.",
        AgentResourceRoleArn: bedrockAgentRole.roleArn,
        FoundationModel: foundationModel.valueAsString,
        Instruction: agentInstruction,
        IdleSessionTTLInSeconds: 900,
        AutoPrepare: true,
        SkipResourceInUseCheckOnDelete: true,
        ActionGroups: [
          {
            ActionGroupName: "compose_email",
            Description: "Draft-only Gmail actions for compose and reply.",
            ActionGroupState: "ENABLED",
            SkipResourceInUseCheckOnDelete: true,
            ActionGroupExecutor: {
              Lambda: gmailActionsLambda.functionArn,
            },
            ApiSchema: {
              Payload: gmailApiSchemaPayload,
            },
          },
          {
            ActionGroupName: "jira",
            Description: "Prepare Jira ticket drafts for user review.",
            ActionGroupState: "ENABLED",
            SkipResourceInUseCheckOnDelete: true,
            ActionGroupExecutor: {
              Lambda: jiraActionsLambda.functionArn,
            },
            ApiSchema: {
              Payload: jiraApiSchemaPayload,
            },
          },
          {
            ActionGroupName: "schedule_meeting",
            Description: "Prepare meeting/calendar event drafts and resolve attendee emails.",
            ActionGroupState: "ENABLED",
            SkipResourceInUseCheckOnDelete: true,
            ActionGroupExecutor: {
              Lambda: meetingActionsLambda.functionArn,
            },
            ApiSchema: {
              Payload: meetingApiSchemaPayload,
            },
          },
        ],
      },
    })
    bedrockAgent.node.addDependency(bedrockAgentRole)
    bedrockAgent.node.addDependency(allowBedrockInvokeGmail)
    bedrockAgent.node.addDependency(allowBedrockInvokeJira)
    bedrockAgent.node.addDependency(allowBedrockInvokeMeeting)

    // Changing this hash (because the instruction text, action groups, or the
    // selected model changed) forces the alias resource to update, which
    // publishes a NEW agent version from the freshly prepared draft and routes
    // the alias to it. Without this the alias stays pinned to its first
    // published version and never picks up model/instruction changes.
    const agentConfigHash = crypto
      .createHash("sha256")
      .update(agentInstruction)
      .update(gmailApiSchemaPayload)
      .update(jiraApiSchemaPayload)
      .update(meetingApiSchemaPayload)
      .digest("hex")
      .slice(0, 16)

    const bedrockAgentAlias = new cdk.CfnResource(this, "ChronoFlowAgentAlias", {
      type: "AWS::Bedrock::AgentAlias",
      properties: {
        AgentId: bedrockAgent.getAtt("AgentId"),
        AgentAliasName: aliasName.valueAsString,
        Description: cdk.Fn.sub(
          `ChronoFlow Bedrock Agent alias. cfg=${agentConfigHash} model=\${ModelId}`,
          { ModelId: foundationModel.valueAsString },
        ),
      },
    })
    bedrockAgentAlias.node.addDependency(bedrockAgent)

    new cdk.CfnOutput(this, "ComposeEmailLambdaArn", {
      value: gmailActionsLambda.functionArn,
    })

    new cdk.CfnOutput(this, "JiraActionsLambdaArn", {
      value: jiraActionsLambda.functionArn,
    })

    new cdk.CfnOutput(this, "MeetingActionsLambdaArn", {
      value: meetingActionsLambda.functionArn,
    })

    new cdk.CfnOutput(this, "BedrockAgentId", {
      value: bedrockAgent.getAtt("AgentId").toString(),
    })

    new cdk.CfnOutput(this, "BedrockAgentAliasId", {
      value: bedrockAgentAlias.getAtt("AgentAliasId").toString(),
    })

    new cdk.CfnOutput(this, "BedrockModelId", {
      value: foundationModel.valueAsString,
    })
  }
}
