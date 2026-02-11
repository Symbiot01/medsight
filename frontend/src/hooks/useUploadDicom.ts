import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dicomService } from "@/services/dicomService";
import { useToast } from "@/hooks/use-toast";

export function useUploadDicom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => dicomService.uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dicom-files"] });
      toast({ title: "Upload complete", description: "DICOM file uploaded successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });
}
