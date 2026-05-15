# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start development mode (hot reload via Raycast)
npm run build      # production build
npm run lint       # lint with Raycast's ESLint config
npm run fix-lint   # auto-fix lint issues
npm run publish    # publish to Raycast store
```

There are no automated tests. The extension is developed and tested live inside Raycast using `npm run dev`.

## Architecture

This is a Raycast extension that lets users configure university courses, each mapped to a set of apps (Warp terminal tabs, VS Code workspaces, GitHub URLs), and launch them all at once.

### Three commands (each maps to a file in `src/`)

- **`open-course`** (`open-course.tsx`) — interactive list of courses; selecting one navigates to `CourseLaunchPage`, which shows "Open All" and per-app actions.
- **`launch-course`** (`launch-course.tsx`) — argument-driven command; accepts `courseName` and optional `app` argument (aliases in `APP_ALIASES`). Launches immediately or shows an `AppPickerView` when multiple apps of the same type exist.
- **`manage-courses`** (`manage-courses.tsx`) — full CRUD interface. `ManageCourses` is also pushed from within `open-course` via `useNavigation`.

### Core modules

- **`types.ts`** — `Course` and `AppEntry` types, `APP_DEFINITIONS` (display labels/icons), `STORAGE_KEY`, and the fixed `EMOJIS` list. `AppType` is the union `"warp" | "vscode" | "github"`.
- **`storage.ts`** — thin wrapper over Raycast `LocalStorage`. All courses are stored as a single JSON array under `STORAGE_KEY = "courses-v2"`.
- **`launcher.ts`** — executes shell commands via `execSync` + `$SHELL -l -c`. Warp opens via URL scheme (`warp://action/new_tab?path=...`), VS Code via the `code` CLI (falls back to `open -a`), GitHub via `open <url>`. When VS Code is included in a launch, `quitVSCode()` runs first (via AppleScript) so the new workspace opens cleanly.

### Key behaviors to preserve

- "Open All" in `open-course` and `launch-course` (no `app` argument) silently skips GitHub entries — only Warp and VS Code are launched.
- `launch-course` uses `hasRun` ref to prevent double-firing the effect in React strict mode.
- Paths support `~` expansion (handled in `launcher.ts:expandPath`).
- GitHub entries require `path` to start with `http`; this is validated in `CourseForm` before save.
