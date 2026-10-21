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

* Your saved commands are stored in VS Code global storage, so they are **kept when the extension updates**
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

### Command names

The name becomes a program on your PATH, so Power Terminal refuses names that would hide
something real: shell built-ins (`cd`, `dir`, `set`...), common tools (`git`, `npm`, `node`...),
anything already found on PATH, and names that are already saved. Names use letters, numbers,
`-` and `_`.

### `%` in saved commands

The `.cmd` launcher runs your command through cmd, so `%PATH%` and other variables expand as
usual; write `%%` for a literal `%`. The Git Bash launcher runs the same command through sh, so a
command written in cmd syntax may not work there. Tools like `npm`, `git` and `node` work in both.

Launchers made by versions before 1.4.0 worked by pressing a keyboard shortcut at whatever window
had focus, which typed stray characters into the prompt when VS Code was not focused or a
different keyboard layout was active. Those are replaced automatically the first time 1.4.0
starts.
