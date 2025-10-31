/** ZKG Crucible Planner Backend v4.2 */
const SHEET_TEAM_LIST = 'Team List';
const SHEET_CHAR_LIST = 'List of Characters';
const SHEET_PNGS = 'PNG files';
const SHEET_COUNTER = 'Counter';

function _normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/[(){}\[\].,;:!?/\\\-–—"“”‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function _key(arr) {
  const cleaned = (arr || []).map(_normalize).filter(Boolean);
  const uniq = Array.from(new Set(cleaned));
  uniq.sort(); return uniq.join('|');
}
function _open() { return SpreadsheetApp.getActiveSpreadsheet(); }
function _json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    switch (action) {
      case 'ping': return _json({ ok:true, now: new Date().toISOString() });
      case 'getPNGs': return _getPNGs();
      case 'getTeams': return _getTeams();
      case 'getCharacters': return _getCharacters();
      case 'getTeamMembers': return _getTeamMembers(e);
      case 'findCounters': return _findCounters(e);
      default: return _json({ ok:false, error:'Unknown action' });
    }
  } catch (err) { return _json({ ok:false, error: String(err && err.stack || err) }); }
}

function _getPNGs(){
  const sh = _open().getSheetByName(SHEET_PNGS);
  if (!sh) return _json({ ok:false, error:'PNG files tab missing' });
  const last = sh.getLastRow(); if (last < 2) return _json({ ok:true, map:{} });
  const vals = sh.getRange(2,1,last-1,2).getValues();
  const map = {};
  vals.forEach(([name,file]) => {
    if (!name || !file) return;
    map[_normalize(name)] = String(file).trim();
  });
  return _json({ ok:true, map });
}
function _getTeams(){
  const sh = _open().getSheetByName(SHEET_TEAM_LIST);
  if (!sh) return _json({ ok:false, error:'Team List tab missing' });
  const last = sh.getLastRow(); if (last < 2) return _json({ ok:true, teams: [] });
  const vals = sh.getRange(2,1,last-1,1).getValues().map(r => r[0]).filter(Boolean);
  return _json({ ok:true, teams: vals });
}
function _getCharacters(){
  const sh = _open().getSheetByName(SHEET_CHAR_LIST);
  if (!sh) return _json({ ok:false, error:'List of Characters tab missing' });
  const last = sh.getLastRow(); if (last < 2) return _json({ ok:true, characters: [] });
  const vals = sh.getRange(2,1,last-1,1).getValues().map(r => r[0]).filter(Boolean);
  return _json({ ok:true, characters: vals });
}
function _getTeamMembers(e){
  const team = (e.parameter.team || '').trim();
  if (!team) return _json({ ok:false, error:'Missing team' });
  const sh = _open().getSheetByName(SHEET_TEAM_LIST);
  if (!sh) return _json({ ok:false, error:'Team List tab missing' });
  const last = sh.getLastRow(); if (last < 2) return _json({ ok:false, error:'No teams' });
  const vals = sh.getRange(2,1,last-1,6).getValues();
  for (let i=0;i<vals.length;i++){
    const [t,b,c,d,e2,f] = vals[i];
    if (String(t).trim().toLowerCase() === team.toLowerCase()){
      const members = [b,c,d,e2,f].map(x => (x||'').toString().trim()).filter(Boolean);
      return _json({ ok:true, team: t, members });
    }
  }
  return _json({ ok:false, error:'Team not found' });
}
function _findCounters(e){
  const members = decodeURIComponent(e.parameter.members || '').split('|').map(s => s.trim()).filter(Boolean);
  if (members.length !== 5) return _json({ ok:false, error:'Provide exactly 5 members' });
  const targetKey = _key(members);

  const sh = _open().getSheetByName(SHEET_COUNTER);
  if (!sh) return _json({ ok:false, error:'Counter tab missing' });
  const last = sh.getLastRow(); if (last < 2) return _json({ ok:false, error:'No counter data' });

  const width = sh.getLastColumn();
  const vals = sh.getRange(2,1,last-1,width).getValues();
  const results = [];

  for (let i=0;i<vals.length;i++){
    const row = vals[i];
    const key = _key(row.slice(0,5)); // A-E
    if (key !== targetKey) continue;
    const counterTeam = row.slice(5,10).map(x => (x||'').toString().trim()).filter(Boolean); // F-J
    const room = row[10] || '';  // K
    const type = row[11] || '';  // L
    const tcpDiff = row[12] || ''; // M
    const extras = [];
    for (let c = 14; c < width; c++){ // O+
      const v = row[c];
      if (v != null && String(v).trim() !== '') extras.push(String(v));
    }
    results.push({ counterTeam, room, type, tcpDiff, extras });
  }
  if (!results.length) return _json({ ok:false, error:'No match found' });
  return _json({ ok:true, results });
}
