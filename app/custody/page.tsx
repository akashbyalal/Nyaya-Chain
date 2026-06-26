"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Link2,
  Upload,
  Microscope,
  CheckCircle2,
  Scale,
  Shield,
  Clock,
  User,
  MapPin,
  FileText,
  Hash,
  ChevronRight,
} from "lucide-react"

interface CustodyEvent {
  id: string
  action: string
  actor: string
  role: string
  location: string
  timestamp: string
  status: "completed" | "current" | "pending"
  hash?: string
  notes?: string
}

const custodyTimeline: CustodyEvent[] = [
  {
    id: "1",
    action: "Evidence Collected",
    actor: "SI Vikram Sharma",
    role: "Investigating Officer",
    location: "Crime Scene - Sector 15, Noida",
    timestamp: "2024-01-15 09:30:00",
    status: "completed",
    hash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    notes: "Digital evidence collected from CCTV and mobile devices",
  },
  {
    id: "2",
    action: "Officer Uploaded",
    actor: "SI Vikram Sharma",
    role: "Investigating Officer",
    location: "Police Station - Sector 20, Noida",
    timestamp: "2024-01-15 11:45:00",
    status: "completed",
    hash: "0x3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
    notes: "Evidence uploaded to Nyaya-Chain system with metadata",
  },
  {
    id: "3",
    action: "Forensic Review",
    actor: "Dr. Anjali Mehta",
    role: "Forensic Expert",
    location: "State Forensic Lab, Delhi",
    timestamp: "2024-01-16 14:20:00",
    status: "completed",
    hash: "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    notes: "Digital forensic analysis completed. Evidence authenticity confirmed.",
  },
  {
    id: "4",
    action: "Court Submitted",
    actor: "PP Rajesh Kumar",
    role: "Public Prosecutor",
    location: "District Court, Gautam Buddh Nagar",
    timestamp: "2024-01-18 10:00:00",
    status: "current",
    hash: "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    notes: "Evidence submitted for court proceedings",
  },
  {
    id: "5",
    action: "Judge Verification",
    actor: "Hon. Justice Priya Singh",
    role: "Presiding Judge",
    location: "District Court, Gautam Buddh Nagar",
    timestamp: "Pending",
    status: "pending",
    notes: "Awaiting judicial verification of evidence integrity",
  },
]

const caseDetails = {
  caseId: "FIR-2024-001234",
  title: "Financial Fraud Investigation",
  filedDate: "2024-01-15",
  evidenceCount: 12,
  currentStatus: "Under Court Review",
  lastUpdated: "2024-01-18 10:00:00",
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-success" />
    case "current":
      return <Clock className="h-5 w-5 text-accent animate-pulse" />
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
  }
}

const RoleIcon = ({ role }: { role: string }) => {
  if (role.includes("Officer")) return <Shield className="h-4 w-4" />
  if (role.includes("Forensic")) return <Microscope className="h-4 w-4" />
  if (role.includes("Prosecutor")) return <FileText className="h-4 w-4" />
  if (role.includes("Judge")) return <Scale className="h-4 w-4" />
  return <User className="h-4 w-4" />
}

export default function ChainOfCustodyPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCase] = useState(caseDetails)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chain of Custody</h1>
            <p className="text-muted-foreground">Track complete evidence handling history with blockchain verification</p>
          </div>
        </div>

        {/* Search */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Case ID, Evidence ID, or Officer Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Case Details */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Case Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Case ID</p>
                <p className="font-mono font-medium">{selectedCase.caseId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Title</p>
                <p className="font-medium">{selectedCase.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Filed Date</p>
                  <p className="text-sm">{selectedCase.filedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Evidence Count</p>
                  <p className="text-sm">{selectedCase.evidenceCount} files</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Status</p>
                <Badge variant="outline" className="mt-1 bg-accent/10 text-accent border-accent/20">
                  {selectedCase.currentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
                <p className="text-sm">{selectedCase.lastUpdated}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full">
                  View All Evidence
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chain of Custody Timeline */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-accent" />
                Evidence Timeline
              </CardTitle>
              <CardDescription>Complete chain of custody with blockchain verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-border" />

                <div className="space-y-6">
                  {custodyTimeline.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4">
                      {/* Status indicator */}
                      <div className={`
                        relative z-10 flex items-center justify-center h-11 w-11 rounded-full shrink-0
                        ${event.status === "completed" ? "bg-success/10" : event.status === "current" ? "bg-accent/10" : "bg-muted"}
                      `}>
                        <StatusIcon status={event.status} />
                      </div>

                      {/* Content */}
                      <div className={`
                        flex-1 p-4 rounded-lg border transition-all
                        ${event.status === "current" 
                          ? "bg-accent/5 border-accent/30 shadow-lg shadow-accent/10" 
                          : event.status === "completed" 
                          ? "bg-muted/30 border-border/50" 
                          : "bg-muted/20 border-border/30 opacity-60"
                        }
                      `}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold">{event.action}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <RoleIcon role={event.role} />
                              <span>{event.actor}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <span>{event.role}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              event.status === "completed"
                                ? "bg-success/10 text-success border-success/20"
                                : event.status === "current"
                                ? "bg-accent/10 text-accent border-accent/20"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {event.status === "completed" ? "Verified" : event.status === "current" ? "In Progress" : "Pending"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{event.timestamp}</span>
                        </div>

                        {event.hash && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                            <Hash className="h-3 w-3" />
                            <code className="font-mono truncate">{event.hash}</code>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto">
                              Verify
                            </Button>
                          </div>
                        )}

                        {event.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">&quot;{event.notes}&quot;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Completed & Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                </div>
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
