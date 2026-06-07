#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { ChronoFlowBedrockAgentStack } from "../lib/chronoflow-bedrock-agent-stack.js"

const app = new cdk.App()

new ChronoFlowBedrockAgentStack(app, "ChronoFlowBedrockAgentStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
  },
})
