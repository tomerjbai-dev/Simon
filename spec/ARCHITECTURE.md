# ARCHITECTURE — משחק Simon

**תאריך בדיקת מקורות:** 18 באוקטובר 2026  
**מסמך מקור:** `PRD.md`  
**עיקרון מוביל:** אפליקציית Frontend סטטית, Mobile-First, ללא שירותי שרת.

## 1. Technology Stack שנבחר

| רכיב | טכנולוגיה | תפקיד |
|---|---|---|
| שפת פיתוח | TypeScript | לוגיקת המשחק, טיפוסי State ואימות קלט |
| ממשק | HTML5 + CSS3 | שני מסכים, כפתורי 2×2, RTL, התאמה ל-Android |
| UI | Vanilla TypeScript עם DOM APIs | עדכון ממשק ללא Framework |
| Build / Dev | Vite, תבנית `vanilla-ts` | שרת פיתוח ויצירת Build סטטי |
| צלילים | Web Audio API | ארבעה צלילים מובחנים ללא קבצים חיצוניים |
| גופן | Heebo דרך החבילה `@fontsource/heebo` | גופן עברי שנארז עם האתר, ללא טעינה משירות חיצוני |
| רקע | גרפיקת SVG שנכתבת בקוד (קובץ `background.svg` בפרויקט) | רקע חלל וקטורי, חד בכל גודל מסך, ללא קובצי תמונה |
| שמירת שיא | `window.localStorage` | שיא אישי יחיד לפי Origin |
| PWA | Web App Manifest | התקנה דרך Chrome ב-Android |
| בדיקות | Vitest + בדיקות ידניות ב-Chrome Android | בדיקת לוגיקה והתנהגות דפדפן |
| ניהול קוד | Git + GitHub | Repository, ביקורת שינויים והיסטוריה |
| CI/CD | GitHub Actions | בדיקות, Build ופריסה אוטומטית |
| Hosting | GitHub Pages | אירוח HTTPS של קבצים סטטיים |

### נימוקי הבחירה

- **Vanilla TypeScript לעומת React/Vue:** שני מסכים ומכונת מצבים קטנה אינם מצדיקים Framework, Router או State Management חיצוניים. TypeScript מקטין שגיאות בלוגיקת המשחק ומוכר היטב לכלי AI. React/Vue הם חלופות בשלות, אך מוסיפים שכבת תחזוקה מיותרת למוצר זה.
- **Vite לעומת Webpack או ללא Bundler:** תצורת `vanilla-ts`, פיתוח מהיר ו-Build סטטי ל-GitHub Pages. Webpack גמיש אך דורש יותר תצורה; עבודה ללא כלי Build פשוטה לכאורה אך מוותרת על צינור TypeScript ופריסה עקבי.
- **Web Audio API לעומת קובצי MP3/ספריית Tone.js:** ארבעה צלילים פשוטים ניתנים ליצירה באמצעות Oscillator ו-Gain מובנים. אין צורך להוריד קבצי שמע או להוסיף ספריית מוזיקה.
- **Local Storage לעומת IndexedDB או Cloud Database:** ערך מספרי יחיד בלבד, ללא סנכרון או נתונים מורכבים.
- **GitHub Pages לעומת Vercel/Netlify:** מוצר סטטי ללא Server Functions, עם GitHub Actions מובנה; החלופות מתאימות גם הן אך אינן מספקות יתרון הכרחי. Repository ציבורי ב-GitHub Free מאפשר Pages; שימוש ב-Repository פרטי תלוי בתוכנית. האתר המפורסם ציבורי גם כשה-Repository פרטי בתוכנית תומכת.
- **Heebo מתוך הפרויקט לעומת Google Fonts:** הגופן נארז ב-Build ומוגש מאותה כתובת כמו האתר, כך שאין תלות בשירות חיצוני ואין בקשות לצד שלישי. טוענים רק את המשקלים שבשימוש (Regular, Medium, Bold).
- **Vitest לעומת Jest או ללא בדיקות:** תואם לסביבת Vite, מתאים לבדיקות Unit של משחק אקראי ומכונת מצבים; אינו מחליף בדיקת שמע, Touch ו-PWA על מכשיר Android.

**לא נדרשים:** Backend, Database, Authentication, Authorization ברמת משתמש, APIs חיצוניים, אחסון קבצים בענן, שירותי AI, Analytics, Push Notifications או מערכת חשבונות.

### מגבלות וסיכונים

1. Chrome עשוי להגביל השמעת שמע אוטומטית: יש ליצור/להפעיל `AudioContext` מתוך אירוע הלחיצה על **"התחל"**; במקרה של חסימת שמע, המשחק לא יקרוס והמשוב החזותי ימשיך.
2. PWA אינה מחייבת תמיכת Offline. יש להגדיר Manifest תקין, HTTPS, אייקונים מתאימים ו-`start_url` תקין. Chrome ב-Android אינו דורש Service Worker עם `fetch` handler לצורך התקנה; לכן **לא יתווסף Service Worker** בשלב זה, כדי לא להכניס Cache והתנהגות Offline שלא נדרשו. יש לבדוק התקנה בפועל בגרסת Chrome הנתמכת.
3. `localStorage` עלול להיות חסום, להימחק או להיות לא זמין במצבים מסוימים; המשחק חייב להמשיך לפעול ללא שמירת שיא.
4. GitHub Pages אינו Backend ואינו מתאים לסודות או נתונים פרטיים. העלות הבסיסית עשויה להיות אפס ב-Repository ציבורי בכפוף למגבלות ולתנאי GitHub העדכניים; שימוש בדומיין מותאם כרוך בעלות דומיין אפשרית.
5. אין התחייבות לתמיכה בטאבלט, Desktop, iPhone או דפדפן שאינו Chrome ל-Android.

## 2. ארכיטקטורת המערכת

### 2.1 מבנה כללי

```text
Android / Chrome או PWA מותקנת
          |
          v
GitHub Pages (HTTPS; HTML, CSS, JS, Manifest, Icons)
          |
          v
Frontend App
  |-- UI / Navigation (Home, About)
  |-- Game Controller + State Machine
  |-- Sequence Generator + Scoring
  |-- Playback Scheduler + Web Audio
  |-- High Score Storage (Local Storage)
  `-- Page Visibility / Lifecycle Handling
```

כל הלוגיקה רצה בדפדפן. אין בקשות רשת בזמן משחק מעבר לטעינת משאבי האתר. ניווט בין שני המסכים מתבצע באותו מסמך HTML באמצעות החלפת View, ללא Router וללא ניווט לכתובות נפרדות; כך נמנעות בעיות רענון נתיבים ב-GitHub Pages.

### 2.2 Modules ואחריות

| Module | אחריות |
|---|---|
| `UI` | ציור מסך משחק/אודות, כפתורים, ניקוד, שלב, הודעות סיום וניצחון, אנימציות, נגישות בסיסית |
| `Game Controller` | מכונת מצבים, תחילת משחק, מעבר שלבים, קלט, טעות, ניצחון ואיפוס |
| `Sequence Generator` | יצירת רצף אקראי עצמאי בכל שלב, באורך מספר השלב; חזרות מותרות |
| `Playback Scheduler` | הדלקת צבעים והפעלת צלילים בסדר מדויק, תזמון והפסקת משימות פעילות |
| `Audio` | ארבעה צלילים מובחנים, יצירה/חידוש AudioContext, השתקה |
| `Score` | הוספת נקודות רק לאחר שחזור מלא ומוצלח של שלב; תקרה 55 |
| `High Score Storage` | קריאה ושמירת שיא אישי יחיד רק בסיום בטעות/ניצחון |
| `Lifecycle` | ביטול משחק עם מעבר למסך אודות, רענון או מעבר דף לרקע |

ה-UI קורא ל-Game Controller; רק ה-Controller משנה את מצב המשחק. מודולי Generator, Score ו-Storage אינם תלויים ב-DOM כדי לאפשר Unit Tests.

### 2.3 State Machine

מצבים: `idle`, `presenting`, `input`, `stageSuccess`, `lost`, `won`.

- `idle` → `presenting`: לחיצה על "התחל", איפוס הניקוד, שלב 1 והגרלת רצף.
- `presenting` → `input`: לאחר השלמת השמעת הרצף. קלט צבעים חסום ב-`presenting`.
- `input` → `input`: לחיצה נכונה על צבע שאינו האחרון ברצף.
- `input` → `stageSuccess`: הלחיצה הנכונה האחרונה בשלב 1–9; הוספת ניקוד לפי מספר השלב.
- `stageSuccess` → `presenting`: לאחר משוב הצלחה קצר והשהיה, מעבר אוטומטי לשלב הבא והגרלת רצף חדש.
- `input` → `won`: השלמת שלב 10, הוספת 10 נקודות, עדכון שיא והצגת ניצחון חגיגי.
- `input` → `lost`: טעות ראשונה, ללא נקודות על השלב הנוכחי, עדכון שיא והצגת סיום.
- `lost` / `won` → `presenting`: "משחק חדש" מאפס משחק ומתחיל שלב 1.
- כל מצב פעיל → `idle`: מעבר ל"אודות", מעבר דף לרקע או נטישת המשחק; **ללא עדכון שיא**.

למעבר למסך אודות בזמן משחק יש עדיפות על כל Callback ממתין. בעת ביטול יש לנקות Timers/פעולות Playback ולבטל אירועים מאוחרים באמצעות `runId` או `AbortController` כדי למנוע המשך משחק אחרי יציאה.

### 2.4 Data Model

```ts
type Color = 'blue' | 'red' | 'yellow' | 'green';
type Phase = 'idle' | 'presenting' | 'input' | 'stageSuccess' | 'lost' | 'won';
type Screen = 'home' | 'about';

type GameState = {
  screen: Screen;
  phase: Phase;
  level: number;              // 1..10 בזמן משחק
  sequence: Color[];          // length === level
  nextInputIndex: number;     // 0..sequence.length
  score: number;              // 0..55
  muted: boolean;
  runId: number;              // מונע השלמת פעולות ישנות
};
```

- `GameState` נשמר בזיכרון בלבד; רענון מאפס אותו. אין Persist של רצף, שלב, ניקוד פעיל או מצב השתקה.
- מפתח `localStorage`: `simon.highScore.v1`, ערך מספר שלם בטווח `0..55` כמחרוזת. בהיעדר ערך: `0`.
- עדכון שיא מתבצע **רק** ב-`lost` או `won`: `max(previousHighScore, score)`. מעבר לרקע/אודות אינו מפעיל שמירה.
- קריאה: `try/catch`, בדיקת מספר שלם ובטווח; ערך פגום נחשב ל-0. כתיבה שנכשלה אינה מפילה את המשחק.
- אין נתוני משתמש מזהים, סנכרון או היסטוריה.

### 2.5 חוקי המשחק והתזמון

1. לכל מיקום ברצף בוחרים צבע מתוך ארבעת הצבעים בהסתברות שווה ועצמאית; חזרות רצופות מותרות. להשתמש ב-`Math.random()` — אין צורך ב-Cryptographic RNG.
2. שלב `n` מציג `n` צבעים, רצף חדש שאינו ממשיך את הקודם.
3. משך הצגת צבע בשלב `n`: `1000 - (n - 1) * (600 / 9)` מילישניות; בשלב 1: 1000ms, ובשלב 10: 400ms. זו אינטרפולציה לינארית של הקצוות שאושרו.
4. יש להפריד חזותית בין אירועי צבע עוקבים, במיוחד אם אותו צבע מופיע פעמיים. הפסקה קצרה בין אירועים היא **החלטת מימוש**, לא שינוי של משך הצגת הצבע; יש לשמור על קצב קריא ועקבי.
5. בזמן הצגת רצף: לחצני הצבע אינם פעילים. לאחר מכן אין מגבלת זמן בין לחיצות השחקן.
6. בכל לחיצה פעילה: הדלקה קצרה של הכפתור וצליל ייחודי, אלא אם מושתק. קלט מהיר מטופל בסדר הלחיצות, ללא עיבוד כפול של אירוע אחד.
7. כל שלב שהושלם מוסיף `n` נקודות: `1 + 2 + ... + 10 = 55`. טעות אחת מסיימת משחק מיד.
8. במהלך משחק מוצגים רק שלב וניקוד (ללא הודעות הדרכה מתחלפות או Progress Bar). משוב הצלחה קצר בין שלבים מותר בהתאם ל-PRD; אין צורך בטקסט מתחלף בזמן הצגה/קלט.
9. בתום שלב 10: מסך ניצחון חגיגי **באותו מסך בית**, עם אנימציה, 55 נקודות ו"משחק חדש"; אין מסך שלישי.

### 2.6 UI, שמע וניווט

- `html lang="he" dir="rtl"`; כל טקסטי הממשק בעברית.
- לוח 2×2 עם ארבעה כפתורים גדולים ומעוגלים, בצבעים כחול, אדום, צהוב וירוק. יש לשמור על שיוך קבוע בין צבע, מיקום וצליל.
- יש להשתמש ב-`button` סמנטיים עם שמות נגישים בעברית, שטחי מגע גדולים ומשוב חזותי גם במצב מושתק. להימנע מהסתמכות על צבע בלבד לזיהוי פקד עבור טכנולוגיות מסייעות.
- מסך בית: "התחל" / "משחק חדש" לפי מצב, לוח, כותרת "סיימון" במצב `idle` או פס שלב וניקוד בכל שאר המצבים, וסרגל עליון עם כפתור "אודות" (פינה ימנית) וכפתור השתקה (פינה שמאלית), כמתואר ב-DESIGN.md.
- כרטיס סיום בהפסד: "המשחק נגמר", "הגעת לשלב" (ערך `level` בעת הטעות), "הניקוד שלך" ו"משחק חדש". בניצחון: "ניצחת!", ניקוד 55 ו"משחק חדש", ללא שורת שלב.
- מסך אודות: תיאור, הוראות, שיטת ניקוד, שיא אישי ו"חזרה למשחק".
- ניווט ל"אודות" מבטל משחק פעיל; חזרה מציגה `idle`. אין סרגל ניווט קבוע.
- צלילים: ארבע תדירויות שונות ומובחנות ב-Web Audio API, עם Envelope קצר ב-Gain למניעת Clicks. מיפוי תדירויות קבוע בקוד. להתחיל/לחדש `AudioContext` בתוך לחיצת "התחל" או אינטראקציה ישירה אחרת; לא להסתמך על Autoplay בעת טעינת הדף.
- השתקה משנה רק את הפקת הצליל; משוב האורות נמשך. כשל שמע לא פוגע בלוגיקת המשחק.

### 2.7 Lifecycle, Edge Cases ואמינות

- `visibilitychange` כאשר `document.visibilityState === 'hidden'`: ביטול המשחק הפעיל והחזרה ל-`idle` ללא שמירת שיא. בחזרה לא להפעיל Timers או שמע שנעצרו. אפשר להיעזר ב-`pagehide` לגיבוי, אך אין להסתמך על `beforeunload` במובייל.
- בעת רענון: מצב המשחק אינו נשמר, והאתר עולה במצב `idle`. אין שמירה ב-`unload`.
- קלט בזמן `presenting`, אחרי `lost`/`won`, או בזמן אנימציית מעבר — נזנח.
- רצף של אותו צבע פעמיים מחייב שתי לחיצות נפרדות; אין למזג אותן.
- לחיצה שגויה אינה מעניקה ניקוד על השלב הנוכחי; שמירת שיא תתבצע לכל היותר פעם אחת לכל סיום.
- אם `localStorage` לא זמין: שיא זמני של 0 להצגה והמשחק ממשיך; אין ניסיון להעביר מידע לשרת.
- השהיות מערכת, מעבר לרקע או הפסקת שמע לא יגרמו ל-Callbacks ישנים להחזיר משחק שבוטל.
- פתיחה ללא חיבור רשת אינה מובטחת, בהתאם לדרישה שאין תמיכת Offline.

### 2.8 PWA

- קובץ Web App Manifest עם `name` ו-`short_name` בעברית, `lang: "he"`, `dir: "rtl"`, `display: "standalone"`, `start_url` ו-`scope` המתאימים לנתיב הפריסה, `theme_color`, `background_color`, ואייקוני PNG לפחות בגדלים 192×192 ו-512×512.
- HTTPS מסופק באמצעות GitHub Pages.
- אין כפתור התקנה בתוך הממשק; התקנה מתבצעת מתוך Chrome.
- **לא יתווסף Service Worker או מנגנון Cache יזום**, משום שאין דרישת Offline ו-Chrome Android אינו מחייב Service Worker להתקנה. יש לאמת את תנאי ההתקנה בפועל מול Chrome בעת הפרסום.
- יש להשתמש בנתיבים תואמי `base` גם עבור Manifest, אייקונים ו-`start_url` בפריסה תחת `/<repository>/`.

### 2.9 APIs, אבטחה ופרטיות

- אין HTTP API עסקי, Backend או אינטגרציות חיצוניות. APIs בדפדפן: DOM, Web Audio, Local Storage, Page Visibility.
- אין Authentication או הרשאות משתמש; כל השיאים מקומיים ל-Origin ולפרופיל Chrome. מחיקת נתוני אתר מוחקת את השיא.
- אין סודות בקוד או ב-GitHub Actions; אין להכניס Tokens, פרטי משתמש או Environment Variables רגישים לקבצי Frontend.
- לא להציג HTML שמקורו בקלט חיצוני; עדכוני UI ייעשו ב-`textContent`/DOM בטוח. אין צורך ב-Analytics, Cookies לצורכי מעקב או שירותי צד שלישי.
- מומלץ להשתמש בתלויות מצומצמות, Lockfile, בדיקת Dependencies ב-CI והרשאות GitHub Actions מינימליות.

### 2.10 GitHub, Build ו-Deployment

- Repository יחיד ב-GitHub; ענף פרסום `main`. הקוד המקורי ו-`package-lock.json` נשמרים ב-Git, ותיקיית `dist/` אינה נדרשת ב-Repository.
- סביבת פיתוח: Node.js בגרסת LTS נתמכת על ידי גרסת Vite שנבחרה, `npm ci`, `npm run dev`. אין צורך ב-Docker או בשירותי Cloud לפיתוח מקומי.
- Scripts צפויים: `dev`, `typecheck`, `test`, `build`, `preview`; `build` מפיק את `dist/`.
- Repository: `https://github.com/tomerjbai-dev/Simon` (ציבורי). כתובת האתר: `https://tomerjbai-dev.github.io/Simon/`.
- `vite.config` מגדיר `base: '/Simon/'` (באות S גדולה — הנתיב רגיש לאותיות גדולות וקטנות). `start_url`, `scope`, נתיבי אייקונים ונתיב גרפיקת הרקע חייבים להיות עקביים עם Base Path.
- הפריסה ל-GitHub Pages פועלת מההתחלה, כך שכל גרסה שנדחפה ל-`main` זמינה לבדיקה בטלפון בכתובת האתר. Push ל-`main` מתבצע רק לאחר אישור המשתמש (ראו CLAUDE.md), ולכן כל פריסה היא של גרסה מאושרת.
- GitHub → Settings → Pages → Source: **GitHub Actions**.
- Workflow על Push ל-`main` (ואפשר בדיקות על Pull Request): `checkout` → `setup-node` → `npm ci` → `typecheck` → `test` → `build` → `upload-pages-artifact` של `dist/` → `deploy-pages`.
- הרשאות Workflow לפריסה: `contents: read`, `pages: write`, `id-token: write`; פריסה לסביבת `github-pages` ורק מענף הפרסום.
- אין משתני Production סודיים ואין Database Migrations. כל שינוי שאושר ומוזג ל-`main` נבנה ונפרס אוטומטית; כשל בדיקות או Build חוסם פריסה.
- GitHub Pages מפרסם אתר ציבורי. ה-Repository ציבורי, ולכן Pages זמין ב-GitHub Free.

### 2.11 בדיקות וקבלת התנהגות

- Unit Tests: רצף באורך הנכון, בחירה עצמאית מתוך ארבעה צבעים עם RNG מוזרק בבדיקות, חזרות, ניקוד עד 55, מעבר מצבים, טעות ראשונה, עדכון שיא רק בסיום, ביטול משחק ו-Callbacks ישנים.
- Integration/UI: שני מסכים בלבד, RTL, כפתורים חסומים בהצגה, לחיצה כפולה, השתקה, מעבר לאודות, רענון, `visibilitychange`, אחסון חסום או פגום.
- בדיקות מכשיר אמיתי: Android Chrome, Touch, שמע לאחר לחיצה על "התחל", צלילים חוזרים, תזמון שלב 1 ושלב 10, התקנת PWA דרך Chrome, פתיחה במצב `standalone`, וטעינת כל המשאבים תחת נתיב GitHub Pages.
- אין צורך ב-Backend Tests, Database Tests או בדיקות סנכרון בין מכשירים.

## 3. מקורות רשמיים והערות מחקר

נבדקו חלופות רלוונטיות ל-UI (Vanilla/React/Vue), כלי Build (Vite/Webpack/ללא Bundler), שמע (Web Audio/קבצי Audio/Tone.js), אחסון (Local Storage/IndexedDB/Cloud DB) ו-Hosting (GitHub Pages/Vercel/Netlify). נבחרה בכל קטגוריה החלופה הפשוטה שמכסה את הדרישות ללא שירותים מיותרים.

1. [Vite — Getting Started](https://vite.dev/guide/) — תמיכה בתבנית `vanilla-ts`, פיתוח ו-Build.
2. [Vite — Building for Production](https://vite.dev/guide/build) — Build סטטי והגדרות Base Path.
3. [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy.html) — GitHub Pages עם GitHub Actions ו-`base`.
4. [GitHub Docs — Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) — פרסום דרך Actions וזמינות Pages לפי תוכנית.
5. [Chrome for Developers — Installability requirements](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest) — שדות Manifest ואייקונים; שימו לב שה-Audit המתואר הוצא משימוש, ויש לבדוק תנאים עדכניים בפועל.
6. [Chrome for Developers — What's new in Web on Android](https://developer.chrome.com/blog/whats-new-in-web-on-android-io2023) — ביטול הדרישה ל-Service Worker `fetch` handler לצורך התקנה ב-Chrome Android.
7. [MDN — Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — AudioContext ו-User Gesture.
8. [MDN — Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — הגבלות שמע אוטומטי.
9. [MDN — Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — אחסון מקומי בדפדפן.
10. [MDN — Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — זיהוי מעבר דף לרקע.

המסמך מגדיר ארכיטקטורה בלבד, ללא Milestones, תוכנית עבודה או הרחבות מוצר.

## החלטות מרכזיות (ADRs)

### ADR-1: טעינת Heebo דרך `@fontsource/heebo` במשקלים 400/500/700 בלבד
**הקשר:** הגופן צריך להיארז עם האתר, בלי תלות ב-Google Fonts.
**החלטה:** מייבאים ב-`src/main.ts` רק את קובצי ה-CSS של המשקלים 400, 500 ו-700. Vite אורז את קובצי הגופן ל-`dist/assets`.
**השלכות:** הדפדפן מוריד רק את חלקי הגופן (עברית/לטינית) שבשימוש בפועל, לפי `unicode-range`. משקל נוסף ידרוש ייבוא נוסף.

### ADR-2: מקום שמור ריק לסרגל העליון עד שהכפתורים ימומשו
**הקשר:** כפתורי ההשתקה ו"אודות" שייכים ל-Milestones 2 ו-4, ואסור להציג רכיבים שעדיין לא עובדים.
**החלטה:** ב-Milestone 1 מוצג `div.top-bar` ריק בגובה קבוע (44px).
**השלכות:** כשהכפתורים יתווספו, הפריסה של הכותרת והלוח לא תזוז.

### ADR-3: רקע החלל כקובץ SVG שמיובא מה-CSS
**הקשר:** נתיב הרקע חייב לעבוד תחת `base: '/Simon/'`.
**החלטה:** `src/assets/background.svg` מיובא ב-`styles.css` עם `url('./assets/background.svg')`, כך ש-Vite מתקן את הנתיב ב-Build. ה-SVG מוצג בשכבה קבועה (`body::before`, `background-size: cover`), ומעליו שכבה כהה-שקופה עדינה.
**השלכות:** הנתיב נכון גם בפיתוח וגם ב-GitHub Pages; שינוי ברקע = עריכת קובץ ה-SVG בלבד.

### ADR-4: מנוע משחק מפונקציות טהורות, ו-App שמנהל Timers ו-`runId`
**הקשר:** צריך לבדוק את חוקי המשחק בלי דפדפן, ולמנוע מ-Timers של סבב קודם לשנות סבב חדש.
**החלטה:** `src/game.ts` מכיל פונקציות מעבר מצב טהורות (`startGame`, `finishPresenting`, `pressColor`, `toggleMute`), ללא DOM וללא Timers. `src/app.ts` הוא המקום היחיד שמחזיק את ה-State, מתזמן Playback ו-Timers, ומבטל את כולם בהתחלת משחק. כל Callback מאוחר נבדק גם מול `runId`.
**השלכות:** הלוגיקה מכוסה ב-Vitest בסביבת `node`; שמע ו-DOM נבדקים ידנית.

### ADR-5: זמני השהיה וצלילים
**הקשר:** ה-PRD משאיר את משכי ההשהיה ואת הצלילים להחלטת המימוש.
**החלטה:** `src/timing.ts`: המתנה של 600ms לפני הצבע הראשון, 250ms הפסקה בין צבעים, 250ms הארה בלחיצת שחקן, 700ms משוב הצלחה, 300ms עד הופעת כרטיס הסיום. צלילים: Oscillator מסוג `triangle` עם Envelope קצר; ירוק 415Hz, אדום 310Hz, צהוב 252Hz, כחול 209Hz.
**השלכות:** שינוי קצב = עריכת קבועים בקובץ אחד.

### ADR-6: עצירה זמנית אחרי שלב 1 ב-Milestone 2
**הקשר:** מעבר בין שלבים שייך ל-Milestone 3; המשתמש בחר שהמשחק ייעצר אחרי הצלחה בשלב 1.
**החלטה:** `stageSuccess` הוא מצב עצירה: משוב הצלחה, ניקוד 1 וכפתור "משחק חדש".
**השלכות:** ב-Milestone 3 יתווסף מעבר אוטומטי לשלב הבא במקום העצירה.

### ADR-7: ה-DOM נבנה פעם אחת ומתעדכן
**הקשר:** בנייה מחדש של המסך בכל שינוי הייתה קוטעת הארות ולחיצות על האריחים.
**החלטה:** `mountUi` בונה את המסך פעם אחת; `update(state)` מעדכן רק טקסט, Classes ונראות (`hidden` / `is-reserved`).
**השלכות:** הלוח לא זז ולא נבנה מחדש בין המצבים; כפתור שמוסתר שומר על מקומו.

### ADR-8: כרטיס הסיום מחליף את פס הסטטוס ואת הלוח
**הקשר:** ב-Wireframe של סיום המשחק לא מופיעים פס הסטטוס והלוח.
**החלטה:** במצב `lost` מוצג הכרטיס במקום פס הסטטוס והלוח; הסרגל העליון (כפתור ההשתקה) נשאר.
**השלכות:** אותו כרטיס ישמש גם למצב הניצחון ב-Milestone 3.
