import { useParams, useNavigate } from "react-router-dom";
import { useDicomDetail } from "@/hooks/useDicomDetail";
import { DicomViewer } from "@/components/DicomViewer";
import { DicomMetadataPanel } from "@/components/DicomMetadataPanel";
import { DicomAnalysisPanel } from "@/components/DicomAnalysisPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import { dicomService } from "@/services/dicomService";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DicomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: file, isLoading, error } = useDicomDetail(id ?? "");

  const handleDownload = async () => {
    if (!file) return;
    const a = document.createElement("a");
    const { url } = await dicomService.getDownloadUrl(file.id);
    a.href = url;
    a.rel = "noopener";
    // Note: `download` may be ignored for cross-origin URLs. Backend presigned URL
    // sets ResponseContentDisposition to enforce filename.
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="aspect-square lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="flex flex-col items-center gap-4 p-12">
        <p className="text-destructive">File not found or failed to load.</p>
        <Button variant="outline" onClick={() => navigate("/dicom")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to files
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dicom">DICOM Files</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{file.fileName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/dicom")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DicomViewer fileId={file.id} />
        </div>
        <div>
          <DicomMetadataPanel file={file} />
        </div>
      </div>

      <DicomAnalysisPanel dicomId={file.id} />
    </div>
  );
}
