import log from "electron-log/main";
import { getTimestampDaysAgo } from "../../../util";
import type { XAccountController } from "../../x_account_controller";
import type { XDeleteTweetsStartResponse } from "../../../shared_types";

// When you start deleting likes, return a list of tweets to unlike
export async function deleteLikesStart(
  controller: XAccountController,
): Promise<XDeleteTweetsStartResponse> {
  log.info("XAccountController.deleteLikesStart");

  if (!controller.db) {
    controller.initDB();
  }

  if (!controller.account) {
    throw new Error("Account not found");
  }

  const daysOldTimestamp = controller.account.deleteLikesDaysOldEnabled
    ? getTimestampDaysAgo(controller.account.deleteLikesDaysOld)
    : getTimestampDaysAgo(0);

  const tweets = controller.fetchTweetsWithMediaAndURLs(
    `t.deletedLikeAt IS NULL AND t.isLiked = ? AND COALESCE(t.likedAt, t.createdAt) <= ?`,
    [1, daysOldTimestamp],
  );

  return { tweets };
}
