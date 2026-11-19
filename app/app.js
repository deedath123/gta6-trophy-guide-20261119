/* Leonida Trophy Guide & Tracker — loads app/data/trophies.json, renders the
   checklist, saves progress to localStorage, and offers export / import. */
const STORE_KEY = 'leonida-trophy-tracker-v1';
const THEME_KEY = 'leonida-trophy-theme';
const SPOILER_KEY = 'leonida-trophy-spoiler';

const SESSIONS = [
  { title: 'Session 1 — Prologue & Chapter 1', text: 'Gone Fishing, then Chapter 1. Do the Chapter 1 meditation (Positive Mental Attitude) before the chapter ends.', ids: [2, 3, 28] },
  { title: 'Session 2 — Chapter 2', text: 'Chapter 2 with Jason & Lucia together. Start the duo trophies and stranger strands.', ids: [4, 33, 34] },
  { title: 'Session 3 — Chapter 3', text: 'Chapter 3. Robberies open: armored trucks, gang operations, jewelry stores.', ids: [5, 41, 43, 39] },
  { title: 'Session 4 — Chapter 4 & finale', text: 'Chapter 4, then the final mission (gold). Save before the finale.', ids: [6, 7, 40] },
  { title: 'Session 5 — Stranger strands', text: 'Finish all 8 stranger strands (Andy, Kenton, Billy, Randy, Tyrone + 3 more).', ids: [22, 23, 24, 26, 27, 25] },
  { title: 'Session 6 — Activities', text: 'Shooting Range gold (42), 250 stunts, 20 races, 14 drone wins, fishing, arcade, bowling, 50 challenges.', ids: [17, 15, 19, 18, 20, 21, 46, 32] },
  { title: 'Session 7 — Collectibles & exploration', text: '3 card sets, 100 WAiNK It spots, 100 vehicles, all 52 areas, 8 garages, 10 Scooter Bros registrations, 18 meditations.', ids: [30, 31, 35, 42, 54, 55, 28] },
  { title: 'Session 8 — Money & clean-up', text: 'Launder $250,000 in marked bills, spend $100,000, finish the 100% checklist (A Long Road) and sweep the rest.', ids: [52, 53, 14, 1] },
];

let trophies = [];
let earned = new Set(loadStored());
let filter = 'all';
let query = '';

function loadStored() {
  try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : []; }
  catch (e) { return []; }
}
function saveStored() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b))); } catch (e) { /* storage unavailable */ }
}
function gradeLabel(t) { return t.grade.charAt(0).toUpperCase() + t.grade.slice(1); }
function isSpoilerHidden(t) {
  return document.getElementById('spoiler').checked && t.hidden && !earned.has(t.id);
}
function trophyMatches(t) {
  if (filter === 'story') { if (t.kind !== 'story') return false; }
  else if (filter === 'missable') { if (!t.missable) return false; }
  else if (filter === 'collectibles') { if (t.kind !== 'collectibles') return false; }
  else if (filter === 'activities') { if (t.kind !== 'activities') return false; }
  else if (filter === 'online') { return false; }
  else if (['platinum', 'gold', 'silver', 'bronze'].includes(filter)) { if (t.grade !== filter) return false; }
  if (document.getElementById('hideEarned').checked && earned.has(t.id)) return false;
  if (document.getElementById('unearnedOnly').checked && earned.has(t.id)) return false;
  if (query) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}
function renderProgress() {
  const total = trophies.length || 55;
  const done = trophies.filter(t => earned.has(t.id)).length;
  document.getElementById('count').textContent = done + ' / ' + total;
  document.getElementById('pct').textContent = Math.round(done / total * 100) + '%';
  document.getElementById('bar').style.width = (done / total * 100) + '%';
  const gradeIds = { platinum: 'plat', gold: 'gold', silver: 'silver', bronze: 'bronze' };
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const inGrade = trophies.filter(t => t.grade === g);
    const got = inGrade.filter(t => earned.has(t.id)).length;
    document.getElementById('c-' + gradeIds[g]).textContent = got + '/' + inGrade.length;
  }
  renderNextUp();
}
function renderNextUp() {
  const box = document.getElementById('nextup');
  // The platinum is earned last, so it is never "next up" on its own.
  const next = trophies.find(t => t.grade !== 'platinum' && !earned.has(t.id));
  if (!next) { box.innerHTML = '<b>Platinum earned — Vice Got a Price! is yours. Leonida Legend.</b>'; return; }
  const session = SESSIONS.find(s => s.ids.includes(next.id));
  box.innerHTML = '<b>Next up: ' + escapeHtml(next.name) + '</b> (' + gradeLabel(next) + ') — ' + escapeHtml(next.description) + (session ? '<br><span>' + escapeHtml(session.title) + '</span>' : '');
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function renderRoadmap() {
  const host = document.getElementById('roadmap');
  host.innerHTML = SESSIONS.map(s => {
    const done = s.ids.filter(id => earned.has(id)).length;
    const names = s.ids.map(id => { const t = trophies.find(x => x.id === id); return t ? t.name : ''; }).filter(Boolean);
    return '<div class="session"><h4>' + escapeHtml(s.title) + ' — ' + done + '/' + s.ids.length + ' done</h4><p>' + escapeHtml(s.text) + '</p><p><b>Trophies:</b> ' + escapeHtml(names.join(' · ')) + '</p></div>';
  }).join('');
}
function renderList() {
  const list = document.getElementById('list');
  const shown = trophies.filter(trophyMatches);
  document.getElementById('empty').hidden = shown.length > 0;
  list.innerHTML = shown.map(t => {
    const got = earned.has(t.id);
    const hidden = isSpoilerHidden(t);
    const flags = [];
    if (t.missable) flags.push('<span class="flag missable">⚠ POSSIBLY MISSABLE</span>');
    if (t.hidden) flags.push('<span class="flag hidden">Hidden on PS5</span>');
    if (t.count) flags.push('<span class="flag count">Count: ' + t.count.toLocaleString('en-US') + '</span>');
    const sources = (t.sources || []).map(s => '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.name) + '</a>').join(' · ');
    const body = hidden
      ? '<p class="spoiler-hidden">Story trophy — hidden until earned. Turn spoiler mode off, or tick it earned, to reveal it.</p>'
      : '<p class="desc">“' + escapeHtml(t.description) + '”</p>'
        + '<details class="guidebox" open><summary>Guide &amp; sources</summary><p class="guide">' + escapeHtml(t.guide) + '</p><p class="sources">Sources: ' + sources + '</p></details>';
    return '<li class="trophy' + (got ? ' earned' : '') + '"><label class="row1"><input type="checkbox" data-id="' + t.id + '"' + (got ? ' checked' : '') + ' aria-label="Earned: ' + escapeHtml(t.name) + '"><span><span class="name">' + (hidden ? 'Hidden story trophy' : escapeHtml(t.name)) + '</span><span class="meta"> · ' + gradeLabel(t) + ' · ' + escapeHtml(t.kind) + (t.chapter ? ' · ' + escapeHtml(t.chapter) : '') + '</span></span></label><div class="flags">' + flags.join('') + '</div>' + body + '</li>';
  }).join('');
}
function renderAll() { renderProgress(); renderRoadmap(); renderList(); }

async function init() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies || data;
  trophies.sort((a, b) => a.id - b.id);
  // Theme + spoiler restore.
  const theme = localStorage.getItem(THEME_KEY);
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  updateThemeButton();
  const spoiler = localStorage.getItem(SPOILER_KEY);
  if (spoiler === '1') document.getElementById('spoiler').checked = true;
  renderAll();
}
function updateThemeButton() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('theme').textContent = dark ? '☀️ Paper theme' : '🌙 Night theme';
}
document.getElementById('list').addEventListener('change', e => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  if (e.target.checked) earned.add(id); else earned.delete(id);
  saveStored(); renderAll();
});
document.getElementById('filters').addEventListener('click', e => {
  const b = e.target.closest('button[data-f]'); if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('on', x === b));
  renderList();
});
document.getElementById('search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); renderList(); });
document.getElementById('spoiler').addEventListener('change', e => {
  localStorage.setItem(SPOILER_KEY, e.target.checked ? '1' : '0'); renderList();
});
document.getElementById('hideEarned').addEventListener('change', renderList);
document.getElementById('unearnedOnly').addEventListener('change', renderList);
document.getElementById('theme').addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next); updateThemeButton();
});
document.getElementById('export').addEventListener('click', () => {
  const payload = { app: 'leonida-trophy-guide', version: 1, exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click(); URL.revokeObjectURL(a.href);
});
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    earned = new Set(ids.map(Number).filter(n => trophies.some(t => t.id === n)));
    saveStored(); renderAll();
    alert('Imported ' + earned.size + ' earned trophies.');
  } catch (err) { alert('Could not import that file — it is not a progress export from this guide.'); }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earned = new Set(); saveStored(); renderAll();
});
init();
