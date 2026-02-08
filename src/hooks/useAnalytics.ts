import { analyticsApi, type AnalyticsEventPayload } from "@/lib/analytics";

export const trackEventSafe = async (payload: AnalyticsEventPayload) => {
  try {
    await analyticsApi.trackEvent(payload);
  } catch {
    // ignore analytics failures
  }
};
