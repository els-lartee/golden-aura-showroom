import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ── Mock @mediapipe/tasks-vision ──────────────────────────────
const mockClose = vi.fn();
const mockDetectForVideo = vi.fn().mockReturnValue({
  landmarks: [],
  handedness: [],
  worldLandmarks: [],
});

vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: {
    forVisionTasks: vi.fn().mockResolvedValue({}),
  },
  HandLandmarker: {
    createFromOptions: vi.fn().mockResolvedValue({
      detectForVideo: mockDetectForVideo,
      close: mockClose,
    }),
  },
}));

import { useHandTracking } from "@/hooks/useHandTracking";

import { MockMediaStream } from "@/test/setup";

// ── Helpers ───────────────────────────────────────────────────
const FAKE_LANDMARKS = Array.from({ length: 21 }, (_, i) => ({
  x: i / 21,
  y: i / 21,
  z: 0,
}));

const FAKE_WORLD_LANDMARKS = Array.from({ length: 21 }, (_, i) => ({
  x: (i / 21) * 0.1,
  y: (i / 21) * 0.08,
  z: -0.02 * (i % 5),
}));

const makeResult = (overrides?: {
  label?: string;
  score?: number;
  landmarks?: unknown[];
  worldLandmarks?: unknown[];
}) => ({
  landmarks: [overrides?.landmarks ?? FAKE_LANDMARKS],
  handedness: [
    [
      {
        categoryName: overrides?.label ?? "Right",
        score: overrides?.score ?? 0.95,
      },
    ],
  ],
  worldLandmarks: [overrides?.worldLandmarks ?? FAKE_WORLD_LANDMARKS],
});

/** Stub out the video element so the hook can "play" it. */
function stubVideoElement(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const fakeVideo = document.createElement("video");
  Object.defineProperty(fakeVideo, "readyState", { value: 4, writable: true });
  fakeVideo.play = vi.fn().mockResolvedValue(undefined);
  (videoRef as React.MutableRefObject<HTMLVideoElement>).current = fakeVideo;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDetectForVideo.mockReturnValue(makeResult());
  // Restore getUserMedia mock (clearAllMocks removes the implementation)
  (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(
    new MockMediaStream(),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────
describe("useHandTracking", () => {
  it("returns idle status before start()", () => {
    const { result } = renderHook(() => useHandTracking());
    expect(result.current.status.pipeline).toBe("idle");
    expect(result.current.status.permission).toBe("idle");
    expect(result.current.status.detectedHand).toBeNull();
  });

  it("sets mirrored=true when facingMode is user (default)", () => {
    const { result } = renderHook(() => useHandTracking());
    expect(result.current.mirrored).toBe(true);
  });

  it("sets mirrored=false when facingMode is environment", () => {
    const { result } = renderHook(() =>
      useHandTracking({ facingMode: "environment" }),
    );
    expect(result.current.mirrored).toBe(false);
  });

  it("exposes refs", () => {
    const { result } = renderHook(() => useHandTracking());
    expect(result.current.videoRef).toBeDefined();
    expect(result.current.landmarksRef).toBeDefined();
    expect(result.current.worldLandmarksRef).toBeDefined();
    expect(result.current.handednessRef).toBeDefined();
    expect(result.current.fovRef).toBeDefined();
    expect(result.current.videoDimsRef).toBeDefined();
  });

  it("videoDimsRef defaults to zero dimensions", () => {
    const { result } = renderHook(() => useHandTracking());
    expect(result.current.videoDimsRef.current).toEqual({ width: 0, height: 0 });
  });

  it("start() transitions pipeline through loading states", async () => {
    const { result } = renderHook(() => useHandTracking());
    stubVideoElement(result.current.videoRef);

    await act(async () => {
      await result.current.start();
    });

    // After start(), pipeline should be at least "ready" or "running"
    // and permission should be "granted"
    expect(["ready", "running"]).toContain(result.current.status.pipeline);
    expect(result.current.status.permission).toBe("granted");

    // Cleanup
    act(() => {
      result.current.stop();
    });
  });

  it("stop() can be called without error after start", async () => {
    const { result } = renderHook(() => useHandTracking());
    stubVideoElement(result.current.videoRef);

    await act(async () => {
      await result.current.start();
    });

    // stop() should not throw
    act(() => {
      result.current.stop();
    });

    // After stop, runningRef should be false
    expect(result.current.runningRef.current).toBe(false);
  });

  it("sets permission denied when getUserMedia rejects", async () => {
    const mockGetUserMedia = navigator.mediaDevices
      .getUserMedia as ReturnType<typeof vi.fn>;
    mockGetUserMedia.mockRejectedValueOnce(new Error("NotAllowedError"));

    const { result } = renderHook(() => useHandTracking());
    stubVideoElement(result.current.videoRef);

    await act(async () => {
      await result.current.start();
    });

    // requestCamera and ensureLandmarker run in parallel.
    // Camera failure sets permission=denied; pipeline may stay at whatever
    // ensureLandmarker set it to.
    expect(result.current.status.permission).toBe("denied");
  });

  it("reset() returns status to idle", async () => {
    const { result } = renderHook(() => useHandTracking());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status.pipeline).toBe("idle");
    expect(result.current.status.permission).toBe("idle");
  });

  it("nulls landmarks when detection score is below minConfidence", async () => {
    // Set up low-confidence detection
    mockDetectForVideo.mockReturnValue(makeResult({ score: 0.3 }));

    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() =>
      useHandTracking({ minConfidence: 0.65 }),
    );
    stubVideoElement(result.current.videoRef);

    await act(async () => {
      await result.current.start();
    });

    // After start, processFrame fires via rAF; advance timers to trigger it
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Landmarks should remain null because score < minConfidence
    expect(result.current.landmarksRef.current).toBeNull();
    expect(result.current.worldLandmarksRef.current).toBeNull();

    act(() => {
      result.current.stop();
    });

    vi.useRealTimers();
  });

  it("default FOV is 50", () => {
    const { result } = renderHook(() => useHandTracking());
    expect(result.current.fovRef.current).toBe(50);
  });
});
