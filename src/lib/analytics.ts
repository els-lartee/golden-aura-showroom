import { apiClient } from "@/lib/api";

export type AnalyticsEventType =
  | "view"
  | "click"
  | "like"
  | "favorite"
  | "add_to_cart"
  | "remove_from_cart"
  | "purchase";

export type AnalyticsEventPayload = {
  event_type: AnalyticsEventType;
  product?: number;
  user?: number;
  session_key?: string;
  metadata?: Record<string, unknown>;
};

export const analyticsApi = {
  trackEvent: (payload: AnalyticsEventPayload) =>
    apiClient.post<{ id: number }>("/events/", payload),
  trackBatch: (events: AnalyticsEventPayload[]) =>
    apiClient.post<{ created: number }>("/events/batch", { events }),
};
