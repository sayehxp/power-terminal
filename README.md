  # Power Terminal

  **Power Terminal** ⚡ **Your own terminal commands: save once, run anywhere by name**

  **Power Terminal saves your long or repeated commands under short names, so you type `dev` instead of `npm run dev` in any terminal, editor or AI CLI, or type `start` to run your frontend, backend and database together, each in its own terminal.**

  > **🖹 For Feedback : [Click Here](https://github.com/sayehxp/power-terminal/issues)**

  **▬ Create your custom command** **⬇️**
  ![PowerTerminal](https://raw.githubusercontent.com/sayehxp/power-terminal/main/images/createcommand.gif)



  # How to use

  ## 1. IDE (VS Code, Cursor and Antigravity)

  ### Create Command
  * `ctrl + shift + p` , type `Power Terminal: Create Command`
  * Type a name (no spaces)
  * Type your commands one by one, then press Enter on an empty line

  ### Run Command
  * `ctrl + shift + p` , type `Power Terminal: Run Command`
  * Type the name, plus any [arguments](#passing-arguments)
  * Or use its shortcut, `ctrl + shift + alt + <letter>` (first 26 commands)

  ### Delete Command
  * `ctrl + shift + p` , type `Power Terminal: Delete Command`
  * Type the name

  ## 2. In any terminal

  Just type the command name in any terminal, inside your IDE or outside it: the VS Code,
  Cursor or Antigravity terminal, PowerShell, cmd, Git Bash or Windows Terminal, from any folder.

  * **One command**: runs right there, no IDE needed
  * **Several commands**: each opens in its own terminal, so your IDE must be open

  > Typing the name in a terminal works on Windows only.

  ## 3. In AI CLIs

  Saved commands are ordinary programs on your PATH, so AI CLIs like **Claude Code**, **Codex**
  and **Gemini CLI** can use them directly:

  * **Run one yourself** with `!` followed by the name: `! dev` or `! test --watch`. The output
    lands in the conversation, so the agent sees it too
  * **Let the agent run them**: ask *"run `test` and fix what fails"* and it calls your command
    like any other tool

  `!` is meant for commands that print something and finish. A program that waits for typing,
  like an editor or a CLI's own chat, belongs in a normal terminal.

  ### Manage commands with `pt`

  Create, list and delete commands from any terminal or AI CLI:

  ```
  pt add dev "npm run dev"                    save a command
  pt add stack "npm run api" "npm run web"    several commands, one quoted argument each
  pt add co "git checkout -b $1 origin/$2"    with placeholders
  pt list                                     list saved commands
  pt remove dev                               delete a command
  ```

  AI agents can use it too: ask for *"a command called `deploy` that builds and pushes"* and the
  agent runs `pt add` itself.

  On Windows, the extension adds `pt` for you.

  ## 4. Without an IDE

  Don't use VS Code, Cursor or Antigravity? Install Power Terminal from npm instead (needs Node 14+):

  ```
  npm install -g powerterminal
  ```

  This gives you `pt`, so you can save commands and run them by name in any terminal or AI CLI,
  no IDE needed. Only commands with several entries still need an IDE open, since each entry
  opens in its own IDE terminal.

  > Running commands by name is Windows only for now. On Mac and Linux, commands made with `pt`
  > show up in your IDE's *Run Command* only.

  ## Passing arguments

  Add arguments after the name, just like a normal command. To place them anywhere in your
  command, use placeholders when you create it:

  * `$1` .. `$9` — one argument, by position
  * `$*` or `$@` — all arguments, as typed

  ```
  saved command : npm install $1 --save-dev
  you type      : devdep typescript
  runs          : npm install typescript --save-dev
  ```

  No placeholders? The arguments are simply added to the end:

  ```
  saved command : git pull origin
  you type      : pull main
  runs          : git pull origin main
  ```

  ## Why Power Terminal

  **Shorter AI CLI commands.** One command covers every model:

  ```
  pt add c "claude --model"            c opus, c sonnet, c haiku
  pt add cx "codex -m"                 cx <model>
  ```

  **Short names for Windows tools.** The original keeps working:

  ```
  pt add paint mspaint                 paint photo.png
  pt add here "explorer ."             open the current folder
  pt add settings "explorer ms-settings:"
  ```

  **Everyday commands.**

  ```
  pt add st "git status -sb"
  pt add push "git push -u origin HEAD"
  pt add killport "npx kill-port"      killport 3000
  ```

  **Safe names.** A name that would hide something real, like `git`, `cd` or `calc`, is refused.
  Names use letters, numbers, emoji, `+`, `-` and `_`, so `+` or `c++` work too.

  **Arabic and emoji.** Names and commands can be in any language, or emoji:

  ```
  pt add ابدأ "npm start"
  pt add 🚀 "npm run deploy"
  ```

  `pt` speaks Arabic too: `pt ضيف` (add), `pt اعرض` (list), `pt امسح` (remove). Spellings like
  `ابدأ`, `ابدا` and `إبدأ` count as the same name. In a terminal, type the name as it was saved.

  ## Good to know

  * Your saved commands are kept in one place shared by every editor and by `pt`
    (`%APPDATA%\powerterminal\db.json` on Windows), so a command saved in one editor works in all
    of them and survives extension updates

  ### `%` in saved commands

  The `.cmd` launcher runs your command through cmd, so `%PATH%` and other variables expand as
  usual; write `%%` for a literal `%`. The Git Bash launcher runs the same command through sh, so a
  command written in cmd syntax may not work there. Tools like `npm`, `git` and `node` work in both.

  ### Upgrading from before 1.4.0

  Launchers made by versions before 1.4.0 worked by pressing a keyboard shortcut at whatever window
  had focus, which typed stray characters into the prompt when VS Code was not focused or a
  different keyboard layout was active. Those are replaced automatically the first time 1.4.0
  starts.
