
/* ZKG v4.6A */
const API_URL = window.API_URL;

const teamSelect = document.getElementById("teamSelect");
const seasonSelect = document.getElementById("seasonSelect");
const roomSelect = document.getElementById("roomSelect");
const charSelects = [...document.querySelectorAll(".charSelect")];
const resultEl = document.getElementById("result");
const resetBtn = document.getElementById("resetBtn");

let characters = [], teams = [], pngMap = {};

init();

async function init(){
  lock(true);
  await loadAll();
  await loadSeasonRoomData();
  buildTeamDropdown();
  buildCharacterDropdowns();
  hookPreviewUpdates();
  lock(false);
}

function lock(s){[...document.querySelectorAll("select,button")].forEach(el=>el.disabled=s);}

async function loadAll(){
  const [chars, tms, pngs] = await Promise.all([
    fetch(`${API_URL}?action=getCharacters`).then(r=>r.json()).catch(()=>({ok:false})),
    fetch(`${API_URL}?action=getTeams`).then(r=>r.json()).catch(()=>({ok:false})),
    fetch(`${API_URL}?action=getPNGs`).then(r=>r.json()).catch(()=>({ok:false}))
  ]);
  if(chars.ok) characters = chars.characters||[];
  if(tms.ok) teams = tms.teams||[];
  if(pngs.ok) pngMap = pngs.map||{};
}

async function loadSeasonRoomData(){
  try{
    const res = await fetch(`${API_URL}?action=getSeasonRoomData`);
    const d = await res.json();
    if(!d.ok) return;
    seasonSelect.innerHTML = ['<option value=\"\">Choose Season</option>']
      .concat((d.seasons||[]).map(s=>`<option value=\"${escapeHtml(s)}\">${escapeHtml(s)}</option>`)).join('');
    roomSelect.innerHTML = ['<option value=\"\">Choose Room</option>']
      .concat((d.rooms||[]).map(x=>`<option value=\"${escapeHtml(x)}\">${escapeHtml(x)}</option>`)).join('');
  }catch(e){}
}

function buildTeamDropdown(){
  teamSelect.innerHTML = `<option value=\"\">(Optional) Choose a Team</option>` +
    teams.map(t=>`<option value=\"${escapeHtml(t)}\">${escapeHtml(t)}</option>`).join("");
  teamSelect.addEventListener("change", async () => {
    const val = teamSelect.value; if(!val) return;
    try{
      const r = await fetch(`${API_URL}?action=getTeamMembers&team=${encodeURIComponent(val)}`);
      const d = await r.json();
      if(d.ok){
        (d.members||[]).slice(0,5).forEach((m,i)=>{
          if(charSelects[i]){ charSelects[i].value = m; updatePreviewForSelect(charSelects[i]); }
        });
        maybeAutoSearch();
      }
    }catch(e){}
  });
}

function buildCharacterDropdowns(){
  const opts = `<option value=\"\">Choose character</option>` +
    characters.map(n=>`<option value=\"${escapeHtml(n)}\">${escapeHtml(n)}</option>`).join("");
  charSelects.forEach(sel=> sel.innerHTML = opts);
}

function hookPreviewUpdates(){
  charSelects.forEach(sel => sel.addEventListener("change", ev => { updatePreviewForSelect(ev.target); maybeAutoSearch(); }));
  seasonSelect.addEventListener('change', maybeAutoSearch);
  roomSelect.addEventListener('change', maybeAutoSearch);
  charSelects.forEach(sel => updatePreviewForSelect(sel));
  resetBtn.addEventListener("click", resetUI);
}

function norm(s){
  return (s||'').toLowerCase()
    .replace(/_/g,' ')
    .replace(/\u00A0/g,' ')
    .replace(/[\\u200B-\\u200D\\uFEFF]/g,'')
    .replace(/[’‘`]/g,\"'\")
    .replace(/[(){}\\[\\].,;:!?/\\\\\\-–—\\\"“”‘’]/g,'')
    .replace(/\\s+/g,' ')
    .trim();
}
function imgFor(name){ return pngMap[norm(name)] || \"\"; }

function updatePreviewForSelect(sel){
  const col = sel.closest('.col');
  const imgEl = col.querySelector('.preview img');
  const ph = col.querySelector('.preview .missing-ph');
  const url = imgFor(sel.value);
  if(url){ imgEl.src = url; imgEl.style.display='block'; ph.style.display='none'; }
  else { imgEl.removeAttribute('src'); imgEl.style.display='none'; ph.style.display='flex'; }
}

function resetUI(){
  teamSelect.value = seasonSelect.value = roomSelect.value = \"\";
  charSelects.forEach(s=>{ s.selectedIndex=0; updatePreviewForSelect(s); });
  resultEl.classList.add('muted'); resultEl.classList.remove('searching');
  resultEl.textContent = \"Choose exactly 5 characters to search.\";
}

function maybeAutoSearch(){
  const team = charSelects.map(s=>s.value).filter(Boolean);
  if(team.length===5) onSearch();
}

async function onSearch(){
  const members = charSelects.map(s=>s.value).filter(Boolean);
  if(members.length!==5){
    resultEl.classList.add('muted'); resultEl.textContent = \"Please select exactly 5 characters.\"; return;
  }
  resultEl.classList.remove('muted'); resultEl.classList.add('searching'); resultEl.textContent = \"Searching...\";

  const qs = new URLSearchParams({
    action:'findCounters',
    members: encodeURIComponent(members.join('|')),
    season: seasonSelect.value || '',
    room: roomSelect.value || ''
  });
  try{
    const r = await fetch(`${API_URL}?${qs.toString()}`);
    const d = await r.json();
    resultEl.classList.remove('searching');
    if(!d.ok || !d.results || !d.results.length){
      resultEl.classList.add('muted'); resultEl.textContent = \"No 5-character team match found.\"; return;
    }
    resultEl.innerHTML = d.results.map((m,i)=>{
      const tiles = (m.counterTeam||[]).map(n=>{
        const url = imgFor(n);
        return `<div class=\"char-tile\"><div class=\"nm\">${escapeHtml(n)}</div>` +
               (url?`<img src=\"${escapeHtml(url)}\"/>`:`<div class=\"missing-ph\">?</div>`) + `</div>`;
      }).join('');
      const punch = (m.meta && (m.meta.punchType||'')).toLowerCase();
      const diffClass = punch.includes('down') ? 'tcp-down' : 'tcp-up';
      const info = m.meta ? `<div class=\"counter-info\">
        <span><strong>Season:</strong> ${escapeHtml(m.meta.season||'')}</span>
        <span><strong>Room:</strong> ${escapeHtml(m.meta.room||'')}</span>
        <span><strong>Type:</strong> ${escapeHtml(m.meta.punchType||'')}</span>
        <span><strong>TCP Team:</strong> ${escapeHtml(m.meta.tcpTeam||'')}</span>
        <span><strong>TCP Counter:</strong> ${escapeHtml(m.meta.tcpCounter||'')}</span>
        <span><strong>TCP Diff:</strong> <span class=\"${diffClass}\">${escapeHtml(m.meta.tcpDiff||'')}</span></span>
        <span><strong>Victory Points:</strong> ${escapeHtml(m.meta.victoryPoints||'')}</span>
        <span><strong>Sac First With:</strong> ${escapeHtml(m.meta.sacFirstWith||'')}</span>
      </div>` : '';
      return `<div class=\"match-card\"><h3>Match #${i+1}</h3><div class=\"characterRow\">${tiles}</div>${info}</div>`;
    }).join('');
  }catch(e){
    resultEl.classList.remove('searching'); resultEl.classList.add('muted');
    resultEl.textContent = \"Error: \"+e.message;
  }
}

function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
