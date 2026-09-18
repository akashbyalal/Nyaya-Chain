"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { BarChart3, CheckCircle2, Clock3, FileText, RefreshCw, ShieldCheck } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { getFirs, FIR_STATUSES, type FirSummary } from "@/lib/api"

type Range = "30" | "90" | "180" | "all"

const statusColors: Record<string, string> = {
  Registered: "var(--chart-1)",
  "Under Review": "var(--chart-2)",
  "Investigation Open": "var(--chart-5)",
  "Evidence Pending": "var(--warning)",
  "Charge Sheet Filed": "var(--chart-3)",
  Closed: "var(--success)",
}

const trendConfig = { registrations: { label: "Registrations", color: "var(--chart-2)" } } satisfies ChartConfig
const statusConfig = { cases: { label: "Cases", color: "var(--chart-1)" } } satisfies ChartConfig

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function labelForMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date)
}

function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

function StatCard({ title, value, detail, icon: Icon }: { title: string; value: string | number; detail: string; icon: typeof FileText }) {
  return (
    <Card className="glass">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [firs, setFirs] = useState<FirSummary[]>([])
  const [range, setRange] = useState<Range>("180")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await getFirs(50)
      setFirs(result.firs)
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const data = useMemo(() => {
    const today = startOfDay(new Date())
    const cutoff = range === "all" ? null : new Date(today.getTime() - Number(range) * 86_400_000)
    const filtered = cutoff
      ? firs.filter((fir) => {
          const createdAt = new Date(fir.createdAt)
          return !Number.isNaN(createdAt.getTime()) && createdAt >= cutoff
        })
      : firs

    const statuses = FIR_STATUSES.map((status) => ({
      name: status,
      cases: filtered.filter((fir) => fir.status === status).length,
      fill: statusColors[status],
    }))
    const active = filtered.filter((fir) => fir.status !== "Closed").length
    const closed = filtered.filter((fir) => fir.status === "Closed").length
    const monthCount = range === "30" ? 1 : range === "90" ? 3 : range === "180" ? 6 : 6
    const months = Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1 - index), 1)
      return { key: `${date.getFullYear()}-${date.getMonth()}`, month: labelForMonth(date), registrations: 0 }
    })
    const byMonth = new Map(months.map((entry) => [entry.key, entry]))
    filtered.forEach((fir) => {
      const createdAt = new Date(fir.createdAt)
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`
      const entry = byMonth.get(key)
      if (entry) entry.registrations += 1
    })

    return { filtered, statuses, active, closed, months }
  }, [firs, range])

  const timeLabel = updatedAt
    ? `Updated ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(updatedAt)}`
    : "Loading current data"

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-accent" />
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            </div>
            <p className="mt-1 text-muted-foreground">Operational overview of FIR registrations and case progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(value) => setRange(value as Range)}>
              <SelectTrigger aria-label="Select analytics date range" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="all">All loaded cases</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Refresh analytics">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total cases" value={data.filtered.length} detail="In selected time period" icon={FileText} />
          <StatCard title="Active cases" value={data.active} detail="Excluding closed cases" icon={Clock3} />
          <StatCard title="Closed cases" value={data.closed} detail="Marked as closed" icon={CheckCircle2} />
          <StatCard title="Closure rate" value={data.filtered.length ? `${Math.round((data.closed / data.filtered.length) * 100)}%` : "0%"} detail="Closed of all selected cases" icon={ShieldCheck} />
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <Card className="glass xl:col-span-3">
            <CardHeader>
              <CardTitle>Registration trend</CardTitle>
              <CardDescription>FIRs registered by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendConfig} className="h-[280px] w-full aspect-auto">
                <LineChart data={data.months} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line type="monotone" dataKey="registrations" stroke="var(--color-registrations)" strokeWidth={3} dot={{ fill: "var(--color-registrations)", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="glass xl:col-span-2">
            <CardHeader>
              <CardTitle>Case status</CardTitle>
              <CardDescription>Distribution across the current pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusConfig} className="h-[280px] w-full aspect-auto">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={data.statuses.filter((item) => item.cases > 0)} dataKey="cases" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                    {data.statuses.filter((item) => item.cases > 0).map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="glass lg:col-span-3">
            <CardHeader>
              <CardTitle>Pipeline breakdown</CardTitle>
              <CardDescription>Cases at each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusConfig} className="h-[250px] w-full aspect-auto">
                <BarChart data={data.statuses} layout="vertical" margin={{ top: 0, right: 12, left: 28, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={122} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="cases" radius={[0, 4, 4, 0]}>
                    {data.statuses.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle>Latest registration</CardTitle>
              <CardDescription>{timeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">Loading analytics...</div>
              ) : data.filtered[0] ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <p className="font-mono text-sm font-medium">{data.filtered[0].firNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{data.filtered[0].complainantName}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Filed {dateLabel(data.filtered[0].createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current status</span>
                    <span className="font-medium">{data.filtered[0].status}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-[210px] items-center justify-center text-center text-sm text-muted-foreground">No registrations in this period.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="pb-2 text-xs text-muted-foreground">Metrics are calculated from the latest {firs.length || 0} FIRs available through the current API.</p>
      </div>
    </DashboardLayout>
  )
}
