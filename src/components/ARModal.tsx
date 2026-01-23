import { createPortal } from 'react-dom';
import ARTryOn from './ARTryOn';

/**
 * Props for ARModal component
 */
interface ARModalProps {
  isOpen: boolean;
  modelUrl: string | null;
  productName: string | null;
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
  if (!isOpen || !modelUrl || !productName) {
    return null;
  }

  // Render in portal for fullscreen z-index support
  return createPortal(
    <ARTryOn
      modelUrl={modelUrl}
      productName={productName}
      onClose={onClose}
    />,
    document.body
  );
};

export default ARModal;
