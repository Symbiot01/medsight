import { useDicomList } from "@/hooks/useDicomList";
import { StatsBar } from "@/components/StatsBar";
import { DicomUpload } from "@/components/DicomUpload";
import { DicomTable } from "@/components/DicomTable";
import { Skeleton } from "@/components/ui/skeleton";
import { FileStack } from "lucide-react";

export default function DicomList() {
  const { data, isLoading, error } = useDicomList();

  const stats = {
    totalFiles: data?.total ?? 0,
    recentUploads: data?.files.filter(
      (f) => Date.now() - new Date(f.uploadedAt).getTime() < 7 * 86400000
    ).length ?? 0,
    storageUsed: data
      ? `${(data.files.reduce((sum, f) => sum + f.fileSize, 0) / 1048576).toFixed(1)} MB`
      : "0 MB",
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">DICOM Files</h1>
        <p className="text-sm text-muted-foreground">Manage and view your medical imaging files</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <StatsBar stats={stats} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">Failed to load files. Please try again.</p>
            </div>
          ) : data?.files.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12">
              <FileStack className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No DICOM files yet. Upload your first file.</p>
            </div>
          ) : (
            <DicomTable files={data!.files} />
          )}
        </div>
        <div>
          <DicomUpload />
        </div>
      </div>
    </div>
  );
}
