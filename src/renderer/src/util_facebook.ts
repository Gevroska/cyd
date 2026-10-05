import CydAPIClient from "../../cyd-api-client";
import type { DeviceInfo } from "./types";

// Kept for upstream caller compatibility. No statistics are read or sent.
export async function facebookPostProgress(
  _apiClient: CydAPIClient,
  _deviceInfo: DeviceInfo | null,
  _accountID: number,
) {}

export async function facebookGetLastDelete(
  accountID: number,
): Promise<Date | null> {
  const lastFinishedJob_deleteActivity =
    await window.electron.Facebook.getConfig(
      accountID,
      "lastFinishedJob_deleteActivity",
    );
  if (lastFinishedJob_deleteActivity) {
    return new Date(lastFinishedJob_deleteActivity);
  }
  return null;
}

export async function facebookRequiresPremium(): Promise<boolean> {
  // All Facebook features require premium
  return true;
}
