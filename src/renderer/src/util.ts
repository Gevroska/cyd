import type { DeviceInfo } from "./types";

// Never load or refresh credentials from an older upstream Cyd installation.
export async function getDeviceInfo(): Promise<DeviceInfo> {
  return {
    userEmail: "",
    deviceDescription: "",
    deviceToken: "",
    deviceUUID: "",
    apiToken: "",
    valid: false,
  };
}

export function getAccountIcon(accountType: string): string {
  switch (accountType) {
    case "X":
      return "fa-brands fa-x-twitter";
    case "Bluesky":
      return "fa-brands fa-bluesky";
    case "Facebook":
      return "fa-brands fa-facebook";
    default:
      return "fa-solid fa-gears";
  }
}

export function getBreadcrumbIcon(breadcrumbType: string): string {
  switch (breadcrumbType) {
    case "dashboard":
      return "fa-solid fa-house";
    case "database":
      return "fa-solid fa-database";
    case "build":
      return "fa-solid fa-screwdriver-wrench";
    case "delete":
      return "fa-solid fa-fire";
    case "import":
      return "fa-solid fa-file-import";
    case "review":
      return "fa-solid fa-eye";
    case "bluesky":
      return "fa-brands fa-bluesky";
    case "tombstone":
      return "fa-solid fa-skull";
    default:
      return "fa-solid fa-question";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logObj(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export async function setAccountRunning(accountID: number, isRunning: boolean) {
  if (isRunning) {
    // Start power save blocker
    const powerSaveBlockerID =
      await window.electron.startPowerSaveBlocker(accountID);
    localStorage.setItem(
      `account-${accountID}-power-save-blocker-id`,
      JSON.stringify(powerSaveBlockerID),
    );
  } else {
    // Stop power save blocker
    const powerSaveBlockerID = localStorage.getItem(
      `account-${accountID}-power-save-blocker-id`,
    );
    if (powerSaveBlockerID) {
      window.electron.stopPowerSaveBlocker(
        accountID,
        JSON.parse(powerSaveBlockerID),
      );
      localStorage.removeItem(`account-${accountID}-power-save-blocker-id`);
    }
  }

  localStorage.setItem(
    `account-${accountID}-running`,
    JSON.stringify(isRunning),
  );
}

export async function getAccountRunning(accountID: number): Promise<boolean> {
  const isRunning = localStorage.getItem(`account-${accountID}-running`);
  return isRunning ? JSON.parse(isRunning) : false;
}

export async function openPreventSleepURL() {
  const platform = await window.electron.getPlatform();
  let url: string;
  if (platform === "darwin") {
    url = "https://docs.cyd.social/docs/tips/disable-sleep/mac";
  } else if (platform == "win32") {
    url = "https://docs.cyd.social/docs/tips/disable-sleep/windows";
  } else if (platform == "linux") {
    url = "https://docs.cyd.social/docs/tips/disable-sleep/linux";
  } else {
    url = "https://docs.cyd.social/docs/tips/disable-sleep/intro";
  }
  await window.electron.openURL(url);
}

export async function openURL(url: string) {
  await window.electron.openURL(url);
}

export const formattedDatetime = (date: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return new Date(date).toLocaleString("en-US", options);
};

export const showQuestionOpenModePremiumFeature =
  async (): Promise<boolean> => {
    return await window.electron.showQuestion(
      "You're about to run a job that normally requires Premium access, but you're running Cyd in open source developer mode, so you don't have to authenticate with the Cyd server to use these features.\n\nIf you're not contributing to Cyd, please support the project by paying for a Premium plan.",
      "Continue",
      "Cancel",
    );
  };

// Premium check helper functions
// Before switching to a premium check view, we need to store the reason and tasks that the user was trying to perform

export const setPremiumTasks = (accountID: number, tasks: string[]): void => {
  localStorage.setItem(`premiumTasks-${accountID}`, JSON.stringify(tasks));
};

export const getPremiumTasks = (accountID: number): string[] | null => {
  const tasks = localStorage.getItem(`premiumTasks-${accountID}`);
  return tasks ? JSON.parse(tasks) : null;
};

export const clearPremiumTasks = (accountID: number): void => {
  localStorage.removeItem(`premiumTasks-${accountID}`);
};

// Jobs type helper functions
// Before switching starting a set of jobs (save, archive, delete, migrate, etc.) we need to store the jobs type that the user was trying to perform

export const setJobsType = (accountID: number, type: string): void => {
  localStorage.setItem(`jobsType-${accountID}`, type);
};

export const getJobsType = (accountID: number): string | null => {
  return localStorage.getItem(`jobsType-${accountID}`);
};

export const clearJobsType = (accountID: number): void => {
  localStorage.removeItem(`jobsType-${accountID}`);
};

// Format an error to include the message and stack trace
export const formatError = (error: Error): string => {
  return `${error.message}\n\n${error.stack}`;
};

// Breadcrumb helper functions for wizard pages
// These create common breadcrumb button objects to reduce duplication

export const createDashboardBreadcrumb = <T>(
  setState: (state: T) => void,
  dashboardState: T,
) => ({
  label: "Dashboard",
  action: () => setState(dashboardState),
  icon: getBreadcrumbIcon("dashboard"),
});

export const createBackBreadcrumb = <T>(
  label: string,
  setState: (state: T) => void,
  targetState: T,
  iconType?: string,
) => ({
  label,
  action: () => setState(targetState),
  icon: getBreadcrumbIcon(iconType || "back"),
});
