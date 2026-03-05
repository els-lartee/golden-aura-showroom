// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RecommendationsStrip from "@/components/RecommendationsStrip";

const apiGetMock = vi.fn();
const ensureSessionKeyMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useMe: () => ({ data: null }),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
  ensureSessionKey: () => ensureSessionKeyMock(),
}));

describe("RecommendationsStrip", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    ensureSessionKeyMock.mockReset();
  });

  it("shows empty personalized state and does not fetch generic fallback products", async () => {
    ensureSessionKeyMock.mockResolvedValue("anon-session");
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/recommendations/") {
        return [];
      }
      return [];
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RecommendationsStrip />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Recommendations will appear once we have more activity to learn from.")
      ).toBeTruthy();
    });

    expect(apiGetMock).toHaveBeenCalledWith("/recommendations/", {
      session_key: "anon-session",
    });
    expect(
      apiGetMock.mock.calls.some(
        ([path, params]) => path === "/products/" && (params as { sort?: string })?.sort === "-is_featured"
      )
    ).toBe(false);
  });
});
