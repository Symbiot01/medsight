import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dicomService } from "@/services/dicomService";
import { DicomAnalysis, DicomAnalysisStatus } from "@/types/dicom";

const POLL_INTERVAL = 2500; // 2.5 seconds

export function useDicomAnalysis(dicomId: string) {
  const queryClient = useQueryClient();

  // Query for analysis status
  const statusQuery = useQuery({
    queryKey: ["dicom-analysis-status", dicomId],
    queryFn: () => dicomService.getAnalysisStatus(dicomId),
    enabled: !!dicomId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll when pending or processing, stop otherwise
      return status === "pending" || status === "processing" ? POLL_INTERVAL : false;
    },
  });

  // Query for full analysis (only when completed)
  const analysisQuery = useQuery({
    queryKey: ["dicom-analysis", dicomId],
    queryFn: () => dicomService.getAnalysis(dicomId),
    enabled: !!dicomId && statusQuery.data?.status === "completed",
  });

  // Mutation to trigger analysis
  const triggerMutation = useMutation({
    mutationFn: () => dicomService.triggerAnalysis(dicomId),
    onSuccess: () => {
      // Invalidate status query to refetch immediately
      queryClient.invalidateQueries({ queryKey: ["dicom-analysis-status", dicomId] });
    },
  });

  // Trigger analysis function
  const triggerAnalysis = useCallback(() => {
    triggerMutation.mutate();
  }, [triggerMutation]);

  // Auto-fetch full analysis when status becomes completed
  useEffect(() => {
    if (statusQuery.data?.status === "completed" && !analysisQuery.data) {
      queryClient.invalidateQueries({ queryKey: ["dicom-analysis", dicomId] });
    }
  }, [statusQuery.data?.status, analysisQuery.data, queryClient, dicomId]);

  // Determine current status
  const status = statusQuery.data?.status || "not_started";
  const analysis = analysisQuery.data;
  const isLoading = statusQuery.isLoading || triggerMutation.isPending;
  const error = statusQuery.error || triggerMutation.error || analysisQuery.error;

  return {
    status,
    analysis,
    isLoading,
    error,
    triggerAnalysis,
    isTriggering: triggerMutation.isPending,
  };
}
