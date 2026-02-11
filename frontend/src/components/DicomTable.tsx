import { DicomFile } from "@/types/dicom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dicomService } from "@/services/dicomService";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface DicomTableProps {
  files: DicomFile[];
}

export function DicomTable({ files }: DicomTableProps) {
  const navigate = useNavigate();

  const handleDownload = async (e: React.MouseEvent, file: DicomFile) => {
    e.stopPropagation();
    const { url } = await dicomService.getDownloadUrl(file.id);
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    a.click();
  };

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Modality</TableHead>
            <TableHead>Study Date</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow
              key={file.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/dicom/${file.id}`)}
            >
              <TableCell className="font-medium text-foreground">{file.fileName}</TableCell>
              <TableCell className="text-muted-foreground">{file.patientName ?? "—"}</TableCell>
              <TableCell>
                {file.modality ? (
                  <Badge variant="secondary">{file.modality}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {file.studyDate ? formatDate(file.studyDate) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatFileSize(file.fileSize)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(file.uploadedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dicom/${file.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleDownload(e, file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
