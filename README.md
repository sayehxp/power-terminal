# Power Terminal
**Power Terminal** ⚡ **Your own terminal commands: save once, run anywhere by name**

Power Terminal saves your long or repeated commands under short names, so typing `dev`
launches `npm run dev`. It can also run several commands at once, like typing `startall` to
start your frontend, backend and database servers together.


# How to use
  For [IDE](#IDES) (VS Code, Cursor and Antigravity),

  For [CLI](#CLI) Claude Code , Codex , Windows Terminal

   
## 1.Inside IDE 

![PowerTerminal](https://raw.githubusercontent.com/sayehxp/power-terminal/main/images/createcommand.gif)

### Create Command
* `ctrl + shift + p` , type `Power Terminal: Create Command`
* Type a name (no spaces)
* Type your commands one by one, then press Enter on an empty line

### Run Command
* `ctrl + shift + p` , type `Power Terminal: Run Command`
* Type the name, plus any [arguments](#passing-arguments)


### Delete Command
* `ctrl + shift + p` , type `Power Terminal: Delete Command`
* Type the name


## 2.In CLI (Windows)
  Saved commands are ordinary programs on your PATH - you can Just type the command name in any terminal, in AI CLIs like **Claude Code**, **Codex**
  and **Gemini CLI** can use them directly **Using** `!` followed by the name

  ***note*** : Several commands each opens in its own terminal, so IDE must be open


 ### Take Full Control with CLI

  if u want to add , remove and delete commands without tocuh ides all works get done by cli u can do that using `pt` commands it installed with extension and u can install it standalone as npm package 

  ```
  npm install -g powerterminal
  ```

  ```
  pt add <name> <command/s>      save a command
  pt list                        list saved commands
  pt remove <name>               delete a command
  ```

  For example :

  ```
  pt add 📦 "npm install -g"
  pt add 🗑️ "npm uninstall"

  📦 axios cfonts colors    ->  npm install axios,cfonts,colors 
  🗑️ axios                  ->  npm uninstall axios
  ```

  
  ## Passing arguments

  Add arguments after the name, just like a normal command. To place them anywhere in your
  command, use placeholders when you create it:

  * `$1` .. `$9` — one argument, by position
  * `$*` or `$@` — all arguments, as typed

  ```
  saved command : npm install $1 --save-dev
  you type      : need typescript
  runs          : npm install typescript --save-dev
  
  ```
  

  No placeholders? The arguments are simply added to the end:

  ```
  saved command : git pull origin
  you type      : pull main
  runs          : git pull origin main
  ```

  ## Why Power Terminal

  **Save once, use everywhere.** Create a command in one place, from any IDE (vscode,agy,cursor ..etc ) or even with `pt`, and
  run it in any terminal, or in an AI CLI. 
  

  **Still useful with AI.** Asking an AI to run your commands is bit
  slower. AI agents can call your powerterminal commands too.

  **Name it your way.** Use English, Arabic (`ابدأ`) or emoji (`🚀`). Names that would hide a real program, like `git` or `cd`, are refused.

  **A saved prompt, everywhere.** A command can also hold a prompt you reuse, like
  `claude -p "review my staged changes"`. A skill belongs to one tool; a saved command works in
  every folder and every terminal.


  ### Upgrading from before 1.4.0

  Launchers made by versions before 1.4.0 worked by pressing a keyboard shortcut at whatever window
  had focus, which typed stray characters into the prompt when VS Code was not focused or a
  different keyboard layout was active. Those are replaced automatically the first time 1.4.0
  starts.
  
