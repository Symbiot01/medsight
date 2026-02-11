import { Card, CardContent } from "@/components/ui/card";
import { DicomStats } from "@/types/dicom";
import { FileStack, Clock, HardDrive } from "lucide-react";

interface StatsBarProps {
  stats: DicomStats;
}

const statItems = [
  { key: "totalFiles" as const, label: "Total Files", icon: FileStack },
  { key: "recentUploads" as const, label: "Recent Uploads", icon: Clock },
  { key: "storageUsed" as const, label: "Storage Used", icon: HardDrive },
];

export function StatsBar({ stats }: StatsBarProps) {
  const values: Record<string, string | number> = {
    totalFiles: stats.totalFiles,
    recentUploads: stats.recentUploads,
    storageUsed: stats.storageUsed,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statItems.map((item) => (
        <Card key={item.key}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold text-foreground">{values[item.key]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
