"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getFirs, type FirSummary } from "@/lib/api"
import { Loader2, FileText, RefreshCw } from "lucide-react"

const statusColor: Record<string, string> = {
  Registered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Under Review": "bg-warning/10 text-warning border-warning/20",
  "Investigation Open": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Evidence Pending": "bg-warning/10 text-warning border-warning/20",
  "Charge Sheet Filed": "bg-accent/10 text-accent border-accent/20",
  Closed: "bg-success/10 text-success border-success/20",
}

export default function CasesPage() {
  const [firs, setFirs] = useState<FirSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(50)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getFirs(limit)
      setFirs(result.firs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cases.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
            <p className="text-muted-foreground">
              Filed reports, most recent first (up to {limit}).
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              All Cases
            </CardTitle>
            <CardDescription>The backend only supports fetching a limited, most-recent set (no search or filters yet).</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : firs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No cases yet. <Link href="/report" className="text-accent hover:underline">File the first report.</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {firs.map((fir) => (
                  <Link
                    key={fir.id}
                    href={`/cases/${fir.id}`}
                    className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium font-mono text-sm">{fir.firNumber}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {fir.complainantName} &middot; {fir.incidentDate}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColor[fir.status] ?? ""}>
                      {fir.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
