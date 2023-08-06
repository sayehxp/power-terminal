# Power Terminal

**Power Terminal** 💪 **Run all terminal commands with just one command**

> **Power Terminal is an extension to run multi different commands easily. [Check Here](https://github.com/myrepo)**
>

> ***[For 'feedback' [#78](https://github.com/myissuses)]***


**Create your cusstom command .**


![PowerTerminal](https://raw.githubusercontent.com/sayehxp/power-terminal/main/images/createcommand.gif)



### Create Command
* `ctrl + p` , type  `Power Terminal: Create Command`
* Type command name (without space) 
* add " -x" to name to dispose pervious terminals
* write your commands one by one

### Edit/Delete
* in db.json in your `~\.vscode\extensions\powerTerminal` directory:
 ```  
    {
      "id": 1,
      "name": "run",
      "commands": [
        "npx json-server -w data/db.json -p 8080",
        "npm start"
         ]
    }
```
after edit or delete json file run `Power Terminal: sync` from Command Palette.
### Run Command
Command Palette → `Power Terminal: Run Command` hit enter , type command name
Or just Write the Command name in Terminal 
**note** : this option is available for Win OS only



