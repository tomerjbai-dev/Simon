# תוכנית — Milestone 5: PWA ובדיקת קבלה מלאה

**מקורות:** `PRD.md` (זרימה 4, FR-08, אילוצים, מחוץ לתחום), `ARCHITECTURE.md` (סעיף 2 בהחלטות הפתוחות, 2.8, 2.10, 2.11), `DESIGN.md` (צבעי האריחים, סדר הלוח 2×2, רקע כהה).
**מצב קיים:** משחק מלא עם מסך אודות, שיא אישי וביטול משחק (Milestones 1–4). `index.html` כבר מכיל `<meta name="theme-color" content="#0B1020">`. אין תיקיית `public/`, אין Manifest, אין אייקונים ואין Favicon.

## 1. מה נבנה (תמונה כללית)

1. **קובץ Manifest** — קובץ קטן שאומר ל-Chrome "זה אתר שאפשר להתקין": שם, צבעים, אייקונים ונתיב פתיחה תחת `/Simon/`.
2. **אייקונים** — שתי תמונות PNG (192×192 ו-512×512) בהשראת לוח המשחק, שמופקות פעם אחת בסקריפט קטן ונשמרות בפרויקט.
3. **חיבור ל-`index.html`** — קישור ל-Manifest ול-Favicon.
4. **בדיקות** — בדיקה אוטומטית שה-Manifest תקין ושהאייקונים קיימים בגודל הנכון, ורשימת בדיקות קבלה מלאה במכשיר.

**לא נבנה:** כפתור התקנה, Service Worker, Cache או תמיכת Offline (PRD FR-08, ARCHITECTURE 2.8). אין שינוי בקוד המשחק עצמו.

## 2. קבצים

| קובץ | פעולה | תוכן |
|---|---|---|
| `public/manifest.webmanifest` | חדש | ה-Manifest |
| `public/icons/icon-192.png` | חדש (מופק) | אייקון 192×192 |
| `public/icons/icon-512.png` | חדש (מופק) | אייקון 512×512 |
| `scripts/generate-icons.mjs` | חדש | סקריפט Node ללא תלויות שמצייר את האייקונים ושומר PNG |
| `index.html` | שינוי | `<link rel="manifest">` ו-`<link rel="icon">` |
| `package.json` | שינוי | Script חדש `icons` (הרצה ידנית בלבד, לא חלק מה-Build) |
| `src/__tests__/manifest.test.ts` | חדש | אימות ה-Manifest והאייקונים |
| `spec/ARCHITECTURE.md` | שינוי | ADR-14, ADR-15 |

תיקיית `public/` של Vite מועתקת כמו שהיא ל-`dist/`, כך שהקבצים יוגשו ב-`/Simon/manifest.webmanifest` וב-`/Simon/icons/...`.

## 3. ה-Manifest — `public/manifest.webmanifest`

```json
{
  "name": "סיימון",
  "short_name": "סיימון",
  "description": "משחק זיכרון של אורות וצלילים בעשרה שלבים",
  "lang": "he",
  "dir": "rtl",
  "start_url": "/Simon/",
  "scope": "/Simon/",
  "id": "/Simon/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0B1020",
  "background_color": "#0B1020",
  "icons": [
    { "src": "/Simon/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/Simon/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/Simon/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/Simon/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- הנתיבים מלאים (`/Simon/...`) כי Vite לא משכתב נתיבים בתוך קבצי `public/`. אותם נתיבים עובדים גם ב-`npm run dev` וגם ב-`npm run preview`, כי שניהם מגישים תחת `/Simon/`.
- `theme_color` / `background_color` = `--bg-dark` (`#0B1020`), כמו ה-`theme-color` שכבר ב-`index.html` — כך מסך הפתיחה של האפליקציה המותקנת כהה כמו המשחק.
- `orientation: "portrait"` — האתר Mobile-First לטלפון במצב אנכי (אושר, סעיף 10).
- `description` — משפט קצר שנגזר מה-PRD; לא מוצג בממשק המשחק.
- אותם קבצי אייקון מוצהרים גם כ-`any` וגם כ-`maskable`: הרקע הכהה ממלא את כל הריבוע, והאריחים נמצאים באזור הבטוח המרכזי, כך שהאייקון נראה טוב גם כש-Android חותך אותו לעיגול.

## 4. האייקונים — `scripts/generate-icons.mjs`

**עיצוב** (DESIGN.md לא מגדיר אייקון אפליקציה — אושר, סעיף 10):
- רקע מלא בצבע `#0B1020`.
- במרכז, לוח 2×2 של ארבעה ריבועים מעוגלים בצבעי האריחים ובסדר של `DESIGN.md`: ירוק `#4CD964` משמאל למעלה, אדום `#FF5B57` מימין למעלה, צהוב `#FFB74D` משמאל למטה, כחול `#4DA3FF` מימין למטה.
- הלוח תופס כ-60% מרוחב האייקון (בתוך "האזור הבטוח" של Maskable, שהוא 80% המרכזיים), עם מרווח קטן בין הריבועים ופינות מעוגלות — כמו הלוח במשחק.
- ללא טקסט (טקסט לא קריא בגודל אייקון).

**מימוש:**
- סקריפט Node אחד, **ללא תלויות חדשות**: מצייר פיקסלים במערך, מחליק קצוות (Anti-aliasing פשוט בדגימה מרובה), ושומר PNG בעזרת `zlib` המובנה של Node.
- מופעל ידנית עם `npm run icons`; קובצי ה-PNG שנוצרו נשמרים בפרויקט. ה-Build וה-CI לא מריצים אותו.

## 5. `index.html`

להוסיף בתוך `<head>`:
```html
<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />
<link rel="icon" type="image/png" href="%BASE_URL%icons/icon-192.png" />
```
- `%BASE_URL%` מוחלף על ידי Vite ב-`/Simon/`, כך שהנתיב נכון בכל סביבה.
- ה-Favicon משתמש באותו אייקון; הוא מונע שגיאת 404 על `favicon.ico` ומציג סמל בלשונית. אין כאן רכיב ממשק חדש.
- `<meta name="theme-color">` הקיים נשאר כמו שהוא.

## 6. ADRs להוספה ל-ARCHITECTURE.md

- **ADR-14: Manifest סטטי ב-`public/` עם נתיבי `/Simon/` מלאים** — הקשר: Vite לא משכתב נתיבים בקבצי `public/`. החלטה: Manifest כקובץ JSON סטטי עם `start_url`/`scope`/`id`/אייקונים תחת `/Simon/`, קישור מ-`index.html` דרך `%BASE_URL%`, ללא Plugin ל-PWA וללא Service Worker. השלכות: שינוי שם ה-Repository מחייב עדכון ידני של ה-Manifest (הבדיקה האוטומטית תתפוס אי-התאמה ל-`base`).
- **ADR-15: אייקונים מופקים בסקריפט ללא תלויות ונשמרים בפרויקט** — הקשר: נדרשים PNG ב-192 וב-512, ואין כלי גרפי בפרויקט. החלטה: `scripts/generate-icons.mjs` מצייר את לוח ה-2×2 ושומר PNG עם `zlib`; הקבצים נשמרים ב-Git, האייקון משמש גם כ-`any` וגם כ-`maskable`. השלכות: שינוי עיצוב האייקון = עריכת הסקריפט והרצת `npm run icons`.

## 7. בדיקות אוטומטיות — `src/__tests__/manifest.test.ts` (Vitest, סביבת `node`)

- ה-Manifest הוא JSON תקין; `name`/`short_name` בעברית, `lang: "he"`, `dir: "rtl"`, `display: "standalone"`.
- `start_url`, `scope`, `id` וכל `src` של אייקון מתחילים ב-`base` שמוגדר ב-`vite.config.ts` (`/Simon/`).
- קיימים אייקונים בגדלים `192x192` ו-`512x512` מסוג `image/png`.
- כל קובץ אייקון קיים ב-`public/`, מתחיל בחתימת PNG, והמידות שכתובות בו (כותרת IHDR) תואמות ל-`sizes`.
- `index.html` מכיל `rel="manifest"`.
- אין Service Worker: אין קובץ `sw.js`/`service-worker` ואין קריאה ל-`serviceWorker.register` ב-`src/` וב-`index.html`.

בנוסף: `npm run typecheck`, `npm test`, `npm run build` — וווידוא ש-`dist/manifest.webmanifest` ו-`dist/icons/*.png` קיימים, ושב-`dist/index.html` הקישורים הם `/Simon/...`.

## 8. בדיקה בזמן הבנייה (דפדפן מחשב)

1. `npm run build` ואז `npm run preview` (הפעלה `simon-preview` ב-`.claude/launch.json`, פורט 4173).
2. בדפדפן: `http://localhost:4173/Simon/` — לוודא שאין שגיאות בקונסול ושהבקשות ל-`/Simon/manifest.webmanifest`, `/Simon/icons/icon-192.png`, `/Simon/icons/icon-512.png` מחזירות 200.
3. לפתוח את האייקונים ולהסתכל עליהם (צבעים, סדר, אזור בטוח).
4. מעבר מהיר על המשחק (התחל, שלב, הפסד, אודות) כדי לוודא ששום דבר לא נשבר.
5. לסגור את השרת בסיום.

## 9. בדיקות קבלה במכשיר (לאחר הדחיפה, Android + Chrome, `https://tomerjbai-dev.github.io/Simon/`)

רשימה שנעבור עליה יחד אחרי הדחיפה (אני אדריך צעד אחר צעד):

**טעינה ו-PWA**
- [ ] האתר נטען ב-HTTPS עם רקע, גופן, צבעים; אין שגיאות.
- [ ] `https://tomerjbai-dev.github.io/Simon/manifest.webmanifest` והאייקונים נפתחים (בדיקה שלי מהמחשב).
- [ ] בתפריט Chrome (⋮) מופיע "התקנת אפליקציה" / "הוספה למסך הבית"; ההתקנה מוסיפה אייקון סיימון למסך הבית.
- [ ] פתיחה מהאייקון: חלון בלי שורת כתובת (`standalone`), רקע כהה בזמן הטעינה.
- [ ] אין כפתור התקנה בתוך המשחק.

**משחק**
- [ ] "התחל" → שלב 1, ניקוד 0, הרצף מוצג עם אור וצליל.
- [ ] משחק שלם של 10 שלבים → "ניצחת!", 55 נקודות, חגיגה, "משחק חדש".
- [ ] טעות → "המשחק נגמר", "הגעת לשלב", הניקוד, "משחק חדש" עובד.
- [ ] צבע שחוזר פעמיים ברצף דורש שתי לחיצות.
- [ ] השתקה: אין צליל, האור ממשיך; ביטול השתקה מחזיר צליל.
- [ ] הקצב מתקצר בין שלב 1 לשלבים מתקדמים.

**אודות, שיא וביטול**
- [ ] "אודות" מציג תיאור, הוראות, ניקוד ושיא אישי; "חזרה למשחק" מחזיר למצב התחלתי.
- [ ] שיא חדש נשמר אחרי הפסד/ניצחון; תוצאה נמוכה לא דורסת אותו; נשמר אחרי רענון ובפתיחה מהאפליקציה המותקנת.
- [ ] רענון באמצע משחק → מצב התחלתי.
- [ ] מעבר לאפליקציה אחרת באמצע משחק וחזרה → מצב התחלתי, בלי צלילים ישנים.
- [ ] מסך אנכי בטלפון: אין גלילה אופקית ואין רכיבים חתוכים.

סעיפים שייכשלו יתוקנו כתיקונים בתוך Milestone 5.

## 10. החלטות שאושרו

1. **עיצוב האייקון** (סעיף 4): רקע כהה ולוח 2×2 קטן בארבעת צבעי המשחק, בלי טקסט — אושר.
2. **נעילה למצב אנכי** (`orientation: "portrait"`) — אושר, נשאר ב-Manifest.

## 11. מחוץ לתוכנית

- Service Worker, Cache, Offline, כפתור או הודעת התקנה (מחוץ לתחום לפי PRD).
- אייקון ל-iOS (`apple-touch-icon`) — פלטפורמת היעד היא Android.
- בדיקות דפדפן אוטומטיות (Playwright וכו') — בדיקות הקבלה הן ידניות במכשיר, כמוגדר ב-ARCHITECTURE 2.11.
- כל שינוי בהתנהגות המשחק.
