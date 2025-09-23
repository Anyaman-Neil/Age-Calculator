// script.js
// Age calculator + celebrities from Wikimedia feed
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

// Add event listeners for input changes
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
      ymdEl.innerHTML = `${diff.years} years, ${diff.months} months, ${diff.days} days`; // Always shows months
      hmsEl.textContent = `${pad(diff.hours)}:${pad(diff.minutes)}:${pad(diff.seconds)} (hh:mm:ss)`;
      totalsEl.textContent = `Total: ${diff.totalDays} days • ${diff.totalHours} hours • ${diff.totalMinutes} minutes • ${diff.totalSeconds} seconds`;
      refsEl.textContent = `DOB: ${dobDate.toLocaleString(userLocale, { timeZone: userTz })} • Current: ${currentDate.toLocaleString(userLocale, { timeZone: userTz })}`;
    }
  }

  // If we have a DOB (month/day), fetch celebs for that MM/DD
  if (dobDate && (forceFetchCelebs || !celebsList.dataset.loaded)) {
    const mm = String(dobDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dobDate.getDate()).padStart(2, '0');
    await fetchCelebritiesForDate(mm, dd);
  }
}

// Fetch from Wikimedia "On this day" feed (births) via CORS proxy without custom headers
async function fetchCelebritiesForDate(mm, dd) {
  celebsList.innerHTML = `<div class="muted">Loading famous birthdays for ${mm}/${dd}…</div>`;
  celebsList.dataset.loaded = ''; // Clear flag until success

  try {
    // Use CORS proxy without custom headers to avoid User-Agent conflict
    const apiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${mm}/${dd}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
    console.log('Attempting fetch with proxy:', proxyUrl);

    const feedResp = await fetch(proxyUrl);
    console.log('Response status:', feedResp.status);
    if (!feedResp.ok) throw new Error(`HTTP error! status: ${feedResp.status}`);
    
    const feedText = await feedResp.text();
    console.log('Raw response:', feedText);
    const feedJson = JSON.parse(feedText);
    const births = feedJson.births || [];

    if (!births.length) {
      celebsList.innerHTML = `<div class="muted">No celebrities found on ${mm}/${dd}.</div>`;
      return;
    }

    // Extract unique pages from births
    const pages = [];
    const seen = new Set();
    for (const b of births) {
      if (!b.pages) continue;
      for (const p of b.pages) {
        const title = p.titles && (p.titles.normalized || p.titles.display) || p.title || '';
        if (!title || seen.has(title)) continue;
        seen.add(title);
        pages.push({
          title,
          extract: p.extract || 'No description available',
          pageUrl: (p.content_urls && p.content_urls.desktop && p.content_urls.desktop.page) || ''
        });
      }
    }

    if (pages.length === 0) {
      celebsList.innerHTML = `<div class="muted">No entries found.</div>`;
      return;
    }

    // Render the list
    renderCelebrities(pages);
    celebsList.dataset.loaded = '1';
  } catch (err) {
    console.error('Fetch error details:', err);
    celebsList.innerHTML = `<div class="muted">Failed to fetch celebrity list. Error: ${err.message}. Check console for more details.</div>`;
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
                      <div class="small">${item.extract}</div>
                      <div class="small muted">Page: ${item.pageUrl ? `<a href="${item.pageUrl}" target="_blank" rel="noreferrer">open</a>` : '—'}</div>`;
    const right = document.createElement('div');
    right.className = 'right';
    const openBtn = document.createElement('a');
    openBtn.href = item.pageUrl || '#';
    openBtn.target = '_blank';
    openBtn.className = 'btn';
    openBtn.textContent = 'Open page';
    right.appendChild(openBtn);
    el.appendChild(left);
    el.appendChild(right);
    celebsList.appendChild(el);
  }
}

// initial render
calculateAndRender(true);