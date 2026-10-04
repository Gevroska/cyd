import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import XWizardDeleteOptionsPage from "./XWizardDeleteOptionsPage.vue";
import { XViewModel, State } from "../../../view_models/XViewModel";
import type { XAccount } from "../../../../../shared_types";
import { createMockAccount, mockElectronAPI } from "../../../test_util";
import i18n from "../../../i18n";

vi.mock("../../../util", () => ({
  getBreadcrumbIcon: vi.fn(() => "icon"),
  openURL: vi.fn(),
  setJobsType: vi.fn(),
}));

vi.mock("../../../util_x", () => ({
  xHasSomeData: vi.fn().mockResolvedValue(true),
}));

// Mock child components
vi.mock("../components/XLastImportOrBuildComponent.vue", () => ({
  default: {
    name: "XLastImportOrBuildComponent",
    template: "<div></div>",
  },
}));

vi.mock("../../shared_components/wizard/BaseWizardPage.vue", () => ({
  default: {
    name: "BaseWizardPage",
    template: `<div>
      <slot name="content" />
      <button v-for="button in buttonProps.backButtons" :key="button.label"
        :disabled="button.disabled" @click="button.action()">{{ button.label }}</button>
      <button v-for="button in buttonProps.nextButtons" :key="button.label"
        :disabled="button.disabled" @click="button.action()">{{ button.label }}</button>
    </div>`,
    props: ["breadcrumbProps", "buttonProps"],
  },
}));

describe("XWizardDeleteOptionsPage", () => {
  let wrapper: VueWrapper;

  const createMockModel = (
    accountOverrides: { xAccount?: Partial<XAccount> } = {},
  ): Partial<XViewModel> => ({
    account: createMockAccount({
      xAccount: {
        deleteTweets: false,
        deleteRetweets: false,
        deleteLikes: false,
        deleteLikesDaysOldEnabled: false,
        deleteLikesDaysOld: 0,
        ...accountOverrides.xAccount,
      } as XAccount,
    }),
  });

  beforeEach(() => {
    mockElectronAPI();
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("should mount delete options page component", async () => {
      const mockModel = createMockModel();

      wrapper = mount(XWizardDeleteOptionsPage, {
        props: {
          model: mockModel as XViewModel,
        },
        global: {
          plugins: [i18n],
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it("should render BaseWizardPage wrapper", async () => {
      const mockModel = createMockModel();

      wrapper = mount(XWizardDeleteOptionsPage, {
        props: {
          model: mockModel as XViewModel,
        },
        global: {
          plugins: [i18n],
        },
      });

      expect(wrapper.findComponent({ name: "BaseWizardPage" }).exists()).toBe(
        true,
      );
    });
  });

  describe("navigation", () => {
    it("should emit setState with WizardDashboard when Back clicked", async () => {
      const mockModel = createMockModel();

      wrapper = mount(XWizardDeleteOptionsPage, {
        props: {
          model: mockModel as XViewModel,
        },
        global: {
          plugins: [i18n],
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const backButton = wrapper
        .findAll("button")
        .find((btn) => btn.text().includes("Back"));

      if (backButton) {
        (backButton.element as HTMLButtonElement).click();
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted("setState")).toBeTruthy();
        expect(wrapper.emitted("setState")?.[0]).toEqual([
          State.WizardDashboard,
        ]);
      }
    });
  });

  describe("data loading", () => {
    it("should check for existing data on mount", async () => {
      const { xHasSomeData } = await import("../../../util_x");

      const mockModel = createMockModel();

      wrapper = mount(XWizardDeleteOptionsPage, {
        props: {
          model: mockModel as XViewModel,
        },
        global: {
          plugins: [i18n],
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(xHasSomeData).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe("delete likes advanced options", () => {
    it("shows the likes age filter when toggled", async () => {
      const mockModel = createMockModel();

      wrapper = mount(XWizardDeleteOptionsPage, {
        props: {
          model: mockModel as XViewModel,
        },
        global: {
          plugins: [i18n],
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const toggles = wrapper
        .findAll("button")
        .filter((btn) => btn.text().includes("Show more options"));
      expect(toggles).toHaveLength(3);

      await toggles[2].trigger("click");

      expect(wrapper.find("#deleteLikesDaysOldEnabled").exists()).toBe(true);
    });
  });

  describe("reply tweet protection", () => {
    it("loads a saved choice, opens the options, and saves checkbox changes", async () => {
      const mockModel = createMockModel({
        xAccount: { deleteTweets: true, deleteTweetsKeepReplies: true },
      });
      vi.mocked(window.electron.database.getAccount).mockResolvedValue(
        mockModel.account!,
      );
      wrapper = mount(XWizardDeleteOptionsPage, {
        props: { model: mockModel as XViewModel },
        global: { plugins: [i18n] },
      });
      await flushPromises();

      const checkbox = wrapper.get("#deleteTweetsKeepReplies");
      expect((checkbox.element as HTMLInputElement).checked).toBe(true);
      expect(wrapper.get('label[for="deleteTweetsKeepReplies"]').text()).toBe(
        "Do not delete my reply tweets",
      );
      expect((checkbox.element as HTMLInputElement).disabled).toBe(false);

      await checkbox.setValue(false);
      const continueButton = wrapper
        .findAll("button")
        .find((button) => button.text().includes("Continue to Review"))!;
      await continueButton.trigger("click");
      await flushPromises();
      expect(window.electron.database.saveAccount).toHaveBeenLastCalledWith(
        expect.any(String),
      );
      const saved = vi.mocked(window.electron.database.saveAccount).mock.calls;
      expect(
        JSON.parse(saved.at(-1)![0]).xAccount.deleteTweetsKeepReplies,
      ).toBe(false);

      await checkbox.setValue(true);
      await continueButton.trigger("click");
      await flushPromises();
      expect(
        JSON.parse(saved.at(-1)![0]).xAccount.deleteTweetsKeepReplies,
      ).toBe(true);
    });

    it("disables reply protection when tweet deletion is off", async () => {
      wrapper = mount(XWizardDeleteOptionsPage, {
        props: { model: createMockModel() as XViewModel },
        global: { plugins: [i18n] },
      });
      await flushPromises();
      const toggle = wrapper
        .findAll("button")
        .find((button) => button.text().includes("Show more options"))!;
      await toggle.trigger("click");
      expect(
        (wrapper.get("#deleteTweetsKeepReplies").element as HTMLInputElement)
          .disabled,
      ).toBe(true);
    });
  });
});
