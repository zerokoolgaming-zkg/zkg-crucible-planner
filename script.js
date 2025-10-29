/* ZKG v4.1 */
const API_URL = window.API_URL;

const teamSelect = document.getElementById("teamSelect");
const charSelects = [...document.querySelectorAll(".charSelect")];
const resultEl = document.getElementById("result");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

let characters=[], teams=[], pngMap={};

init();

async function init(){
  lock(true);
  await loadAll();
  buildTeamDropdown();
  buildCharacterDropdowns();
  hookPreviewUpdates();
  lock(false);
}

function lock(s){[...document.querySelectorAll("select,button")].forEach(el=>el.disabled=s);}

async function loadAll(){
  const [chars, tms, pngs] = await Promise.all([
    fetch(`${API_URL}?action=getcharacters`).then(r=>r.json()).catch(()=>({ok:false})),
    fetch(`${API_URL}?action=getteams`).then(r=>r.json()).catch(()=>({ok:false})),
    fetch(`${API_URL}?action=getpngmap`).then(r=>r.json()).catch(()=>({ok:false}))
  ]);
  if(chars.ok) characters = chars.characters||[];
  if(tms.ok) teams = (tms.teams||[]).map(t=> t.team ? {name:t.team, members:t.members||[]} : t );
  if(pngs.ok) pngMap = pngs.map||{};
}

function buildTeamDropdown(){
  teamSelect.innerHTML = `<option value="">(Optional) Choose a Team</option>` +
    teams.map(t=>`<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join("");
  teamSelect.addEventListener("change", () => {
    const t = teams.find(x => x.name === teamSelect.value);
    if(!t) return;
    t.members.slice(0,5).forEach((m,i)=>{
      if(charSelects[i]){
        charSelects[i].value = m;
        updatePreviewForSelect(charSelects[i]);
      }
    });
  });
}

function buildCharacterDropdowns(){
  const opts = `<option value="">Choose character</option>` +
    characters.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  charSelects.forEach(sel=> sel.innerHTML = opts);
}

function hookPreviewUpdates(){
  charSelects.forEach(sel => sel.addEventListener("change", ev => updatePreviewForSelect(ev.target)));
  charSelects.forEach(sel => updatePreviewForSelect(sel));
  searchBtn.addEventListener("click", onSearch);
  resetBtn.addEventListener("click", resetUI);
}

function norm(s){
  return (s||'').toLowerCase()
    .replace(/_/g,' ')
    .replace(/\u00A0/g,' ')
    .replace(/[\u200B-\u200D\uFEFF]/g,'')
    .replace(/[’‘`]/g,"'")
    .replace(/[(){}\[\].,;:!?/\\\-–—\"“”‘’]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function imgFor(name){ return pngMap[norm(name)] || ""; }

function updatePreviewForSelect(sel){
  const slot = sel.closest(".dropdown-block");
  const imgEl = slot.querySelector(".preview img");
  const ph = slot.querySelector(".preview .missing-ph");
  const url = imgFor(sel.value);
  if(url){ imgEl.src = url; imgEl.style.display='block'; ph.style.display='none'; }
  else { imgEl.removeAttribute('src'); imgEl.style.display='none'; ph.style.display='flex'; }
}

function resetUI(){
  teamSelect.value = "";
  charSelects.forEach(s=>{ s.selectedIndex=0; updatePreviewForSelect(s); });
  resultEl.classList.add('muted'); resultEl.textContent = "Choose exactly 5 characters to search.";
}

async function onSearch(){
  const team = charSelects.map(s=>s.value).filter(Boolean);
  if(team.length!==5){
    resultEl.classList.add('muted'); resultEl.textContent = "Please select exactly 5 characters.";
    return;
  }
  resultEl.classList.remove('muted'); resultEl.textContent = "Searching…";
  try{
    const r = await fetch(`${API_URL}?action=findcounters&team=${encodeURIComponent(JSON.stringify(team))}`);
    const d = await r.json();
    if(!d.ok || !d.matches || !d.matches.length){
      resultEl.classList.add('muted'); resultEl.textContent = "No 5-character team match found.";
      return;
    }
    resultEl.innerHTML = d.matches.map((m,i)=>{
      const row = (m.counterTeam||[]).map(c=>`
        <div class="dropdown-block" style="min-width:140px">
          <div class="preview"><img src="${escapeHtml(c.img||'')}" alt="${escapeHtml(c.name||'')}" style="display:${c.img?'block':'none'}"/><div class="missing-ph" style="display:${c.img?'none':'flex'}">?</div></div>
          <div style="text-align:center;margin-top:6px">${escapeHtml(c.name||'')}</div>
        </div>
      `).join('');
      return `<div class="match-card"><h3>Match #${i+1}</h3><div id="characterRow">${row}</div></div>`;
    }).join('');
  }catch(e){
    resultEl.classList.add('muted'); resultEl.textContent = "Error: "+e.message;
  }
}

function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
