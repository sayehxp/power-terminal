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
* Each saved command also gets a keyboard shortcut (`ctrl + shift + alt + <letter>`) assigned automatically in order of creation
