# ZKG Crucible Planner (GitHub Pages + Google Sheets)

Frontend: GitHub Pages (index.html, admin.html)  
Backend: Google Apps Script Web App reading/writing the Google Sheet.

## 1) Prepare the Google Sheet
- Tabs:
  - **List of Characters**: A2:A = names
  - **Counter**:
    - A–E: Team Member 1..5
    - F–J: Counter Character 1..5
    - K: Room
    - L: Punch-up / Down
    - M: TCP Difference
    - N: Combo / Notes

Copy your Spreadsheet ID (between /d/ and /edit in URL).

## 2) Apps Script backend
- In the Sheet: Extensions → Apps Script
- Paste **Code.gs**, set:
  - `const SPREADSHEET_ID = 'YOUR_SHEET_ID_HERE';`
- Deploy → New deployment → Web App
  - Execute as: **Me**
  - Who has access: **Anyone**
- Copy the Web App URL (ends with `/exec`).

## 3) Frontend (this repo)
- Edit `app.js` and `admin.js` and set:
  - `const API_URL = "YOUR_WEB_APP_URL/exec";`
- Push to GitHub (public).

## 4) GitHub Pages
- Repo Settings → Pages → Branch: `main`, Folder: `/root`.
- Open `https://<you>.github.io/zkg-crucible-planner/`

## 5) Admin
- Go to `/admin.html`
- Password: **Jujub1234!**
- You can fetch a sheet snapshot and update small ranges (A1 notation).

---
Security notes:
- For production, consider moving the password to Apps Script Properties Service, restricting Web App access, or adding your own auth.
