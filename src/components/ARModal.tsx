import { lazy, Suspense } from "react";
import { createPortal } from "react-dom";

const VirtualTryOn = lazy(() => import("@/components/VirtualTryOn"));

/**
 * Props for ARModal component
 */
interface ARModalProps {
  isOpen: boolean;
  modelUrl?: string | null;
  productName?: string | null;
  onClose: () => void;
}

/**
 * ARModal Component
 * 
 * A portal-based modal that renders the ARTryOn component.
 * Uses React Portal to ensure the AR view is rendered at the
 * document root level, avoiding z-index and overflow issues.
 * 
 * This component acts as a bridge between the product UI and
 * the fullscreen AR experience.
 */
const ARModal = ({ isOpen, modelUrl, productName, onClose }: ARModalProps) => {
  // Don't render if not open or missing required data
  if (!isOpen || !modelUrl) {
    return null;
  }

  // Render in portal for fullscreen z-index support
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center text-white">
            <span className="text-sm uppercase tracking-[0.2em]">Loading AR...</span>
          </div>
        }
      >
        <VirtualTryOn
          modelUrl={modelUrl}
          productName={productName || "AR Try-On"}
          onClose={onClose}
          className="h-full w-full rounded-none"
        />
      </Suspense>
    </div>,
    document.body,
  );
};

export default ARModal;
