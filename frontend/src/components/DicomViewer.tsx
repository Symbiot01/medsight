import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageOff, Loader2, AlertCircle } from "lucide-react";
import { dicomService } from "@/services/dicomService";
import { loadImage, disableElement, resetViewport } from "@/lib/cornerstone";

interface DicomViewerProps {
  fileId: string;
}

export function DicomViewer({ fileId }: DicomViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!fileId || !viewportRef.current) {
      return;
    }

    const element = viewportRef.current;
    let mounted = true;

    const loadDicomImage = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageLoaded(false);

        // Get WADO URL
        const wadoUrl = dicomService.getWadoUrl(fileId);

        // Load and display the image
        await loadImage(element, wadoUrl);

        if (mounted) {
          setImageLoaded(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load DICOM image:", err);
        if (mounted) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load DICOM image. Please try again.";
          setError(errorMessage);
          setLoading(false);
          setImageLoaded(false);
        }
      }
    };

    loadDicomImage();

    // Cleanup function
    return () => {
      mounted = false;
      if (element) {
        try {
          disableElement(element);
          resetViewport(element);
        } catch (err) {
          console.warn("Error during cleanup:", err);
        }
      }
    };
  }, [fileId]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          ref={viewportRef}
          className="cornerstone-enabled-element relative aspect-square w-full bg-black"
          style={{
            minHeight: "400px",
            display: imageLoaded ? "block" : "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="text-sm font-medium">Loading DICOM image...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-destructive">
              <AlertCircle className="h-12 w-12" />
              <div className="text-center">
                <p className="text-sm font-medium">Failed to load image</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !imageLoaded && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <ImageOff className="h-12 w-12" />
              <div className="text-center">
                <p className="text-sm font-medium">DICOM Viewer</p>
                <p className="text-xs">No image to display</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
