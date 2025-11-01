const BACKEND_URL = "https://script.google.com/macros/s/AKfycbxzcmkptsIql7UO2ehqlICzXYhL8biFEVXU3EDIzj25n-iDKdfobgVmRPMFfUWsZe36ew/exec";
const el = id => document.getElementById(id);

function setResultsLoading(on){
  const msg = el('searchingMessage');
  if(on){ msg.textContent='Searching…'; msg.classList.add('pulse'); }
  else { msg.textContent=''; msg.classList.remove('pulse'); }
}

async function fetchJSON(url){
  const res = await fetch(url, { cache:'no-store' });
  return res.json();
}
const api = action => BACKEND_URL + '?action=' + encodeURIComponent(action);

window.addEventListener('DOMContentLoaded', async () => {
  await populateCharacters();
  await populateTeams();
  setupListeners();
});

async function populateCharacters(){
  try {
    const data = await fetchJSON(api('getCharacters'));
    for (let i=1;i<=5;i++) {
      const s = el('char'+i);
      data.forEach(name=>{ const o=document.createElement('option'); o.value=name; o.textContent=name; s.appendChild(o); });
    }
  } catch(err){ console.error('getCharacters failed', err); }
}
async function populateTeams(){
  try {
    const teams = await fetchJSON(api('getTeams'));
    const sel = el('teamSelect');
    teams.forEach(t=>{ const o=document.createElement('option'); o.value=t.name; o.textContent=t.name; sel.appendChild(o); });
  } catch(err){ console.error('getTeams failed', err); }
}

let pngMapCache=null;
async function getPngMap(){
  if(pngMapCache) return pngMapCache;
  const list = await fetchJSON(api('getPNGs'));
  pngMapCache = new Map(list.map(x=>[x.name, x.url]));
  return pngMapCache;
}
async function updateCharacterImage(slot, name){
  const img = el('img'+slot);
  if(!name){ img.src='assets/question.png'; return; }
  const map = await getPngMap();
  img.src = map.get(name) || 'assets/question.png';
}

function fillTeamMembers(members){
  members.slice(0,5).forEach((m,i)=>{ const s=el('char'+(i+1)); s.value=m||''; updateCharacterImage(i+1, m||''); });
  runCounterSearch();
}
el('teamSelect').addEventListener('change', async e=>{
  if(!e.target.value) return;
  const teams=await fetchJSON(api('getTeams'));
  const t=teams.find(x=>x.name===e.target.value);
  if(t) fillTeamMembers(t.members);
});
el('teamSearchBox').addEventListener('input', async e=>{
  const q=e.target.value.trim().toLowerCase(); if(!q) return;
  const teams=await fetchJSON(api('getTeams'));
  const m=teams.find(t=>t.name.toLowerCase().includes(q)); if(m){ el('teamSelect').value=m.name; fillTeamMembers(m.members); }
});

async function runCounterSearch(){
  const chosen=[]; for(let i=1;i<=5;i++){ const v=el('char'+i).value; if(v) chosen.push(v); }
  if(chosen.length===0){ el('resultsContainer').innerHTML=''; return; }
  setResultsLoading(true);
  try {
    const url = BACKEND_URL + '?action=getCounters&chars=' + encodeURIComponent(chosen.join(','));
    const data = await fetchJSON(url);
    renderResults(data || []);
  } catch(err) { console.error('getCounters failed', err); }
  setResultsLoading(false);
}
function setupListeners(){
  for(let i=1;i<=5;i++){
    el('char'+i).addEventListener('change', e=>{ updateCharacterImage(i, e.target.value); runCounterSearch(); });
  }
}

function fmtNum(n){
  if(n===null || n===undefined || n==='') return '';
  const v = typeof n==='number' ? n : (''+n).replace(/,/g,'');
  const num = Number(v); if(Number.isNaN(num)) return n;
  return num.toLocaleString();
}
function signWithColor(diff){
  const raw = (diff ?? '').toString().replace(/,/g,'');
  const num = Number(raw);
  const isPos = num>0; const isNeg = num<0;
  const cls = isPos ? 'positive' : (isNeg ? 'negative' : '');
  const withSign = isPos ? ('+'+fmtNum(num)) : (isNeg ? fmtNum(num) : fmtNum(num));
  return { text: withSign, cls };
}
function renderResults(items){
  const cont = document.getElementById('resultsContainer');
  cont.innerHTML = '';
  if(!items.length){ cont.innerHTML = '<p>No counters found.</p>'; return; }
  items.forEach((team,i)=>{
    const card = document.createElement('div'); card.className='result-card'; card.style.animationDelay = (i*0.18)+'s';
    const row = document.createElement('div'); row.className='team-row';
    (team.members||[]).forEach(m=>{
      const cell=document.createElement('div'); cell.className='char-card';
      const img=new Image(); img.src=m.url || 'assets/question.png'; img.alt=m.name||'';
      const span=document.createElement('span'); span.textContent=m.name||'';
      cell.append(img, span); row.appendChild(cell);
    });
    const hr=document.createElement('hr'); hr.className='result-divider';
    const info=document.createElement('div'); info.className='result-info';
    const diff = signWithColor(team.tcpDiff);
    info.innerHTML = ''
      + '<span class="label">Season:</span> ' + (team.season??'') + ' &nbsp;|&nbsp; '
      + '<span class="label">Room:</span> ' + (team.room??'') + ' &nbsp;|&nbsp; '
      + '<span class="label">Match:</span> ' + (team.punch??'') + ' &nbsp;|&nbsp; '
      + '<span class="label">TCP Team:</span> ' + fmtNum(team.tcpTeam) + ' &nbsp;|&nbsp; '
      + '<span class="label">TCP Counter:</span> ' + fmtNum(team.tcpCounter) + ' &nbsp;|&nbsp; '
      + '<span class="label">TCP Diff:</span> <span class="diff ' + diff.cls + '">' + diff.text + '</span>';
    card.append(row, hr, info);
    cont.appendChild(card);
  });
}
