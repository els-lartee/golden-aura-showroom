import { Suspense, useEffect, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Loader2, CameraOff, Hand } from "lucide-react";
import type { MutableRefObject } from "react";
import { PerspectiveCamera, ACESFilmicToneMapping } from "three";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Environment, ContactShadows } from "@react-three/drei";
import JewelryModel from "@/components/JewelryModel";
import HandOcclusionMesh from "@/components/HandOcclusionMesh";
import useHandTracking, { type HandPreference, type ProcessingSize } from "@/hooks/useHandTracking";
import useARAnalytics from "@/hooks/useARAnalytics";
import type { JewelryType } from "@/lib/jewelryConfig";

interface VirtualTryOnProps {
  modelUrl?: string;
  processingSize?: ProcessingSize;
  initialHand?: HandPreference;
  className?: string;
  productName?: string;
  productId?: string | number | null;
  jewelryType?: JewelryType;
  onClose?: () => void;
}

const statusLabel: Record<"idle" | "loading" | "ready" | "running" | "error", string> = {
  idle: "Idle",
  loading: "Loading",
  ready: "Ready",
  running: "Live",
  error: "Error",
};

/** Keeps the R3F camera FOV in sync with the value in fovRef (updated by useHandTracking). */
const CameraFovSync = ({ fovRef }: { fovRef: MutableRefObject<number> }) => {
  const { camera } = useThree();
  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    if (cam.fov !== fovRef.current) {
      cam.fov = fovRef.current;
      cam.updateProjectionMatrix();
    }
  });
  return null;
};

const JEWELRY_HINTS: Record<JewelryType, string> = {
  ring: "Keep your ring finger visible; the ring aligns between joints 13 (MCP) and 14 (PIP).",
  bracelet: "Keep your wrist visible; the bracelet anchors at the wrist landmark.",
};

const JEWELRY_DEFAULT_LABEL: Record<JewelryType, string> = {
  ring: "Ring finger alignment (MCP\u2192PIP)",
  bracelet: "Wrist alignment",
};

export const VirtualTryOn = ({
  modelUrl = "/ring.glb",
  processingSize = { width: 640, height: 480 },
  initialHand = "auto",
  className,
  productName,
  productId,
  jewelryType = "ring",
  onClose,
}: VirtualTryOnProps) => {
  const [handChoice, setHandChoice] = useState<HandPreference>(initialHand);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { videoRef, landmarksRef, worldLandmarksRef, handednessRef, fovRef, status, isModelLoading, start, stop, mirrored } = useHandTracking({
    preferredHand: handChoice,
    processingSize,
  });

  // AR session analytics — fires start on mount, end on unmount
  useARAnalytics({ productId, modelUrl, active: true });

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
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        playsInline
        autoPlay
        muted
      />

      <Canvas
        className="absolute inset-0"
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        camera={{ position: [0, 0, 2.8], fov: 50 }}
      >
        <CameraFovSync fovRef={fovRef} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[1.2, 1.2, 1.2]} intensity={0.6} />
        <Environment preset="studio" />
        <Suspense fallback={null}>
          <HandOcclusionMesh landmarksRef={landmarksRef} />
          <JewelryModel
            modelUrl={modelUrl}
            landmarksRef={landmarksRef}
            worldLandmarksRef={worldLandmarksRef}
            handednessRef={handednessRef}
            fovRef={fovRef}
            jewelryType={jewelryType}
          />
          <ContactShadows
            opacity={0.2}
            scale={0.5}
            blur={2}
            far={0.8}
            position={[0, -0.15, 0]}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <div className="space-y-1 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">AR Virtual Try-On</p>
          <p className="text-sm font-semibold">{productName || JEWELRY_DEFAULT_LABEL[jewelryType]}</p>
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
          {JEWELRY_HINTS[jewelryType]}
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
              We need camera access to place the jewelry on your hand. Please allow camera permission and try again.
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
