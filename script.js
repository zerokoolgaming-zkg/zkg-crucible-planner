/* ZKG Crucible Planner — live-backend build */
let PNG_MAP = {}, CHARACTERS = [], TEAMS = [];

const liveEl = document.getElementById("live");
const liveText = document.getElementById("liveText");

async function fetchJSON(action){
  const r = await fetch(`${backend_url}?action=${action}&_=${Date.now()}`);
  return r.json();
}

function setLive(ok){
  if(!liveEl) return;
  liveEl.classList.toggle('online', !!ok);
  liveEl.classList.toggle('offline', !ok);
  if (liveText) liveText.textContent = ok ? 'Live' : 'Offline';
}

async function init(){
  try{
    setLive(false);
    const ping = await fetchJSON('ping');
    setLive(!!(ping && ping.ok));
  }catch{ setLive(false); }

  showLoading(true);
  try{
    const [t, c, p] = await Promise.all([
      fetchJSON('getTeams'),
      fetchJSON('getCharacters'),
      fetchJSON('getPngMap')
    ]);
    if(!t.ok || !c.ok || !p.ok) throw new Error('Backend returned not ok');
    TEAMS = t.teams || t.data || [];
    CHARACTERS = c.characters || c.data || [];
    PNG_MAP = p.pngMap || p.map || {};
    populate();
    hookEvents();
    showLoading(false);
  }catch(e){
    showError('Failed to load data.'); console.error(e);
  }
}

function populate(){
  const teamSel = document.getElementById('teamSelect');
  teamSel.innerHTML = `<option value="">(Optional) Choose a Team</option>` + TEAMS.map(n=>`<option>${escapeHtml(n)}</option>`).join('');

  const options = `<option value="">Choose character</option>` + CHARACTERS.map(n=>`<option>${escapeHtml(n)}</option>`).join('');
  for(let i=1;i<=5;i++){
    const sel = document.getElementById(`char${i}`);
    sel.innerHTML = options;
  }
}

function hookEvents(){
  document.getElementById('teamSelect').addEventListener('change', e => {
    const teamName = e.target.value;
    // Optional: team autofill may be added via another endpoint
  });
  for(let i=1;i<=5;i++){
    const sel = document.getElementById(`char${i}`);
    sel.addEventListener('change', () => updatePortrait(i));
  }
  document.getElementById('resetBtn').addEventListener('click', resetUI);
}

function updatePortrait(i){
  const sel = document.getElementById(`char${i}`);
  const img = document.getElementById(`charImg${i}`);
  const name = (sel.value||'').trim();
  const url = PNG_MAP[name] || PNG_MAP[name.toLowerCase()] || '';
  if(url){ img.src = url; img.style.display='block'; }
  else { img.src = 'assets/question.png'; img.style.display='block'; }
}

function resetUI(){
  document.getElementById('teamSelect').selectedIndex = 0;
  for(let i=1;i<=5;i++){
    const sel = document.getElementById(`char${i}`);
    sel.selectedIndex = 0;
    const img = document.getElementById(`charImg${i}`);
    img.src = 'assets/question.png';
  }
  const res = document.getElementById('results');
  res.classList.add('muted');
  res.textContent = 'Choose exactly 5 characters to search.';
}

function showLoading(flag){
  const s = document.getElementById('loadingSpinner'); if(s) s.style.display = flag ? 'flex':'none';
  const e = document.getElementById('errorBox'); if(e && flag) e.style.display='none';
}

function showError(msg){
  const e = document.getElementById('errorBox');
  if(e){ e.textContent = msg; e.style.display='block'; }
  showLoading(false);
}

function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

document.addEventListener('DOMContentLoaded', init);
