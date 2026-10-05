import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import AutomationErrorReportModal from "./AutomationErrorReportModal.vue";
import { AutomationErrorType } from "../automation_errors";
import { mockElectronAPI } from "../test_util";

vi.mock("bootstrap/js/dist/modal", () => ({
  default: class {
    show = vi.fn();
    hide = vi.fn();
    dispose = vi.fn();
  },
}));
describe("local automation error dialog", () => {
  let wrapper: VueWrapper;
  const emit = vi.fn();
  const report = {
    id: 1,
    accountID: 1,
    errorReportType: AutomationErrorType.x_unknownError,
    accountUsername: "private-user",
    screenshotDataURI: "private-screenshot",
    errorReportData: '{"secret":"private-content"}',
  };
  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI();
    localStorage.setItem("automationErrorAccountID", "1");
    window.electron.database.getNewErrorReports = vi
      .fn()
      .mockResolvedValue([report]);
  });
  afterEach(() => wrapper?.unmount());
  const render = async () => {
    wrapper = mount(AutomationErrorReportModal, {
      global: { config: { globalProperties: { emitter: { emit } } } },
    });
    await flushPromises();
  };
  it("offers retry/cancel without showing or submitting old sensitive diagnostics", async () => {
    await render();
    expect(wrapper.text()).toContain("No error report");
    expect(wrapper.text()).not.toContain("private-");
    expect(wrapper.find("textarea").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Submit");
    await wrapper.find(".btn-primary").trigger("click");
    await flushPromises();
    expect(emit).toHaveBeenCalledWith("automation-error-1-retry");
    expect(
      window.electron.database.dismissNewErrorReports,
    ).toHaveBeenCalledWith(1);
    expect(window.electron.trackEvent).not.toHaveBeenCalled();
  });
  it("cancels an interrupted task exactly once when dismissed", async () => {
    await render();
    await wrapper.find(".btn-secondary").trigger("click");
    await wrapper.trigger("hidden.bs.modal");
    await flushPromises();
    expect(emit).toHaveBeenCalledExactlyOnceWith("automation-error-1-cancel");
  });
  it.each([
    AutomationErrorType.X_manualBugReport,
    AutomationErrorType.facebook_manualBugReport,
  ])("resumes after a manual notice for %s", async (type) => {
    vi.mocked(window.electron.database.getNewErrorReports).mockResolvedValue([
      { ...report, errorReportType: type },
    ] as Awaited<
      ReturnType<typeof window.electron.database.getNewErrorReports>
    >);
    await render();
    expect(wrapper.find(".btn-primary").exists()).toBe(false);
    await wrapper.find(".btn-secondary").trigger("click");
    await flushPromises();
    expect(emit).toHaveBeenCalledWith("automation-error-1-resume");
  });
});
