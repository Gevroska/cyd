import { describe, it, expect, vi, afterEach } from "vitest";
import CydAPIClient from "./cyd-api-client";
import { getDeviceInfo } from "./renderer/src/util";

afterEach(() => vi.unstubAllGlobals());
describe("fork privacy", () => {
  it("never transmits data through any legacy service entry point, even with saved credentials", async () => {
    const network = vi.fn(() => {
      throw new Error("Unexpected network request");
    });
    vi.stubGlobal("fetch", network);
    const client = new CydAPIClient();
    client.initialize("https://api.cyd.social");
    client.setUserEmail("private@example.com");
    await client.setDeviceToken("saved-secret");
    await client.authenticate({ email: "private@example.com" });
    await client.registerDevice({
      email: "private@example.com",
      verification_code: "code",
      description: "hostname",
      device_type: "desktop",
    });
    await client.getToken({
      email: "private@example.com",
      device_token: "saved-secret",
    });
    await client.deleteDevice({ uuid: "device-id" });
    await client.getNewAPIToken();
    await client.validateAPIToken();
    await client.ping();
    await client.getUserPremium();
    await client.postUserActivity();
    await client.postNewsletter({ email: "private@example.com" });
    await client.getVersion();
    for (const authenticated of [true, false]) {
      await client.postXProgress(
        { account_uuid: "private-id" } as Parameters<
          CydAPIClient["postXProgress"]
        >[0],
        authenticated,
      );
      await client.postFacebookProgress(
        { account_uuid: "private-id" } as Parameters<
          CydAPIClient["postFacebookProgress"]
        >[0],
        authenticated,
      );
      const result = await client.postAutomationErrorReport(
        {
          app_version: "1.2.4",
          client_platform: "win32",
          account_type: "X",
          error_report_type: "failure",
          error_report_data: { token: "secret" },
          screenshot_data_uri: "private screenshot",
        },
        authenticated,
      );
      expect(result).toMatchObject({ error: true });
    }
    expect(network).not.toHaveBeenCalled();
    expect(client.apiURL).toBeNull();
  });
  it("does not load saved upstream account credentials on startup", async () => {
    const getConfig = vi.fn().mockResolvedValue("old-secret");
    vi.stubGlobal("window", { electron: { database: { getConfig } } });
    expect(await getDeviceInfo()).toMatchObject({
      valid: false,
      deviceToken: "",
      userEmail: "",
    });
    expect(getConfig).not.toHaveBeenCalled();
  });
});
