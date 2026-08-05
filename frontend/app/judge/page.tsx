"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Search,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Hash,
  Shield,
  FileCheck,
  Clock,
  Download,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
} from "lucide-react"

interface VerificationResult {
  caseId: string
  fileName: string
  originalHash: string
  currentHash: string
  blockchainTimestamp: string
  status: "verified" | "tampered" | "pending"
  uploadedBy: string
  chainOfCustody: number
}

const recentVerifications: VerificationResult[] = [
  {
    caseId: "FIR-2024-001234",
    fileName: "crime_scene_photo_001.jpg",
    originalHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    currentHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    blockchainTimestamp: "2024-01-15 14:32:05",
    status: "verified",
    uploadedBy: "SI Vikram Sharma",
    chainOfCustody: 4,
  },
  {
    caseId: "FIR-2024-001233",
    fileName: "bank_statement.pdf",
    originalHash: "0x3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
    currentHash: "0x3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
    blockchainTimestamp: "2024-01-14 09:15:30",
    status: "verified",
    uploadedBy: "Inspector Meera Joshi",
    chainOfCustody: 3,
  },
  {
    caseId: "FIR-2024-001230",
    fileName: "witness_video.mp4",
    originalHash: "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    currentHash: "0x8a5f6c2d1e3b4a09876543210fedcba987654321abcdef1234567890abcdef",
    blockchainTimestamp: "2024-01-10 16:45:00",
    status: "tampered",
    uploadedBy: "Constable Rahul Gupta",
    chainOfCustody: 5,
  },
  {
    caseId: "FIR-2024-001228",
    fileName: "forensic_report.pdf",
    originalHash: "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    currentHash: "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    blockchainTimestamp: "2024-01-08 11:20:00",
    status: "verified",
    uploadedBy: "Dr. Anjali Mehta",
    chainOfCustody: 2,
  },
]

export default function JudgeVerificationPage() {
  const [searchCaseId, setSearchCaseId] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  const handleVerify = () => {
    if (!searchCaseId) return
    setIsVerifying(true)
    setVerificationResult(null)
    
    setTimeout(() => {
      setIsVerifying(false)
      // Simulate finding a case
      const found = recentVerifications.find(v => v.caseId.toLowerCase().includes(searchCaseId.toLowerCase()))
      if (found) {
        setVerificationResult(found)
      } else {
        setVerificationResult({
          caseId: searchCaseId,
          fileName: "evidence_file.pdf",
          originalHash: "0x" + Math.random().toString(16).slice(2, 66),
          currentHash: "0x" + Math.random().toString(16).slice(2, 66),
          blockchainTimestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          status: Math.random() > 0.3 ? "verified" : "tampered",
          uploadedBy: "Unknown Officer",
          chainOfCustody: Math.floor(Math.random() * 5) + 1,
        })
      }
    }, 2000)
  }

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "tampered":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Tampered
          </Badge>
        )
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Judge Verification Dashboard</h1>
            <p className="text-muted-foreground">Verify evidence integrity using blockchain hash comparison</p>
          </div>
          <Badge variant="outline" className="w-fit bg-accent/10 text-accent border-accent/20 px-4 py-2">
            <Scale className="h-4 w-4 mr-2" />
            Judicial Access Level
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Verifications", value: "2,847", icon: FileCheck, color: "text-accent" },
            { label: "Verified Evidence", value: "2,792", icon: CheckCircle2, color: "text-success" },
            { label: "Tampered Files", value: "12", icon: AlertTriangle, color: "text-destructive" },
            { label: "Pending Review", value: "43", icon: Clock, color: "text-warning" },
          ].map((stat) => (
            <Card key={stat.label} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verification Search */}
        <Card className="glass overflow-hidden">
          <CardHeader className="bg-accent/5 border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" />
              Evidence Verification
            </CardTitle>
            <CardDescription>Enter a Case ID to verify evidence integrity against blockchain records</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="caseId">Case ID</Label>
                <Input
                  id="caseId"
                  placeholder="Enter Case ID (e.g., FIR-2024-001234)"
                  value={searchCaseId}
                  onChange={(e) => setSearchCaseId(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleVerify}
                  disabled={!searchCaseId || isVerifying}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-6"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div className={`
                p-6 rounded-xl border-2 transition-all duration-300
                ${verificationResult.status === "verified" 
                  ? "bg-success/5 border-success/30" 
                  : "bg-destructive/5 border-destructive/30"
                }
              `}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {verificationResult.status === "verified" ? (
                      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">
                        {verificationResult.status === "verified" ? "Evidence Verified" : "Evidence Tampered"}
                      </h3>
                      <p className="text-muted-foreground">
                        {verificationResult.status === "verified"
                          ? "The file hash matches the blockchain record. Evidence integrity confirmed."
                          : "WARNING: The file hash does not match the blockchain record. Evidence may have been modified."}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={verificationResult.status} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Case ID</p>
                      <p className="font-mono font-medium">{verificationResult.caseId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">File Name</p>
                      <p className="font-medium">{verificationResult.fileName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Uploaded By</p>
                      <p className="text-sm">{verificationResult.uploadedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Chain of Custody</p>
                      <p className="text-sm">{verificationResult.chainOfCustody} transfers</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        Original Hash (Blockchain)
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted/50 p-2 rounded flex-1 truncate">
                          {verificationResult.originalHash}
                        </code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        Current File Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <code className={`
                          text-xs font-mono p-2 rounded flex-1 truncate
                          ${verificationResult.status === "verified" ? "bg-success/10" : "bg-destructive/10"}
                        `}>
                          {verificationResult.currentHash}
                        </code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Blockchain Timestamp</p>
                      <p className="text-sm">{verificationResult.blockchainTimestamp}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Blockchain
                  </Button>
                  <Button variant="outline" onClick={() => setVerificationResult(null)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Search
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-accent" />
              Recent Verifications
            </CardTitle>
            <CardDescription>Your recent evidence verification history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Case ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">File</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Uploaded By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVerifications.map((item) => (
                    <tr key={`${item.caseId}-${item.fileName}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{item.caseId}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{item.fileName}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.blockchainTimestamp}</td>
                      <td className="py-3 px-4 text-sm">{item.uploadedBy}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => setVerificationResult(item)}>
                          View Details
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
