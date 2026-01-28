import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader2, CameraOff, Hand } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import RingModel from "@/components/RingModel";
import useHandTracking, { type HandPreference, type ProcessingSize } from "@/hooks/useHandTracking";

interface VirtualTryOnProps {
  modelUrl?: string;
  processingSize?: ProcessingSize;
  initialHand?: HandPreference;
  className?: string;
  productName?: string;
  onClose?: () => void;
}

const statusLabel: Record<"idle" | "loading" | "ready" | "running" | "error", string> = {
  idle: "Idle",
  loading: "Loading",
  ready: "Ready",
  running: "Live",
  error: "Error",
};

export const VirtualTryOn = ({
  modelUrl = "/ring.glb",
  processingSize = { width: 640, height: 480 },
  initialHand = "auto",
  className,
  productName,
  onClose,
}: VirtualTryOnProps) => {
  const [handChoice, setHandChoice] = useState<HandPreference>(initialHand);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { videoRef, landmarksRef, handednessRef, status, isModelLoading, start, stop } = useHandTracking({
    preferredHand: handChoice,
    processingSize,
  });

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    if (status.permission === "denied") {
      setDialogOpen(true);
    }
  }, [status.permission]);

  const detectedHand = status.detectedHand ?? handednessRef.current;

  const loading = isModelLoading || status.pipeline === "loading" || status.permission === "prompt";

  const processingLabel = processingSize === "full" ? "Full resolution" : `${processingSize.width}×${processingSize.height} detect`;

  return (
    <div className={cn("relative h-full min-h-[600px] w-full overflow-hidden rounded-3xl bg-black", className)}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        autoPlay
        muted
      />

      <Canvas
        className="absolute inset-0"
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.8], fov: 50 }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[1.2, 1.2, 1.2]} intensity={0.8} />
        <Suspense fallback={null}>
          <RingModel modelUrl={modelUrl} landmarksRef={landmarksRef} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <div className="space-y-1 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">AR Virtual Try-On</p>
          <p className="text-sm font-semibold">{productName || "Ring finger alignment (MCP→PIP)"}</p>
          <p className="text-xs text-white/60">{processingLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
            {statusLabel[status.pipeline]}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3 px-4">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white backdrop-blur">
          <Hand className="h-4 w-4" />
          <span className="text-sm font-medium">Hand</span>
          <ToggleGroup
            type="single"
            value={handChoice}
            onValueChange={(val) => setHandChoice((val as HandPreference) || "auto")}
            className="gap-2"
          >
            <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
          <span className="text-xs text-white/70">Detected: {detectedHand ?? "—"}</span>
        </div>
        <div className="text-center text-xs text-white/60">
          Keep your ring finger visible; the ring aligns between joints 13 (MCP) and 14 (PIP).
        </div>
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading hand tracker…</p>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CameraOff className="h-5 w-5" />
              Camera permission needed
            </DialogTitle>
            <DialogDescription>
              We need camera access to place the ring on your finger. Please allow camera permission and try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Dismiss
            </Button>
            <Button onClick={() => start()}>Try again</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualTryOn;
