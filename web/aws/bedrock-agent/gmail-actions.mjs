import {
  actionResponse,
  callInternalApi,
  extractInput,
  getUserEmail,
} from "./action-utils.mjs"

export const handler = async (event) => {
  const actionGroup = event.actionGroup
  const apiPath = event.apiPath || "/compose-new-email"
  const httpMethod = event.httpMethod || "POST"

  try {
    if (apiPath === "/reply-to-email") {
      return await handleReplyToEmail({ event, actionGroup, apiPath, httpMethod })
    }

    return await handleComposeNewEmail({ event, actionGroup, apiPath, httpMethod })
  } catch (error) {
    console.error("gmail action failed", {
      message: error instanceof Error ? error.message : String(error),
      actionGroup,
      apiPath,
    })

    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: 500,
      body: {
        error: "Internal server error",
        message: "I could not complete the Gmail action right now. Please try again.",
      },
    })
  }
}

async function handleComposeNewEmail({ event, actionGroup, apiPath, httpMethod }) {
  const input = extractInput(event)

  if (!input.context) {
    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: 400,
      body: {
        error: "Missing context",
        message: "Ask the user what the email should be about before drafting.",
      },
    })
  }

  if (!input.to) {
    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: 400,
      body: {
        error: "Missing recipient",
        code: "MISSING_RECIPIENT",
        message: "Ask the user who they want to email — a name is fine.",
      },
    })
  }

  const userEmail = getUserEmail(event)
  if (!userEmail) {
    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: 400,
      body: {
        error: "Missing user context",
        message: "I could not identify the signed-in user for this email.",
      },
    })
  }

  const { response, payload } = await callInternalApi("/api/internal/ai/compose-email", {
    userEmail,
    to: input.to,
    subject: input.subject,
    context: input.context,
    tone: input.tone,
  })

  return actionResponse({
    actionGroup,
    apiPath,
    httpMethod,
    statusCode: response.status,
    body: payload,
  })
}

async function handleReplyToEmail({ event, actionGroup, apiPath, httpMethod }) {
  const input = extractInput(event)
  const userEmail = getUserEmail(event)

  if (!userEmail) {
    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: 400,
      body: {
        error: "Missing user context",
        message: "I could not identify the signed-in user for this reply.",
      },
    })
  }

  const emailId = input.emailId || event.promptSessionAttributes?.selectedEmailId
  const provider = input.provider || event.promptSessionAttributes?.selectedEmailProvider

  if (!emailId || !provider) {
    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: 400,
      body: {
        error: "Missing email context",
        code: "MISSING_EMAIL",
        message: "Ask the user to select the email they want to reply to before drafting a reply.",
      },
    })
  }

  const { response, payload } = await callInternalApi("/api/internal/ai/reply-email", {
    userEmail,
    emailId,
    provider,
    tone: input.tone,
    additionalInstructions: input.additionalInstructions,
  })

  return actionResponse({
    actionGroup,
    apiPath,
    httpMethod,
    statusCode: response.status,
    body: payload,
  })
}
