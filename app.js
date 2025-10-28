
const API_URL = "https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec";

const teamSelect = document.getElementById("teamSelect");
const charSelects = [...document.querySelectorAll(".charSelect")];
const resultEl = document.getElementById("result");
document.getElementById("searchBtn").addEventListener("click", onSearch);
document.getElementById("resetBtn").addEventListener("click", resetUI);

let characters = [];
let teams = [];
let pngMap = {};

bootstrap();

async function bootstrap() {
  lockUI(true);
  await Promise.all([loadCharacters(), loadTeams(), loadPngMap()]);
  buildCharacterDropdowns();
  buildTeamDropdown();
  hookPreviewUpdates();
  lockUI(false);
}

function lockUI(l) { [...document.querySelectorAll("select,button")].forEach(e => e.disabled = l); }

async function loadCharacters() {
  const r = await fetch(`${API_URL}?action=getcharacters`);
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || "Failed to load characters");
  characters = d.characters || [];
}

async function loadTeams() {
  const r = await fetch(`${API_URL}?action=getteams`);
  const d = await r.json();
  if (!d.ok) return;
  teams = d.teams || [];
}

async function loadPngMap() {
  const r = await fetch(`${API_URL}?action=getpngmap`);
  const d = await r.json();
  if (!d.ok) return;
  pngMap = d.map || {}
}

function buildCharacterDropdowns() {
  charSelects.forEach((sel) => {
    sel.innerHTML = `<option value="">Choose character</option>` +
      characters.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
  });
}

function buildTeamDropdown() {
  teamSelect.innerHTML = `<option value="">(Optional) Choose a Team</option>` +
    teams.map(t => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join('');
  teamSelect.addEventListener("change", () => {
    const name = teamSelect.value;
    const t = teams.find(x => x.name === name);
    if (t && Array.isArray(t.members) && t.members.length === 5) {
      t.members.forEach((m, i) => {
        if (charSelects[i]) {
          charSelects[i].value = m;
          updatePreviewForSelect(charSelects[i]);
        }
      });
    }
  });
}

function hookPreviewUpdates() {
  charSelects.forEach(sel => sel.addEventListener("change", ev => updatePreviewForSelect(ev.target)));
  document.querySelectorAll(".slot .preview img").forEach(img => img.style.display = "none");
}

function norm(s) {
  return (s||'').toLowerCase().replace(/_/g,' ').replace(/\u00A0/g,' ').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[’‘`]/g,"'").replace(/[(){}\[\].,;:!?/\\\-–—"“”‘’]/g,'').replace(/\s+/g,' ').trim();
}

function getImgForName(name) { return pngMap[norm(name)] || ""; }

function updatePreviewForSelect(sel) {
  const slot = sel.closest(".slot");
  const img = slot.querySelector(".preview img");
  const url = getImgForName(sel.value);
  if (url) { img.src = url; img.style.display = "block"; }
  else { img.removeAttribute("src"); img.style.display = "none"; }
}

function resetUI() {
  teamSelect.value = "";
  charSelects.forEach(s => { s.selectedIndex = 0; updatePreviewForSelect(s); });
  resultEl.innerHTML = "";
}

async function onSearch() {
  const team = charSelects.map(s => s.value).filter(Boolean);
  if (team.length !== 5) {
    resultEl.innerHTML = `<div class="muted">Please select exactly 5 characters.</div>`;
    return;
  }
  lockUI(true);
  try {
    const r = await fetch(`${API_URL}?action=findcounters&team=${encodeURIComponent(JSON.stringify(team))}`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "Lookup failed");
    renderResult(d.matches || []);
  } catch(e) {
    resultEl.innerHTML = `<div class="muted">Error: ${e.message}</div>`;
  } finally { lockUI(false); }
}

function renderResult(matches) {
  if (!matches.length) { resultEl.innerHTML = `<div class="muted">No 5-character team match found.</div>`; return; }
  const html = matches.map((m,i)=> {
    const imgRow = (m.counterTeam || []).map(c => `
      <div class="char-slot">
        <img src="${escapeHtml(c.img||'')}" alt="${escapeHtml(c.name||'')}" />
        <p>${escapeHtml(c.name||'')}</p>
      </div>`).join('');
    return `<div class="match-card">
      <h3>Match #${i+1}</h3>
      <div class="selectors" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">${imgRow}</div>
      <div class="info">
        <p><b>Room:</b> ${escapeHtml(m.room||'-')}</p>
        <p><b>Punch-up / Down:</b> ${escapeHtml(m.punchup||'-')}</p>
        <p><b>TCP Diff:</b> ${escapeHtml(m.tcpDiff||'-')}</p>
        <p><b>Combo / Notes:</b> ${escapeHtml(m.combo||'-')}</p>
      </div>
    </div>`;
  }).join('');
  resultEl.innerHTML = html;
}

function escapeHtml(s) {
  return (s==null?'':String(s)).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
}
