import { DicomFile, DicomListResponse, DicomAnalysisStatus, DicomAnalysis } from "@/types/dicom";
import { apiRequest, apiUpload } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ---- Mock data for development ----
const mockFiles: DicomFile[] = [
  {
    id: "1",
    fileName: "chest_xray_001.dcm",
    patientName: "John Smith",
    patientId: "PAT-001",
    studyDate: "2025-12-15",
    modality: "CR",
    fileSize: 5242880,
    uploadedAt: "2026-01-10T14:30:00Z",
    description: "Chest PA view",
    dimensions: { rows: 2048, columns: 2048 },
  },
  {
    id: "2",
    fileName: "brain_mri_002.dcm",
    patientName: "Jane Doe",
    patientId: "PAT-002",
    studyDate: "2026-01-05",
    modality: "MR",
    fileSize: 15728640,
    uploadedAt: "2026-01-12T09:15:00Z",
    description: "Brain T1 Axial",
    dimensions: { rows: 512, columns: 512 },
  },
  {
    id: "3",
    fileName: "knee_ct_003.dcm",
    patientName: "Robert Johnson",
    patientId: "PAT-003",
    studyDate: "2026-01-20",
    modality: "CT",
    fileSize: 8388608,
    uploadedAt: "2026-02-01T11:00:00Z",
    description: "Right knee axial",
    dimensions: { rows: 1024, columns: 1024 },
  },
  {
    id: "4",
    fileName: "abdomen_us_004.dcm",
    patientName: "Emily Davis",
    patientId: "PAT-004",
    studyDate: "2026-02-05",
    modality: "US",
    fileSize: 2097152,
    uploadedAt: "2026-02-08T16:45:00Z",
    description: "Abdominal ultrasound",
    dimensions: { rows: 640, columns: 480 },
  },
];

const USE_MOCK = false; // Toggle to true to use mock data without backend

export interface DicomDownloadResponse {
  url: string;
  expiresIn: number;
  fileName: string;
}

export const dicomService = {
  async listFiles(): Promise<DicomListResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      return { files: mockFiles, total: mockFiles.length, page: 1, pageSize: 20 };
    }
    return apiRequest<DicomListResponse>("/api/dicom");
  },

  async getFile(id: string): Promise<DicomFile> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      const file = mockFiles.find((f) => f.id === id);
      if (!file) throw new Error("File not found");
      return file;
    }
    return apiRequest<DicomFile>(`/api/dicom/${id}`);
  },

  async uploadFile(file: File): Promise<DicomFile> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 1500));
      const newFile: DicomFile = {
        id: String(Date.now()),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        modality: "OT",
        description: "Uploaded file",
      };
      mockFiles.unshift(newFile);
      return newFile;
    }
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<DicomFile>("/api/dicom/upload", formData);
  },

  async getDownloadUrl(id: string): Promise<DicomDownloadResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        url: "data:application/dicom;base64,bW9jaw==",
        expiresIn: 3600,
        fileName: "mock.dcm",
      };
    }
    return apiRequest<DicomDownloadResponse>(`/api/dicom/${id}/download`);
  },

  getWadoUrl(id: string): string {
    return `${API_BASE_URL}/api/dicom/${id}/wado`;
  },

  async triggerAnalysis(dicomId: string): Promise<DicomAnalysisStatus> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        dicomId,
        status: "pending",
        message: "Analysis started",
      };
    }
    return apiRequest<DicomAnalysisStatus>(`/api/dicom/${dicomId}/analyze`, {
      method: "POST",
    });
  },

  async getAnalysisStatus(dicomId: string): Promise<DicomAnalysisStatus> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return {
        dicomId,
        status: "not_started",
        message: "Analysis has not been started",
      };
    }
    return apiRequest<DicomAnalysisStatus>(`/api/dicom/${dicomId}/analysis/status`);
  },

  async getAnalysis(dicomId: string): Promise<DicomAnalysis> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        dicomId,
        status: "completed",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        analysis: {
          rawResponse: "Mock analysis response",
          imageType: "X-ray",
          anatomicalRegion: "Chest",
          observations: ["Normal lung fields", "No acute findings"],
          diagnosticAssessment: {
            primaryDiagnosis: "Normal chest X-ray",
            differentialDiagnoses: [],
            urgentFindings: false,
          },
          patientFriendlyExplanation: "The X-ray appears normal with no concerning findings.",
          severity: "Normal",
        },
      };
    }
    return apiRequest<DicomAnalysis>(`/api/dicom/${dicomId}/analysis`);
  },
};
