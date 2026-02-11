import { useQuery } from "@tanstack/react-query";
import { dicomService } from "@/services/dicomService";

export function useDicomList() {
  return useQuery({
    queryKey: ["dicom-files"],
    queryFn: () => dicomService.listFiles(),
  });
}
