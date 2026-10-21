# Power Terminal — الخطة

**معيار الترتيب:** اللي بيضر المستخدمين الحاليين الأول ← بعدها اللي بيميّز الإكستنشن عن غيرها ← في الآخر الحاجات اللي بتريّح في الاستخدام.

## طريقة الشغل (لكل تاسك)

1. **Issue** على GitHub فيه: المشكلة، الحل المقترح، وإزاي نتأكد إنه اشتغل.
2. **Branch** من `main` باسم واضح: `fix/...`، `feat/...`.
3. **Commits** صغيرة، وكل commit بيعمل حاجة واحدة.
4. **PR** فيه `Closes #<رقم الـ issue>` عشان الـ issue يتقفل لوحده بعد الـ merge.
5. **تجربة يدوي** بـ F5 (Extension Development Host) + الـ tests.
6. **Merge** في `main`، وبعد ما الإصدار يخلص: `CHANGELOG.md` + رفع الـ version + `vsce publish` + GitHub Release + GIF للميزة الجديدة.

**Labels:** `bug`، `feature`، `ai`، `docs`، `breaking`، `good first issue`
**Milestones:** واحد لكل إصدار تحت.

**قاعدة لكل الـ issues:** مفيش أي كود جديد يعتمد على VBS أو SendKeys أو الـ keyboard shortcuts. كل حاجة تتبني على الـ launchers (`.cmd` + sh). وأي إصلاح في `vbs.js` أو `ShortcutKeys.js` مش هيتعمل، لأنهم هيتمسحوا.

---

## 1. `v1.4.0` — نكمّل PR #1 (الأولوية القصوى)

**ليه الأول:** المستخدمين الحاليين عندهم bug (الأوامر بتكتب حروف غلط في الترمينال لما VS Code مش عليه الفوكس)، وVBScript هيتقفل من Windows (حوالي 2027)، والأوامر مش بتشتغل من Claude CLI.

**الـ branch:** `feat/cmd-shim-launchers` — [PR #1](https://github.com/sayehxp/power-terminal/pull/1)

### اللي في الـ PR خلاص
- [x] `name.cmd` في `WindowsApps` بدل `.vbs`.
- [x] أمر بسطر واحد بيشتغل مباشرة في الـ shell (`call` + `%*` + ترجمة `$1` ← `%1`).
- [x] أمر بأكتر من سطر: الـ launcher بيكتب ملف طلب، والإكستنشن بتراقبه بـ `fs.watch` وبتفتح ترمينال لكل سطر (الحل الهجين). محمي من شباكين VS Code مفتوحين ومن الطلبات القديمة.
- [x] Migration: مسح الـ `.vbs` وعمل `.cmd` بداله وقت الـ activate.
- [x] `src/db.json` اتفضّى (كان بينزّل 13 أمر تجربة عند كل مستخدم جديد).

### نضيف عليه
- [ ] **launcher لـ bash**: ملف `name` من غير امتداد جنب الـ `.cmd`، عشان Git Bash و `! dev` في Claude CLI.
  - سطر واحد: `#!/bin/sh` + الأمر، و `$*`/`$@` ← `"$@"`، ومن غير placeholder يتضاف `"$@"` في الآخر.
  - أكتر من سطر: يكتب نفس ملف الطلب اللي الـ `.cmd` بيكتبه.
  - يتمسح مع الـ `.cmd` في Delete، ويتعمل في الـ migration.
  - اتجرّب يدوي بـ `ptest` وشغال من Git Bash ومن CMD ومع `!` في Claude.
- [ ] **حماية الأسماء** (`validateName`، دالة مستقلة):
  - الاسم يكون بس `[A-Za-z0-9_-]`.
  - قبل الحفظ: `where <name>` (و `command -v` على Mac/Linux بعدين). لو لقى حاجة مش launcher بتاعنا ← يرفض ويقول السبب.
  - قايمة أسماء ممنوعة ثابتة: `git`، `npm`، `node`، `cd`، `dir`، `ls`، `code`...
  - **مهم جداً:** `git.cmd` هيغطي على git الحقيقي في كل الـ shells.
- [ ] **escaping في ملف الطلب**: `echo %*` بيبوظ (أو يشغّل أوامر محدش قصدها) لو الـ arguments فيها `&` أو `|` أو `<` أو `>`.
- [ ] **قرار `%` جوه الأمر المحفوظ**: الترشيح نسيبها زي ما هي (`%PATH%` يشتغل، و `100%` محتاج المستخدم يكتبها `100%%`)، لأن ده السلوك العادي في CMD. ونكتبها في الـ README.
- [ ] **Tests** (`node:test` من غير مكتبات، و `"test": "node --test test/"`):
  - `arguments.js` (pure functions).
  - دوال بناء الـ `.cmd` والـ bash: placeholders، `%*`، `call`، الأوامر بأكتر من سطر.

### إصلاحات صغيرة معاه
- [ ] **الـ engine**: `^1.0.0` ← `^1.48.0` على الأقل (`globalStorageUri` محتاجه).
- [ ] **`openTerminal`**: `vscode.window.createTerminal({ name })` بدل `executeCommand` + آخر terminal (ممكن ياخد terminal غلط)، وكل ترمينال ياخد اسم الأمر.
- [ ] **رسائل**: Delete لأمر مش موجود ← "not found"، منع حفظ أمر من غير ولا سطر، تصحيح `sucessuful` ← `successfully`.
- [ ] **مسح فولدر `empty/`**.
- [ ] **README**: قسم "Works in any terminal and with AI CLIs" + إزاي تستخدمه مع `!` في Claude.

### بعد الإصدار
- [ ] بوست على Reddit (`r/vscode`) و dev.to: "بيشتغل مع Claude CLI".
- [ ] مسح ملفات التجربة `ptest` و `ptest.cmd` من `WindowsApps`.

---

## 2. `v1.5.0` — تنضيف وتجربة أسهل

**ليه تاني:** بيشيل الكود القديم، وبيخلي الإكستنشن أسهل للمستخدمين الجداد.

- [ ] **شيل الـ shortcuts** (`breaking`): الـ 26 keybinding من `package.json` + `extension.catcharg` + `ShortcutKeys.js`. الـ `id` يفضل كـ id داخلي بس. CHANGELOG يوضّح ليه.
- [ ] **طريقة تشغيل واحدة**: Run Command جوه VS Code يبعت `dev <args>` للترمينال بـ `sendText`، فيشتغل نفس الـ launcher اللي بيشتغل من برا. منطق الـ arguments في مكان واحد.
- [ ] **QuickPick** في Run و Delete: قايمة بالأوامر + بحث، وجنب كل أمر السطور اللي جواه.
- [ ] **أمر Edit**: تعديل السطور (InputBox بالقيمة القديمة) بدل المسح وإعادة الإنشاء، والـ launchers تتعمل من جديد.
- [ ] **CI**: GitHub Action بيشغّل `npm test` على كل PR (Windows و Ubuntu).
- [ ] **Issue templates**: `bug_report.md` و `feature_request.md`.

---

## 3. `v1.6.0` — MCP server

**ليه بدري:** الميزة اللي مش موجودة عند غيرك. بعد `v1.4` Claude يقدر يشغّل `dev`، بس مش هيعرف إن عندك أوامر محفوظة ولا إيه اللي جواها. الـ MCP بيخلي أي AI agent (Claude Code، Cursor، Copilot agent) يشوف أوامرك ويستخدمها بدل ما يخمّن. والمجهود متوسط لأن الأوامر أصلاً في `db.json`.

- [ ] **MCP server** يقرا `db.json` ويعرض:
  - tool لعرض الأوامر وإيه اللي جوا كل واحد.
  - tool لتشغيل أمر بالاسم + arguments، والـ output يرجع للـ agent.
- [ ] **Language Model Tools** (`vscode.lm.registerTool`): نفس الفكرة لـ Copilot جوه VS Code (محتاج engine `^1.90.0` تقريباً).
- [ ] **حماية قبل التشغيل**: تحذير قبل `rm -rf` و `git push --force` و `DROP TABLE`... (مهم لأن الـ agents هي اللي هتشغّل).
- [ ] **Positioning** في الـ README والـ Marketplace: "الأوامر الموثوقة اللي الـ AI مسموحله يشغّلها".
- [ ] بوست تاني بعد الإصدار.

---

## 4. `v1.7.0` — الواجهة

- [ ] **Sidebar (TreeView)**: الأوامر وجنب كل واحد ▶ تشغيل، ✏️ تعديل، 🗑️ مسح، و ➕ فوق.
- [ ] **Status bar**: تثبيت أمر أو اتنين بزرار تحت.
- [ ] **Prompt للـ arguments**: لو الأمر فيه `$1` ومفيش argument (من جوه VS Code) ← InputBox يسأل عليه.
- [ ] **Import / Export**: تصدير الأوامر لملف JSON واستيرادها.

---

## 5. `v2.0.0` — أوامر خاصة بكل مشروع

**ليه متأخرة:** أكبر تغيير، ومحتاجة تصميم، ومبنية على الـ launchers والـ Edit والـ Sidebar.

- [ ] **`.vscode/powerterminal.json`** يترفع على git ويتشارك مع التيم.
  - **نقطة تصميم:** الـ launchers global على الـ PATH، فإزاي `dev` يشغّل أمر المشروع الحالي؟
  - اقتراح: الـ launcher يشغّل `node runner.js dev` اللي بيدوّر على `.vscode/powerterminal.json` من الـ cwd لفوق، ولو ملقاش يرجع للأوامر الـ global.
- [ ] **Import من `package.json` scripts** بضغطة واحدة.
- [ ] **`cwd` لكل سطر** (مثلاً `client/` و `server/`).
- [ ] **Split terminals** للأوامر بأكتر من سطر جوه VS Code.
- [ ] **Mac و Linux**: الـ launchers في `~/.local/bin` + `chmod +x`، ولو مش على الـ PATH ← رسالة فيها السطر اللي يتضاف في `.bashrc` / `.zshrc`.
- [ ] **Settings Sync**: الأوامر تتنقل مع حساب VS Code.

---

## 6. `v2.x` — باقي مميزات الـ AI

**أساس:** `vscode.lm` بيستخدم موديلات Copilot اللي عند المستخدم (من غير API key)، واللي معندوش Copilot يحط مفتاحه في الـ settings.

- [ ] **إنشاء أمر بالكلام العادي**: "شغّل الباك والفرونت" ← الـ AI يقرا `package.json` / `docker-compose.yml` / `Makefile` ويقترح الأوامر، والمستخدم يراجع ويوافق.
- [ ] **Chat participant `@powerterminal`** في Copilot Chat.
- [ ] **اقتراح أوامر من الاستخدام**: بـ Shell Integration API، لو نفس الأوامر بتتكتب ورا بعض كتير ← "تحب أحفظهم كأمر؟"، والـ AI يقترح الاسم والـ `$1`.
- [ ] **شرح الخطأ**: لما أمر يفشل (exit code من Shell Integration) ← زرار "اشرح / صلّح".
- [ ] **تحويل بين الـ shells**: bash ⇄ PowerShell ⇄ CMD.

---

## مع كل إصدار (Marketplace)

- [ ] CHANGELOG + GIF للميزة الجديدة + نشر.
- [ ] keywords: شيل `multi` المكررة، وضيف `npm scripts`، `task runner`، `alias`، `productivity`، `claude`، `ai agent`، `mcp`.
- [ ] `"categories": ["Other", "AI"]`.
- [ ] GitHub Action لـ `vsce publish` لما يتعمل tag جديد.

---

`PLAN.md` مستبعد من الـ `.vsix` في `.vscodeignore`.
