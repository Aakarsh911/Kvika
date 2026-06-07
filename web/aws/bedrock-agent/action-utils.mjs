export const JSON_CONTENT_TYPE = "application/json"

export function extractInput(event) {
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

export function actionResponse({ actionGroup, apiPath, httpMethod, statusCode, body }) {
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

export function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export function getUserEmail(event) {
  return event.sessionAttributes?.userEmail || event.promptSessionAttributes?.userEmail || null
}

export async function callInternalApi(path, body) {
  const baseUrl = requireEnv("CHRONOFLOW_INTERNAL_BASE_URL").replace(/\/$/, "")
  const secret = requireEnv("INTERNAL_AGENT_SECRET")

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": JSON_CONTENT_TYPE,
      "x-chronoflow-agent-secret": secret,
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({
    error: "Invalid ChronoFlow response",
  }))

  return { response, payload }
}
