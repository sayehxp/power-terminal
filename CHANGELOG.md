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
