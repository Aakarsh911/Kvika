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
    const apiSchemaPayload = fs.readFileSync(
      path.join(bedrockAgentAssetPath, "compose-email-action.openapi.json"),
      "utf8"
    )

    const composeEmailLambda = new lambda.Function(this, "ComposeEmailActionLambda", {
      description: "ChronoFlow Bedrock Agent action for draft-only compose_new_email.",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "compose-email-action.handler",
      code: lambda.Code.fromAsset(bedrockAgentAssetPath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        CHRONOFLOW_INTERNAL_BASE_URL: chronoflowInternalBaseUrl.valueAsString,
        INTERNAL_AGENT_SECRET: internalAgentSecret.valueAsString,
      },
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

    const bedrockInvokePermission = new lambda.CfnPermission(this, "AllowBedrockInvokeComposeEmail", {
      action: "lambda:InvokeFunction",
      functionName: composeEmailLambda.functionName,
      principal: "bedrock.amazonaws.com",
      sourceAccount: this.account,
    })

    const agentInstruction = `You are ChronoFlow's productivity assistant. Help users manage email, tasks, calendar, and work planning.

For compose_new_email:
- Draft only. Never send email.
- Use compose_new_email only when the user explicitly asks to write, draft, or compose a new email.
- If the recipient email address is missing, ask the user for it before calling compose_new_email.
- If the user asks you to send directly, refuse to send and explain that ChronoFlow will show a draft for review.
- After compose_new_email succeeds, return ONLY this JSON shape and no markdown:
{"message":"I've drafted an email to recipient@example.com:","clientAction":{"type":"show_new_email_draft","to":"recipient@example.com","subject":"Subject","body":"Email body","provider":"gmail"}}

For normal conversation, answer naturally without JSON.`

    const bedrockAgent = new cdk.CfnResource(this, "ChronoFlowAgent", {
      type: "AWS::Bedrock::Agent",
      properties: {
        AgentName: agentName.valueAsString,
        Description: "ChronoFlow AI assistant with tool action groups.",
        AgentResourceRoleArn: bedrockAgentRole.roleArn,
        FoundationModel: foundationModel.valueAsString,
        Instruction: agentInstruction,
        IdleSessionTTLInSeconds: 900,
        AutoPrepare: true,
        ActionGroups: [
          {
            ActionGroupName: "compose_email",
            Description: "Drafts a new email for user review in ChronoFlow.",
            ActionGroupState: "ENABLED",
            ActionGroupExecutor: {
              Lambda: composeEmailLambda.functionArn,
            },
            ApiSchema: {
              Payload: apiSchemaPayload,
            },
          },
        ],
      },
    })
    bedrockAgent.node.addDependency(bedrockAgentRole)
    bedrockAgent.node.addDependency(bedrockInvokePermission)

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
      value: composeEmailLambda.functionArn,
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
