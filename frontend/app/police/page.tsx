"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { analyzeFir, FIR_STATUSES, FirStatus, getRecentFirs, LegalAnalysis, submitFir, updateFirStatus, FirSummary } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { AlertTriangle, Brain, Calendar, CheckCircle2, Clock, FileCheck, FileText, Loader2, Mail, MapPin, Scale, Send, Users } from "lucide-react"

const emptyForm = { complainantName: "", complainantEmail: "", incidentDate: "", location: "", description: "" }

export default function PoliceDashboard() {
  const [form, setForm] = useState(emptyForm)
  const [analysis, setAnalysis] = useState<LegalAnalysis | null>(null)
  const [recentCases, setRecentCases] = useState<FirSummary[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingFirId, setUpdatingFirId] = useState<string | null>(null)

  const loadRecentFirs = useCallback(async () => {
    try {
      const { firs } = await getRecentFirs()
      setRecentCases(firs)
    } catch {
      // The FIR form remains usable if the API has not been configured yet.
    }
  }, [])

  useEffect(() => { void loadRecentFirs() }, [loadRecentFirs])

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === "description" || field === "incidentDate" || field === "location") setAnalysis(null)
  }

  async function handleAnalyze() {
    if (!form.description || !form.incidentDate || !form.location) {
      toast.error("Add the incident date, location, and description before analysis.")
      return
    }
    setIsAnalyzing(true)
    try {
      setAnalysis(await analyzeFir(form))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI analysis failed.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await submitFir(form)
      setAnalysis(result.analysis)
      setForm(emptyForm)
      toast.success(`FIR ${result.fir.firNumber} has been registered.${result.emailSent ? " A confirmation email was sent." : ""}`)
      await loadRecentFirs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "FIR registration failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange(id: string, status: FirStatus) {
    setUpdatingFirId(id)
    try {
      const { fir } = await updateFirStatus(id, status)
      setRecentCases((current) => current.map((item) => item.id === id ? fir : item))
      toast.success(`${fir.firNumber} marked as ${status}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed.")
    } finally {
      setUpdatingFirId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Police Dashboard</h1><p className="text-muted-foreground">Register FIRs and receive AI-assisted legal information</p></div>
          <Badge variant="outline" className="w-fit bg-success/10 text-success border-success/20 px-3 py-1"><CheckCircle2 className="h-3 w-3 mr-1" />System Online</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />New FIR Entry</CardTitle><CardDescription>Details are securely registered and a confirmation email is sent to the complainant.</CardDescription></CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Complainant Name" icon={Users}><Input required value={form.complainantName} onChange={(e) => updateField("complainantName", e.target.value)} placeholder="Enter full name" /></Field>
                  <Field label="Complainant Email" icon={Mail}><Input required type="email" value={form.complainantEmail} onChange={(e) => updateField("complainantEmail", e.target.value)} placeholder="name@example.com" /></Field>
                  <Field label="Date of Incident" icon={Calendar}><Input required type="date" value={form.incidentDate} onChange={(e) => updateField("incidentDate", e.target.value)} /></Field>
                  <Field label="Location" icon={MapPin}><Input required value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Enter incident location" /></Field>
                </div>
                <Field label="Incident Description" icon={FileText}><Textarea required minLength={20} rows={6} value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe the incident in detail..." /></Field>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="button" variant="outline" onClick={handleAnalyze} disabled={isAnalyzing || isSubmitting} className="flex-1">{isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing...</> : <><Brain className="h-4 w-4 mr-2" />AI Analyse Actions</>}</Button>
                  <Button type="submit" disabled={isSubmitting || isAnalyzing} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">{isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering...</> : <><Send className="h-4 w-4 mr-2" />Submit FIR</>}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-accent" />Suggested Legal Actions</CardTitle><CardDescription>Generated from this FIR&apos;s narrative</CardDescription></CardHeader><CardContent>{analysis ? <div className="space-y-4"><p className="text-sm text-muted-foreground">{analysis.summary}</p>{analysis.recommendations.map((item) => <div key={`${item.law}-${item.section}`} className="p-3 rounded-lg bg-background/50 border border-border/50"><div className="flex justify-between gap-2"><span className="font-medium text-sm">{item.section}</span><Badge variant="outline">{item.confidence}%</Badge></div><p className="text-xs text-accent mt-1">{item.law}: {item.title}</p><p className="text-xs text-muted-foreground mt-2">{item.rationale}</p></div>)}<div className="border-t pt-3"><p className="text-sm font-medium mb-2">Practical next steps</p>{analysis.victimActions.map((action) => <p className="text-xs text-muted-foreground mb-2" key={action}>{action}</p>)}</div><p className="text-xs text-muted-foreground flex gap-1"><AlertTriangle className="h-3 w-3 shrink-0" />{analysis.disclaimer}</p></div> : <div className="text-center py-8"><Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground">Complete the incident details and use AI Analyse Actions.</p></div>}</CardContent></Card>
        </div>

        <Card className="glass"><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-accent" />Recent FIR Registrations</CardTitle><CardDescription>Loaded from the FIR registry. Police can update the active case status.</CardDescription></CardHeader><CardContent>{recentCases.length === 0 ? <p className="text-sm text-muted-foreground py-4">No FIR registrations found yet.</p> : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border"><th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">FIR Number</th><th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Complainant</th><th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Incident Date</th><th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Case Status</th></tr></thead><tbody>{recentCases.map((fir) => <tr key={fir.id} className="border-b border-border/50"><td className="py-3 px-4 font-mono text-sm">{fir.firNumber}</td><td className="py-3 px-4 text-sm">{fir.complainantName}</td><td className="py-3 px-4 text-sm text-muted-foreground">{fir.incidentDate}</td><td className="py-3 px-4 min-w-48"><Select value={fir.status} onValueChange={(value) => void handleStatusChange(fir.id, value as FirStatus)} disabled={updatingFirId === fir.id}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{FIR_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></td></tr>)}</tbody></table></div>}</CardContent></Card>
      </div>
    </DashboardLayout>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Users; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" />{label}</Label>{children}</div>
}
