export interface DicomFile {
  id: string;
  fileName: string;
  patientName?: string;
  patientId?: string;
  studyDate?: string;
  modality?: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
  seriesDescription?: string;
  studyDescription?: string;
  dimensions?: { rows: number; columns: number };
}

export interface DicomListResponse {
  files: DicomFile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DicomStats {
  totalFiles: number;
  recentUploads: number;
  storageUsed: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type AnalysisStatus = "not_started" | "pending" | "processing" | "completed" | "failed";

export interface DicomAnalysisStatus {
  dicomId: string;
  status: AnalysisStatus;
  message?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface DiagnosticAssessment {
  primaryDiagnosis: string | null;
  differentialDiagnoses: string[];
  urgentFindings: boolean;
}

export interface DicomAnalysis {
  schemaVersion?: string;
  dicomId: string;
  userId?: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt: string | null;
  analysis: {
    rawResponse: string;
    imageType: string | null;
    anatomicalRegion: string | null;
    observations: string[];
    diagnosticAssessment: DiagnosticAssessment;
    patientFriendlyExplanation: string | null;
    severity: "Normal" | "Mild" | "Moderate" | "Severe";
  } | null;
  metadata?: {
    processingTime?: number;
    imageDimensions?: {
      width: number;
      height: number;
    };
    aiModel?: string;
    langchainVersion?: string;
    error?: string;
  };
}
