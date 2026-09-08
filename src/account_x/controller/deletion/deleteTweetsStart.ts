import log from "electron-log/main";
import { getDeleteTweetsWhereClause } from "./getDeleteTweetsWhereClause";
import type { XAccountController } from "../../x_account_controller";
import type { XDeleteTweetsStartResponse } from "../../../shared_types";

export async function deleteTweetsStart(
  controller: XAccountController,
): Promise<XDeleteTweetsStartResponse> {
  log.info("XAccountController.deleteTweetsStart");

  if (!controller.db) {
    controller.initDB();
  }

  if (!controller.account) {
    throw new Error("Account not found");
  }

  const { whereClause, params } = await getDeleteTweetsWhereClause(controller);

  // Fetch tweets using the helper function
  const tweets = controller.fetchTweetsWithMediaAndURLs(whereClause, params);

  return { tweets };
}
