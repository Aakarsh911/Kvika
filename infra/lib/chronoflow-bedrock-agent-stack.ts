import * as path from "path"
import * as fs from "fs"
import * as cdk from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"

export class ChronoFlowBedrockAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const chronoflowInternalBaseUrl = new cdk.CfnParameter(this, "ChronoFlowInternalBaseUrl", {
      type: "String",
      description:
        "Public base URL that Lambda can use to call ChronoFlow, for example an ngrok or Vercel URL.",
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
      default: "amazon.nova-lite-v1:0",
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

    const bedrockAgentRole = new iam.Role(this, "BedrockAgentRole", {
      description: "Execution role for ChronoFlow Bedrock Agent.",
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: {
        ChronoFlowBedrockAgentModelInvoke: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
              resources: [
                cdk.Fn.sub("arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/${ModelId}", {
                  ModelId: foundationModel.valueAsString,
                }),
                cdk.Fn.sub("arn:${AWS::Partition}:bedrock:${AWS::Region}:${AWS::AccountId}:inference-profile/*"),
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

    const agentInstruction = `You are ChronoFlow's productivity assistant. Help users manage email, tasks, calendar, and work planning.

Gmail tools (draft only — never send email):
- compose_new_email: use when the user asks to write or compose a new email. Ask for recipient if missing.
- reply_to_email: use when the user asks to reply to an email. Use emailId and provider from context; if missing, ask the user to select an email first.
- After compose_new_email succeeds, return ONLY:
{"message":"I've drafted an email to recipient@example.com:","clientAction":{"type":"show_new_email_draft","to":"recipient@example.com","subject":"Subject","body":"Email body","provider":"gmail"}}
- After reply_to_email succeeds, return ONLY:
{"message":"I've drafted a reply to \\"Subject\\":","clientAction":{"type":"show_email_reply_draft","emailId":"...","provider":"gmail","subject":"Subject","body":"Reply body"}}

Jira tool:
- create_jira_ticket: use when the user asks to create, file, or log a Jira ticket. Collect title and description first. The user chooses the project in ChronoFlow before creation.
- After create_jira_ticket succeeds, return ONLY:
{"message":"I'll help you create a Jira ticket. Please review and edit the details:","clientAction":{"type":"show_jira_ticket_draft","title":"...","description":"...","priority":"Medium"}}

For normal conversation, answer naturally without JSON.`

    const bedrockAgent = new cdk.CfnResource(this, "ChronoFlowAgent", {
      type: "AWS::Bedrock::Agent",
      properties: {
        AgentName: agentName.valueAsString,
        Description: "ChronoFlow AI assistant with Gmail and Jira action groups.",
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
        ],
      },
    })
    bedrockAgent.node.addDependency(bedrockAgentRole)
    bedrockAgent.node.addDependency(allowBedrockInvokeGmail)
    bedrockAgent.node.addDependency(allowBedrockInvokeJira)

    const bedrockAgentAlias = new cdk.CfnResource(this, "ChronoFlowAgentAlias", {
      type: "AWS::Bedrock::AgentAlias",
      properties: {
        AgentId: bedrockAgent.getAtt("AgentId"),
        AgentAliasName: aliasName.valueAsString,
        Description: "ChronoFlow Bedrock Agent alias.",
      },
    })
    bedrockAgentAlias.node.addDependency(bedrockAgent)

    new cdk.CfnOutput(this, "ComposeEmailLambdaArn", {
      value: gmailActionsLambda.functionArn,
    })

    new cdk.CfnOutput(this, "JiraActionsLambdaArn", {
      value: jiraActionsLambda.functionArn,
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
