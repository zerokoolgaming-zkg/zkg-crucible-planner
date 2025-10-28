const API_URL = "https://script.google.com/macros/s/AKfycbwgqUa14K4cMZVDP7qxg6rqDs17vGKSiWCVJOavIA-D0oC6o2SkhvqwJHuJ4oZdqtE/exec";

const ddWrap=document.getElementById("dropdowns");
const resultEl=document.getElementById("result");
document.getElementById("searchBtn").addEventListener("click",onSearch);
document.getElementById("resetBtn").addEventListener("click",resetUI);

let characters=[];let selects=[];
bootstrap();
async function bootstrap(){lockUI(true);const ok=await loadCharacters();buildDropdowns(ok?characters:[]);lockUI(false);}
function lockUI(l){[...document.querySelectorAll("select,button")].forEach(e=>e.disabled=l);}
function resetUI(){selects.forEach(s=>s.selectedIndex=0);resultEl.innerHTML="";}
async function loadCharacters(){
 try{const r=await fetch(`${API_URL}?action=getcharacters`);
 const d=await r.json();if(!d.ok)throw new Error(d.error||"Load failed");characters=d.characters||[];return true;}
 catch(e){resultEl.innerHTML=`<div class='muted'>Error: ${e.message}</div>`;return false;}
}
function buildDropdowns(list){
 ddWrap.innerHTML="";selects=[];
 for(let i=0;i<5;i++){const s=document.createElement("select");
 const ph=document.createElement("option");ph.value="";ph.textContent=`Team Member ${i+1}`;s.appendChild(ph);
 list.forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;s.appendChild(o);});
 ddWrap.appendChild(s);selects.push(s);}
}
async function onSearch(){
 const team=selects.map(s=>s.value).filter(Boolean);
 if(team.length!==5){resultEl.innerHTML="<div class='muted'>Please select 5 characters.</div>";return;}
 lockUI(true);
 try{const r=await fetch(`${API_URL}?action=findcounters&team=${encodeURIComponent(JSON.stringify(team))}`);
 const d=await r.json();if(!d.ok)throw new Error(d.error||"Lookup failed");renderResult(d.matches||[]);}
 catch(e){resultEl.innerHTML=`<div class='muted'>Error: ${e.message}</div>`;}finally{lockUI(false);}
}
function renderResult(matches){
 if(!matches.length){resultEl.innerHTML="<div class='muted'>No match found.</div>";return;}
 const cards=matches.map((m,i)=>{
  const imgRow=m.counterTeam.map(c=>`<div class='char-slot'><img src='${c.img||""}' alt='${c.name||""}'/><p>${c.name||""}</p></div>`).join('');
  return `<div class='match-card'><h3>Match #${i+1}</h3><div class='grid5'>${imgRow}</div>
  <div class='info'><p><b>Room:</b> ${m.room||'-'}</p><p><b>Punch-up / Down:</b> ${m.punchup||'-'}</p>
  <p><b>TCP Diff:</b> ${m.tcpDiff||'-'}</p><p><b>Combo / Notes:</b> ${m.combo||'-'}</p></div></div>`;
 }).join('');
 resultEl.innerHTML=cards;
}
