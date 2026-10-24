## Unreleased

- **Arabic command names**: names can use letters from any language — `ابدأ`, `رفع_الملفات` — and type straight into any terminal
- **Emoji command names**: `🚀`, `deploy🔥`, `👍🏽`, `👨‍💻`, `🇪🇬` and `1️⃣` work as names in cmd, PowerShell, Git Bash and Claude Code. `❤` and `❤️` count as the same name
- Arabic spellings of one word (`ابدأ` / `ابدا` / `إبدأ`, tashkeel, `ة`/`ه`, `ى`/`ي`) count as the same name, so a duplicate is refused and Run / Delete find it either way. Name matching is no longer case-sensitive, like the duplicate check already was
- **`+` in names**: `+`, `c++` or `+🚀` are names now, and `-` can start one. PowerShell reads a name like `+` or `-1` as math, so `pt` says to run those as `& '+'` there
- `pt remove` and `pt list` replace `pt rm` and `pt ls`, which still work
- `pt` actions in Arabic: `pt ضيف` / `أضف`, `pt امسح` / `احذف`, `pt اعرض` / `قائمة`
- Fix: Arabic (or any non-ASCII text) inside a saved command, or typed as an argument to a multi-entry command, was garbled by cmd. The `.cmd` launchers now run in UTF-8 and restore the console's code page afterwards

## 1.6.0

- **`pt` command line**: create, delete and list commands from any terminal — `pt add dev "npm run dev"`, `pt rm dev`, `pt ls`. It edits the same shared commands and launchers as the editor, so AI CLIs like Claude Code can make commands for you. Runs on the editor's own executable, no Node install needed
- **Also on npm**: `npm install -g powerterminal` gives you `pt` without installing the extension in any editor. When both are installed the npm one is used
- `pt` is now a reserved command name

## 1.5.0

- **One set of commands for every editor**: VS Code, Cursor, Antigravity and other forks each kept their own copy of your commands, so a command saved in one was missing in the others. They now share one `db.json` (`%APPDATA%\powerterminal` on Windows, `~/Library/Application Support/powerterminal` on macOS, `~/.config/powerterminal` on Linux)
- **Multiple entries launchers work with any editor**: the request folder is shared too, so typing the name in a terminal opens the terminals in whichever editor is running, instead of only the one that created the launcher
- Commands saved by earlier versions in any of these editors are brought over on the first start, once. If two editors saved different commands under the same name, the running editor's version is kept and you are told which names clashed. The old files are left untouched
- Saving is now written to a temporary file and moved into place, so two editors reading at the same moment never see half a file
- **Names Git Bash already uses are refused**: Git Bash runs its own tools (`yes`, `head`, `sort`, `sleep`...) before anything on the Windows PATH, and the name check could not see them. A command called `yes` ran the real `yes` in Git Bash and Claude Code, printing `y` until it was killed

## 1.4.0

- **Fix: typing a command name no longer spills junk characters into the prompt.** Launchers used to press `ctrl+shift+alt+<letter>` and hope VS Code was the focused window. When it was not — a terminal outside VS Code, a different keyboard layout, a conflicting shortcut — Windows read `ctrl+alt` as AltGr and typed a literal character instead of running anything
- Launchers are now `.cmd` files. A command with a single entry runs straight from the shell, with no VS Code round trip, so it works in PowerShell, cmd and Windows Terminal, in any folder
- Commands with **multiple entries** still need VS Code to open one terminal per entry. The launcher now leaves a request file that the extension watches for, instead of sending keystrokes — independent of focus and keyboard layout
- Old `.vbs` launchers are deleted and replaced on startup. They also had to go because `.VBS` comes before `.CMD` in the default `PATHEXT` and would keep winning
- Arguments keep working the same way, including `$1`..`$9` and `$*` / `$@`
- The bundled sample database no longer ships 13 placeholder commands into every fresh install
- **Git Bash and AI CLIs**: every command also gets an extensionless sh launcher, so `dev` works in Git Bash and `! dev` works in Claude Code, with the output coming back
- **Safer names**: names that would hide a shell built-in, a common tool or anything already on PATH are refused, as are duplicates and names with characters other than letters, numbers, `-` and `_`
- Fix: arguments containing `&`, `|`, `>` or `!` broke multi-entry launchers, and `%` or `^` in arguments were mangled by single-entry ones
- Fix: multi-entry launchers did nothing until a Power Terminal command had been run in that window; the extension now starts with VS Code
- Each terminal opened for a command is named after it
- Deleting a command that does not exist, or saving one with no entries, now says so
- Requires VS Code 1.48 or newer

## 1.3.0 - 2026-08-26

- **Arguments**: the whole typed line is used now, not just the command name — `pull main` on a command holding `git pull origin` runs `git pull origin main`. Works in the *Run Command* input box and when typing the name straight into the terminal
- Optional placeholders `$1`..`$9` and `$*` / `$@` put the arguments anywhere inside a saved command; without a placeholder they are appended to the last entry
- Command names containing spaces (saved by older versions) still resolve — the longest matching name wins
- Launchers created by older versions are brought up to date on startup, so existing commands accept arguments without being re-created
- The `.vbs` launcher is no longer written on macOS/Linux, where it cannot run
- Fix: deleting a command no longer reports "your command has been sucessuful inserted"

## 1.2.0 - 2026-07-11

- New terminal behavior: a command with a **single** entry now runs in the currently active terminal; commands with **multiple** entries still open one separate terminal per entry
- Saved commands now live in VS Code global storage, so they are **no longer lost when the extension updates**
- Show a friendly "Command not found" message instead of failing silently when running an unknown command name
- Fix activation error: the `extension.catcharg` command was missing a required `title` in package.json (it is also hidden from the Command Palette now, since it is shortcut-only)
- Fix crash when cancelling the Create Command input box
- Add `.vscode/launch.json` so F5 launches the Extension Development Host with installed extensions disabled

## 1.1.0 - 2024-1-15

- Fix bugs  `del method 'sync' , prevent name with space `
- increase created commands limits to more than 30
- inhance delete command
- Refactor some code to make it more clear
- Update README ` & explain gif `
