import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDicomAnalysis } from "@/hooks/useDicomAnalysis";
import ReactMarkdown from "react-markdown";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Activity,
  Stethoscope,
  MessageSquare,
} from "lucide-react";

interface DicomAnalysisPanelProps {
  dicomId: string;
}

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "Severe":
      return "destructive";
    case "Moderate":
      return "default";
    case "Mild":
      return "secondary";
    default:
      return "outline";
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "Severe":
      return "text-red-600 dark:text-red-400";
    case "Moderate":
      return "text-yellow-600 dark:text-yellow-400";
    case "Mild":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-muted-foreground";
  }
}

export function DicomAnalysisPanel({ dicomId }: DicomAnalysisPanelProps) {
  const { status, analysis, isLoading, error, triggerAnalysis, isTriggering } = useDicomAnalysis(dicomId);

  // Not started state
  if (status === "not_started") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Analysis
            </CardTitle>
            <Button onClick={triggerAnalysis} disabled={isTriggering} size="sm">
              {isTriggering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the button above to start AI-powered analysis of this DICOM image. The analysis will provide
            detailed observations, diagnostic assessment, and patient-friendly explanations.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state (pending or processing)
  if (status === "pending" || status === "processing") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse" />
              AI Analysis
            </CardTitle>
            <Badge variant="secondary">
              {status === "pending" ? "Queued" : "Processing"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {status === "pending"
                  ? "Analysis is queued and will start shortly..."
                  : "Analyzing DICOM image with AI. This may take a few moments..."}
              </p>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (status === "failed" || error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              AI Analysis
            </CardTitle>
            <Badge variant="destructive">Failed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>
              {analysis?.metadata?.error ||
                (error instanceof Error ? error.message : "An error occurred during analysis.")}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={triggerAnalysis} disabled={isTriggering} variant="outline" size="sm">
              {isTriggering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Retry Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completed state - show analysis results
  if (status === "completed" && analysis?.analysis) {
    const analysisData = analysis.analysis;
    const severity = analysisData.severity || "Normal";

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              AI Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getSeverityVariant(severity)}>{severity}</Badge>
              {analysisData.diagnosticAssessment.urgentFindings && (
                <Badge variant="destructive">Urgent</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Urgent Findings Alert */}
          {analysisData.diagnosticAssessment.urgentFindings && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Urgent Findings Detected</AlertTitle>
              <AlertDescription>
                This analysis has identified findings that may require immediate medical attention. Please consult
                with a healthcare professional promptly.
              </AlertDescription>
            </Alert>
          )}

          {/* Image Type & Anatomical Region */}
          {(analysisData.imageType || analysisData.anatomicalRegion) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Image Type & Anatomical Region
              </h4>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                {analysisData.imageType && (
                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                    <ReactMarkdown>{analysisData.imageType}</ReactMarkdown>
                  </div>
                )}
                {analysisData.anatomicalRegion && (
                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                    <ReactMarkdown>{analysisData.anatomicalRegion}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Observations & Key Findings */}
          {analysisData.observations && analysisData.observations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Observations & Key Findings
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
                {analysisData.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Diagnostic Assessment */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Diagnostic Assessment
            </h4>
            <div className="text-sm text-muted-foreground space-y-3 pl-6">
              {analysisData.diagnosticAssessment.primaryDiagnosis && (
                <div>
                  <p className="font-medium text-foreground mb-1">Primary Diagnosis:</p>
                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                    <ReactMarkdown>{analysisData.diagnosticAssessment.primaryDiagnosis}</ReactMarkdown>
                  </div>
                </div>
              )}
              {analysisData.diagnosticAssessment.differentialDiagnoses &&
                analysisData.diagnosticAssessment.differentialDiagnoses.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1">Differential Diagnoses:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {analysisData.diagnosticAssessment.differentialDiagnoses.map((diag, idx) => (
                        <li key={idx}>{diag}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>

          <Separator />

          {/* Patient-Friendly Explanation */}
          {analysisData.patientFriendlyExplanation && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Patient-Friendly Explanation
              </h4>
              <div className="text-sm text-muted-foreground pl-6 prose prose-sm prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown>{analysisData.patientFriendlyExplanation}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Metadata */}
          {analysis.metadata && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                {analysis.metadata.processingTime && (
                  <p>Processing time: {analysis.metadata.processingTime}s</p>
                )}
                {analysis.metadata.aiModel && <p>AI Model: {analysis.metadata.aiModel}</p>}
                {analysis.completedAt && (
                  <p>Completed: {new Date(analysis.completedAt).toLocaleString()}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback loading state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}
