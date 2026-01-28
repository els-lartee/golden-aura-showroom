import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
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
}

interface HandTrackingStatus {
  permission: PermissionState;
  pipeline: PipelineState;
  detectedHand: HandLabel | null;
  error?: string;
}

const DEFAULT_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm";
// Use the hosted float16 model from the official bucket to avoid CDN 404s
const DEFAULT_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const useHandTracking = (options: UseHandTrackingOptions = {}) => {
  const {
    preferredHand = "auto",
    processingSize = { width: 640, height: 480 },
    maxHands = 1,
    wasmBaseUrl = DEFAULT_WASM_BASE,
    modelAssetPath = DEFAULT_MODEL_PATH,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>();
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const handednessRef = useRef<HandLabel | null>(null);
  const lastReportedHandRef = useRef<HandLabel | null>(null);
  const runningRef = useRef(false);
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
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (video) {
      video.srcObject = null;
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
        video: { facingMode: "environment" },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setStatus((prev) => ({ ...prev, permission: "granted" }));
      return true;
    } catch (error) {
      console.error("Camera permission denied", error);
      setStatus({ permission: "denied", pipeline: "error", detectedHand: null, error: "Camera permission denied" });
      return false;
    }
  }, []);

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
      if (handIndex !== null && result?.landmarks?.[handIndex]) {
        landmarksRef.current = result.landmarks[handIndex];
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

    const [cameraOk, landmarker] = await Promise.all([requestCamera(), ensureLandmarker()]);
    if (!cameraOk || !landmarker) return;

    runningRef.current = true;
    setStatus((prev) => ({ ...prev, pipeline: "running", error: undefined }));
    processFrame();
  }, [ensureLandmarker, processFrame, requestCamera]);

  const reset = useCallback(() => {
    landmarksRef.current = null;
    handednessRef.current = null;
    setStatus({ permission: "idle", pipeline: "idle", detectedHand: null });
  }, []);

  return {
    videoRef,
    landmarksRef,
    handednessRef,
    status,
    isModelLoading,
    start,
    stop,
    reset,
    runningRef,
  };
};

export default useHandTracking;
