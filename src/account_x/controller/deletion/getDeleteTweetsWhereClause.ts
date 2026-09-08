import { getTimestampDaysAgo } from "../../../util";
import type { XAccountController } from "../../x_account_controller";

// Shared by the deletion list, review, and unarchived-tweet warning.
export async function getDeleteTweetsWhereClause(controller: XAccountController) {
  if (!controller.account) {
    throw new Error("Account not found");
  }

  // Determine the timestamp for filtering tweets
  const daysOldTimestamp = controller.account.deleteTweetsDaysOldEnabled
    ? getTimestampDaysAgo(controller.account.deleteTweetsDaysOld)
    : getTimestampDaysAgo(0);

  // Build the WHERE clause and parameters dynamically
  let whereClause = `
            t.deletedTweetAt IS NULL
            AND t.text NOT LIKE ?
            AND t.username = ?
            AND t.createdAt <= ?
        `;
  const params: (string | number)[] = [
    "RT @%",
    controller.account.username,
    daysOldTimestamp,
  ];

  if (controller.account.deleteTweetsLikesThresholdEnabled) {
    whereClause += " AND t.likeCount <= ?";
    params.push(controller.account.deleteTweetsLikesThreshold);
  }
  if (controller.account.deleteTweetsRetweetsThresholdEnabled) {
    whereClause += " AND t.retweetCount <= ?";
    params.push(controller.account.deleteTweetsRetweetsThreshold);
  }

  if (controller.account.deleteTweetsKeepPinned) {
    const pinnedTweetIDs: unknown = JSON.parse(
      (await controller.getConfig("pinnedTweetIDs")) || "null",
    );
    // Unknown pin data must never be treated as an empty list.
    if (
      !Array.isArray(pinnedTweetIDs) ||
      !pinnedTweetIDs.every(
        (id) => typeof id === "string" && /^\d+$/.test(id),
      )
    ) {
      throw new Error(
        "Could not verify pinned tweets. Refresh your account data.",
      );
    }
    if (pinnedTweetIDs.length > 0) {
      whereClause += ` AND t.tweetID NOT IN (${pinnedTweetIDs.map(() => "?").join(", ")})`;
      params.push(...pinnedTweetIDs);
    }
  }

  return { whereClause, params };
}
