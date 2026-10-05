import CydAPIClient from "../../cyd-api-client";
import type { DeviceInfo } from "./types";
import { XAccount } from "../../shared_types";

export async function xGetLastImportArchive(
  accountID: number,
): Promise<Date | null> {
  const lastFinishedJob_importArchive = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_importArchive",
  );
  if (lastFinishedJob_importArchive) {
    return new Date(lastFinishedJob_importArchive);
  }
  return null;
}

export async function xGetLastBuildDatabase(
  accountID: number,
): Promise<Date | null> {
  const lastFinishedJob_indexTweets = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_indexTweets",
  );
  const lastFinishedJob_indexLikes = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_indexLikes",
  );
  if (lastFinishedJob_indexTweets || lastFinishedJob_indexLikes) {
    const lastFinishedJob_indexTweets_date = lastFinishedJob_indexTweets
      ? new Date(lastFinishedJob_indexTweets)
      : new Date(0);
    const lastFinishedJob_indexLikes_date = lastFinishedJob_indexLikes
      ? new Date(lastFinishedJob_indexLikes)
      : new Date(0);
    return lastFinishedJob_indexTweets_date > lastFinishedJob_indexLikes_date
      ? lastFinishedJob_indexTweets_date
      : lastFinishedJob_indexLikes_date;
  }
  return null;
}

export async function xGetLastDelete(accountID: number): Promise<Date | null> {
  const lastFinishedJob_deleteTweets = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_deleteTweets",
  );
  const lastFinishedJob_deleteRetweets = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_deleteRetweets",
  );
  const lastFinishedJob_deleteLikes = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_deleteLikes",
  );
  const lastFinishedJob_deleteBookmarks = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_deleteBookmarks",
  );
  const lastFinishedJob_unfollowEveryone = await window.electron.X.getConfig(
    accountID,
    "lastFinishedJob_unfollowEveryone",
  );
  if (
    lastFinishedJob_deleteTweets ||
    lastFinishedJob_deleteRetweets ||
    lastFinishedJob_deleteLikes ||
    lastFinishedJob_deleteBookmarks ||
    lastFinishedJob_unfollowEveryone
  ) {
    const lastFinishedJob_deleteTweets_date = lastFinishedJob_deleteTweets
      ? new Date(lastFinishedJob_deleteTweets)
      : new Date(0);
    const lastFinishedJob_deleteRetweets_date = lastFinishedJob_deleteRetweets
      ? new Date(lastFinishedJob_deleteRetweets)
      : new Date(0);
    const lastFinishedJob_deleteLikes_date = lastFinishedJob_deleteLikes
      ? new Date(lastFinishedJob_deleteLikes)
      : new Date(0);
    const lastFinishedJob_deleteBookmarks_date = lastFinishedJob_deleteBookmarks
      ? new Date(lastFinishedJob_deleteBookmarks)
      : new Date(0);
    const lastFinishedJob_unfollowEveryone_date =
      lastFinishedJob_unfollowEveryone
        ? new Date(lastFinishedJob_unfollowEveryone)
        : new Date(0);
    return new Date(
      Math.max(
        lastFinishedJob_deleteTweets_date.getTime(),
        lastFinishedJob_deleteRetweets_date.getTime(),
        lastFinishedJob_deleteLikes_date.getTime(),
        lastFinishedJob_deleteBookmarks_date.getTime(),
        lastFinishedJob_unfollowEveryone_date.getTime(),
      ),
    );
  }
  return null;
}

export async function xHasSomeData(accountID: number): Promise<boolean> {
  const lastImportArchive: Date | null = await xGetLastImportArchive(accountID);
  const lastBuildDatabase: Date | null = await xGetLastBuildDatabase(accountID);
  return lastImportArchive !== null || lastBuildDatabase !== null;
}

export async function xRequiresPremium(
  _accountID: number,
  _xAccount: XAccount,
): Promise<boolean> {
  return false;
}

// Kept for upstream caller compatibility. No statistics are read or sent.
export async function xPostProgress(
  _apiClient: CydAPIClient,
  _deviceInfo: DeviceInfo | null,
  _accountID: number,
) {}
