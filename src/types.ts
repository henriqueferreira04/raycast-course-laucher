export type AppType = "warp" | "vscode" | "github";

export interface AppEntry {
  id: string;
  type: AppType;
  path: string;
  label?: string; // optional custom name, defaults to app name
}

export interface Course {
  id: string;
  name: string;
  emoji: string;
  apps: AppEntry[];
  createdAt: number;
}

export const APP_DEFINITIONS: Record<AppType, { label: string; icon: string }> = {
  warp:   { label: "Warp",    icon: "🖥️" },
  vscode: { label: "VS Code", icon: "💻" },
  github: { label: "GitHub",  icon: "🐙" },
};

export const STORAGE_KEY = "courses-v2";

export const EMOJIS = ["📚", "🧪", "💡", "🔬", "📐", "🎨", "🖊️", "🧮", "🌍", "⚙️", "🧠", "📊", "🏛️", "🎯", "🔭"];
