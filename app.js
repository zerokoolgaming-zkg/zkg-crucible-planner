/* ZKG Planner v4.4-root (with static cache fallback) */
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec";

const FALLBACK = {{
  characters: ["Captain America", "Black Widow", "Iron Man", "Hulk", "Thor"],
  teams: [{{name:"Avengers", members:["Captain America","Iron Man","Thor","Black Widow","Hulk"]}}],
  pngMap: {{"captain america":"https://assets.marvelstrikeforce.com/imgs/Portrait_CaptainAmerica_Speed.png"}}
}};

const teamSelect = document.getElementById("teamSelect");
const charSelects = [...document.querySelectorAll(".charSelect")];
const resultEl = document.getElementById("result");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const banner = document.getElementById("banner");
const retryBtn = document.getElementById("retryBtn");
const spinner = document.getElementById("spinner");

let characters=[], teams=[], pngMap={{}};

retryBtn?.addEventListener("click", init);
init();

async function init(){
  banner.classList.add("hidden");
  spinner.classList.remove("hidden");
  lock(true);
  try{
    await loadAll();
    buildTeamDropdown();
    buildCharacterDropdowns();
    hookPreviewUpdates();
  }catch(e){
    console.error(e);
    banner.classList.remove("hidden");
  }finally{
    spinner.classList.add("hidden"); lock(false);
  }
}

function lock(s){[...document.querySelectorAll("select,button")].forEach(el=>el.disabled=s);}

async function safeJson(url){
  const r = await fetch(url + '&_=' + Date.now());
  if(!r.ok) throw new Error('Network ' + r.status);
  const j = await r.json();
  if(!j || j.ok === false) throw new Error((j && j.error) || 'API error');
  return j;
}

async function loadAll(){
  try {
    await safeJson(`$https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec?action=ping`);
    const [pngs, tms, chars] = await Promise.all([
      safeJson(`$https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec?action=getpngmap`),
      safeJson(`$https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec?action=getteams`),
      safeJson(`$https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec?action=getcharacters`)
    ]);
    pngMap = normalizePngMap(pngs.map || {});
    teams  = (tms.teams || []).map(t => ({ name: t.team || t.name, members: t.members || [] }));
    characters = chars.characters || [];
  } catch (e) {
    console.warn("[ZKG] Backend unavailable, using fallback.", e.message);
    pngMap = normalizePngMap(FALLBACK.pngMap);
    teams = FALLBACK.teams;
    characters = FALLBACK.characters;
  }
}

function normalizePngMap(raw){
  const m = {}; Object.keys(raw||{}).forEach(k => m[norm(k)] = raw[k]); return m;
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

function buildTeamDropdown(){
  teamSelect.innerHTML = `<option value="">(Optional) Choose a Team</option>` +
    teams.map(t=>`<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join("");
  teamSelect.addEventListener("change", () => {
    const t = teams.find(x => x.name === teamSelect.value);
    if(!t) return;
    t.members.slice(0,5).forEach((m,i)=>{
      if(charSelects[i]){ charSelects[i].value = m; updatePreviewForSelect(charSelects[i]); }
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
  if(team.length!==5){ resultEl.classList.add('muted'); resultEl.textContent = "Please select exactly 5 characters."; return; }
  resultEl.classList.remove('muted'); resultEl.textContent = "Searching…";
  try{
    const r = await safeJson(`$https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec?action=findcounters&team=${encodeURIComponent(JSON.stringify(team))}`);
    if(!r.matches || !r.matches.length){
      resultEl.classList.add('muted'); resultEl.textContent = "No 5-character team match found."; return;
    }
    resultEl.innerHTML = r.matches.map((m,i)=>{
      const row = (m.counterTeam||[]).map(c=>`
        <div>
          <div class="result-name">${escapeHtml(c.name||'')}</div>
          <div class="preview">
            <img src="${escapeHtml(imgFor(c.name)||'')}" alt="${escapeHtml(c.name||'')}" style="display:${imgFor(c.name)?'block':'none'}"/>
            <div class="missing-ph" style="display:${imgFor(c.name)?'none':'flex'}">?</div>
          </div>
        </div>`).join('');
      return `<div class="match-card"><h3>Match #${i+1}</h3><div class="result-row">${row}</div></div>`;
    }).join('');
  }catch(e){
    resultEl.classList.add('muted'); resultEl.textContent = "Error: "+e.message;
  }
}

function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
