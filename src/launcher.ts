import { execSync } from "child_process";
import { showToast, Toast } from "@raycast/api";
import { AppEntry, Course, APP_DEFINITIONS } from "./types";

function expandPath(p: string): string {
  const home = process.env.HOME ?? ("/Users/" + (process.env.USER ?? ""));
  if (p === "~") return home;
  if (p.startsWith("~/")) return home + p.slice(1);
  if (p.startsWith("~")) return home + "/" + p.slice(1);
  return p;
}

function shell(cmd: string): void {
  execSync(`$SHELL -l -c ${JSON.stringify(cmd)}`, { stdio: "pipe" });
}

function quitVSCode() {
  try {
    // Gracefully quit VS Code if it's running
    shell(`osascript -e 'tell application "Visual Studio Code" to quit'`);
    // Give it a moment to fully quit before reopening
    execSync("sleep 1");
  } catch {
    // Not running, that's fine
  }
}

function openWarp(entry: AppEntry) {
  const expanded = expandPath(entry.path);
  const encoded = encodeURIComponent(expanded);
  // Opens a new TAB in the existing Warp window
  shell(`open "warp://action/new_tab?path=${encoded}"`);
}

function openVSCode(entry: AppEntry) {
  const expanded = expandPath(entry.path);
  try {
    shell(`code "${expanded}"`);
  } catch {
    shell(`open -a "Visual Studio Code" "${expanded}"`);
  }
}

function openGitHub(entry: AppEntry) {
  const url = entry.path.trim();
  if (!url.startsWith("http")) {
    throw new Error("Invalid URL");
  }
  shell(`open ${JSON.stringify(url)}`);
}

export async function launchSingleApp(course: Course, appId: string): Promise<void> {
  const entry = course.apps.find((a) => a.id === appId);
  if (!entry) {
    await showToast({ style: Toast.Style.Failure, title: "App not found" });
    return;
  }
  if (entry.type === "vscode") quitVSCode();
  try {
    if (entry.type === "warp") openWarp(entry);
    else if (entry.type === "vscode") openVSCode(entry);
    else if (entry.type === "github") openGitHub(entry);
    await showToast({
      style: Toast.Style.Success,
      title: `${course.emoji} ${course.name}`,
      message: `${entry.label ?? APP_DEFINITIONS[entry.type].label} opened`,
    });
  } catch {
    await showToast({ style: Toast.Style.Failure, title: "Failed to open", message: entry.path });
  }
}

export async function launchCourse(course: Course): Promise<void> {
  if (course.apps.length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No apps configured",
      message: `Add apps for ${course.name} in Manage Courses`,
    });
    return;
  }

  const hasVSCode = course.apps.some((a) => a.type === "vscode");

  // Quit VS Code first so we start fresh with only this course's workspaces
  if (hasVSCode) {
    quitVSCode();
  }

  const errors: string[] = [];

  for (const entry of course.apps) {
    try {
      if (entry.type === "warp") openWarp(entry);
      else if (entry.type === "vscode") openVSCode(entry);
      else if (entry.type === "github") openGitHub(entry);
    } catch (e) {
      errors.push(`${entry.type === "warp" ? "Warp" : entry.type === "vscode" ? "VS Code" : "GitHub"} (${entry.path})`);
    }
  }

  if (errors.length > 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Some apps failed to open",
      message: errors.join(", "),
    });
  } else {
    await showToast({
      style: Toast.Style.Success,
      title: `${course.emoji} ${course.name} launched`,
      message: `${course.apps.length} app${course.apps.length !== 1 ? "s" : ""} opened`,
    });
  }
}
