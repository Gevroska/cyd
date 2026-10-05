import { test, expect, describe, vi, beforeEach } from "vitest";
import CydAPIClient from "../../cyd-api-client";
import * as UtilFacebook from "./util_facebook";

// Mock window.electron.Facebook
const mockFacebookGetConfig = vi.fn();
const mockFacebookGetProgressInfo = vi.fn();

// Set up window.electron mock
Object.defineProperty(window, "electron", {
  value: {
    Facebook: {
      getConfig: mockFacebookGetConfig,
      getProgressInfo: mockFacebookGetProgressInfo,
    },
  },
  writable: true,
});

describe("util_facebook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("facebookGetLastDelete", () => {
    test("returns null when no lastFinishedJob_deleteActivity config exists", async () => {
      mockFacebookGetConfig.mockResolvedValue(null);

      const result = await UtilFacebook.facebookGetLastDelete(1);

      expect(result).toBeNull();
      expect(mockFacebookGetConfig).toHaveBeenCalledWith(
        1,
        "lastFinishedJob_deleteActivity",
      );
    });

    test("returns Date when lastFinishedJob_deleteActivity config exists", async () => {
      const testDate = "2024-01-15T10:30:00.000Z";
      mockFacebookGetConfig.mockResolvedValue(testDate);

      const result = await UtilFacebook.facebookGetLastDelete(1);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(testDate);
      expect(mockFacebookGetConfig).toHaveBeenCalledWith(
        1,
        "lastFinishedJob_deleteActivity",
      );
    });
  });

  describe("facebookPostProgress", () => {
    test("does not read or transmit account statistics, including for legacy callers", async () => {
      const postFacebookProgress = vi.fn();
      await UtilFacebook.facebookPostProgress(
        { postFacebookProgress } as unknown as CydAPIClient,
        null,
        1,
      );
      expect(mockFacebookGetProgressInfo).not.toHaveBeenCalled();
      expect(postFacebookProgress).not.toHaveBeenCalled();
    });
  });
});
