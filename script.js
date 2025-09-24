// script.js
// Age calculator + celebrities from Wikimedia feed via reliable proxy with dynamic affiliate section
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

// Add/subtract month/day/year on a datetime-local input
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

// Affiliate products data (manage here)
const products = [
  {
    name: 'Fire-Boltt Smart Watch - Track Your Time',
    image: 'https://m.media-amazon.com/images/I/71e3z9uW-UL._AC_SL1500_.jpg',
    link: 'https://www.amazon.com/dp/B08L5N6L5N',
    alt: 'Fire-Boltt Smart Watch - Track Your Time'
  },
  {
    name: 'Birthday Gift Hamper - Perfect for Celebrations',
    image: 'https://m.media-amazon.com/images/I/81z5X8X8X8L._AC_SL1500_.jpg',
    link: 'https://www.amazon.com/dp/B07P9J8Y8Y',
    alt: 'Birthday Gift Hamper - Perfect for Celebrations'
  },
  {
    name: 'Stylish Wall Clock - Timeless Decor',
    image: 'https://m.media-amazon.com/images/I/61y6Z6Y6Y6L._AC_SL1500_.jpg',
    link: 'https://www.amazon.com/dp/B01M0X9X9X',
    alt: 'Stylish Wall Clock - Timeless Decor'
  }
];

// Render affiliate products
function renderAffiliateProducts() {
  const container = $('#affiliate-products');
  container.innerHTML = ''; // Clear existing content
  products.forEach(product => {
    const div = document.createElement('div');
    div.innerHTML = `
      <a href="${product.link}" target="_blank" rel="noreferrer">
        <img src="${product.image}" alt="${product.alt}">
      </a>
      <p>${product.name}</p>
      <p>Price: <a href="${product.link}" target="_blank" rel="noreferrer">Check on Amazon</a></p>
    `;
    container.appendChild(div);
  });
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

// Initialize inputs
currentEl.value = toDateTimeLocalValue(new Date());
dobEl.value = '';

// Small-controls wiring
document.querySelectorAll('.small-controls button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.dataset.action;
    const delta = btn.dataset.delta;
    const target = action === 'dob' ? dobEl : currentEl;
    target.value = adjustDatetimeLocal(target.value, delta);
    calculateAndRender(true);
  });
});

// Event listeners
dobEl.addEventListener('change', () => calculateAndRender(true));
currentEl.addEventListener('change', () => calculateAndRender(false));
recalcBtn.addEventListener('click', () => calculateAndRender(true));
resetBtn.addEventListener('click', () => {
  dobEl.value = '';
  currentEl.value = toDateTimeLocalValue(new Date());
  calculateAndRender(true);
});

// Live ticking
let liveInterval = setInterval(() => calculateAndRender(false), 1000);

// Calculate and render
function calculateAndRender(forceFetchCelebs = false) {
  const dobVal = dobEl.value;
  const currentVal = currentEl.value || toDateTimeLocalValue(new Date());
  const dobDate = parseLocalDateTimeLocal(dobVal);
  const currentDate = parseLocalDateTimeLocal(currentVal) || new Date();

  if (!dobDate) {
    ymdEl.textContent = 'Enter a valid Date of Birth';
    hmsEl.textContent = '';
    totalsEl.textContent = '';
    refsEl.textContent = '';
    return;
  }

  const diff = calculateYMDHMS(dobDate, currentDate);
  if (!diff) {
    ymdEl.textContent = 'Current date must be on/after DOB';
    return;
  }

  ymdEl.innerHTML = `${diff.years} years, ${diff.months} months, ${diff.days} days`;
  hmsEl.textContent = `${pad(diff.hours)}:${pad(diff.minutes)}:${pad(diff.seconds)} (hh:mm:ss)`;
  totalsEl.textContent = `Total: ${diff.totalDays} days • ${diff.totalHours} hours • ${diff.totalMinutes} minutes • ${diff.totalSeconds} seconds`;
  refsEl.textContent = `DOB: ${dobDate.toLocaleString(userLocale, { timeZone: userTz })} • Current: ${currentDate.toLocaleString(userLocale, { timeZone: userTz })}`;

  if (forceFetchCelebs) {
    const mm = String(dobDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dobDate.getDate()).padStart(2, '0');
    fetchCelebritiesForDate(mm, dd);
  }
}

// Fetch celebrities from Wikimedia via cors-anywhere proxy
async function fetchCelebritiesForDate(mm, dd) {
  celebsList.innerHTML = `<div class="muted">Loading famous birthdays for ${mm}/${dd}…</div>`;
  try {
    const apiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${mm}/${dd}`;
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${apiUrl}`;
    const headers = {
      'User-Agent': 'AgeCalculatorExample/1.0 (alphatroniumgoku@gmail.com)'
    };
    const response = await fetch(proxyUrl, { headers });
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const feedText = await response.text();
    console.log('Raw response length:', feedText.length);
    const feedJson = JSON.parse(feedText);
    const births = feedJson.births || [];

    if (!births.length) {
      celebsList.innerHTML = `<div class="muted">No celebrities found on ${mm}/${dd}.</div>`;
      return;
    }

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

    renderCelebrities(pages.slice(0, 5));
    celebsList.dataset.loaded = '1';
  } catch (error) {
    console.error("Celebrity fetch error:", error);
    celebsList.innerHTML = `<div class="muted">Failed to load famous birthdays. Error: ${error.message}</div>`;
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

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderAffiliateProducts();
  calculateAndRender(true);
});