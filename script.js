// script.js
// Age calculator + celebrities from Wikipedia MediaWiki API (CORS-enabled) with dynamic affiliate section
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
    image: 'https://m.media-amazon.com/images/I/61ZjlBKEQ5L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/dp/B0B5B6PQ5M?tag=birthdaytools-21',
    alt: 'Fire-Boltt Smart Watch - Track Your Time'
  },
  {
    name: 'Birthday Gift Hamper - Perfect for Celebrations',
    image: 'https://m.media-amazon.com/images/I/71q8+U8ZxLL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/dp/B08L3Z1Z3J?tag=birthdaytools-21',
    alt: 'Birthday Gift Hamper - Perfect for Celebrations'
  },
  {
    name: 'Stylish Wall Clock - Timeless Decor',
    image: 'https://m.media-amazon.com/images/I/71F6Ntz6+9L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/dp/B07V4N2V7S?tag=birthdaytools-21',
    alt: 'Stylish Wall Clock - Timeless Decor'
  }
];

// Render affiliate products
function renderAffiliateProducts() {
  const container = $('#affiliate-products');
  container.innerHTML = ''; // Clear existing content
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-card'; // Add a class for styling
    div.innerHTML = `
      <a href="${product.link}" target="_blank" rel="noreferrer" class="product-link">
        <img src="${product.image}" alt="${product.alt}" class="product-image" onerror="this.src='https://via.placeholder.com/200x200?text=Product+Image';">
      </a>
      <p class="product-name">${product.name}</p>
      <p class="product-price">Price: <a href="${product.link}" target="_blank" rel="noreferrer" class="price-link">Check on Amazon</a></p>
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

// Live ticking (every second for H:M:S)
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

  // Fetch celebs only on DOB change (not every second to avoid rate limits)
  if (forceFetchCelebs && dobDate) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mm = monthNames[dobDate.getMonth()];
    const dd = dobDate.getDate();
    fetchCelebritiesForDate(mm, dd);
  }
}

// Fetch celebrities from Wikipedia MediaWiki API (CORS-enabled)
async function fetchCelebritiesForDate(monthName, day) {
  celebsList.innerHTML = `<div class="muted">Loading famous birthdays for ${monthName} ${day}…</div>`;
  try {
    const searchQuery = `born on ${monthName} ${day}`;
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srwhat=text&format=json&origin=*&srlimit=5`;
    console.log('Attempting Wikipedia API fetch:', apiUrl);

    const response = await fetch(apiUrl, { mode: 'cors' });
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    console.log('Raw response:', data);

    const searchResults = data.query?.search || [];
    if (!searchResults.length) {
      celebsList.innerHTML = `<div class="muted">No celebrities found for ${monthName} ${day}.</div>`;
      return;
    }

    celebsList.innerHTML = '';
    searchResults.slice(0, 5).forEach(result => {
      const el = document.createElement('div');
      el.className = 'celebrity';
      const left = document.createElement('div');
      left.className = 'left';
      left.innerHTML = `<div style="font-weight:600">${result.title}</div>
                        <div class="small">${result.snippet.replace(/<[^>]*>/g, '').trim()}...</div>`;
      const right = document.createElement('div');
      right.className = 'right';
      const openBtn = document.createElement('a');
      openBtn.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`;
      openBtn.target = '_blank';
      openBtn.className = 'btn';
      openBtn.textContent = 'Open page';
      right.appendChild(openBtn);
      el.appendChild(left);
      el.appendChild(right);
      celebsList.appendChild(el);
    });
  } catch (error) {
    console.error("Celebrity fetch error:", error);
    celebsList.innerHTML = `<div class="muted">Failed to load famous birthdays. Error: ${error.message}</div>`;
  }
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderAffiliateProducts();
  calculateAndRender(true);
});

// Add inline styles for visual appeal (can move to style.css later)
const style = document.createElement('style');
style.textContent = `
  .product-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    margin: 10px;
    width: 200px;
    display: inline-block;
    vertical-align: top;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }
  .product-card:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  .product-image {
    max-width: 180px;
    height: auto;
    display: block;
    margin: 0 auto 10px;
  }
  .product-link:hover img {
    opacity: 0.8;
  }
  .product-name {
    font-size: 16px;
    font-weight: bold;
    margin: 5px 0;
    text-align: center;
  }
  .product-price {
    font-size: 14px;
    text-align: center;
  }
  .price-link {
    color: #0073aa;
    text-decoration: none;
  }
  .price-link:hover {
    text-decoration: underline;
    color: #005d87;
  }
`;
document.head.appendChild(style);