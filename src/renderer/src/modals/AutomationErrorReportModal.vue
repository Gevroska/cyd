<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, getCurrentInstance } from "vue";
import {
  AutomationErrorType,
  AutomationErrorTypeToMessage,
} from "../automation_errors";
import type { ErrorReport } from "../../../shared_types";
import Modal from "bootstrap/js/dist/modal";

const emit = defineEmits(["hide"]);
const emitter =
  getCurrentInstance()?.appContext.config.globalProperties.emitter;
const automationErrorReportModal = ref<HTMLElement | null>(null);
const errorReports = ref<ErrorReport[]>([]);
const accountID = Number(localStorage.getItem("automationErrorAccountID"));
let modalInstance: Modal | null = null;
let handled = false;
const manual = computed(() =>
  errorReports.value.some(
    (report) =>
      report.errorReportType === AutomationErrorType.X_manualBugReport ||
      report.errorReportType === AutomationErrorType.facebook_manualBugReport,
  ),
);
const message = computed(
  () =>
    AutomationErrorTypeToMessage[
      errorReports.value[0]?.errorReportType as AutomationErrorType
    ] ?? "An automation error occurred.",
);
const finish = async (action: "retry" | "cancel" | "resume") => {
  if (handled) return;
  handled = true;
  await window.electron.database.dismissNewErrorReports(accountID);
  emitter?.emit(
    `automation-error-${accountID}-${manual.value ? "resume" : action}`,
  );
  modalInstance?.hide();
  emit("hide");
};
const dismissed = () => {
  void finish("cancel");
};
onMounted(async () => {
  errorReports.value =
    await window.electron.database.getNewErrorReports(accountID);
  if (automationErrorReportModal.value) {
    modalInstance = new Modal(automationErrorReportModal.value);
    automationErrorReportModal.value.addEventListener(
      "hidden.bs.modal",
      dismissed,
    );
    modalInstance.show();
  }
});
onUnmounted(() => {
  automationErrorReportModal.value?.removeEventListener(
    "hidden.bs.modal",
    dismissed,
  );
  modalInstance?.dispose();
});
</script>

<template>
  <div
    id="automationErrorReportModal"
    ref="automationErrorReportModal"
    class="modal fade"
    role="dialog"
    aria-labelledby="automationErrorReportModalLabel"
    tabindex="-1"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="automationErrorReportModalLabel" class="modal-title">
            Automation paused
          </h4>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
          <p>
            No error report, screenshot, or account data is sent. You can retry
            the task or cancel it.
          </p>
        </div>
        <div class="modal-footer">
          <button
            v-if="!manual"
            class="btn btn-primary"
            @click="finish('retry')"
          >
            Retry
          </button>
          <button class="btn btn-secondary" @click="finish('cancel')">
            {{ manual ? "Close" : "Cancel" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
