"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import type { AnalyticsPayload } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const tooltipStyle = {
  backgroundColor: "var(--cf-bg-elev, var(--card))",
  border: "1px solid var(--cf-border, var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
}

type TimeRange = "week" | "month"

function TrendBadge({
  delta,
  trend,
  label,
  invert = false,
}: {
  delta: string
  trend: "up" | "down"
  label: string
  invert?: boolean
}) {
  const isPositive = invert ? trend === "down" : trend === "up"
  const Icon = isPositive ? ArrowUp : ArrowDown
  return (
    <div className="mt-1 flex items-center gap-1">
      <Icon className={cn("h-3 w-3", isPositive ? "text-[rgba(var(--cf-accent-rgb),1)]" : "text-red-500")} />
      <span className={cn("text-xs", isPositive ? "text-[rgba(var(--cf-accent-rgb),1)]" : "text-red-500")}>
        {delta} {label}
      </span>
    </div>
  )
}

function getInsightIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-[rgba(var(--cf-accent-rgb),1)]" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    default:
      return <Zap className="h-5 w-5 text-[rgba(var(--cf-primary-rgb),1)]" />
  }
}

function getInsightColor(type: string) {
  switch (type) {
    case "success":
      return "border-[rgba(var(--cf-accent-rgb),0.25)] bg-[rgba(var(--cf-accent-rgb),0.06)]"
    case "warning":
      return "border-amber-500/25 bg-amber-500/5"
    default:
      return "border-[rgba(var(--cf-primary-rgb),0.25)] bg-[rgba(var(--cf-primary-rgb),0.06)]"
  }
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week")
  const [tab, setTab] = useState("overview")
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async (range: TimeRange) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?range=${range}`)
      if (!res.ok) throw new Error("Failed to load analytics")
      setData(await res.json())
    } catch {
      setError("Could not load analytics. Try again in a moment.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAnalytics(timeRange)
  }, [timeRange, loadAnalytics])

  const totalTasksCompleted = useMemo(
    () => data?.tasksByDay.reduce((sum, row) => sum + row.completed, 0) ?? 0,
    [data],
  )

  if (loading && !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgba(var(--cf-accent-rgb),1)]" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void loadAnalytics(timeRange)}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const kpis = data.kpis

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="How your week actually went"
        subtitle="Focus time, meetings, and tasks — synced from your calendar and task list."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
              disabled={loading}
            >
              <SelectTrigger className="w-[140px] border-[var(--cf-border)] bg-[var(--cf-bg-soft)]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--cf-border)]"
              onClick={() => void loadAnalytics(timeRange)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="cf-surface-card border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Focus time</p>
                <p className="text-2xl font-bold text-[rgba(var(--cf-primary-rgb),1)]">{kpis.focusHours.value}</p>
                <TrendBadge {...kpis.focusHours} label={kpis.focusHours.label} />
              </div>
              <div className="rounded-lg bg-[rgba(var(--cf-primary-rgb),0.12)] p-2">
                <Clock className="h-5 w-5 text-[rgba(var(--cf-primary-rgb),1)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cf-surface-card border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meeting hours</p>
                <p className="text-2xl font-bold">{kpis.meetingHours.value}</p>
                <TrendBadge {...kpis.meetingHours} label={kpis.meetingHours.label} invert />
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cf-surface-card border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks completed</p>
                <p className="text-2xl font-bold text-[rgba(var(--cf-accent-rgb),1)]">{kpis.tasksCompleted.value}</p>
                <TrendBadge {...kpis.tasksCompleted} label={kpis.tasksCompleted.label} />
              </div>
              <div className="rounded-lg bg-[rgba(var(--cf-accent-rgb),0.12)] p-2">
                <Target className="h-5 w-5 text-[rgba(var(--cf-accent-rgb),1)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cf-surface-card border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">From email</p>
                <p className="text-2xl font-bold">{kpis.emailTasks.value}</p>
                <TrendBadge {...kpis.emailTasks} label={kpis.emailTasks.label} />
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg-soft)] px-4 py-3">
        <TrendingUp className="h-4 w-4 text-[rgba(var(--cf-accent-rgb),1)]" />
        <span className="text-sm text-[var(--cf-text-muted)]">
          {data.summary.bestFocusDay ? (
            <>
              Best focus day:{" "}
              <span className="font-semibold text-[var(--cf-text)]">{data.summary.bestFocusDay}</span>
            </>
          ) : (
            "No focus blocks recorded yet"
          )}
          {" · "}
          {data.summary.busiestMeetingDay ? (
            <>
              Busiest meeting day:{" "}
              <span className="font-medium text-[var(--cf-text)]">{data.summary.busiestMeetingDay}</span>
            </>
          ) : (
            "No meetings recorded yet"
          )}
          {" · "}
          <span className="font-medium text-[var(--cf-text)]">{data.summary.openTasks}</span> open tasks
          {data.summary.staleTasks > 0 && (
            <>
              {" "}
              (<span className="text-amber-600">{data.summary.staleTasks} stale</span>)
            </>
          )}
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-[var(--cf-bg-soft)] p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="cf-surface-card border-0">
              <CardHeader>
                <CardTitle className="text-base">Daily calendar mix</CardTitle>
                <CardDescription>Focus blocks and meetings per day</CardDescription>
              </CardHeader>
              <CardContent>
                {data.dailyWorkMix.some((d) => d.focus > 0 || d.meetings > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.dailyWorkMix}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit="h" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="focus" name="Focus" stackId="a" fill="rgba(var(--cf-primary-rgb), 0.85)" />
                      <Bar dataKey="meetings" name="Meetings" stackId="a" fill="#9333ea" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No calendar events in this period. Sync your calendar to see this chart.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="cf-surface-card border-0">
              <CardHeader>
                <CardTitle className="text-base">Task sources</CardTitle>
                <CardDescription>Where completed tasks originated</CardDescription>
              </CardHeader>
              <CardContent>
                {data.taskSources.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.taskSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.taskSources.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No completed tasks in this period.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="cf-surface-card border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Tasks completed</CardTitle>
                <CardDescription>
                  {totalTasksCompleted} task{totalTasksCompleted === 1 ? "" : "s"} completed this{" "}
                  {timeRange === "week" ? "week" : "month"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.tasksByDay.some((d) => d.completed > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.tasksByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        name="Tasks completed"
                        stroke="rgba(var(--cf-accent-rgb), 1)"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Complete a task to see your throughput trend.
                  </p>
                )}
              </CardContent>
            </Card>

            {data.meetingPatterns.length > 0 && (
              <Card className="cf-surface-card border-0 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Meetings by time of day</CardTitle>
                  <CardDescription>When your meetings tend to cluster</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.meetingPatterns}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Meetings" fill="rgba(var(--cf-accent-rgb), 0.75)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.integrations.map((item) => (
              <Card key={item.name} className="cf-surface-card border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[10px]",
                        item.error && "border-amber-500/50 text-amber-600",
                        item.connected && !item.error && "border-[rgba(var(--cf-accent-rgb),0.4)]",
                      )}
                    >
                      {item.connected ? (item.error ? "sync error" : "connected") : "not connected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Last successful sync: {formatSyncTime(item.lastSync)}
                  </p>
                  {item.error && (
                    <p className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-xs text-amber-700">
                      {item.error}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold tabular-nums">{item.eventsInRange}</p>
                      <p className="text-xs text-muted-foreground">calendar events</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-[rgba(var(--cf-accent-rgb),1)]">
                        {item.tasksInRange}
                      </p>
                      <p className="text-xs text-muted-foreground">tasks created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          <Card className="cf-surface-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-[rgba(var(--cf-accent-rgb),1)]" />
                Recommendations
              </CardTitle>
              <CardDescription>Based on your calendar and task patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.insights.map((insight) => (
                  <div
                    key={insight.title}
                    className={cn("rounded-lg border p-4", getInsightColor(insight.type))}
                  >
                    <div className="flex gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold">{insight.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                        <p className="mt-3 text-xs">
                          <span className="font-medium">Try: </span>
                          {insight.action}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          {insight.impact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
