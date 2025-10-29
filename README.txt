ZKG Crucible Planner — v4.5 (Root Build)

All files belong in your REPO ROOT (same level as index.html).

Structure
---------
index.html
diagnostics.html   (PIN: 2479)
style.css
script.js          (uses your backend: https://script.google.com/macros/s/AKfycbweQfrrV7MW5Z49MxYWe6nQ25Y5whGe_VHXZ6-gkR8x/exec)
assets/
  img/logo.png
  img/energy-bg.png
  icons/spinner.svg

Deploy
------
1) Upload everything to your repo root.
2) GitHub → Settings → Pages → Build from branch → main → /(root).
3) Open your site URL.
4) Visit /diagnostics.html → enter PIN 2479 → expect: Ping OK • PNGs OK • Teams OK.

Notes
-----
- If Apps Script is down, a small static fallback keeps dropdowns usable.
- If you redeploy Apps Script, its /exec URL may change; update BACKEND_URL in script.js.
