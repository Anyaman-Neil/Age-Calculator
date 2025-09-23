// script.js
// Age calculator + celebrities from Wikimedia feed + Wikidata enrichment
// Save as script.js and keep in same folder as index.html/style.css

// --- Utilities ---
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));
const pad = (n) => n.toString().padStart(2, '0');

function parseLocalDateTimeLocal(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function toDateTimeLocalValue(d) {
  if (!d) return '';
  const year = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${year}-${mo}-${day}T${hh}:${mm}`;
}

// Calendar math: compute Y M D h m s between start and end (end >= start)
function calculateYMDHMS(start, end) {
  start = new Date(start); end = new Date(end);
  if (isNaN(start) || isNaN(end) || end < start) return null;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

  if (seconds < 0) { seconds += 60; minutes -= 1; }
  if (minutes < 0) { minutes += 60; hours -= 1; }
  if (hours < 0) { hours += 24; days -= 1; }
  if (days < 0) {
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }
  if (months < 0) { months += 12; years -= 1; }

  const totalMs = end.getTime() - start.getTime();
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  return { years, months, days, hours, minutes, seconds, totalSeconds, totalMinutes, totalHours, totalDays };
}

// Add/subtract month/day/year on a datetime-local input (value string)
function adjustDatetimeLocal(value, delta) {
  const dt = parseLocalDateTimeLocal(value) || new Date();
  const sign = delta[0] === '-' ? -1 : 1;
  const unit = delta.slice(-1); // d,m,y
  const amount = parseInt(delta.slice(1, -1) || delta.slice(1)) || 1;
  if (delta.includes('d')) dt.setDate(dt.getDate() + sign * amount);
  if (delta.includes('m') && !delta.includes('mo')) dt.setMonth(dt.getMonth() + sign * amount);
  if (delta.includes('y')) dt.setFullYear(dt.getFullYear() + sign * amount);
  return toDateTimeLocalValue(dt);
}

// DOM refs
const dobEl = $('#dob');
const currentEl = $('#current');
const tzEl = $('#tz');
const localeEl = $('#locale');
const ymdEl = $('#ymd');
const hmsEl = $('#hms');
const totalsEl = $('#totals');
const refsEl = $('#refs');
const celebsList = $('#celebs-list');
const recalcBtn = $('#recalc');
const resetBtn = $('#reset');

// Setup locale & timezone
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const userLocale = navigator.language || 'en-US';
tzEl.textContent = userTz;
localeEl.textContent = userLocale;

// Initialize inputs: DOB empty, Current default to now
currentEl.value = toDateTimeLocalValue(new Date());
dobEl.value = ''; // user will fill

// Small-controls wiring
document.querySelectorAll('.small-controls button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.dataset.action; // 'dob' or 'current'
    const delta = btn.dataset.delta;   // like '+1d' or '-1m' or '+1y'
    const target = action === 'dob' ? dobEl : currentEl;
    target.value = adjustDatetimeLocal(target.value, delta);
    calculateAndRender(true); // Force recalc and celeb fetch
  });
});

// Add event listeners for input changes (fixes recognition issue)
dobEl.addEventListener('change', () => calculateAndRender(true));
currentEl.addEventListener('change', () => calculateAndRender(true));

// Recalculate and reset
recalcBtn.addEventListener('click', () => calculateAndRender(true));
resetBtn.addEventListener('click', () => {
  dobEl.value = '';
  currentEl.value = toDateTimeLocalValue(new Date());
  calculateAndRender(true);
});

// live ticking every second to update H:M:S part
let liveInterval = setInterval(() => calculateAndRender(false), 1000);

// calculate and update DOM
async function calculateAndRender(forceFetchCelebs = false) {
  const dobVal = dobEl.value;
  const currentVal = currentEl.value || toDateTimeLocalValue(new Date());
  const dobDate = parseLocalDateTimeLocal(dobVal);
  const currentDate = parseLocalDateTimeLocal(currentVal) || new Date();

  if (!dobDate) {
    ymdEl.textContent = 'Enter a valid Date of Birth';
    hmsEl.textContent = '';
    totalsEl.textContent = '';
    refsEl.textContent = '';
  } else {
    const diff = calculateYMDHMS(dobDate, currentDate);
    if (!diff) {
      ymdEl.textContent = 'Current date must be on/after DOB';
    } else {
      ymdEl.innerHTML = `${diff.years} years, ${diff.months} months, ${diff.days} days`; // Always shows months, even 0
      hmsEl.textContent = `${pad(diff.hours)}:${pad(diff.minutes)}:${pad(diff.seconds)} (hh:mm:ss)`;
      totalsEl.textContent = `Total: ${diff.totalDays} days • ${diff.totalHours} hours • ${diff.totalMinutes} minutes • ${diff.totalSeconds} seconds`;
      refsEl.textContent = `DOB: ${dobDate.toLocaleString(userLocale, { timeZone: userTz })} • Current: ${currentDate.toLocaleString(userLocale, { timeZone: userTz })}`;
    }
  }

  // If we have a DOB (month/day), fetch celebs for that MM/DD
  if (dobDate && (forceFetchCelebs || !celebsList.dataset.loaded)) {
    const mm = String(dobDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dobDate.getDate()).padStart(2, '0');
    fetchCelebritiesForDate(mm, dd);
  }
}

// Fetch from Wikimedia "On this day" feed (births) and enrich with Wikidata DOB/DOD
async function fetchCelebritiesForDate(mm, dd) {
  celebsList.innerHTML = `<div class="muted">Loading famous birthdays for ${mm}/${dd}…</div>`;
  celebsList.dataset.loaded = ''; // clear flag until success
  const headers = { 'Accept': 'application/json', 'User-Agent': 'AgeCalculatorExample/1.0 (your-email@example.com)' }; // Replace with your real email
  try {
    const feedUrl = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${mm}/${dd}`;
    const feedResp = await fetch(feedUrl, { headers });
    if (!feedResp.ok) throw new Error('Failed retrieving feed');
    const feedJson = await feedResp.json();
    const births = feedJson.births || [];
    // Flatten pages from births entries and dedupe by title
    const pages = [];
    const seen = new Set();
    for (const b of births) {
      if (!b.pages) continue;
      for (const p of b.pages) {
        const title = p.titles && (p.titles.normalized || p.titles.display) || p.title || '';
        if (!title) continue;
        if (seen.has(title)) continue;
        seen.add(title);
        pages.push({
          title,
          extract: p.extract || '',
          pageUrl: (p.content_urls && p.content_urls.desktop && p.content_urls.desktop.page) || ''
        });
      }
    }

    if (pages.length === 0) {
      celebsList.innerHTML = `<div class="muted">No celebrities found on this date.</div>`;
      return;
    }

    // For each page, fetch pageprops to get wikibase_item (QID), then fetch Wikidata entity for P569 (DOB) and P570 (DOD)
    const enriched = [];
    for (const p of pages.slice(0, 10)) { // Reduced to 10 to avoid rate limits
      let qid = null;
      let dob = null;
      let dod = null;
      try {
        const pagePropsUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageprops&titles=${encodeURIComponent(p.title)}&ppprop=wikibase_item`;
        const ppResp = await fetch(pagePropsUrl, { headers });
        if (ppResp.ok) {
          const ppJson = await ppResp.json();
          const pageId = Object.keys(ppJson.query.pages)[0];
          qid = ppJson.query.pages[pageId].pageprops?.wikibase_item || null;
        }
        if (qid) {
          // fetch Wikidata entity JSON
          const wdUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
          const wdResp = await fetch(wdUrl, { headers });
          if (wdResp.ok) {
            const wdJson = await wdResp.json();
            const ent = wdJson.entities && wdJson.entities[qid];
            if (ent && ent.claims) {
              const claims = ent.claims;
              if (claims.P569 && claims.P569[0] && claims.P569[0].mainsnak && claims.P569[0].mainsnak.datavalue) {
                const dv = claims.P569[0].mainsnak.datavalue.value;
                dob = dv.time || null;
              }
              if (claims.P570 && claims.P570[0] && claims.P570[0].mainsnak && claims.P570[0].mainsnak.datavalue) {
                const dv = claims.P570[0].mainsnak.datavalue.value;
                dod = dv.time || null;
              }
            }
          }
        }

        // Parse the Wikidata times (if present). If time strings exist, convert to JS Date:
        const parseWikidataTime = (t) => {
          if (!t) return null;
          const cleaned = t.replace(/^\+/, '').replace(/Z$/, '');
          return new Date(cleaned);
        };

        enriched.push({
          title: p.title,
          extract: p.extract,
          pageUrl: p.pageUrl,
          qid,
          dobWikidata: parseWikidataTime(dob),
          dodWikidata: parseWikidataTime(dod)
        });
      } catch (e) {
        // Skip entry on error, but continue with others
        console.error(`Error enriching ${p.title}:`, e);
      }
    }

    // Render enriched list
    renderCelebrities(enriched);
    celebsList.dataset.loaded = '1';
  } catch (err) {
    console.error(err);
    celebsList.innerHTML = `<div class="muted">Failed to fetch celebrity list. Please try again later. (Error: ${err.message})</div>`;
  }
}

function renderCelebrities(list) {
  if (!list || list.length === 0) {
    celebsList.innerHTML = `<div class="muted">No entries found.</div>`;
    return;
  }
  celebsList.innerHTML = '';
  for (const item of list) {
    const el = document.createElement('div');
    el.className = 'celebrity';
    const left = document.createElement('div');
    left.className = 'left';
    left.innerHTML = `<div style="font-weight:600">${item.title}</div>
                      <div class="small">${item.extract || ''}</div>
                      <div class="small muted">Page: ${item.pageUrl ? `<a href="${item.pageUrl}" target="_blank" rel="noreferrer">open</a>` : '—'}</div>`;

    const right = document.createElement('div');
    right.className = 'right';

    // compute DOB/DOD fallback: if Wikidata present use it, otherwise unknown
    const dob = item.dobWikidata || null;
    const dod = item.dodWikidata || null;
    const now = new Date();

    // compute lived/current age
    const refEnd = dod || now;
    if (dob) {
      const diff = calculateYMDHMS(dob, refEnd);
      if (diff) {
        const totalStr = `${diff.years}y ${diff.months}m ${diff.days}d • ${diff.totalDays}d • ${diff.totalHours}h`;
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = 'Use';
        btn.title = 'Load this celebrity in the Date of Birth field';
        btn.addEventListener('click', () => {
          const localStr = toDateTimeLocalValue(dob);
          dobEl.value = localStr;
          if (dod) currentEl.value = toDateTimeLocalValue(dod);
          else currentEl.value = toDateTimeLocalValue(new Date());
          calculateAndRender(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn';
        detailsBtn.style.background = '#6b7280';
        detailsBtn.textContent = 'Total time';
        detailsBtn.addEventListener('click', () => {
          alert(`${item.title}\n\nDOB: ${dob.toLocaleString(userLocale)}\n${dod ? ('DOD: ' + dod.toLocaleString(userLocale) + '\n') : ''}\n\nLived/has lived: ${diff.years} years, ${diff.months} months, ${diff.days} days, ${diff.hours} hours, ${diff.minutes} minutes, ${diff.seconds} seconds\n\nTotals: ${diff.totalDays} days • ${diff.totalHours} hours • ${diff.totalMinutes} minutes • ${diff.totalSeconds} seconds`);
        });

        right.appendChild(btn);
        right.appendChild(detailsBtn);
        const small = document.createElement('div');
        small.className = 'small muted';
        small.textContent = `${dob ? 'Born: ' + dob.toLocaleString(userLocale) : 'Born: unknown'}${dod ? ' • Died: ' + dod.toLocaleString(userLocale) : ''}`;
        left.appendChild(small);
      } else {
        const noData = document.createElement('div');
        noData.className = 'small muted';
        noData.textContent = 'Date info incomplete.';
        left.appendChild(noData);
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = 'Use (approx)';
        btn.addEventListener('click', () => {
          if (dob) dobEl.value = toDateTimeLocalValue(dob);
          if (dod) currentEl.value = toDateTimeLocalValue(dod);
          calculateAndRender(true);
        });
        right.appendChild(btn);
      }
    } else {
      const openBtn = document.createElement('a');
      openBtn.href = item.pageUrl || '#';
      openBtn.target = '_blank';
      openBtn.className = 'btn';
      openBtn.textContent = 'Open page';
      right.appendChild(openBtn);
    }

    el.appendChild(left);
    el.appendChild(right);
    celebsList.appendChild(el);
  }
}

// initial render
calculateAndRender(true);