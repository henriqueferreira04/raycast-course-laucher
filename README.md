# Course Launcher

A [Raycast](https://www.raycast.com) extension to instantly launch all the apps you need for a university course: Warp terminal tabs, VS Code workspaces, and GitHub repositories, all in one keystroke.

## Commands

### Open Course

Browse your saved courses and launch them interactively. Select a course to see individual app actions or use **Open All** to launch Warp and VS Code at once.

### Manage Courses

Add, edit, and delete courses. Each course holds a list of app entries, where each entry is one of:

- **Warp** — a terminal tab opened at a local path
- **VS Code** — a workspace opened via the `code` CLI
- **GitHub** — a repository URL opened in the browser (excluded from "Open All")

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development mode (hot-reloads inside Raycast):

   ```bash
   npm run dev
   ```

## How It Works

When you launch a course, the extension:

1. Quits VS Code first (via AppleScript) so the new workspace opens cleanly.
2. Opens each Warp entry as a new terminal tab using the `warp://` URL scheme.
3. Opens each VS Code entry using the `code` CLI (falls back to `open -a "Visual Studio Code"`).
4. GitHub entries are only opened when launched individually, not through "Open All".

Paths support `~` expansion. GitHub entries must begin with `http`.

## Development

```bash
npm run build      # production build
npm run lint       # lint
npm run fix-lint   # auto-fix lint issues
npm run publish    # publish to Raycast store
```

Testing is done live inside Raycast with `npm run dev` — there is no automated test suite.

## Requirements

- [Raycast](https://www.raycast.com) (macOS)
- [Warp](https://www.warp.dev) for terminal entries
- [VS Code](https://code.visualstudio.com) with the `code` CLI in your PATH for workspace entries
