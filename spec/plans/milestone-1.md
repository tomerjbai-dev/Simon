# תוכנית — Milestone 1: בסיס האפליקציה, מסך משחק ראשוני ופרסום

**מקורות:** `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `wireframes.png`, `mockups.png`, `style-guide.png`.

## 0. דרישות מוקדמות

- **Node.js אינו מותקן כרגע במחשב.** לפני הבנייה המשתמש צריך להתקין Node.js בגרסת LTS (22.x או חדשה יותר) מ-https://nodejs.org (Windows Installer, הגדרות ברירת מחדל). Claude ידריך צעד אחר צעד בתחילת הבנייה ויוודא ש-`node --version` ו-`npm --version` עובדים.
- אין צורך במפתחות, חשבונות או `.env` ב-Milestone זה (אין סודות; האתר סטטי).
- חיבור ה-Repository ל-GitHub והגדרת Pages — רק בשלב הדחיפה, לאחר אישור (ראו סעיף 7).

## 1. היקף — מה נכלל ומה לא

**נכלל:**
- פרויקט Vite + Vanilla TypeScript עם Scripts: `dev`, `typecheck`, `build`, `preview`, `test`.
- מסך בית במצב `idle` בלבד: כותרת "סיימון", לוח 2×2 צבעוני, כפתור "התחל".
- רקע חלל SVG, גופן Heebo מקומי, טוקני עיצוב מ-`DESIGN.md`.
- מבנה `GameState` + פונקציית Render שיודעת להציג כותרת (ב-`idle`) או פס שלב וניקוד (בשאר המצבים) — מוכן לחיבור המנוע ב-Milestone 2.
- בדיקות Vitest בסיסיות.
- Workflow ל-GitHub Pages.

**לא נכלל (כדי לא להציג רכיבים שלא מומשו):**
- **כפתור השתקה** (Milestone 2) ו**כפתור "אודות"** (Milestone 4) — לא מוצגים. שורת הסרגל העליון תשמור מקום ריק בגובה קבוע, כדי שהפריסה לא תזוז כשהכפתורים יתווספו.
- אין מנוע משחק, הגרלת רצף, צלילים, שיא אישי, מסך אודות או Manifest.
- לחיצה על "התחל" ועל האריחים: יש משוב לחיצה חזותי (סגנון Pressed), אך **אין עדיין פעולת משחק**. לא מוצגים שלב/ניקוד מדומים.
- אין כרטיס "שיא אישי" במסך הבית (לפי DESIGN.md, למרות שהוא מופיע ב-Mockup).

## 2. מבנה קבצים

```text
/
├─ index.html                     # lang="he" dir="rtl", viewport, #app
├─ package.json                   # scripts + devDependencies
├─ package-lock.json              # נוצר ע"י npm install
├─ tsconfig.json                  # strict, noEmit, types: vite/client, vitest/globals לא נדרש
├─ vite.config.ts                 # base: '/Simon/', test: { environment: 'node' }
├─ src/
│  ├─ assets/background.svg       # רקע החלל, מיובא מ-CSS כדי ש-Vite יתקן את הנתיב תחת /Simon/
│  ├─ main.ts                     # נקודת כניסה: ייבוא CSS + גופנים, יצירת state, render
│  ├─ state.ts                    # טיפוסים (Color, Phase, Screen, GameState) + createInitialState()
│  ├─ board.ts                    # BOARD_LAYOUT: סדר האריחים, תוויות נגישות בעברית
│  ├─ ui.ts                       # render(root, state): בניית DOM בטוח (createElement/textContent)
│  ├─ format.ts                   # formatLevel(level) → "שלב 3 מתוך 10", formatScore(score) → "ניקוד: 2"
│  ├─ styles.css                  # טוקנים, פריסה, אריחים, כפתורים, רקע
│  └─ __tests__/
│     ├─ state.test.ts
│     └─ board.test.ts
└─ .github/workflows/deploy.yml
```

הערה: `background.svg` מיובא ב-CSS עם `url('./assets/background.svg')`, כך ש-Vite מתקן את הנתיב אוטומטית לפי `base`; ייבדק ב-`npm run preview` שהקובץ נטען תחת `/Simon/`.

## 3. תלויות

- `devDependencies`: `vite`, `typescript`, `vitest` (גרסאות יציבות עדכניות בזמן הבנייה).
- `dependencies`: `@fontsource/heebo` — ייבוא שלושת המשקלים בלבד: `400`, `500`, `700` (רק subset עברי+לטיני שהחבילה מספקת כברירת מחדל).
- ללא Framework, ללא ספריות נוספות.

Scripts:
```json
"dev": "vite",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"build": "tsc --noEmit && vite build",
"preview": "vite preview"
```

## 4. State ו-Render (בסיס ל-Milestone 2)

`src/state.ts` — לפי מודל הנתונים ב-ARCHITECTURE §2.4:
```ts
type Color = 'blue' | 'red' | 'yellow' | 'green';
type Phase = 'idle' | 'presenting' | 'input' | 'stageSuccess' | 'lost' | 'won';
type Screen = 'home' | 'about';
type GameState = { screen; phase; level; sequence; nextInputIndex; score; muted; runId };
const TOTAL_LEVELS = 10;
function createInitialState(): GameState // screen 'home', phase 'idle', level 0, sequence [], score 0, muted false, runId 0
```

`src/board.ts` — מקור יחיד לסדר האריחים, **בסדר חזותי קבוע** (לא תלוי RTL):
```ts
// visual order, row by row, left to right
[{ color: 'green', label: 'ירוק' }, { color: 'red', label: 'אדום' },
 { color: 'yellow', label: 'צהוב' }, { color: 'blue', label: 'כחול' }]
```

`src/ui.ts` — `render(root, state)`:
- סרגל עליון: `div.top-bar` ריק בגובה קבוע (מקום לכפתורי אייקון בעתיד).
- אזור כותרת: אם `phase === 'idle'` → `h1` "סיימון"; אחרת → פס סטטוס עם `formatLevel` ו-`formatScore`. ב-M1 בפועל מוצגת רק הכותרת.
- לוח: `div.board` עם `dir="ltr"` (כדי שה-Grid לא יתהפך), ובתוכו 4 `button.tile` עם `data-color` ו-`aria-label` בעברית. בלי מאזיני לחיצה למשחק.
- כפתור ראשי: `button.btn-primary` "התחל" — ללא פעולת משחק ב-M1.
- כל הטקסט דרך `textContent`; אין `innerHTML` עם תוכן.

## 5. עיצוב (`styles.css`)

**טוקנים (`:root`)** — מ-DESIGN §2.1: `--green #4CD964`, `--red #FF5B57`, `--yellow #FFB74D`, `--blue #4DA3FF`, `--bg-dark #0B1020`, `--bg-mid #1A2340`, `--surface #24314F`, `--text #FFFFFF`, `--text-2 #A8B3CC`, `--glow #6EE7FF`; מרווחים `4/8/12/16/24/32px`; `--radius 16px`.

**טיפוגרפיה** — `font-family: 'Heebo', system-ui, sans-serif`; H1 `32px/700`; מחלקות מוכנות ל-H2 24/700, H3 20/700 (פס השלב), Body-L 18/500, Body 16/400, Caption 14/400.

**פריסה (Mobile-First):**
- `html, body` בגובה `100dvh`, `overflow: hidden` אופקית; `body` ברקע `--bg-dark` + `background.svg` (`background-size: cover`, `background-attachment: fixed`/שכבה `position: fixed`), ושכבה כהה-שקופה עדינה מעליו.
- מכולת תוכן ממורכזת, `max-width: 480px`, שוליים צדדיים `16px`, עמודה אנכית: סרגל עליון → כותרת → לוח → כפתור.
- לוח: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`; רוחב הלוח מוגבל ע"י `min(רוחב זמין, גובה זמין)` כך שהכל נכנס במסך טלפון (360×640 ומעלה) בלי גלילה. אריחים `aspect-ratio: 1`, `border-radius: 24px`.
- כפתור "התחל" ברוחב מלא של המכולת.

**אריחים** — מילוי בצבע הבסיס, גבול דק בגוון בהיר של אותו צבע, Gradient עדין ו-Glow מתון (`box-shadow` בצבע האריח). מחלקה `.tile.is-active` (בהירות + Glow חזק) מוגדרת כבר עכשיו לשימוש M2. `:active` — Glow רגעי + `transform: scale(.97)`.

**כפתור ראשי** — מילוי כחול בוהק (Gradient סביב `--blue`), טקסט לבן Bold 20px, `border-radius: 16px`, מסגרת בהירה, Glow כחול; `:active` מקטין מעט ומחליש Glow. סגנונות `.btn-secondary` ו-`.status-bar` / `.card` (Surface Glass-like: `rgba` של `--surface`, גבול `rgba(255,255,255,.12)`, `backdrop-filter: blur`) מוגדרים לשימוש בהמשך — אין בהם רכיב גלוי ב-M1 מלבד מה שמתואר בסעיף 4.

**נגישות ומגע** — `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, `user-select: none` על הלוח; `:focus-visible` עם קו מתאר `--glow`.

## 6. רקע החלל (`background.svg`)

SVG יחיד, `viewBox="0 0 400 800"`, `preserveAspectRatio="xMidYMid slice"`, סגנון Flat ללא אנימציה, לפי DESIGN §2.4 Imagery:
1. `linearGradient` אנכי: `#0B1020` → `#1A2340` → טורקיז עמוק (~`#0E4A5A`) בשליש התחתון; `radialGradient` בהיר עדין מאחורי קו האופק.
2. כוכבים: ~60 עיגולים קטנים לבנים/תכלכלים בגדלים ושקיפויות שונים; 4–5 כוכבים נוצצים בצורת "+" רכה.
3. כוכב לכת גדול חתוך בפינה העליונה (כחול-אפור, הצללה בעזרת עיגול כהה חופף/Gradient), ו-1–2 כוכבי לכת קטנים.
4. 4–6 גבישים מצולעים (`polygon`) בטורקיז `#6EE7FF` עם Glow עדין (`filter: feGaussianBlur`), **בשוליים בלבד**.
5. צללית סלעית כהה ומחודדת (`path`) בתחתית.
- המרכז (מאחורי הלוח) נשאר שקט יחסית — בלי גבישים/כוכבי לכת במרכז.
- גודל יעד: עד כמה עשרות KB.

## 7. פרסום — GitHub Pages

**`vite.config.ts`:** `base: '/Simon/'` (S גדולה).

**`.github/workflows/deploy.yml`:**
- `on: push: branches: [main]` + `workflow_dispatch`.
- `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: false`.
- Job `build`: `actions/checkout` → `actions/setup-node` (Node LTS, `cache: npm`) → `npm ci` → `npm run typecheck` → `npm test` → `npm run build` → `actions/configure-pages` → `actions/upload-pages-artifact` (`path: dist`).
- Job `deploy` (`needs: build`, `environment: github-pages`): `actions/deploy-pages`.
- גרסאות Actions עדכניות (major) בזמן הבנייה.

**הגדרה ב-GitHub (המשתמש מבצע, בהדרכה, בזמן הדחיפה):** Repository → Settings → Pages → Source: **GitHub Actions**. ה-Repository: `https://github.com/tomerjbai-dev/Simon` (ציבורי). Push רק אחרי אישור המשתמש.

## 8. בדיקות (Vitest)

- `state.test.ts`: `createInitialState()` מחזיר `phase: 'idle'`, `screen: 'home'`, `score: 0`, `sequence` ריק, `muted: false`; `TOTAL_LEVELS === 10`.
- `board.test.ts`: `BOARD_LAYOUT` מכיל בדיוק 4 צבעים שונים, בסדר `green, red, yellow, blue`.
- `format`: `formatLevel(3)` → `"שלב 3 מתוך 10"`, `formatScore(2)` → `"ניקוד: 2"`.
- סביבת `node` (ללא DOM) — מספיק ל-M1.

## 9. בדיקה עצמית בזמן הבנייה (לפני סימון 🟡)

1. `npm ci` (אחרי `npm install` ראשוני שיוצר `package-lock.json`), `npm run typecheck`, `npm test`, `npm run build` — הכל ללא שגיאות; `dist/` נוצר.
2. `npm run preview` → פתיחה ב-`http://localhost:4173/Simon/` בדפדפן המובנה, בגודל Mobile (375×812 וגם 360×640):
   - RTL, Heebo נטען (בדיקה ב-Network / `document.fonts`), רקע SVG נטען, אין שגיאות Console או 404.
   - אין גלילה אופקית (`scrollWidth <= clientWidth`) ואין חיתוך.
   - סדר אריחים: ירוק שמאל-עליון, אדום ימין-עליון, צהוב שמאל-תחתון, כחול ימין-תחתון.
   - מוצגים רק: כותרת, לוח, "התחל". צילום מסך להשוואה מול ה-Mockup.
3. בדיקה שאין סודות בקבצים ושה-`.gitignore` לא הוסר ממנו `.env` (`dist/` ו-`node_modules/` כבר מוחרגים).
4. סגירת שרת ה-preview בסיום.
5. עדכון `CLAUDE.md` → **פקודות הרצה**: `npm run dev` / `npm test`.
6. סימון 🟡 ליד כותרת Milestone 1 ב-`MILESTONES.md`.

## 10. מיפוי ל-Definition of Done

| תנאי | איך מאומת |
|---|---|
| `npm ci`/`typecheck`/`test`/`build` ללא שגיאות, `dist/` נוצר | סעיף 9.1 |
| עברית RTL, מסך טלפון, ללא גלילה/חיתוך, רקע חלל, Heebo | סעיף 9.2 |
| סדר אריחים ללא היפוך RTL | `dir="ltr"` על הלוח + בדיקה `board.test.ts` + צילום מסך |
| רק רכיבים ממומשים | אין כפתורי השתקה/אודות, אין שלב/ניקוד מדומה, אין שיא אישי |
| אין סודות; `package-lock.json` ו-Workflow קיימים | סעיף 9.3 + בדיקת קבצים |
| (לאחר דחיפה) Workflow עובר והאתר נטען בכתובת | ידווח "טרם נבדק"; ייבדק אחרי Push |
| (לאחר דחיפה) נבדק ב-Chrome על Android | ידווח "טרם נבדק"; המשתמש בודק בטלפון |

## 11. החלטות מימוש שיתועדו כ-ADR ב-ARCHITECTURE.md

- **ADR-1: הגופן נטען דרך `@fontsource/heebo` במשקלים 400/500/700 בלבד.** (מימוש ההחלטה הקיימת; תיעוד קצר.)
- **ADR-2: סרגל עליון שמור ריק ב-M1** — כפתורי השתקה ואודות יתווספו ב-Milestones 2 ו-4; המקום נשמר כדי שהפריסה לא תזוז.
