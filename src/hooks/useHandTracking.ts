import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  HandLandmarker,
  HandLandmarkerResult,
  Landmark,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type HandPreference = "auto" | "left" | "right";
export type HandLabel = "Left" | "Right";
export type ProcessingSize = { width: number; height: number } | "full";

type PermissionState = "idle" | "prompt" | "granted" | "denied";
type PipelineState = "idle" | "loading" | "ready" | "running" | "error";

interface UseHandTrackingOptions {
  preferredHand?: HandPreference;
  processingSize?: ProcessingSize;
  maxHands?: number;
  wasmBaseUrl?: string;
  modelAssetPath?: string;
  facingMode?: "user" | "environment";
  minConfidence?: number;
}

interface HandTrackingStatus {
  permission: PermissionState;
  pipeline: PipelineState;
  detectedHand: HandLabel | null;
  error?: string;
}

const DEFAULT_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
// Use the hosted float16 model from the official bucket to avoid CDN 404s
const DEFAULT_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type MediapipeModule = typeof import("@mediapipe/tasks-vision");
let mediapipeModulePromise: Promise<MediapipeModule> | null = null;

const loadMediapipeModule = () => {
  if (!mediapipeModulePromise) {
    mediapipeModulePromise = import("@mediapipe/tasks-vision");
  }
  return mediapipeModulePromise;
};

export const useHandTracking = (options: UseHandTrackingOptions = {}) => {
  const {
    preferredHand = "auto",
    processingSize = { width: 640, height: 480 },
    maxHands = 1,
    wasmBaseUrl = DEFAULT_WASM_BASE,
    modelAssetPath = DEFAULT_MODEL_PATH,
    facingMode = "user",
    minConfidence = 0.65,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>();
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const worldLandmarksRef = useRef<Landmark[] | null>(null);
  const handednessRef = useRef<HandLabel | null>(null);
  const lastReportedHandRef = useRef<HandLabel | null>(null);
  const fovRef = useRef<number>(50);
  const runningRef = useRef(false);
  const stoppedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const preferredHandRef = useRef<HandPreference>(preferredHand);
  const processingSizeRef = useRef<ProcessingSize>(processingSize);

  const [status, setStatus] = useState<HandTrackingStatus>({
    permission: "idle",
    pipeline: "idle",
    detectedHand: null,
  });
  const [isModelLoading, setIsModelLoading] = useState(false);

  useEffect(() => {
    preferredHandRef.current = preferredHand;
  }, [preferredHand]);

  useEffect(() => {
    processingSizeRef.current = processingSize;
  }, [processingSize]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Stop the tracked stream (handles race with pending getUserMedia)
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      // Also stop any stream on the element in case it diverged
      const videoStream = video.srcObject as MediaStream | null;
      if (videoStream && videoStream !== stream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      video.srcObject = null;
    }

    // Release the HandLandmarker GPU resources
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const pickHandIndex = useCallback((result: HandLandmarkerResult): number | null => {
    if (!result.handedness?.length || !result.landmarks?.length) {
      return null;
    }

    const target = preferredHandRef.current === "auto" ? null : preferredHandRef.current;
    let bestIndex: number | null = null;
    let bestScore = -Infinity;

    result.handedness.forEach((hand, idx) => {
      const choice = hand?.[0];
      if (!choice) return;
      const label = choice.categoryName?.toLowerCase();
      const score = choice.score ?? 0;

      if (target) {
        if (label === target && score > bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      } else if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    });

    return bestIndex ?? 0;
  }, []);

  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setStatus((prev) => ({ ...prev, pipeline: "loading", error: undefined }));
    setIsModelLoading(true);

    try {
      const { FilesetResolver, HandLandmarker } = await loadMediapipeModule();
      const fileset = await FilesetResolver.forVisionTasks(wasmBaseUrl);
      const landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: maxHands,
      });

      landmarkerRef.current = landmarker;
      setStatus((prev) => ({ ...prev, pipeline: "ready" }));
      return landmarker;
    } catch (error) {
      console.error("Failed to initialize HandLandmarker", error);
      setStatus({ permission: "idle", pipeline: "error", detectedHand: null, error: "Could not load MediaPipe tasks" });
      return null;
    } finally {
      setIsModelLoading(false);
    }
  }, [maxHands, modelAssetPath, wasmBaseUrl]);

  const requestCamera = useCallback(async () => {
    if (!videoRef.current) return false;

    setStatus((prev) => ({ ...prev, permission: "prompt" }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      // If stop() was called while we were awaiting getUserMedia, kill the stream immediately
      if (stoppedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Attempt to read camera FOV from track capabilities/settings
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const settings = videoTrack.getSettings() as MediaTrackSettings & { focalLength?: number };
          const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & {
            focalLength?: { min: number; max: number };
          } | undefined;

          // Some browsers/devices report focalLength in the track settings or capabilities.
          // Convert focal length (mm) to vertical FOV using sensor height estimate.
          // Typical phone sensor height ≈ 3.6mm (1/3" sensor).
          const focalLength = settings.focalLength ?? capabilities?.focalLength?.max;
          if (focalLength && focalLength > 0) {
            const sensorHeight = 3.6; // mm — common phone sensor
            const videoHeight = settings.height ?? 480;
            const videoWidth = settings.width ?? 640;
            const aspect = videoWidth / videoHeight;
            // Vertical FOV = 2 * atan(sensorHeight / (2 * focalLength))
            const vFov = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
            // Clamp to sane range
            fovRef.current = Math.max(20, Math.min(120, vFov));
          }
        } catch {
          // getCapabilities not supported — keep default FOV
        }
      }

      setStatus((prev) => ({ ...prev, permission: "granted" }));;
      return true;
    } catch (error) {
      console.error("Camera permission denied", error);
      setStatus({ permission: "denied", pipeline: "error", detectedHand: null, error: "Camera permission denied" });
      return false;
    }
  }, [facingMode]);

  const getInputFrame = useCallback((): HTMLVideoElement | HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const currentSize = processingSizeRef.current;
    if (currentSize === "full") return video;

    const canvas = offscreenCanvasRef.current ?? document.createElement("canvas");
    canvas.width = currentSize.width;
    canvas.height = currentSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return video;

    ctx.drawImage(video, 0, 0, currentSize.width, currentSize.height);
    offscreenCanvasRef.current = canvas;
    return canvas;
  }, []);

  const processFrame = useCallback(() => {
    if (!runningRef.current) return;

    const landmarker = landmarkerRef.current;
    const frame = getInputFrame();
    if (landmarker && frame) {
      const now = performance.now();
      const result = landmarker.detectForVideo(frame, now);

      const handIndex = result ? pickHandIndex(result) : null;
      const score = handIndex !== null ? (result?.handedness?.[handIndex]?.[0]?.score ?? 0) : 0;
      if (handIndex !== null && result?.landmarks?.[handIndex] && score >= minConfidence) {
        landmarksRef.current = result.landmarks[handIndex];
        worldLandmarksRef.current = result.worldLandmarks?.[handIndex] ?? null;
        const label = result.handedness?.[handIndex]?.[0]?.categoryName as HandLabel | undefined;
        handednessRef.current = label ?? null;

        if (label && lastReportedHandRef.current !== label) {
          lastReportedHandRef.current = label;
          setStatus((prev) => ({ ...prev, detectedHand: label }));
        } else if (!label && lastReportedHandRef.current) {
          lastReportedHandRef.current = null;
          setStatus((prev) => ({ ...prev, detectedHand: null }));
        }
      } else {
        landmarksRef.current = null;
        worldLandmarksRef.current = null;
        handednessRef.current = null;
        if (lastReportedHandRef.current) {
          lastReportedHandRef.current = null;
          setStatus((prev) => ({ ...prev, detectedHand: null }));
        }
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [getInputFrame, pickHandIndex]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    stoppedRef.current = false;

    const [cameraOk, landmarker] = await Promise.all([requestCamera(), ensureLandmarker()]);
    if (!cameraOk || !landmarker) return;

    runningRef.current = true;
    setStatus((prev) => ({ ...prev, pipeline: "running", error: undefined }));
    processFrame();
  }, [ensureLandmarker, processFrame, requestCamera]);

  const reset = useCallback(() => {
    landmarksRef.current = null;
    worldLandmarksRef.current = null;
    handednessRef.current = null;
    setStatus({ permission: "idle", pipeline: "idle", detectedHand: null });
  }, []);

  const mirrored = facingMode === "user";

  return {
    videoRef,
    landmarksRef,
    worldLandmarksRef,
    handednessRef,
    fovRef,
    status,
    isModelLoading,
    start,
    stop,
    reset,
    runningRef,
    mirrored,
  };
};

export default useHandTracking;
