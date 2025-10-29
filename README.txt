ZKG Crucible Planner — v4.4 (Root Build)

All files go in your REPO ROOT (same folder as index.html).

Structure
---------
index.html
diagnostics.html   (PIN: 2479)
assets/
  css/style.css
  js/app.js        (uses your backend: https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec)
  img/logo.png
  img/energy-bg.png

Deploy
------
1) Upload everything to your repo root.
2) GitHub → Settings → Pages → Build from branch → main → /(root).
3) Open your site URL.
4) Visit /diagnostics.html → enter PIN 2479 → expect: Ping OK • PNGs OK • Teams OK.

Notes
-----
- If Apps Script is down, a small static fallback keeps dropdowns usable.
- If you redeploy Apps Script, its /exec URL may change; update BACKEND_URL in assets/js/app.js.
