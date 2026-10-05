<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, getCurrentInstance } from "vue";
import type { DeviceInfo } from "./types";
import type { CredentialProtection } from "../../shared_types";
import { getDeviceInfo } from "./util";
import CydAPIClient from "../../cyd-api-client";
import AutomationErrorReportModal from "./modals/AutomationErrorReportModal.vue";
import TabsView from "./views/TabsView.vue";
import CredentialStoreBar from "./views/shared_components/CredentialStoreBar.vue";

const emitter =
  getCurrentInstance()?.appContext.config.globalProperties.emitter;
const isReady = ref(false);
const apiClient = ref(new CydAPIClient());
const deviceInfo = ref<DeviceInfo | null>(null);
const userEmail = ref("");
const refreshDeviceInfo = async () => {
  deviceInfo.value = await getDeviceInfo();
};
const refreshAPIClient = async () => {
  apiClient.value = new CydAPIClient();
  await refreshDeviceInfo();
};
provide("apiClient", apiClient);
provide("deviceInfo", deviceInfo);
provide("userEmail", userEmail);
provide("refreshDeviceInfo", refreshDeviceInfo);
provide("refreshAPIClient", refreshAPIClient);

const showAutomationErrorReportModal = ref(false);
const showAutomationError = (accountID: number) => {
  localStorage.setItem("automationErrorAccountID", accountID.toString());
  showAutomationErrorReportModal.value = true;
};
emitter?.on("show-automation-error", showAutomationError);
const credentialProtection = ref<CredentialProtection | null>(null);
const checkForUpdates = () => window.electron.checkForUpdates();

onMounted(async () => {
  try {
    credentialProtection.value =
      await window.electron.getCredentialProtection();
  } catch {
    credentialProtection.value = null;
  }
  await refreshDeviceInfo();
  document.title = "Cyd";
  isReady.value = true;
});
onUnmounted(() => emitter?.off("show-automation-error", showAutomationError));
</script>

<template>
  <div class="d-flex flex-column vh-100">
    <template v-if="isReady">
      <TabsView @check-for-updates-clicked="checkForUpdates" />
      <div class="bottom-bars">
        <CredentialStoreBar :protection="credentialProtection" />
      </div>
    </template>
    <AutomationErrorReportModal
      v-if="showAutomationErrorReportModal"
      @hide="showAutomationErrorReportModal = false"
    />
  </div>
</template>
