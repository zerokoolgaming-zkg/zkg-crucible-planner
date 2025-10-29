const API_URL = window.API_URL; const PASSWORD="Jujub1234!";
const pwd=document.getElementById('pwd'), loginBtn=document.getElementById('loginBtn'), msg=document.getElementById('loginMsg');
const panel=document.getElementById('panel'), refreshBtn=document.getElementById('refreshBtn'), statusEl=document.getElementById('status');
loginBtn.addEventListener('click',()=>{ if(pwd.value===PASSWORD){ msg.textContent='Logged in.'; panel.style.display='block'; } else { msg.textContent='Invalid password.'; }});
refreshBtn.addEventListener('click', async ()=>{ statusEl.textContent='Refreshing…'; try{ const r=await fetch(`${API_URL}?action=admin_refreshcache&password=${encodeURIComponent(PASSWORD)}`); const d=await r.json(); statusEl.textContent = d.ok?`Cache refreshed at ${d.refreshed}.`:`Error: ${d.error||'unknown'}`;}catch(e){ statusEl.textContent='Network error: '+e.message; }});
