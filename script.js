// ---- CONFIG ----
const backend_url = "https://script.google.com/macros/s/AKfycbxxjCb-eMn3fvADCK50mGOVbNY5Oj9I_SoWAIyq0wGaq3y47ENRFZyzZd_hRFbCdiO-Fg/exec"; // Replace with your /exec URL


/* ZKG v3 — Local PNGs + Team Autofill + Result Labels */
let PNG_MAP = {}, CHARACTERS = [], TEAMS = [];

const el = id => document.getElementById(id);
const val = id => (el(id).value || "").trim();
const hide = (id) => el(id).style.display = 'none';
const show = (id, mode='block') => el(id).style.display = mode;

function showError(msg){ const e = el('errorBox'); e.textContent = msg; e.style.display='block'; hide('loadingSpinner'); }
function clearError(){ const e = el('errorBox'); e.textContent=""; e.style.display='none'; }

async function api(action, params={}){
  const qs = new URLSearchParams({ action, ...params, _: Date.now() }).toString();
  const r = await fetch(`${backend_url}?${qs}`);
  return r.json();
}

function optionsFrom(list, placeholder){
  return `<option value="">${placeholder}</option>` + list.map(n => `<option>${escapeHtml(n)}</option>`).join('');
}
function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function updatePortrait(i){
  const name = val(`char${i}`);
  const file = PNG_MAP[(name||"").toLowerCase()] || "";
  const img = el(`charImg${i}`);
  img.src = file ? ("assets/portraits/" + file) : "assets/question.png";
  img.alt = name || "portrait";
}

function resetUI(){
  el('teamSelect').selectedIndex = 0;
  for(let i=1;i<=5;i++){ el(`char${i}`).selectedIndex = 0; updatePortrait(i); }
  const res = el('results'); res.classList.add('muted'); res.innerHTML = "Choose exactly 5 characters to search.";
}

function membersSelected(){
  const m = [];
  for(let i=1;i<=5;i++){ const n = val(`char${i}`); if(n) m.push(n); }
  return m;
}

function renderResults(payload){
  const root = el('results');
  if(!payload.ok){ root.classList.add('muted'); root.textContent = payload.error || "No match found."; return; }
  const { results } = payload;
  if(!results || !results.length){ root.classList.add('muted'); root.textContent = "No match found."; return; }

  root.classList.remove('muted');
  root.innerHTML = "";
  results.slice(0,6).forEach((r,idx) => {
    const grid = document.createElement('div');
    grid.className = 'resultsGrid';
    r.counterTeam.forEach(name => {
      const div = document.createElement('div');
      div.className = 'resultCard';
      const file = PNG_MAP[(name||"").toLowerCase()] || "";
      const src = file ? ("assets/portraits/" + file) : "assets/question.png";
      div.innerHTML = `<div class="nameTag">${escapeHtml(name||"")}</div>
                       <img src="${src}" alt="${escapeHtml(name||'portrait')}" width="108" height="108">`;
      grid.appendChild(div);
    });
    const meta = document.createElement('div');
    meta.className = 'meta';
    const extras = (r.extras || []).filter(Boolean).join(' • ');
    meta.textContent = [
      r.room ? `Room: ${r.room}` : "",
      r.type ? `Type: ${r.type}` : "",
      r.tcpDiff ? `TCP Diff: ${r.tcpDiff}` : "",
      extras
    ].filter(Boolean).join('  |  ');
    root.appendChild(document.createElement('hr'));
    const title = document.createElement('div'); title.className='nameTag'; title.style.margin='6px 0'; title.textContent = `Match #${idx+1}`; root.appendChild(title);
    root.appendChild(grid);
    if (meta.textContent) root.appendChild(meta);
  });
}

async function init(){
  show('loadingSpinner','flex'); clearError();
  try {
    const [pngs, teams, chars] = await Promise.all([
      api('getPNGs'),
      api('getTeams'),
      api('getCharacters')
    ]);
    if(!pngs.ok || !teams.ok || !chars.ok) throw new Error("Backend not OK");
    PNG_MAP = pngs.map || {};
    CHARACTERS = chars.characters || [];
    TEAMS = teams.teams || [];
    el('teamSelect').innerHTML = optionsFrom(TEAMS, '(Optional) Choose a Team');
    const charOpts = optionsFrom(CHARACTERS, 'Choose character');
    for(let i=1;i<=5;i++){ el(`char${i}`).innerHTML = charOpts; el(`char${i}`).addEventListener('change', ()=>updatePortrait(i)); updatePortrait(i); }
    el('teamSelect').addEventListener('change', async ()=>{
      const team = val('teamSelect');
      if(!team){ return; }
      const info = await api('getTeamMembers', { team });
      if(info.ok && info.members){
        info.members.forEach((name,idx) => {
          const sel = el(`char${idx+1}`);
          if (!name) return;
          let i = Array.from(sel.options).findIndex(o => o.value.toLowerCase() === name.toLowerCase());
          if (i < 0) { sel.insertAdjacentHTML('beforeend', `<option>${escapeHtml(name)}</option>`); i = Array.from(sel.options).length-1; }
          sel.selectedIndex = i;
          updatePortrait(idx+1);
        });
      }
    });
    el('resetBtn').addEventListener('click', resetUI);
    el('findCounters').addEventListener('click', async ()=>{
      const M = membersSelected();
      if(M.length !== 5){ renderResults({ok:false, error:"Please select exactly 5 members."}); return; }
      const payload = await api('findCounters', { members: encodeURIComponent(M.join('|')) });
      renderResults(payload);
    });
  } catch(e) {
    console.error(e);
    showError('Failed to load data.');
  } finally {
    hide('loadingSpinner');
  }
}

document.addEventListener('DOMContentLoaded', init);
