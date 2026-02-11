import { DicomFile } from "@/types/dicom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface DicomMetadataPanelProps {
  file: DicomFile;
}

const fields: { label: string; key: keyof DicomFile | "dimensionsStr" }[] = [
  { label: "File Name", key: "fileName" },
  { label: "Patient Name", key: "patientName" },
  { label: "Patient ID", key: "patientId" },
  { label: "Study Date", key: "studyDate" },
  { label: "Description", key: "description" },
  { label: "Series", key: "seriesDescription" },
  { label: "Dimensions", key: "dimensionsStr" },
];

export function DicomMetadataPanel({ file }: DicomMetadataPanelProps) {
  const data: Record<string, string | undefined> = {
    ...file,
    dimensionsStr: file.dimensions
      ? `${file.dimensions.rows} × ${file.dimensions.columns}`
      : undefined,
  } as any;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">File Metadata</CardTitle>
          {file.modality && <Badge variant="secondary">{file.modality}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {fields.map((f) => {
            const val = data[f.key];
            if (!val) return null;
            return (
              <div key={f.key} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="text-sm text-foreground">{String(val)}</dd>
              </div>
            );
          })}
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">File Size</dt>
            <dd className="text-sm text-foreground">{formatFileSize(file.fileSize)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
