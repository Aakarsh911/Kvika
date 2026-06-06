const JSON_CONTENT_TYPE = "application/json"

export const handler = async (event) => {
  const actionGroup = event.actionGroup
  const apiPath = event.apiPath || "/compose-new-email"
  const httpMethod = event.httpMethod || "POST"

  try {
    const input = extractInput(event)

    if (!input.context) {
      return actionResponse({ actionGroup, apiPath, httpMethod, statusCode: 400, body: {
        error: "Missing context",
        message: "Ask the user what the email should be about before drafting.",
      }})
    }

    if (!input.to) {
      return actionResponse({ actionGroup, apiPath, httpMethod, statusCode: 400, body: {
        error: "Missing recipient",
        code: "MISSING_RECIPIENT",
        message: "Ask the user for the recipient email address before drafting.",
      }})
    }

    const baseUrl = requireEnv("CHRONOFLOW_INTERNAL_BASE_URL").replace(/\/$/, "")
    const secret = requireEnv("INTERNAL_AGENT_SECRET")

    const response = await fetch(`${baseUrl}/api/internal/ai/compose-email`, {
      method: "POST",
      headers: {
        "content-type": JSON_CONTENT_TYPE,
        "x-chronoflow-agent-secret": secret,
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        context: input.context,
        tone: input.tone,
      }),
    })

    const body = await response.json().catch(() => ({
      error: "Invalid ChronoFlow response",
    }))

    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: response.status,
      body,
    })
  } catch (error) {
    console.error("compose_new_email action failed", {
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
        message: "I could not draft the email right now. Please try again.",
      },
    })
  }
}

function extractInput(event) {
  const requestJson = event.requestBody?.content?.[JSON_CONTENT_TYPE]
  const requestBody = requestJson?.body
  if (typeof requestBody === "string" && requestBody.trim()) {
    try {
      return JSON.parse(requestBody)
    } catch {
      // Fall through to property extraction.
    }
  }

  const properties = requestJson?.properties || event.parameters || []
  return properties.reduce((acc, property) => {
    if (property?.name) acc[property.name] = property.value
    return acc
  }, {})
}

function actionResponse({ actionGroup, apiPath, httpMethod, statusCode, body }) {
  return {
    messageVersion: "1.0",
    response: {
      actionGroup,
      apiPath,
      httpMethod,
      httpStatusCode: statusCode,
      responseBody: {
        [JSON_CONTENT_TYPE]: {
          body: JSON.stringify(body),
        },
      },
    },
  }
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}
