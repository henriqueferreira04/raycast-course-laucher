import { LocalStorage } from "@raycast/api";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Course, STORAGE_KEY } from "./types";

export const BACKUP_PATH = path.join(os.homedir(), "Downloads", "courses-backup.json");

export async function loadCourses(): Promise<Course[]> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Course[];
  } catch {
    return [];
  }
}

export async function saveCourses(courses: Course[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export async function deleteCourse(id: string): Promise<Course[]> {
  const courses = await loadCourses();
  const updated = courses.filter((c) => c.id !== id);
  await saveCourses(updated);
  return updated;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function exportCourses(): Promise<string> {
  const courses = await loadCourses();
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(courses, null, 2), "utf-8");
  return BACKUP_PATH;
}

export function importCoursesFromFile(filePath: string): Course[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Invalid backup: expected a JSON array");
  for (const item of parsed) {
    if (typeof item.id !== "string" || typeof item.name !== "string" || !Array.isArray(item.apps)) {
      throw new Error("Invalid backup: malformed course entry");
    }
  }
  return parsed as Course[];
}
