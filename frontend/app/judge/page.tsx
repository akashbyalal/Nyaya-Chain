"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ExternalLink,
  RefreshCw,
  Loader2,
  FileText,
} from "lucide-react";

import {
  getFirs,
  getEvidenceForFir,
  verifyEvidence,
  Evidence,
  FirSummary,
} from "@/lib/api";

type VerificationResult = {
  evidenceId: string;
  caseId: string;
  fileName: string;
  originalHash: string;
  currentHash: string;
  blockchainTimestamp: string | null;
  status: "verified" | "tampered";
  uploadedBy: string | null;
  transactionHash: string | null;
  fileHashMatches: boolean;
  blockchainExists: boolean;
};

export default function JudgeVerificationPage() {
  const [searchCaseId, setSearchCaseId] = useState("");

  const [matchedFir, setMatchedFir] = useState<FirSummary | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>("");

  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const caseId = searchCaseId.trim();

    if (!caseId) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setMatchedFir(null);
    setEvidence([]);
    setSelectedEvidenceId("");
    setVerificationResult(null);

    try {
      const { firs } = await getFirs(50);

      const found = firs.find(
        (fir) =>
          fir.firNumber.toLowerCase() === caseId.toLowerCase(),
      );

      if (!found) {
        setError(
          "FIR not found in the available FIR records.",
        );
        return;
      }

      setMatchedFir(found);

      setIsLoadingEvidence(true);

      try {
        const result = await getEvidenceForFir(found.id);
        setEvidence(result.evidence);

        if (result.evidence.length === 0) {
          setError(
            "This FIR does not have any evidence records.",
          );
        }
      } finally {
        setIsLoadingEvidence(false);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to search for the FIR.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleVerify() {
    if (!selectedEvidenceId) {
      setError("Select an evidence file before verification.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const result = await verifyEvidence(selectedEvidenceId);
      const verification = result.verification;

      setVerificationResult({
        evidenceId: verification.evidenceId,
        caseId: verification.firNumber,
        fileName:
          evidence.find(
            (item) => item.id === verification.evidenceId,
          )?.fileName ?? "Evidence file",
        originalHash: verification.originalHash,
        currentHash: verification.currentHash,
        blockchainTimestamp:
          verification.blockchain.timestamp,
        status: verification.status === "Verified"
          ? "verified"
          : "tampered",
        uploadedBy: verification.blockchain.uploadedBy,
        transactionHash: verification.blockchain.transactionHash,
        fileHashMatches: verification.fileHashMatches,
        blockchainExists: verification.blockchain.exists,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Evidence verification failed.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  function resetSearch() {
    setSearchCaseId("");
    setMatchedFir(null);
    setEvidence([]);
    setSelectedEvidenceId("");
    setVerificationResult(null);
    setError(null);
  }

  const StatusBadge = ({
    status,
  }: {
    status: string;
  }) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );

      case "tampered":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Tampered
          </Badge>
        );

      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Judge Verification Dashboard
            </h1>

            <p className="text-muted-foreground">
              Verify evidence integrity using blockchain hash comparison
            </p>
          </div>

          <Badge
            variant="outline"
            className="w-fit bg-accent/10 text-accent border-accent/20 px-4 py-2"
          >
            <Scale className="h-4 w-4 mr-2" />
            Judicial Access Level
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Verifications",
              value: "—",
              icon: FileCheck,
              color: "text-accent",
            },
            {
              label: "Verified Evidence",
              value: "—",
              icon: CheckCircle2,
              color: "text-success",
            },
            {
              label: "Tampered Files",
              value: "—",
              icon: AlertTriangle,
              color: "text-destructive",
            },
            {
              label: "Pending Review",
              value: "—",
              icon: Clock,
              color: "text-warning",
            },
          ].map((stat) => (
            <Card key={stat.label} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>

                    <p className="text-2xl font-bold mt-1">
                      {stat.value}
                    </p>
                  </div>

                  <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                    <stat.icon
                      className={`h-6 w-6 ${stat.color}`}
                    />
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

            <CardDescription>
              Enter an FIR number to retrieve its evidence records
              and verify evidence integrity against blockchain records.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* FIR Search */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="caseId">
                  FIR Number
                </Label>

                <Input
                  id="caseId"
                  placeholder="Enter FIR Number (e.g., FIR-2024-001234)"
                  value={searchCaseId}
                  onChange={(e) => {
                    setSearchCaseId(e.target.value);
                    setError(null);
                  }}
                  className="bg-background/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSearch();
                    }
                  }}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => void handleSearch()}
                  disabled={!searchCaseId.trim() || isSearching}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-6"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />

                  <p className="text-sm text-muted-foreground">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Matched FIR */}
            {matchedFir && (
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      FIR Found
                    </p>

                    <p className="font-mono font-medium mt-1">
                      {matchedFir.firNumber}
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      {matchedFir.complainantName}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {matchedFir.status}
                  </Badge>
                </div>
              </div>
            )}

            {/* Evidence Selection */}
            {matchedFir && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="evidence">
                    Select Evidence
                  </Label>

                  <p className="text-xs text-muted-foreground mt-1">
                    Select the evidence record you want to verify.
                  </p>
                </div>

                {isLoadingEvidence ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />

                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading evidence...
                    </span>
                  </div>
                ) : evidence.length > 0 ? (
                  <div className="space-y-2">
                    {evidence.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvidenceId(item.id);
                          setVerificationResult(null);
                          setError(null);
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedEvidenceId === item.id
                            ? "border-accent bg-accent/5"
                            : "border-border/50 bg-muted/20 hover:border-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-accent" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.fileName}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              {item.fileType}
                            </p>
                          </div>

                          <Badge variant="outline">
                            {item.verificationStatus}
                          </Badge>
                        </div>
                      </button>
                    ))}

                    <Button
                      onClick={() => void handleVerify()}
                      disabled={!selectedEvidenceId || isVerifying}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-4"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Verify Selected Evidence
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Verification Result */}
            {verificationResult && (
              <div
                className={`
                  p-6 rounded-xl border-2 transition-all duration-300
                  ${
                    verificationResult.status === "verified"
                      ? "bg-success/5 border-success/30"
                      : "bg-destructive/5 border-destructive/30"
                  }
                `}
              >
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
                        {verificationResult.status === "verified"
                          ? "Evidence Verified"
                          : "Evidence Tampered"}
                      </h3>

                      <p className="text-muted-foreground">
                        {verificationResult.status === "verified"
                          ? "The file hash matches the blockchain record. Evidence integrity confirmed."
                          : "WARNING: The file hash does not match the blockchain record. Evidence may have been modified."}
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status={verificationResult.status}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        FIR Number
                      </p>

                      <p className="font-mono font-medium">
                        {verificationResult.caseId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        File Name
                      </p>

                      <p className="font-medium">
                        {verificationResult.fileName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Blockchain Record
                      </p>

                      <p className="text-sm">
                        {verificationResult.blockchainExists
                          ? "Found"
                          : "Not found"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Hash Match
                      </p>

                      <p className="text-sm">
                        {verificationResult.fileHashMatches
                          ? "Matched"
                          : "Mismatch detected"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        Original Hash
                      </p>

                      <code className="block text-xs font-mono bg-muted/50 p-2 rounded break-all">
                        {verificationResult.originalHash}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        Current File Hash
                      </p>

                      <code
                        className={`
                          block text-xs font-mono p-2 rounded break-all
                          ${
                            verificationResult.status === "verified"
                              ? "bg-success/10"
                              : "bg-destructive/10"
                          }
                        `}
                      >
                        {verificationResult.currentHash}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Blockchain Timestamp
                      </p>

                      <p className="text-sm">
                        {verificationResult.blockchainTimestamp ??
                          "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Uploaded By
                      </p>

                      <p className="text-sm">
                        {verificationResult.uploadedBy ??
                          "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                {verificationResult.transactionHash && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Blockchain Transaction
                    </p>

                    <code className="block text-xs font-mono bg-muted/50 p-3 rounded break-all">
                      {verificationResult.transactionHash}
                    </code>
                  </div>
                )}

                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!verificationResult.transactionHash}
                    onClick={() => {
                      if (!verificationResult.transactionHash) {
                        return;
                      }

                      // Blockchain explorer URL depends on the deployed
                      // blockchain network. Keep this disabled until the
                      // network/explorer is configured.
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Blockchain
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setVerificationResult(null)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Verification
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current FIR Evidence */}
        {matchedFir && evidence.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-accent" />
                Evidence Records
              </CardTitle>

              <CardDescription>
                Evidence associated with {matchedFir.firNumber}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        File
                      </th>

                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Type
                      </th>

                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Uploaded
                      </th>

                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>

                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {evidence.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-sm">
                            {item.fileName}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.fileType}
                        </td>

                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(item.uploadedAt)}
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {item.verificationStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEvidenceId(item.id);
                              setVerificationResult(null);
                              setError(null);
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset */}
        {(matchedFir || verificationResult || error) && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={resetSearch}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );

    case "tampered":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Tampered
        </Badge>
      );

    default:
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}