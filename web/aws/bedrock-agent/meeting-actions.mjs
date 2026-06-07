import {
  actionResponse,
  callInternalApi,
  extractInput,
  getUserEmail,
} from "./action-utils.mjs"

export const handler = async (event) => {
  const actionGroup = event.actionGroup
  const apiPath = event.apiPath || "/schedule-meeting"
  const httpMethod = event.httpMethod || "POST"

  try {
    const input = extractInput(event)
    const userEmail = getUserEmail(event)

    if (!input.title || !input.startTime) {
      return actionResponse({
        actionGroup,
        apiPath,
        httpMethod,
        statusCode: 400,
        body: {
          error: "Missing fields",
          message: "Ask the user for a meeting title and start time before scheduling.",
        },
      })
    }

    let attendees = input.attendees
    if (typeof attendees === "string") {
      attendees = attendees
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    }

    const { response, payload } = await callInternalApi("/api/internal/ai/prepare-meeting", {
      userEmail,
      title: input.title,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      attendees: Array.isArray(attendees) ? attendees : [],
      description: input.description,
      location: input.location,
    })

    return actionResponse({
      actionGroup,
      apiPath,
      httpMethod,
      statusCode: response.status,
      body: payload,
    })
  } catch (error) {
    console.error("meeting action failed", {
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
        message: "I could not prepare the meeting right now. Please try again.",
      },
    })
  }
}
