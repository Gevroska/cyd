import type { Emitter, EventType } from "mitt";
import type { Account } from "../../../shared_types";
import { AutomationErrorType } from "../automation_errors";
import { logObj } from "../util";
import { TranslatorFn, TranslatorParams, translate } from "../i18n/translator";

// The browser-automation layer raises these while driving a page, and the
// platforms it drives already import them from here.
export {
  TimeoutError,
  URLChangedError,
  InternetDownError,
} from "./automation_failures";

type Log = {
  timestamp: string; // ISO string
  func: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message?: any;
};

/**
 * Renderer-side owner of one account's view state, for every platform.
 *
 * This core knows nothing about how a platform is driven: it holds the account
 * and its state machine, the recent log, error reporting, pause and resume
 * through sleep and wake, and translation.
 *
 * Platforms driven through an embedded browser build on BrowserViewModel,
 * which adds the webview and the page-interaction helpers. Platforms that talk
 * to an API directly build on this class, so no automation method is reachable
 * on them.
 */
export class BaseViewModel {
  public logs: Log[] = [];

  public account: Account;

  public state: string;
  public runJobsState: string;
  public action: string;
  public actionString: string;
  public actionFinishedString: string;

  public isPaused: boolean;

  // If the computer resumes from sleep, should we resume the automation?
  public shouldResumeOnResume: boolean;
  // Only allow the suspend events to be triggerer once at a time
  public suspendLock: boolean;

  public showBrowser: boolean;
  public showAutomationNotice: boolean;
  public instructions: string;

  public emitter: Emitter<Record<EventType, unknown>> | null;

  protected translator: TranslatorFn;

  constructor(
    account: Account,
    emitter: Emitter<Record<EventType, unknown>> | null,
    translator: TranslatorFn = translate,
  ) {
    this.account = account;

    this.state = "";
    this.runJobsState = "";
    this.action = "";
    this.actionString = "";
    this.actionFinishedString = "";
    this.instructions = "";
    this.showBrowser = false;
    this.showAutomationNotice = false;

    this.isPaused = false;
    this.shouldResumeOnResume = false;
    this.suspendLock = false;

    this.emitter = emitter;
    this.translator = translator;

    this.resetLogs();

    // Suspend and resume
    window.electron.onPowerMonitorSuspend(() => this.powerMonitorSuspend());
    window.electron.onPowerMonitorResume(() => this.powerMonitorResume());
  }

  public t(key: string, params?: TranslatorParams): string {
    return this.translator(key, params);
  }

  /**
   * Release what this view model holds open. The core holds nothing, so
   * platforms and layers with resources of their own override this.
   */
  cleanup() {
    // Nothing to release
  }

  async reloadAccount() {
    this.log("reloadAccount");
    const account = await window.electron.database.getAccount(this.account.id);
    if (account) {
      this.account = account;
    }
  }

  powerMonitorSuspend() {
    if (this.suspendLock) {
      this.log(
        "powerMonitorSuspend",
        "already got the suspend event, so skipping",
      );
      return;
    }
    this.suspendLock = true;

    if (this.isPaused) {
      this.log("powerMonitorSuspend", "already paused");
      this.shouldResumeOnResume = false;
    } else {
      this.log("powerMonitorSuspend", "pausing, will auto-resume on wake");
      this.shouldResumeOnResume = true;
      this.pause();
    }
  }

  powerMonitorResume() {
    this.suspendLock = false;

    if (this.shouldResumeOnResume) {
      this.log("powerMonitorResume", "resuming");
      this.resume();
    } else {
      this.log("powerMonitorResume", "was already paused");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(func: string, message?: any) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      func: func,
      message: message,
    });

    // Cap this.logs to at most 20 items
    if (this.logs.length > 20) {
      this.logs.shift();
    }

    if (message === undefined) {
      console.log(
        `${this.account?.type}[${this.account?.id}] ${func} (${this.state})`,
      );
    } else {
      console.log(
        `${this.account?.type}[${this.account?.id}] ${func} (${this.state}):`,
        logObj(message),
      );
    }
  }

  resetLogs() {
    this.logs = [];
  }

  async error(
    automationErrorType: AutomationErrorType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _errorReportData: any = null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _sensitiveContextData: any = null,
    allowContinue: boolean = false,
  ) {
    console.error(`Automation Error: ${automationErrorType}`);
    // Keep only the local state required by the retry/cancel dialog.
    // Do not capture page screenshots, URLs, usernames, payloads, or logs.
    await window.electron.database.createErrorReport(
      this.account.id,
      this.account.type,
      automationErrorType,
      "null",
      "",
      "",
      "{}",
    );

    if (!allowContinue) {
      await this.showErrorModal();
    }
  }

  async showErrorModal() {
    // Show the error modal
    this.emitter?.emit("show-automation-error", this.account.id);

    this.pause();
    await this.waitForPause();
  }

  async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async checkInternetConnectivity(): Promise<boolean> {
    return window.electron.checkInternetConnectivity(this.account.type);
  }

  // Pause and resume the jobs

  pause() {
    this.isPaused = true;
    this.log("pause", "paused");
  }

  resume() {
    this.isPaused = false;
    this.log("resume", "resumed");
  }

  async waitForPause() {
    if (!this.isPaused) {
      return;
    }

    while (this.isPaused) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    this.log("waitForPause", "resumed");
  }
}
