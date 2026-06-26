"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  Brain,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Scale,
  FileCheck,
  Users,
  Calendar,
  MapPin,
} from "lucide-react"

const recentCases = [
  { id: "FIR-2024-001234", complainant: "Ramesh Kumar", date: "2024-01-15", status: "Submitted", severity: "High" },
  { id: "FIR-2024-001233", complainant: "Priya Sharma", date: "2024-01-14", status: "Under Review", severity: "Medium" },
  { id: "FIR-2024-001232", complainant: "Amit Singh", date: "2024-01-13", status: "Verified", severity: "Low" },
  { id: "FIR-2024-001231", complainant: "Sunita Devi", date: "2024-01-12", status: "Submitted", severity: "High" },
]

const predictedSections = [
  { section: "Section 420 IPC", description: "Cheating and dishonestly inducing delivery of property", confidence: 92 },
  { section: "Section 406 IPC", description: "Criminal breach of trust", confidence: 87 },
  { section: "Section 34 IPC", description: "Acts done by several persons in furtherance of common intention", confidence: 78 },
  { section: "Section 120B IPC", description: "Punishment of criminal conspiracy", confidence: 65 },
]

export default function PoliceDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const [incidentDescription, setIncidentDescription] = useState("")

  const handleAnalyze = () => {
    if (!incidentDescription) return
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowPredictions(true)
    }, 2000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Police Dashboard</h1>
            <p className="text-muted-foreground">File FIRs and manage evidence with AI assistance</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              System Online
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total FIRs Today", value: "24", icon: FileText, trend: "+12%" },
            { label: "Pending Review", value: "8", icon: Clock, trend: "-5%" },
            { label: "Evidence Uploaded", value: "156", icon: Upload, trend: "+23%" },
            { label: "AI Predictions", value: "89%", icon: Brain, trend: "+2%" },
          ].map((stat) => (
            <Card key={stat.label} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.trend} from yesterday</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* FIR Entry Form */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                New FIR Entry
              </CardTitle>
              <CardDescription>Fill in the details to register a new First Information Report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complainant" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Complainant Name
                  </Label>
                  <Input id="complainant" placeholder="Enter full name" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date of Incident
                  </Label>
                  <Input id="date" type="date" className="bg-background/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </Label>
                <Input id="location" placeholder="Enter incident location" className="bg-background/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Incident Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the incident in detail..."
                  rows={5}
                  value={incidentDescription}
                  onChange={(e) => {
                    setIncidentDescription(e.target.value)
                    setShowPredictions(false)
                  }}
                  className="bg-background/50"
                />
              </div>

              {/* Evidence Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  Upload Evidence
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Drag and drop files here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse (Images, Videos, Documents)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleAnalyze}
                  disabled={!incidentDescription || isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analyze Sections
                    </>
                  )}
                </Button>
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Send className="h-4 w-4 mr-2" />
                  Submit FIR
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Predictions Panel */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                AI Predicted Legal Sections
              </CardTitle>
              <CardDescription>Based on incident description analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {!showPredictions ? (
                <div className="text-center py-8">
                  <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Enter incident description and click &quot;AI Analyze Sections&quot; to get predictions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {predictedSections.map((section) => (
                    <div
                      key={section.section}
                      className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">{section.section}</span>
                        <Badge
                          variant="outline"
                          className={
                            section.confidence >= 85
                              ? "bg-success/10 text-success border-success/20"
                              : section.confidence >= 70
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {section.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      AI predictions are suggestions only. Please verify with legal experts.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-accent" />
              Recent FIR Submissions
            </CardTitle>
            <CardDescription>View and track your recent case filings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Case ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Complainant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Severity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{caseItem.id}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{caseItem.complainant}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{caseItem.date}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            caseItem.status === "Verified"
                              ? "bg-success/10 text-success border-success/20"
                              : caseItem.status === "Under Review"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }
                        >
                          {caseItem.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            caseItem.severity === "High"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : caseItem.severity === "Medium"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {caseItem.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
