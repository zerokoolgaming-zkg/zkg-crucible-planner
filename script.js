/**
 * ==========================================================
 * ZKG CRUCIBLE COUNTER LIST (Frontend Script) v4.3
 * Auto Search + Animated Loading + PNG & Team Integration
 * ==========================================================
 */

const searchingMsg = document.getElementById("searchingMessage");
const teamSelect = document.getElementById("teamSelect");
const charSelects = [...document.querySelectorAll(".charSelect")];
const imgRow = document.getElementById("imageRow");
const resultsDiv = document.getElementById("resultsContainer");

let pngMap = {};
let teams = [];
let chars = [];

/** INIT **/
window.onload = async () => {
  await loadPNGs();
  await loadCharacters();
  await loadTeams();
  initDropdowns();
  showMessage("Select 5 characters or a team to begin.", "#66ccff");
};

/** FETCH HELPERS **/
async function getData(endpoint) {
  const res = await fetch(`${backend_url}?action=${endpoint}`);
  return await res.json();
}

/** LOAD DATA **/
async function loadPNGs() {
  const data = await getData("pngs");
  pngMap = data.pngMap || {};
}
async function loadCharacters() {
  const data = await getData("characters");
  chars = data.characters || [];
}
async function loadTeams() {
  const data = await getData("teams");
  teams = data.teams || [];
}

/** INIT DROPDOWNS **/
function initDropdowns() {
  teamSelect.innerHTML = `<option value="">Select Team (Optional)</option>` +
    teams.map(t => `<option value="${t.team}">${t.team}</option>`).join("");
  charSelects.forEach(sel => {
    sel.innerHTML = `<option value="">Select Character</option>` +
      chars.map(c => `<option value="${c}">${c}</option>`).join("");
    sel.addEventListener("change", onCharChange);
  });
  teamSelect.addEventListener("change", onTeamSelect);
}

/** TEAM SELECTION **/
function onTeamSelect() {
  const teamName = teamSelect.value;
  if (!teamName) return;
  const team = teams.find(t => t.team === teamName);
  if (team) {
    charSelects.forEach((sel, i) => {
      sel.value = team.members[i] || "";
    });
    triggerSearch();
  }
}

/** CHARACTER SELECTION **/
function onCharChange() {
  triggerSearch();
}

/** TRIGGER SEARCH **/
let searchTimeout;
function triggerSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchCounters();
  }, 400);
}

/** SEARCH COUNTERS **/
async function searchCounters() {
  const selected = charSelects.map(sel => sel.value).filter(Boolean);
  imgRow.innerHTML = "";
  resultsDiv.innerHTML = "";

  if (selected.length < 5) {
    showMessage("Please select 5 characters.", "#66ccff");
    return;
  }

  showMessage("Searching counters…", "#66ccff", true);
  await showCharacterImages(selected);

  const key = selected.join("|");
  const res = await fetch(`${backend_url}?action=counters&team=${encodeURIComponent(key)}`);
  const data = await res.json();
  showResults(data.counters || []);
}

/** DISPLAY RESULTS **/
function showResults(results) {
  if (!results.length) {
    showMessage("No counters found.", "#ff6666");
    return;
  }

  searchingMsg.innerHTML = "";
  resultsDiv.innerHTML = results.map(r => `
    <div class="result-card">
      <div class="team-row">
        ${r.counter.map(c => `
          <div class="char-card">
            <img src="${pngMap[c.toLowerCase()] || PORTRAIT_BASE + 'question.png'}">
            <span>${c}</span>
          </div>`).join("")}
      </div>
      <p class="meta">
        Room: ${r.info.room || "-"} | Type: ${r.info.type || "-"} | TCP: ${r.info.tcp || "-"}
      </p>
      ${r.info.extras ? `<p class="extras">${r.info.extras}</p>` : ""}
    </div>
  `).join("");
}

/** CHARACTER IMAGES **/
async function showCharacterImages(selected) {
  imgRow.innerHTML = selected.map(name => `
    <div class="char-slot">
      <img src="${pngMap[name.toLowerCase()] || PORTRAIT_BASE + 'question.png'}">
      <p>${name}</p>
    </div>
  `).join("");
}

/** MESSAGE DISPLAY **/
function showMessage(msg, color, pulse = false) {
  searchingMsg.style.color = color;
  searchingMsg.innerHTML = msg;
  if (pulse) searchingMsg.classList.add("pulse");
  else searchingMsg.classList.remove("pulse");
}
