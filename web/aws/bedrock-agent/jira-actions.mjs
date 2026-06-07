import {
  actionResponse,
  callInternalApi,
  extractInput,
} from "./action-utils.mjs"

export const handler = async (event) => {
  const actionGroup = event.actionGroup
  const apiPath = event.apiPath || "/create-jira-ticket"
  const httpMethod = event.httpMethod || "POST"

  try {
    const input = extractInput(event)

    if (!input.title || !input.description) {
      return actionResponse({
        actionGroup,
        apiPath,
        httpMethod,
        statusCode: 400,
        body: {
          error: "Missing fields",
          message: "Ask the user for a ticket title and description before preparing the Jira ticket.",
        },
      })
    }

    const { response, payload } = await callInternalApi("/api/internal/ai/prepare-jira-ticket", {
      title: input.title,
      description: input.description,
      priority: input.priority,
    })

    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: response.status,
      body: payload,
    })
  } catch (error) {
    console.error("jira action failed", {
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
        message: "I could not prepare the Jira ticket right now. Please try again.",
      },
    })
  }
}
