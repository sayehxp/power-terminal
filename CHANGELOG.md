## 1.4.0

- **Fix: typing a command name no longer spills junk characters into the prompt.** Launchers used to press `ctrl+shift+alt+<letter>` and hope VS Code was the focused window. When it was not — a terminal outside VS Code, a different keyboard layout, a conflicting shortcut — Windows read `ctrl+alt` as AltGr and typed a literal character instead of running anything
- Launchers are now `.cmd` files. A command with a single entry runs straight from the shell, with no VS Code round trip, so it works in PowerShell, cmd, Git Bash and Windows Terminal, in any folder
- Commands with **multiple entries** still need VS Code to open one terminal per entry. The launcher now leaves a request file that the extension watches for, instead of sending keystrokes — independent of focus and keyboard layout
- Old `.vbs` launchers are deleted and replaced on startup. They also had to go because `.VBS` comes before `.CMD` in the default `PATHEXT` and would keep winning
- Arguments keep working the same way, including `$1`..`$9` and `$*` / `$@`
- The bundled sample database no longer ships 13 placeholder commands into every fresh install

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
