/** ===========================================================
 * ZKG Crucible Planner v4.5 - Apps Script Backend
 * Tabs expected:
 *  - List of Characters: Column A (names)
 *  - Team List: Column A team, B–F members
 *  - PNG files: Column A name, B url
 *  - Counter: A–E attacker names, K season, L room, M match, N tcpTeam, O tcpCounter, P tcpDiff
 * =========================================================== */
function _normalize(s){
  return (s||'').toString().trim().toLowerCase()
    .replace(/[_\u00A0\u200B-\u200D\uFEFF]/g,' ')
    .replace(/[’‘`]/g,"'")
    .replace(/[(){}\[\].,;:!?/\\\-–—"“”‘’]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function _key(arr){ return arr.map(_normalize).filter(Boolean).sort().join('|'); }
function _json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet(e){
  var a=(e.parameter.action||'').toLowerCase();
  if(a==='getcharacters') return _json(getCharacters_());
  if(a==='getteams')      return _json(getTeams_());
  if(a==='getpngs')       return _json(getPNGs_());
  if(a==='getcounters')   return _json(getCounters_(e.parameter.chars||''));
  if(a==='ping')          return _json({ok:true,msg:'API online'});
  return _json({ok:false,error:'Unknown action'});
}
function _sh(name){ return SpreadsheetApp.getActive().getSheetByName(name); }
function getCharacters_(){
  var sh=_sh('List of Characters'); if(!sh) return [];
  var last=sh.getLastRow(); if(last<2) return [];
  return sh.getRange(2,1,last-1,1).getValues().map(function(r){ return (r[0]||'').toString().trim(); }).filter(String);
}
function getTeams_(){
  var sh=_sh('Team List'); if(!sh) return [];
  var last=sh.getLastRow(); if(last<2) return [];
  var vals=sh.getRange(2,1,last-1,6).getValues();
  return vals.map(function(r){
    return { name:(r[0]||'').toString().trim(), members:[r[1],r[2],r[3],r[4],r[5]].map(function(x){return (x||'').toString().trim();}).filter(String) };
  }).filter(function(t){ return t.name; });
}
function getPNGs_(){
  var sh=_sh('PNG files'); if(!sh) return [];
  var last=sh.getLastRow(); if(last<2) return [];
  var vals=sh.getRange(2,1,last-1,2).getValues();
  return vals.map(function(r){ return {name:(r[0]||'').toString().trim(), url:(r[1]||'').toString().trim()}; }).filter(function(x){return x.name;});
}
function getCounters_(charsCsv){
  var sel=charsCsv.split(',').map(function(s){return s.trim();}).filter(String);
  if(!sel.length) return [];
  var keySel=_key(sel);
  var sh=_sh('Counter'); if(!sh) return [];
  var last=sh.getLastRow(); if(last<2) return [];
  var vals=sh.getRange(2,1,last-1,16).getValues(); // A..P
  var pngList=getPNGs_(), pngMap={};
  pngList.forEach(function(x){ pngMap[_normalize(x.name)] = x.url; });
  var out=[];
  for(var i=0;i<vals.length;i++){
    var r=vals[i];
    var atk=[r[0],r[1],r[2],r[3],r[4]].map(function(x){return (x||'').toString().trim();});
    var keyAtk=_key(atk);
    if(keyAtk!==keySel) continue;
    var season=r[10], room=r[11], punch=r[12], tcpTeam=r[13], tcpCounter=r[14], tcpDiff=r[15];
    var members=atk.map(function(n){ return { name:n, url:(pngMap[_normalize(n)]||'') }; });
    out.push({ members:members, season:season, room:room, punch:punch, tcpTeam:tcpTeam, tcpCounter:tcpCounter, tcpDiff:tcpDiff });
  }
  return out;
}
