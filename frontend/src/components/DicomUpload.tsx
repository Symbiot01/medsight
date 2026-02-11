import { useCallback, useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUploadDicom } from "@/hooks/useUploadDicom";
import { cn } from "@/lib/utils";

export function DicomUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const upload = useUploadDicom();

  const handleFile = useCallback(
    (file: File) => {
      upload.mutate(file);
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center gap-3 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {upload.isPending ? "Uploading..." : "Drop DICOM file here"}
          </p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>
        <Button variant="outline" size="sm" disabled={upload.isPending} asChild>
          <label className="cursor-pointer">
            <FileUp className="mr-2 h-4 w-4" />
            Browse Files
            <input
              type="file"
              className="hidden"
              accept=".dcm,.dicom,application/dicom"
              onChange={handleInputChange}
              disabled={upload.isPending}
            />
          </label>
        </Button>
      </CardContent>
    </Card>
  );
}
