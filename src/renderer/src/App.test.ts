import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import App from "./App.vue";
import { mockElectronAPI } from "./test_util";
afterEach(() => vi.unstubAllGlobals());
describe("private fork startup", () => {
  it("starts without network requests, login refresh, telemetry, or update polling", async () => {
    mockElectronAPI();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    window.electron.getCredentialProtection = vi.fn().mockResolvedValue(null);
    window.electron.checkForUpdates = vi.fn();
    const wrapper = mount(App, {
      global: {
        stubs: ["TabsView", "CredentialStoreBar", "AutomationErrorReportModal"],
        config: {
          globalProperties: { emitter: { on: vi.fn(), off: vi.fn() } },
        },
      },
    });
    await flushPromises();
    expect(wrapper.findComponent({ name: "TabsView" }).exists()).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expect(window.electron.trackEvent).not.toHaveBeenCalled();
    expect(window.electron.database.getConfig).not.toHaveBeenCalled();
    expect(window.electron.checkForUpdates).not.toHaveBeenCalled();
    wrapper
      .findComponent({ name: "TabsView" })
      .vm.$emit("check-for-updates-clicked");
    expect(window.electron.checkForUpdates).toHaveBeenCalledOnce();
    wrapper.unmount();
  });
});
