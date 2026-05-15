import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  useNavigation,
  confirmAlert,
  Alert,
  closeMainWindow,
  popToRoot,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { Course, APP_DEFINITIONS, AppType, AppEntry } from "./types";
import { loadCourses, deleteCourse } from "./storage";
import { launchCourse, launchSingleApp } from "./launcher";
import ManageCourses from "./manage-courses";

const appIconMap: Record<AppType, Icon> = {
  warp: Icon.Terminal,
  vscode: Icon.Code,
  github: Icon.Link,
};

function AppPickerView({ course, entries }: { course: Course; entries: AppEntry[] }) {
  return (
    <List navigationTitle={`${course.emoji} ${course.name}`}>
      {entries.map((app) => {
        const def = APP_DEFINITIONS[app.type];
        const label = app.path.split("/").pop() ?? app.path;
        return (
          <List.Item
            key={app.id}
            icon={appIconMap[app.type]}
            title={app.label ?? def.label}
            subtitle={label}
            actions={
              <ActionPanel>
                <Action
                  title={`Open ${app.label ?? def.label}`}
                  icon={appIconMap[app.type]}
                  onAction={async () => {
                    await launchSingleApp(course, app.id);
                    await closeMainWindow();
                    await popToRoot();
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

// ─── Course Launcher Page ────────────────────────────────────────────────────

function CourseLaunchPage({ course }: { course: Course }) {
  const { pop } = useNavigation();

  async function handleLaunchAll() {
    const filtered = { ...course, apps: course.apps.filter((a) => a.type !== "github") };
    await launchCourse(filtered);
    pop();
  }

  async function handleLaunchSingle(appId: string) {
    await launchSingleApp(course, appId);
    pop();
  }

  const appIconMap: Record<AppType, Icon | string> = {
    warp: Icon.Terminal,
    vscode: Icon.Code,
    github: Icon.Link,
  };

  return (
    <List navigationTitle={`${course.emoji} ${course.name}`} searchBarPlaceholder="Search options...">
      <List.Section title="Launch">
        <List.Item
          icon={Icon.Play}
          title="Open All"
          subtitle={`${course.apps.length} app${course.apps.length !== 1 ? "s" : ""}`}
          actions={
            <ActionPanel>
              <Action title="Open All" icon={Icon.Play} onAction={handleLaunchAll} />
            </ActionPanel>
          }
        />
      </List.Section>
      <List.Section title="Open Single">
        {course.apps.map((app) => {
          const def = APP_DEFINITIONS[app.type];
          const label = app.path.split("/").pop() ?? app.path;
          return (
            <List.Item
              key={app.id}
              icon={appIconMap[app.type]}
              title={app.label ?? def.label}
              subtitle={app.type === "github" ? app.path : label}
              actions={
                <ActionPanel>
                  <Action
                    title={`Open ${app.label ?? def.label}`}
                    icon={appIconMap[app.type]}
                    onAction={() => handleLaunchSingle(app.id)}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}

// ─── Course List ─────────────────────────────────────────────────────────────

export default function OpenCourse() {
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

  function getAppsSummary(course: Course): string {
    return course.apps
      .map((a) => `${APP_DEFINITIONS[a.type].icon} ${a.label ?? a.path.split("/").pop() ?? a.path}`)
      .join("  ");
  }

  async function handleDelete(course: Course) {
    const confirmed = await confirmAlert({
      title: `Remove "${course.name}"?`,
      message: "This will remove the course and its settings.",
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) {
      const updated = await deleteCourse(course.id);
      setCourses(updated);
      await showToast({ style: Toast.Style.Success, title: "Course removed" });
    }
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search courses..."
      actions={
        <ActionPanel>
          <Action
            title="Manage Courses"
            icon={Icon.Gear}
            onAction={() => push(<ManageCourses onCoursesChanged={fetchCourses} />)}
          />
        </ActionPanel>
      }
    >
      {courses.length === 0 && !isLoading ? (
        <List.EmptyView
          icon="📚"
          title="No courses yet"
          description="Press ↵ to set up your first course"
          actions={
            <ActionPanel>
              <Action
                title="Manage Courses"
                icon={Icon.Plus}
                onAction={() => push(<ManageCourses onCoursesChanged={fetchCourses} />)}
              />
            </ActionPanel>
          }
        />
      ) : (
        courses.map((course) => (
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
                    title="Launch All"
                    icon={Icon.Play}
                    onAction={async () => {
                      const filtered = { ...course, apps: course.apps.filter((a) => a.type !== "github") };
                      await launchCourse(filtered);
                      await closeMainWindow();
                    }}
                  />
                  <Action
                    title="Open Terminal"
                    icon={Icon.Terminal}
                    shortcut={{ modifiers: ["cmd"], key: "t" }}
                    onAction={async () => {
                      const warpEntries = course.apps.filter((a) => a.type === "warp");
                      if (warpEntries.length === 1) {
                        await launchSingleApp(course, warpEntries[0].id);
                        await closeMainWindow();
                      } else if (warpEntries.length > 1) {
                        push(<AppPickerView course={course} entries={warpEntries} />);
                      }
                    }}
                  />
                  <Action
                    title="Open VS Code"
                    icon={Icon.Code}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                    onAction={async () => {
                      const entry = course.apps.find((a) => a.type === "vscode");
                      if (entry) {
                        await launchSingleApp(course, entry.id);
                        await closeMainWindow();
                      }
                    }}
                  />
                  <Action
                    title="Open GitHub"
                    icon={Icon.Link}
                    shortcut={{ modifiers: ["cmd"], key: "g" }}
                    onAction={async () => {
                      const entry = course.apps.find((a) => a.type === "github");
                      if (entry) {
                        await launchSingleApp(course, entry.id);
                        await closeMainWindow();
                      }
                    }}
                  />
                  <Action
                    title="Browse Apps"
                    icon={Icon.ChevronRight}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
                    onAction={() => push(<CourseLaunchPage course={course} />)}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Manage Courses"
                    icon={Icon.Gear}
                    shortcut={{ modifiers: ["cmd"], key: "m" }}
                    onAction={() => push(<ManageCourses onCoursesChanged={fetchCourses} />)}
                  />
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
        ))
      )}
    </List>
  );
}
