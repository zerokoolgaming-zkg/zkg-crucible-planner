# ZKG Crucible Planner — Hero Animated Edition

- MSF-style header (metallic navy) with **alternating gold shimmer** every ~10s
- Circular emblem logo + favicon
- Mobile-friendly responsive layout
- PNG portrait rendering from "PNG files" tab (A: name, B: PNG URL)
- Admin portal (password **Jujub1234!**)

## Deploy
1) **Apps Script backend**
   - Google Sheet → Extensions → Apps Script
   - Paste `Code.gs` (Sheet ID preset: 1Mq88NZUs6rIsbQFGmR_4koqxZofYeFS063-S81GtShk)
   - Deploy → New deployment → Web app (Execute as Me, Access Anyone)

2) **GitHub Pages**
   - Create public repo `zkg-crucible-planner`
   - Upload all files from this folder
   - Settings → Pages → main / (root)
   - Site: `https://<you>.github.io/zkg-crucible-planner/`

Frontend already points to your API URL:
https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec
