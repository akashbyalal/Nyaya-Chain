"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileImage,
  FileVideo,
  FileText,
  CheckCircle2,
  Clock,
  Hash,
  Cloud,
  Link2,
  Trash2,
  Eye,
  Download,
  Shield,
  HardDrive,
  Loader2,
} from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  type: "image" | "video" | "document"
  size: string
  hash: string
  ipfsStatus: "uploading" | "uploaded" | "failed"
  blockchainStatus: "pending" | "confirmed" | "failed"
  timestamp: string
}

const uploadedFiles: UploadedFile[] = [
  {
    id: "1",
    name: "crime_scene_photo_001.jpg",
    type: "image",
    size: "2.4 MB",
    hash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    ipfsStatus: "uploaded",
    blockchainStatus: "confirmed",
    timestamp: "2024-01-15 14:32:05",
  },
  {
    id: "2",
    name: "witness_statement.pdf",
    type: "document",
    size: "845 KB",
    hash: "0x3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
    ipfsStatus: "uploaded",
    blockchainStatus: "confirmed",
    timestamp: "2024-01-15 14:28:12",
  },
  {
    id: "3",
    name: "surveillance_footage.mp4",
    type: "video",
    size: "156 MB",
    hash: "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    ipfsStatus: "uploading",
    blockchainStatus: "pending",
    timestamp: "2024-01-15 14:35:00",
  },
  {
    id: "4",
    name: "medical_report.pdf",
    type: "document",
    size: "1.2 MB",
    hash: "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    ipfsStatus: "uploaded",
    blockchainStatus: "pending",
    timestamp: "2024-01-15 14:30:45",
  },
]

const FileIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "image":
      return <FileImage className="h-8 w-8 text-blue-400" />
    case "video":
      return <FileVideo className="h-8 w-8 text-purple-400" />
    default:
      return <FileText className="h-8 w-8 text-accent" />
  }
}

export default function EvidenceUploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    simulateUpload()
  }

  const simulateUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Upload</h1>
          <p className="text-muted-foreground">Securely upload and manage digital evidence with blockchain verification</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Files", value: "1,247", icon: HardDrive, color: "text-blue-400" },
            { label: "IPFS Stored", value: "1,198", icon: Cloud, color: "text-purple-400" },
            { label: "Blockchain Verified", value: "1,142", icon: Link2, color: "text-accent" },
            { label: "Storage Used", value: "48.2 GB", icon: Shield, color: "text-success" },
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                Upload Evidence Files
              </CardTitle>
              <CardDescription>
                Drag and drop files or click to browse. All files are encrypted and stored on IPFS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && simulateUpload()}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                  ${isDragging ? "border-accent bg-accent/10 scale-[1.02]" : "border-border hover:border-accent/50 hover:bg-muted/30"}
                  ${isUploading ? "pointer-events-none" : ""}
                `}
              >
                {isUploading ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto text-accent animate-spin" />
                    <div>
                      <p className="font-medium">Uploading files...</p>
                      <p className="text-sm text-muted-foreground">Encrypting and storing on IPFS</p>
                    </div>
                    <div className="max-w-xs mx-auto">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% complete</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-lg font-medium mb-1">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      Supports images, videos, and documents up to 500MB each
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        <span>Images</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileVideo className="h-4 w-4" />
                        <span>Videos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Documents</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Processing Info */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <Hash className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium">SHA-256 Hashing</p>
                    <p className="text-xs text-muted-foreground">Cryptographic verification</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <Cloud className="h-5 w-5 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">IPFS Storage</p>
                    <p className="text-xs text-muted-foreground">Distributed file system</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <Link2 className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Blockchain Record</p>
                    <p className="text-xs text-muted-foreground">Immutable timestamp</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Status */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Upload Status
              </CardTitle>
              <CardDescription>Real-time file processing status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Files in Queue</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing</span>
                  <span className="font-medium text-warning">1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-success">2</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">Current Processing</p>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 text-warning animate-spin" />
                    <span className="text-sm font-medium">surveillance_footage.mp4</span>
                  </div>
                  <Progress value={67} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-2">Uploading to IPFS... 67%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uploaded Files */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-accent" />
              Uploaded Evidence Files
            </CardTitle>
            <CardDescription>View and manage your uploaded evidence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-accent/30 transition-colors"
                >
                  <div className="shrink-0">
                    <FileIcon type={file.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                      <span className="text-xs text-muted-foreground">{file.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <code className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {file.hash}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        file.ipfsStatus === "uploaded"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : file.ipfsStatus === "uploading"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }
                    >
                      <Cloud className="h-3 w-3 mr-1" />
                      {file.ipfsStatus === "uploaded" ? "IPFS" : file.ipfsStatus === "uploading" ? "Uploading..." : "Failed"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        file.blockchainStatus === "confirmed"
                          ? "bg-success/10 text-success border-success/20"
                          : file.blockchainStatus === "pending"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }
                    >
                      {file.blockchainStatus === "confirmed" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {file.blockchainStatus === "confirmed" ? "Verified" : file.blockchainStatus === "pending" ? "Pending" : "Failed"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
