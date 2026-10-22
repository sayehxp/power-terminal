# Power Terminal

**Power Terminal** 💪 **Run all your terminal commands with just one command**

****Power Terminal is a simple extension to run multiple different commands easily, or to make a long command in (VSCode) simpler and shorter [Github Here](https://github.com/sayehxp/power-terminal.git)****

> **🖹 For Feedback : [Click Here](https://github.com/sayehxp/power-terminal/issues)**

**▬ Create your custom command** **⬇️**
![PowerTerminal](https://raw.githubusercontent.com/sayehxp/power-terminal/main/images/createcommand.gif)



### Create Command
* `ctrl + shift + p` , type `Power Terminal: Create Command`
* Type a command name (without spaces)
* Write your commands one by one — press Enter on an empty input when you are done

### Run Command
* `ctrl + shift + p` , type `Power Terminal: Run Command`
* Type the command name you want to run. Or just write the command name in the Terminal
* **note** : the "write it in the Terminal" option is available for Win OS only

### Delete Command
* `ctrl + shift + p` , type `Power Terminal: Delete Command`
* Type the command name you want to delete

## Passing arguments

The whole line you type is used, not just the command name — anything after the name is passed
along to your command. This works both in the *Run Command* input box and when you type the
name straight into the terminal.

So a command named `pull` holding `git pull origin` gives you:

```
pull main            ->  git pull origin main
pull dev --rebase    ->  git pull origin dev --rebase
pull                 ->  git pull origin
```

Need the arguments somewhere other than the end? Use placeholders when creating the command:

* `$1` .. `$9` — a single argument by position
* `$*` or `$@` — every argument as typed

```
saved command : git checkout -b $1 origin/$2
you type      : co feature/login dev
runs          : git checkout -b feature/login origin/dev
```

Without a placeholder the arguments are appended to the **last** entry of the command.


## How commands open in the terminal

* A saved command with **multiple entries** opens **one separate terminal per entry**, so they all run side by side
* A saved command with a **single entry** runs **in your currently active terminal** — no extra terminal is opened (if no terminal is open, one is created for you)

## Good to know

* Your saved commands are kept in one place shared by **VS Code, Cursor, Antigravity** and other VS Code based editors (`%APPDATA%\powerterminal\db.json` on Windows), so a command saved in one editor works in all of them and survives extension updates
* A launcher for a **multiple entries** command is picked up by whichever of those editors is open
* Each saved command also gets a keyboard shortcut (`ctrl + shift + alt + <letter>`) assigned automatically in order of creation, for the first 26 commands

## Typing the command name in a terminal (Windows)

Every command you create also gets two small launchers on your PATH, which is what lets you
type the name in any terminal: `name.cmd` for PowerShell and cmd, and `name` (no extension) for
Git Bash.

* A **single entry** command runs directly from the shell — PowerShell, cmd, Git Bash, Windows
  Terminal, any folder. VS Code does not have to be open or focused
* A **multiple entries** command needs VS Code, since only VS Code can open a terminal per entry.
  The launcher leaves a request that the running VS Code window picks up. If no window is open,
  nothing happens and the request is discarded

### Works with AI CLIs

Tools like Claude Code run shell commands through Git Bash, so your saved commands work there
too: type `! dev` in Claude Code, or ask the agent to run `dev`, and the output comes back to it.

### Creating commands from the terminal: `pt`

The extension also puts a `pt` command on your PATH, so commands can be created and deleted
from any terminal without opening the command palette:

```
pt add dev "npm run dev"                    one entry
pt add stack "npm run api" "npm run web"    one quoted argument per entry
pt add co "git checkout -b $1 origin/$2"    placeholders work the same way
pt ls                                       list saved commands
pt rm dev                                   delete a command
```

It saves to the same shared `db.json` and writes the same launchers, so the command is usable
straight away and shows up in every editor. The same name rules apply.

An AI CLI can use it too: ask Claude Code to *"make a power terminal command called `deploy`
that builds and pushes"* and it can run `pt add deploy ...` itself.

There are two ways to get `pt`:

* **With the extension**: it is written when VS Code, Cursor or Antigravity starts, and runs on
  the editor's own executable, so Node does not need to be installed
* **Without any editor**, from npm (needs Node 14+):

  ```
  npm install -g powerterminal
  ```

  Single entry commands work fully without an editor; multiple entries ones still need one
  open. When both are installed, the npm `pt` is used and the extension leaves it alone.

### Command names

The name becomes a program on your PATH, so Power Terminal refuses names that would hide
something real: shell built-ins (`cd`, `dir`, `set`...), common tools (`git`, `npm`, `node`...), `pt` itself,
anything already found on PATH, and names that are already saved. Names use letters, numbers,
emoji, `-` and `_`.

### Arabic and other languages

Names can use letters from any language, so a command can be called `ابدأ` or `رفع_الملفات`,
and saved commands and arguments can contain Arabic text too:

```
pt ضيف ابدأ "npm start"          pt add, in Arabic (also أضف)
ابدأ --port 3000                 type it in any terminal
pt اعرض                          pt ls (also قائمة)
pt امسح ابدأ                     pt rm (also احذف)
```

One Arabic word is often typed several ways, so `ابدأ`, `ابدا` and `إبدأ`, with or without
tashkeel, count as the same name: saving a second spelling is refused, and *Run Command*,
*Delete Command* and `pt rm` accept any of them. In the terminal itself, type the name as
it was saved, since the shell looks for that exact file.

The `.cmd` launchers switch the console to UTF-8 while a command with Arabic runs and put
the old code page back afterwards, so Arabic reaches the program intact in cmd and
PowerShell.

### Emoji

Emoji work as names too, alone or mixed with letters, and inside commands and arguments:

```
pt add 🚀 "npm run deploy"
🚀 --prod                        type it in any terminal
pt add deploy🔥 "npm run build && npm run deploy"
```

Skin tones (`👍🏽`), joined emoji (`👨‍💻`), flags (`🇪🇬`) and keycaps (`1️⃣`) are all fine.
An emoji typed with or without its variation selector (`❤` / `❤️`) counts as the same name in
*Run Command*, *Delete Command* and `pt rm`; in the terminal, type it the way it was saved.
The old Windows console (conhost) may not let you type or show emoji, but the command still
runs. Windows Terminal, the VS Code terminal and Git Bash show them properly.

### `%` in saved commands

The `.cmd` launcher runs your command through cmd, so `%PATH%` and other variables expand as
usual; write `%%` for a literal `%`. The Git Bash launcher runs the same command through sh, so a
command written in cmd syntax may not work there. Tools like `npm`, `git` and `node` work in both.

Launchers made by versions before 1.4.0 worked by pressing a keyboard shortcut at whatever window
had focus, which typed stray characters into the prompt when VS Code was not focused or a
different keyboard layout was active. Those are replaced automatically the first time 1.4.0
starts.
