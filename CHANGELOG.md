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
