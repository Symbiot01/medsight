import { useQuery } from "@tanstack/react-query";
import { dicomService } from "@/services/dicomService";

export function useDicomDetail(id: string) {
  return useQuery({
    queryKey: ["dicom-file", id],
    queryFn: () => dicomService.getFile(id),
    enabled: !!id,
  });
}
