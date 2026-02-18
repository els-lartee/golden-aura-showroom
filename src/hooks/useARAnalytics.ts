import { useEffect, useRef } from "react";

const API_BASE = "/api";

/**
 * Fire-and-forget POST to the analytics events endpoint.
 * Errors are silently logged — analytics should never block the AR UX.
 */
const postEvent = async (
  eventType: string,
  productId?: string | number | null,
  metadata?: Record<string, unknown>,
) => {
  try {
    await fetch(`${API_BASE}/events/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        event_type: eventType,
        ...(productId != null ? { product: productId } : {}),
        metadata: metadata ?? {},
      }),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[AR Analytics]", eventType, "failed to send:", err);
  }
};

interface UseARAnalyticsOptions {
  /** Product ID (catalog primary key) if known. */
  productId?: string | number | null;
  /** URL of the GLB model being rendered. */
  modelUrl?: string | null;
  /** Whether the AR session is currently active. */
  active?: boolean;
}

/**
 * Tracks AR session lifecycle:
 *  - Fires `ar_session_start` when the component mounts (or `active` becomes true)
 *  - Fires `ar_session_end` with duration on unmount (or `active` becomes false)
 *
 * Usage:
 * ```tsx
 * useARAnalytics({ productId: product.id, modelUrl, active: true });
 * ```
 */
export const useARAnalytics = ({
  productId,
  modelUrl,
  active = true,
}: UseARAnalyticsOptions) => {
  const startTimeRef = useRef<number | null>(null);
  const firedStartRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    // Fire session start
    startTimeRef.current = Date.now();
    firedStartRef.current = true;
    postEvent("ar_session_start", productId, {
      model_url: modelUrl ?? undefined,
    });

    // Fire session end on cleanup
    return () => {
      if (!firedStartRef.current) return;
      const durationMs = Date.now() - (startTimeRef.current ?? Date.now());
      const durationSeconds = Math.round(durationMs / 1000);
      postEvent("ar_session_end", productId, {
        duration_seconds: durationSeconds,
        model_url: modelUrl ?? undefined,
      });
      firedStartRef.current = false;
    };
  }, [active, productId, modelUrl]);
};

export default useARAnalytics;
