import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns"
import { EventType, Provider } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type AnalyticsRange = "week" | "month"

export type AnalyticsKpi = {
  value: string
  delta: string
  trend: "up" | "down"
  label: string
}

export type AnalyticsInsight = {
  type: "success" | "warning" | "info"
  title: string
  description: string
  action: string
  impact: string
}

export type AnalyticsPayload = {
  range: AnalyticsRange
  kpis: {
    focusHours: AnalyticsKpi
    meetingHours: AnalyticsKpi
    tasksCompleted: AnalyticsKpi
    emailTasks: AnalyticsKpi
  }
  summary: {
    bestFocusDay: string | null
    busiestMeetingDay: string | null
    openTasks: number
    staleTasks: number
  }
  dailyWorkMix: { day: string; focus: number; meetings: number }[]
  tasksByDay: { day: string; completed: number }[]
  taskSources: { name: string; value: number; color: string }[]
  meetingPatterns: { time: string; count: number }[]
  integrations: {
    name: string
    connected: boolean
    lastSync: string | null
    error: string | null
    eventsInRange: number
    tasksInRange: number
  }[]
  insights: AnalyticsInsight[]
}

const SOURCE_LABELS: Record<string, string> = {
  EMAIL_AI: "Email",
  MANUAL: "Manual",
  JIRA: "Jira",
  GITHUB: "GitHub",
  CALENDAR: "Calendar",
}

const SOURCE_COLORS: Record<string, string> = {
  Email: "rgba(var(--cf-accent-rgb), 1)",
  Manual: "rgba(var(--cf-primary-rgb), 1)",
  Jira: "#ea580c",
  GitHub: "#9333ea",
  Calendar: "#0891b2",
  Other: "var(--muted-foreground)",
}

function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
}

function sumEventHours(
  events: { startTime: Date; endTime: Date }[],
  start: Date,
  end: Date,
): number {
  return events.reduce((sum, event) => {
    const eventStart = event.startTime < start ? start : event.startTime
    const eventEnd = event.endTime > end ? end : event.endTime
    if (eventEnd <= eventStart) return sum
    return sum + hoursBetween(eventStart, eventEnd)
  }, 0)
}

function formatHours(hours: number): string {
  if (hours < 0.05) return "0h"
  return `${hours.toFixed(1)}h`
}

function formatCountDelta(current: number, previous: number): AnalyticsKpi["trend"] {
  return current >= previous ? "up" : "down"
}

function formatHoursDelta(current: number, previous: number): { delta: string; trend: AnalyticsKpi["trend"] } {
  const diff = current - previous
  const sign = diff >= 0 ? "+" : ""
  return { delta: `${sign}${diff.toFixed(1)}h`, trend: formatCountDelta(current, previous) }
}

function formatPercentDelta(current: number, previous: number): { delta: string; trend: AnalyticsKpi["trend"] } {
  const diff = current - previous
  const sign = diff >= 0 ? "+" : ""
  return { delta: `${sign}${diff}`, trend: formatCountDelta(current, previous) }
}

function formatPercentDeltaRate(current: number, previous: number): { delta: string; trend: AnalyticsKpi["trend"] } {
  const diff = Math.round(current - previous)
  const sign = diff >= 0 ? "+" : ""
  return { delta: `${sign}${diff}%`, trend: formatCountDelta(current, previous) }
}

function getRangeBounds(range: AnalyticsRange, now = new Date()) {
  if (range === "month") {
    const currentStart = startOfMonth(now)
    const currentEnd = endOfDay(now > endOfMonth(now) ? endOfMonth(now) : now)
    const previousStart = startOfMonth(subMonths(now, 1))
    const previousEnd = endOfMonth(subMonths(now, 1))
    return { currentStart, currentEnd, previousStart, previousEnd }
  }

  const currentStart = startOfWeek(now, { weekStartsOn: 1 })
  const currentEnd = endOfDay(now)
  const previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  return { currentStart, currentEnd, previousStart, previousEnd }
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? "Other"
}

function isTaskDone(status: string, completedAt: Date | null): boolean {
  return status.toLowerCase() === "done" || !!completedAt
}

export async function getUserAnalytics(userId: string, range: AnalyticsRange): Promise<AnalyticsPayload> {
  const now = new Date()
  const { currentStart, currentEnd, previousStart, previousEnd } = getRangeBounds(range, now)

  const [
    currentEvents,
    previousEvents,
    currentTasks,
    previousTasks,
    openTasks,
    staleTasks,
    calendarSyncs,
    integrations,
  ] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, startTime: { lte: currentEnd }, endTime: { gte: currentStart } },
      select: { startTime: true, endTime: true, eventType: true },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startTime: { lte: previousEnd }, endTime: { gte: previousStart } },
      select: { startTime: true, endTime: true, eventType: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        OR: [
          { completedAt: { gte: currentStart, lte: currentEnd } },
          { completedAt: null, status: "Done", updatedAt: { gte: currentStart, lte: currentEnd } },
        ],
      },
      select: { source: true, completedAt: true, updatedAt: true, status: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        OR: [
          { completedAt: { gte: previousStart, lte: previousEnd } },
          { completedAt: null, status: "Done", updatedAt: { gte: previousStart, lte: previousEnd } },
        ],
      },
      select: { source: true, completedAt: true, updatedAt: true, status: true },
    }),
    prisma.task.count({
      where: { userId, status: { not: "Done" }, completedAt: null },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { not: "Done" },
        completedAt: null,
        updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.calendarSync.findMany({ where: { userId } }),
    prisma.integration.findMany({ where: { userId } }),
  ])

  const focusCurrent = currentEvents.filter((e) => e.eventType === EventType.FOCUS_TIME)
  const meetingCurrent = currentEvents.filter((e) => e.eventType === EventType.MEETING)
  const focusPrevious = previousEvents.filter((e) => e.eventType === EventType.FOCUS_TIME)
  const meetingPrevious = previousEvents.filter((e) => e.eventType === EventType.MEETING)

  const focusHoursCurrent = sumEventHours(focusCurrent, currentStart, currentEnd)
  const meetingHoursCurrent = sumEventHours(meetingCurrent, currentStart, currentEnd)
  const focusHoursPrevious = sumEventHours(focusPrevious, previousStart, previousEnd)
  const meetingHoursPrevious = sumEventHours(meetingPrevious, previousStart, previousEnd)

  const tasksCompletedCurrent = currentTasks.filter((t) => isTaskDone(t.status, t.completedAt)).length
  const tasksCompletedPrevious = previousTasks.filter((t) => isTaskDone(t.status, t.completedAt)).length

  const emailTasksCurrent = currentTasks.filter((t) => t.source === "EMAIL_AI").length
  const emailTasksPrevious = previousTasks.filter((t) => t.source === "EMAIL_AI").length
  const emailTaskRateCurrent =
    tasksCompletedCurrent > 0 ? Math.round((emailTasksCurrent / tasksCompletedCurrent) * 100) : 0
  const emailTaskRatePrevious =
    tasksCompletedPrevious > 0 ? Math.round((emailTasksPrevious / tasksCompletedPrevious) * 100) : 0

  const periodLabel = range === "week" ? "vs last week" : "vs last month"

  const focusDelta = formatHoursDelta(focusHoursCurrent, focusHoursPrevious)
  const meetingDelta = formatHoursDelta(meetingHoursCurrent, meetingHoursPrevious)
  const tasksDelta = formatPercentDelta(tasksCompletedCurrent, tasksCompletedPrevious)
  const emailDelta = formatPercentDeltaRate(emailTaskRateCurrent, emailTaskRatePrevious)

  const dayInterval =
    range === "week"
      ? eachDayOfInterval({ start: currentStart, end: endOfWeek(now, { weekStartsOn: 1 }) })
      : eachDayOfInterval({ start: currentStart, end: currentEnd })

  const dailyWorkMix = dayInterval.map((day) => {
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    return {
      day: format(day, range === "week" ? "EEE" : "MMM d"),
      focus: sumEventHours(focusCurrent, dayStart, dayEnd),
      meetings: sumEventHours(meetingCurrent, dayStart, dayEnd),
    }
  })

  const tasksByDay = dayInterval.map((day) => {
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    const completed = currentTasks.filter((task) => {
      const doneAt = task.completedAt ?? task.updatedAt
      return isTaskDone(task.status, task.completedAt) && doneAt >= dayStart && doneAt <= dayEnd
    }).length
    return { day: format(day, range === "week" ? "EEE" : "MMM d"), completed }
  })

  const sourceCounts = new Map<string, number>()
  for (const task of currentTasks) {
    const label = sourceLabel(task.source)
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1)
  }
  const taskSources = Array.from(sourceCounts.entries())
    .map(([name, value]) => ({ name, value, color: SOURCE_COLORS[name] ?? SOURCE_COLORS.Other }))
    .sort((a, b) => b.value - a.value)

  const meetingHourBuckets = new Map<number, number>()
  for (const event of meetingCurrent) {
    const hour = event.startTime.getHours()
    meetingHourBuckets.set(hour, (meetingHourBuckets.get(hour) ?? 0) + 1)
  }
  const meetingPatterns =
    meetingHourBuckets.size > 0
      ? Array.from(meetingHourBuckets.entries())
          .sort(([a], [b]) => a - b)
          .map(([hour, count]) => ({
            time: format(new Date(2000, 0, 1, hour), "h a"),
            count,
          }))
      : []

  const bestFocusDay =
    dailyWorkMix.length > 0
      ? dailyWorkMix.reduce((best, row) => (row.focus > best.focus ? row : best)).day
      : null
  const busiestMeetingDay =
    dailyWorkMix.length > 0
      ? dailyWorkMix.reduce((best, row) => (row.meetings > best.meetings ? row : best)).day
      : null

  const providerEvents = await prisma.calendarEvent.groupBy({
    by: ["source"],
    where: { userId, startTime: { gte: currentStart, lte: currentEnd } },
    _count: { _all: true },
  })

  const providerTaskCounts = await prisma.task.groupBy({
    by: ["source"],
    where: { userId, createdAt: { gte: currentStart, lte: currentEnd } },
    _count: { _all: true },
  })

  const integrationRows = buildIntegrationRows(
    integrations,
    calendarSyncs,
    providerEvents,
    providerTaskCounts,
    currentStart,
    currentEnd,
  )

  const insights = buildInsights({
    dailyWorkMix,
    meetingHoursCurrent,
    focusHoursCurrent,
    staleTasks,
    calendarSyncs,
    tasksCompletedCurrent,
    bestFocusDay,
    busiestMeetingDay,
  })

  return {
    range,
    kpis: {
      focusHours: { value: formatHours(focusHoursCurrent), ...focusDelta, label: periodLabel },
      meetingHours: { value: formatHours(meetingHoursCurrent), ...meetingDelta, label: periodLabel },
      tasksCompleted: {
        value: String(tasksCompletedCurrent),
        delta: `${tasksDelta.delta}`,
        trend: tasksDelta.trend,
        label: periodLabel,
      },
      emailTasks: {
        value: `${emailTaskRateCurrent}%`,
        ...emailDelta,
        label: "of completed tasks",
      },
    },
    summary: {
      bestFocusDay: focusHoursCurrent > 0 ? bestFocusDay : null,
      busiestMeetingDay: meetingHoursCurrent > 0 ? busiestMeetingDay : null,
      openTasks,
      staleTasks,
    },
    dailyWorkMix,
    tasksByDay,
    taskSources,
    meetingPatterns,
    integrations: integrationRows,
    insights,
  }
}

function buildIntegrationRows(
  integrations: { provider: Provider }[],
  calendarSyncs: {
    source: string
    calendarName: string | null
    lastSuccessfulSync: Date | null
    lastSyncError: string | null
    syncEnabled: boolean
  }[],
  providerEvents: { source: string; _count: { _all: number } }[],
  providerTaskCounts: { source: string; _count: { _all: number } }[],
  start: Date,
  end: Date,
) {
  const providerNames: Record<string, string> = {
    GOOGLE: "Google Calendar",
    MICROSOFT: "Microsoft Calendar",
    JIRA: "Jira",
    GITHUB: "GitHub",
  }

  const rows: AnalyticsPayload["integrations"] = []

  for (const integration of integrations) {
    const name =
      integration.provider === Provider.GOOGLE
        ? "Gmail / Google"
        : integration.provider === Provider.MICROSOFT
          ? "Outlook / Teams"
          : providerNames[integration.provider] ?? integration.provider

    const sync = calendarSyncs.find((s) => s.source === integration.provider)
    const eventCount =
      providerEvents.find((e) => e.source === integration.provider)?._count._all ??
      providerEvents.find((e) => e.source === integration.provider.toString())?._count._all ??
      0

    const taskSource =
      integration.provider === Provider.JIRA
        ? "JIRA"
        : integration.provider === Provider.GITHUB
          ? "GITHUB"
          : integration.provider === Provider.GOOGLE || integration.provider === Provider.MICROSOFT
            ? "EMAIL_AI"
            : null

    const tasksInRange = taskSource
      ? (providerTaskCounts.find((t) => t.source === taskSource)?._count._all ?? 0)
      : 0

    rows.push({
      name,
      connected: true,
      lastSync: sync?.lastSuccessfulSync?.toISOString() ?? null,
      error: sync?.lastSyncError ?? null,
      eventsInRange: eventCount,
      tasksInRange,
    })
  }

  if (rows.length === 0) {
    rows.push({
      name: "No integrations",
      connected: false,
      lastSync: null,
      error: null,
      eventsInRange: 0,
      tasksInRange: 0,
    })
  }

  void start
  void end
  return rows
}

function buildInsights(input: {
  dailyWorkMix: { day: string; focus: number; meetings: number }[]
  meetingHoursCurrent: number
  focusHoursCurrent: number
  staleTasks: number
  calendarSyncs: { lastSyncError: string | null; syncEnabled: boolean }[]
  tasksCompletedCurrent: number
  bestFocusDay: string | null
  busiestMeetingDay: string | null
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = []

  if (input.bestFocusDay && input.focusHoursCurrent > 0) {
    const best = input.dailyWorkMix.reduce((a, b) => (b.focus > a.focus ? b : a))
    insights.push({
      type: "success",
      title: "Best focus day",
      description: `${input.bestFocusDay} had ${best.focus.toFixed(1)}h of focus time — your highest this period.`,
      action: `Protect ${input.bestFocusDay} with a recurring focus block.`,
      impact: "+focus consistency",
    })
  }

  if (input.busiestMeetingDay && input.meetingHoursCurrent > 0) {
    const busiest = input.dailyWorkMix.reduce((a, b) => (b.meetings > a.meetings ? b : a))
    if (busiest.meetings > 0) {
      insights.push({
        type: "warning",
        title: "Meeting-heavy day",
        description: `${input.busiestMeetingDay} had ${busiest.meetings.toFixed(1)}h of meetings.`,
        action: "Move or shorten optional syncs on that day.",
        impact: "+focus time",
      })
    }
  }

  if (input.staleTasks > 0) {
    insights.push({
      type: "warning",
      title: "Stale open tasks",
      description: `${input.staleTasks} open task${input.staleTasks === 1 ? "" : "s"} haven't been updated in over a week.`,
      action: "Review or close stale items in Tasks.",
      impact: "clearer backlog",
    })
  }

  const syncErrors = input.calendarSyncs.filter((s) => s.syncEnabled && s.lastSyncError)
  if (syncErrors.length > 0) {
    insights.push({
      type: "info",
      title: "Calendar sync needs attention",
      description: `${syncErrors.length} calendar sync${syncErrors.length === 1 ? "" : "s"} reported errors recently.`,
      action: "Reconnect or refresh your calendar integration in Settings.",
      impact: "accurate schedule",
    })
  }

  if (input.tasksCompletedCurrent > 0) {
    insights.push({
      type: "success",
      title: "Task momentum",
      description: `You completed ${input.tasksCompletedCurrent} task${input.tasksCompletedCurrent === 1 ? "" : "s"} this period.`,
      action: "Keep batching similar work to maintain throughput.",
      impact: "steady progress",
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Getting started",
      description: "Connect calendar and tasks to see personalized insights here.",
      action: "Sync your calendar and create a few tasks to build your baseline.",
      impact: "better visibility",
    })
  }

  return insights.slice(0, 4)
}
