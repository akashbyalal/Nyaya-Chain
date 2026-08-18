"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Scale,
  Shield,
  User,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  getFir,
  FirDetails,
  
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FirDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [data, setData] = useState<FirDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFir() {
      if (!id) {
        setError("No FIR ID was provided.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await getFir(id);
        setData(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load FIR details.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadFir();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-accent" />

            <p className="mt-4 text-sm text-muted-foreground">
              Loading FIR details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="glass max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-4" />

              <h2 className="text-lg font-semibold">
                Unable to load FIR
              </h2>

              <p className="text-sm text-muted-foreground mt-2">
                {error ?? "FIR details could not be found."}
              </p>

              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { fir, evidence } = data;

  const statusIsClosed = fir.status === "Closed";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              className="px-0 mb-3"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Police Dashboard
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {fir.firNumber}
                </h1>

                <p className="text-muted-foreground">
                  FIR Registration Details
                </p>
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className={
              statusIsClosed
                ? "w-fit px-4 py-2 bg-muted text-muted-foreground"
                : "w-fit px-4 py-2 bg-accent/10 text-accent border-accent/20"
            }
          >
            {statusIsClosed ? (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}

            {fir.status}
          </Badge>
        </div>

        {/* FIR Overview */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                FIR Information
              </CardTitle>

              <CardDescription>
                Registered information associated with this FIR.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <InfoItem
                  icon={User}
                  label="Complainant"
                  value={fir.complainantName}
                />

                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={fir.complainantEmail}
                />

                <InfoItem
                  icon={Calendar}
                  label="Incident Date"
                  value={formatDate(fir.incidentDate)}
                />

                <InfoItem
                  icon={MapPin}
                  label="Location"
                  value={fir.location}
                />

                <InfoItem
                  icon={Clock}
                  label="Registered On"
                  value={formatDateTime(fir.createdAt)}
                />

                <InfoItem
                  icon={Shield}
                  label="Current Status"
                  value={fir.status}
                />
              </div>
            </CardContent>
          </Card>

          {/* FIR ID */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Record Identity
              </CardTitle>

              <CardDescription>
                Unique identifier for this FIR record.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  FIR UUID
                </p>

                <code className="text-xs font-mono break-all">
                  {fir.id}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incident Description */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Incident Description
            </CardTitle>

            <CardDescription>
              Narrative submitted during FIR registration.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="p-5 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm leading-7 whitespace-pre-wrap">
                {fir.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Legal Analysis */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent" />
              AI-Assisted Legal Analysis
            </CardTitle>

            <CardDescription>
              Legal information generated from the FIR narrative.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!fir.legalAnalysis ? (
              <div className="py-8 text-center">
                <Scale className="h-10 w-10 mx-auto text-muted-foreground/50" />

                <p className="text-sm text-muted-foreground mt-3">
                  No legal analysis is available for this FIR.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Summary
                  </p>

                  <p className="text-sm leading-6">
                    {fir.legalAnalysis.summary}
                  </p>
                </div>

                {fir.legalAnalysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Legal Recommendations
                    </h3>

                    <div className="space-y-3">
                      {fir.legalAnalysis.recommendations.map(
                        (recommendation) => (
                          <div
                            key={`${recommendation.law}-${recommendation.section}`}
                            className="p-4 rounded-lg bg-background/50 border border-border/50"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium">
                                  {recommendation.section}
                                </p>

                                <p className="text-sm text-accent mt-1">
                                  {recommendation.law}:{" "}
                                  {recommendation.title}
                                </p>
                              </div>

                              <Badge variant="outline">
                                {recommendation.confidence}%
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mt-3">
                              {recommendation.rationale}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {fir.legalAnalysis.victimActions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Recommended Actions
                    </h3>

                    <div className="space-y-2">
                      {fir.legalAnalysis.victimActions.map((action) => (
                        <div
                          key={action}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />

                          <p className="text-sm text-muted-foreground">
                            {action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />

                  <p className="text-xs text-muted-foreground">
                    {fir.legalAnalysis.disclaimer}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence */}
        <Card className="glass">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-accent" />
                  Evidence
                </CardTitle>

                <CardDescription>
                  Evidence records associated with this FIR.
                </CardDescription>
              </div>

              <Badge variant="outline">
                {evidence.length}{" "}
                {evidence.length === 1 ? "File" : "Files"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {evidence.length === 0 ? (
              <div className="py-8 text-center">
                <FileCheck className="h-10 w-10 mx-auto text-muted-foreground/50" />

                <p className="text-sm text-muted-foreground mt-3">
                  No evidence has been uploaded for this FIR.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.fileName}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.fileType}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.uploadedAt)}
                        </span>
                      </div>

                      <code className="block text-xs text-muted-foreground font-mono truncate mt-2">
                        SHA-256: {item.fileHash}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          item.verificationStatus === "Verified"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        }
                      >
                        {item.verificationStatus}
                      </Badge>

                      {item.blockchainTxHash && (
                        <Badge
                          variant="outline"
                          className="bg-accent/10 text-accent border-accent/20"
                        >
                          Blockchain
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {evidence.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push(`/evidence?firId=${fir.id}`);
                  }}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Manage Evidence
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Status */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Registration Email
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-3">
              {fir.emailSentAt ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />

                  <div>
                    <p className="text-sm font-medium">
                      Confirmation email sent
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(fir.emailSentAt)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-warning" />

                  <div>
                    <p className="text-sm font-medium">
                      Confirmation email not recorded
                    </p>

                    <p className="text-xs text-muted-foreground">
                      No email delivery timestamp is available.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-accent" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>

        <p className="text-sm font-medium mt-1 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}