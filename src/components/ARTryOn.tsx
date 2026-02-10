import { useEffect, useRef, useCallback, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { X, RotateCcw, ZoomIn, ZoomOut, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AFRAME_SRC = "https://aframe.io/releases/1.4.2/aframe.min.js";
const ARJS_SRC = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js";

const loadScriptOnce = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = src;
      script.async = true;
      script.dataset.loaded = "false";
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      script.dataset.loaded = "true";
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error(`Failed to load ${src}`));
    };

    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
  });

/**
 * Props for the ARTryOn component.
 * modelUrl is dynamically provided from the backend API response.
 */
interface ARTryOnProps {
  /** URL to the .glb 3D model file (from backend API) */
  modelUrl: string;
  /** Name of the product being tried on */
  productName: string;
  /** Callback when user exits the AR view */
  onClose: () => void;
  /** Optional callback when AR scene is fully loaded */
  onLoaded?: () => void;
}

/**
 * ARTryOn Component
 * 
 * Renders a fullscreen AR view using AR.js and A-Frame.
 * The component creates an A-Frame scene that:
 * 1. Accesses the device camera
 * 2. Detects the Hiro AR marker
 * 3. Renders the 3D jewellery model on the marker
 * 
 * Data Flow:
 * Backend API → modelUrl prop → a-gltf-model src attribute
 * 
 * Mobile Constraints Handled:
 * - Camera permissions (requested before mounting)
 * - HTTPS requirement (checked by parent hook)
 * - Fullscreen display (fixed positioning)
 */
const ARTryOn = ({ modelUrl, productName, onClose, onLoaded }: ARTryOnProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);

  /**
   * Handle zoom controls for the 3D model
   */
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  }, []);

  const handleResetScale = useCallback(() => {
    setScale(0.5);
  }, []);

  /**
   * Initialize AR.js and A-Frame scene.
   * We use innerHTML to create the A-Frame elements because A-Frame
   * uses custom elements that need to be parsed by the A-Frame library.
   */
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let cleanupScene: (() => void) | null = null;

    const initScene = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await loadScriptOnce(AFRAME_SRC);
        await loadScriptOnce(ARJS_SRC);
      } catch (error) {
        if (!cancelled) {
          setError('AR libraries not loaded. Please refresh the page.');
          setIsLoading(false);
        }
        return;
      }

      if (cancelled) return;
      if (typeof (window as any).AFRAME === 'undefined') {
        setError('AR libraries not loaded. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      /**
       * Create the A-Frame AR scene.
       * 
       * Key Components:
       * - a-scene: The main AR scene with AR.js integration
       * - a-marker: Detects the Hiro pattern marker
       * - a-gltf-model: Loads the 3D jewellery model from backend URL
       * - a-entity camera: Required for AR view
       * 
       * The model URL is dynamically set from the prop (backend data).
       */
      const sceneHTML = `
      <a-scene
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true;"
        vr-mode-ui="enabled: false"
        gesture-detector
        id="ar-scene"
      >
        <!-- AR Marker: Using Hiro pattern for detection -->
        <a-marker preset="hiro" id="ar-marker">
          <!-- 3D Jewellery Model: URL from backend API -->
          <a-gltf-model
            src="${modelUrl}"
            scale="${scale} ${scale} ${scale}"
            position="0 0 0"
            rotation="0 0 0"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear;"
            id="ar-model"
          ></a-gltf-model>
        </a-marker>

        <!-- Camera entity for AR view -->
        <a-entity camera></a-entity>
      </a-scene>
    `;

      // Insert the scene HTML
      containerRef.current.innerHTML = sceneHTML;

      // Wait for scene to load
      const scene = document.getElementById('ar-scene') as any;
      if (scene) {
        scene.addEventListener('loaded', () => {
          setIsLoading(false);
          onLoaded?.();
        });

        // Handle errors
        scene.addEventListener('arError', () => {
          setError('Failed to initialize AR. Please ensure camera access is allowed.');
          setIsLoading(false);
        });
      }

      // Set loading complete after a timeout if no events fire
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      cleanupScene = () => {
        clearTimeout(timeout);
        if (containerRef.current) {
          // Stop all camera streams before destroying the scene
          const videos = containerRef.current.querySelectorAll('video');
          videos.forEach((video) => {
            const stream = video.srcObject as MediaStream | null;
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
            }
            video.srcObject = null;
          });

          // Properly dispose of the A-Frame scene
          const scene = containerRef.current.querySelector('a-scene') as any;
          if (scene) {
            if (typeof scene.destroy === 'function') scene.destroy();
            else if (typeof scene.dispose === 'function') scene.dispose();
          }
          containerRef.current.innerHTML = '';
        }
      };
    };

    void initScene();

    return () => {
      cancelled = true;
      cleanupScene?.();
    };
  }, [modelUrl, onLoaded]);

  /**
   * Update model scale when zoom changes
   */
  useEffect(() => {
    const model = document.getElementById('ar-model');
    if (model) {
      model.setAttribute('scale', `${scale} ${scale} ${scale}`);
    }
  }, [scale]);

  /**
   * Handle escape key to close AR view
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  /**
   * Prevent body scroll when AR view is active
   */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-foreground"
      >
        {/* AR Container - fullscreen for mobile */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/90 z-10">
            <div className="text-center text-background">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="swiss-subheading text-background/70 mb-2">Initializing AR</p>
              <p className="text-sm text-background/50">Point camera at the Hiro marker</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/95 z-10">
            <div className="text-center text-background max-w-sm px-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-lg font-semibold mb-2">AR Error</p>
              <p className="text-sm text-background/70 mb-6">{error}</p>
              <Button 
                onClick={onClose}
                variant="outline"
                className="border-background/30 text-background hover:bg-background/10"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* UI Controls - Swiss Design Style */}
        <div className="absolute top-0 left-0 right-0 z-20">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-foreground/80 to-transparent">
            <div>
              <p className="swiss-subheading text-background/70 text-xs">AR Try-On</p>
              <p className="text-background font-semibold">{productName}</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-background hover:bg-background/10"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="icon"
            className="bg-background/20 backdrop-blur-sm text-background hover:bg-background/30"
          >
            <ZoomIn size={20} />
          </Button>
          <Button
            onClick={handleResetScale}
            variant="ghost"
            size="icon"
            className="bg-background/20 backdrop-blur-sm text-background hover:bg-background/30"
          >
            <RotateCcw size={20} />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="icon"
            className="bg-background/20 backdrop-blur-sm text-background hover:bg-background/30"
          >
            <ZoomOut size={20} />
          </Button>
        </div>

        {/* Bottom Instructions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-foreground/80 to-transparent">
          <div className="text-center text-background">
            <p className="swiss-subheading text-background/70 mb-1">Instructions</p>
            <p className="text-sm">
              Point your camera at a{' '}
              <a 
                href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                Hiro marker
              </a>
              {' '}to see the jewellery
            </p>
          </div>
        </div>

        {/* Exit hint for desktop */}
        <div className="hidden md:block absolute bottom-4 left-4 z-20">
          <p className="text-xs text-background/50">Press ESC to exit</p>
        </div>
      </m.div>
    </AnimatePresence>
  );
};

export default ARTryOn;
