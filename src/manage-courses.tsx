import {
  List,
  ActionPanel,
  Action,
  Icon,
  Form,
  useNavigation,
  showToast,
  Toast,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { Course, AppEntry, AppType, APP_DEFINITIONS, EMOJIS } from "./types";
import { loadCourses, saveCourses, deleteCourse, generateId, exportCourses, importCoursesFromFile, BACKUP_PATH } from "./storage";

interface ManageCoursesProps {
  onCoursesChanged?: () => void;
}

// ─── App Entry Row inside the form ──────────────────────────────────────────

function AppEntryRow({
  entry,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  entry: AppEntry;
  index: number;
  total: number;
  onChange: (updated: AppEntry) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const def = APP_DEFINITIONS[entry.type];
  return (
    <>
      <Form.Separator />
      <Form.Description
        title={`${def.icon} ${def.label} #${index + 1}`}
        text={index === 0 ? "First to open" : ""}
      />
      <Form.Dropdown
        id={`type-${entry.id}`}
        title="App"
        value={entry.type}
        onChange={(v) => onChange({ ...entry, type: v as AppType })}
      >
        <Form.Dropdown.Item value="warp" title="🖥️  Warp" />
        <Form.Dropdown.Item value="vscode" title="💻  VS Code" />
        <Form.Dropdown.Item value="github" title="🐙  GitHub" />
      </Form.Dropdown>
      <Form.TextField
        id={`label-${entry.id}`}
        title="Name"
        placeholder={def.label}
        value={entry.label ?? ""}
        onChange={(v) => onChange({ ...entry, label: v || undefined })}
      />
      <Form.TextArea
        id={`path-${entry.id}`}
        title={entry.type === "github" ? "URL" : "Path"}
        placeholder={
          entry.type === "github"
            ? "https://github.com/org/repo"
            : "~/Desktop/2S/CLE/2526-tp2-group03"
        }
        value={entry.path}
        onChange={(v) => onChange({ ...entry, path: v.replace(/\n/g, "") })}
        enableMarkdown={false}
      />
    </>
  );
}

// ─── Course Form ─────────────────────────────────────────────────────────────

function CourseForm({
  course,
  onSave,
}: {
  course?: Course;
  onSave: (course: Course) => void;
}) {
  const { pop } = useNavigation();
  const isEditing = !!course;

  const [name, setName] = useState(course?.name ?? "");
  const [emoji, setEmoji] = useState(course?.emoji ?? "📚");
  const [apps, setApps] = useState<AppEntry[]>(course?.apps ?? []);
  const [nameError, setNameError] = useState<string | undefined>();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  function addApp(type: AppType) {
    const newEntry: AppEntry = { id: generateId(), type, path: "" };
    setApps((prev) => [...prev, newEntry]);
    setSelectedAppId(newEntry.id);
  }

  function updateApp(id: string, updated: AppEntry) {
    setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  function removeApp(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  function moveApp(id: string, direction: "up" | "down") {
    setApps((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError("Course name is required");
      return;
    }

    const emptyPaths = apps.filter((a) => !a.path.trim());
    if (emptyPaths.length > 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Missing paths",
        message: `Fill in all paths before saving`,
      });
      return;
    }

    const invalidUrls = apps.filter((a) => a.type === "github" && !a.path.trim().startsWith("http"));
    if (invalidUrls.length > 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid GitHub URL",
        message: `GitHub links must start with https://`,
      });
      return;
    }

    const saved: Course = {
      id: course?.id ?? generateId(),
      name: name.trim(),
      emoji,
      apps,
      createdAt: course?.createdAt ?? Date.now(),
    };

    onSave(saved);
    await showToast({
      style: Toast.Style.Success,
      title: isEditing ? "Course updated" : "Course added",
      message: saved.name,
    });
    pop();
  }

  // Build action panel dynamically based on selected app
  const selectedApp = apps.find((a) => a.id === selectedAppId) ?? null;
  const selectedIndex = selectedApp ? apps.indexOf(selectedApp) : -1;

  return (
    <Form
      navigationTitle={isEditing ? `Edit ${course?.name}` : "Add Course"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isEditing ? "Save Changes" : "Add Course"}
            icon={Icon.CheckCircle}
            onSubmit={handleSubmit}
          />
          <ActionPanel.Section title="Add App">
            <Action
              title="Add Warp Tab"
              icon="🖥️"
              onAction={() => addApp("warp")}
            />
            <Action
              title="Add VS Code Workspace"
              icon="💻"
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={() => addApp("vscode")}
            />
            <Action
              title="Add GitHub Link"
              icon="🐙"
              shortcut={{ modifiers: ["cmd", "shift"], key: "g" }}
              onAction={() => addApp("github")}
            />
          </ActionPanel.Section>
          {apps.length > 0 && (
            <ActionPanel.Section title="Manage Entries">
              {selectedIndex > 0 && (
                <Action
                  title="Move Entry Up"
                  icon={Icon.ArrowUp}
                  shortcut={{ modifiers: ["cmd", "opt"], key: "arrowUp" }}
                  onAction={() => selectedApp && moveApp(selectedApp.id, "up")}
                />
              )}
              {selectedIndex < apps.length - 1 && selectedIndex >= 0 && (
                <Action
                  title="Move Entry Down"
                  icon={Icon.ArrowDown}
                  shortcut={{ modifiers: ["cmd", "opt"], key: "arrowDown" }}
                  onAction={() => selectedApp && moveApp(selectedApp.id, "down")}
                />
              )}
              <Action
                title="Remove Last Entry"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                onAction={() => {
                  if (apps.length > 0) removeApp(apps[apps.length - 1].id);
                }}
              />
            </ActionPanel.Section>
          )}
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Course Name"
        placeholder="e.g. CLE, Algorithms, Web Dev"
        value={name}
        onChange={setName}
        error={nameError}
        onBlur={() => {
          if (!name.trim()) setNameError("Required");
          else setNameError(undefined);
        }}
        autoFocus={true}
      />
      <Form.Dropdown id="emoji" title="Icon" value={emoji} onChange={setEmoji}>
        {EMOJIS.map((e) => (
          <Form.Dropdown.Item key={e} value={e} title={e} />
        ))}
      </Form.Dropdown>

      {apps.length === 0 ? (
        <>
          <Form.Separator />
          <Form.Description
            title="No apps yet"
            text="Use ⌘N to add a Warp tab or VS Code workspace · ⌘⌫ to remove"
          />
        </>
      ) : (
        apps.map((entry, i) => (
          <AppEntryRow
            key={entry.id}
            entry={entry}
            index={i}
            total={apps.length}
            onChange={(updated) => updateApp(entry.id, updated)}
            onRemove={() => removeApp(entry.id)}
            onMoveUp={() => moveApp(entry.id, "up")}
            onMoveDown={() => moveApp(entry.id, "down")}
          />
        ))
      )}
    </Form>
  );
}

// ─── Import Courses Form ──────────────────────────────────────────────────────

function ImportCoursesForm({ onImport }: { onImport: (courses: Course[], mode: "merge" | "replace") => void }) {
  const { pop } = useNavigation();
  const [files, setFiles] = useState<string[]>([]);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  async function handleSubmit() {
    if (files.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "No file selected" });
      return;
    }
    try {
      const imported = importCoursesFromFile(files[0]);
      onImport(imported, mode);
      await showToast({
        style: Toast.Style.Success,
        title: `${imported.length} course${imported.length !== 1 ? "s" : ""} imported`,
        message: mode === "replace" ? "Existing courses replaced" : "Merged with existing courses",
      });
      pop();
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Import failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <Form
      navigationTitle="Import Courses"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Import" icon={Icon.Download} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="file"
        title="Backup File"
        allowMultipleSelection={false}
        value={files}
        onChange={setFiles}
      />
      <Form.Dropdown id="mode" title="Import Mode" value={mode} onChange={(v) => setMode(v as "merge" | "replace")}>
        <Form.Dropdown.Item value="merge" title="Merge — keep existing, add new" />
        <Form.Dropdown.Item value="replace" title="Replace — overwrite all courses" />
      </Form.Dropdown>
    </Form>
  );
}

// ─── Manage Courses List ─────────────────────────────────────────────────────

export default function ManageCourses({ onCoursesChanged }: ManageCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  async function fetchCourses() {
    setIsLoading(true);
    const loaded = await loadCourses();
    setCourses(loaded);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleSave(saved: Course) {
    const existing = courses.find((c) => c.id === saved.id);
    const updated = existing
      ? courses.map((c) => (c.id === saved.id ? saved : c))
      : [...courses, saved];
    await saveCourses(updated);
    setCourses(updated);
    onCoursesChanged?.();
  }

  async function handleExport() {
    try {
      await exportCourses();
      await showToast({
        style: Toast.Style.Success,
        title: "Courses exported",
        message: BACKUP_PATH,
      });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Export failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function handleImport(imported: Course[], mode: "merge" | "replace") {
    let updated: Course[];
    if (mode === "replace") {
      updated = imported;
    } else {
      const existingIds = new Set(courses.map((c) => c.id));
      const newOnes = imported.filter((c) => !existingIds.has(c.id));
      updated = [...courses, ...newOnes];
    }
    await saveCourses(updated);
    setCourses(updated);
    onCoursesChanged?.();
  }

  async function handleDelete(course: Course) {
    const confirmed = await confirmAlert({
      title: `Remove "${course.name}"?`,
      message: "Removes the course and its settings. Your files stay untouched.",
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) {
      const updated = await deleteCourse(course.id);
      setCourses(updated);
      onCoursesChanged?.();
      await showToast({ style: Toast.Style.Success, title: "Course removed" });
    }
  }

  function getAppsSummary(course: Course): string {
    if (course.apps.length === 0) return "No apps";
    return course.apps
      .map((a) => `${APP_DEFINITIONS[a.type].icon} ${a.path.split("/").pop() ?? a.path}`)
      .join("  ");
  }

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Manage Courses"
      searchBarPlaceholder="Search courses..."
      actions={
        <ActionPanel>
          <Action
            title="Add Course"
            icon={Icon.Plus}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={() => push(<CourseForm onSave={handleSave} />)}
          />
          <ActionPanel.Section title="Backup">
            <Action
              title="Export Courses"
              icon={Icon.Upload}
              shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
              onAction={handleExport}
            />
            <Action
              title="Import Courses"
              icon={Icon.Download}
              shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
              onAction={() => push(<ImportCoursesForm onImport={handleImport} />)}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      {courses.length === 0 && !isLoading ? (
        <List.EmptyView
          icon="📚"
          title="No courses yet"
          description="Press ⌘N to add your first course"
          actions={
            <ActionPanel>
              <Action
                title="Add Course"
                icon={Icon.Plus}
                onAction={() => push(<CourseForm onSave={handleSave} />)}
              />
            </ActionPanel>
          }
        />
      ) : (
        <List.Section title="Courses" subtitle={`${courses.length} course${courses.length !== 1 ? "s" : ""}`}>
          {courses.map((course) => (
            <List.Item
              key={course.id}
              icon={course.emoji}
              title={course.name}
              subtitle={getAppsSummary(course)}
              accessories={[{ text: `${course.apps.length} app${course.apps.length !== 1 ? "s" : ""}` }]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action
                      title="Edit Course"
                      icon={Icon.Pencil}
                      onAction={() => push(<CourseForm course={course} onSave={handleSave} />)}
                    />
                    <Action
                      title="Add Course"
                      icon={Icon.Plus}
                      shortcut={{ modifiers: ["cmd"], key: "n" }}
                      onAction={() => push(<CourseForm onSave={handleSave} />)}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="Remove Course"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      onAction={() => handleDelete(course)}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
