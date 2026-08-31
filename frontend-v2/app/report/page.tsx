"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { submitFir, type FirInput, type LegalAnalysis } from "@/lib/api"
import { formatConfidence } from "@/lib/utils"
import { CheckCircle2, Loader2, Mail, MailWarning, AlertTriangle } from "lucide-react"
import Link from "next/link"

const emptyForm: FirInput = {
  complainantName: "",
  complainantEmail: "",
  incidentDate: "",
  location: "",
  description: "",
}

export default function ReportPage() {
  const [form, setForm] = useState<FirInput>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    firId: string
    firNumber: string
    analysis: LegalAnalysis
    emailSent: boolean
    aiAvailable: boolean
  } | null>(null)

  function update<K extends keyof FirInput>(key: K, value: FirInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await submitFir(form)
      setResult({
        firId: response.fir.id,
        firNumber: response.fir.firNumber,
        analysis: response.analysis,
        emailSent: response.emailSent,
        aiAvailable: response.aiAvailable,
      })
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit the FIR.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="glass border-success/30">
            <CardHeader>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle>FIR Registered</CardTitle>
              </div>
              <CardDescription>
                FIR number <span className="font-mono text-foreground">{result.firNumber}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                {result.emailSent ? (
                  <>
                    <Mail className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">Confirmation email sent.</span>
                  </>
                ) : (
                  <>
                    <MailWarning className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">
                      FIR saved, but the confirmation email could not be sent.
                    </span>
                  </>
                )}
              </div>

              {!result.aiAvailable && (
                <div className="flex items-start gap-2 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>AI legal analysis was unavailable when this FIR was filed.</span>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Summary</p>
                <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>
              </div>

              {result.analysis.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Suggested legal sections</p>
                  <div className="space-y-2">
                    {result.analysis.recommendations.map((rec, i) => (
                      <div key={i} className="rounded-lg border border-border/50 p-3 bg-muted/30">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {rec.law} &middot; {rec.section}
                          </span>
                          <Badge variant="outline">{formatConfidence(rec.confidence)}% confidence</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.analysis.victimActions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recommended next steps</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {result.analysis.victimActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                {result.analysis.disclaimer}
              </p>

              <div className="flex gap-3 pt-2">
                <Link href={`/cases/${result.firId}`}>
                  <Button>View Case</Button>
                </Link>
                <Button variant="outline" onClick={() => setResult(null)}>
                  File Another Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File a Report</h1>
          <p className="text-muted-foreground">
            Submit a First Information Report. It will be reviewed by AI for relevant legal
            sections and registered immediately.
          </p>
        </div>

        <Card className="glass">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complainantName">Your name</Label>
                  <Input
                    id="complainantName"
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.complainantName}
                    onChange={(e) => update("complainantName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantEmail">Email</Label>
                  <Input
                    id="complainantEmail"
                    type="email"
                    required
                    value={form.complainantEmail}
                    onChange={(e) => update("complainantEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Incident date</Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    required
                    value={form.incidentDate}
                    onChange={(e) => update("incidentDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    required
                    minLength={2}
                    maxLength={300}
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What happened</Label>
                <Textarea
                  id="description"
                  required
                  minLength={20}
                  maxLength={10000}
                  rows={8}
                  placeholder="Describe the incident in as much detail as possible..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {form.description.length}/10000 characters (minimum 20)
                </p>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting and running AI analysis...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
