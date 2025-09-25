// script.js
// Multi Calculator Tool: Age, Conversions, Permutation/Combination
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

// Factorial function for permutations/combinations
function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Conversion units and factors (non-currency)
const units = {
  length: {
    base: 'm',
    factors: {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      inch: 0.0254,
      foot: 0.3048,
      yard: 0.9144,
      mile: 1609.34,
      nautical_mile: 1852,
      light_year: 9.4607e15,
      au: 1.496e11,
      parsec: 3.0857e16,
      planck_length: 1.616255e-35
    }
  },
  time: {
    base: 's',
    factors: {
      ms: 0.001,
      s: 1,
      min: 60,
      h: 3600,
      day: 86400,
      week: 604800,
      month: 2629746, // approximate (30.42 days)
      year: 31556952 // approximate (365.24 days)
    }
  },
  speed: {
    base: 'm/s',
    factors: {
      'm/s': 1,
      'km/h': 0.277778,
      mph: 0.44704,
      'ft/s': 0.3048,
      knot: 0.514444,
      'km/s': 1000,
      'mile/s': 1609.34,
      'c': 299792458 // speed of light
    }
  },
  currency: {
    base: 'USD',
    currencies: [], // Will be populated dynamically with all 170+ codes
    rates: {} // Will be populated dynamically
  }
};

let currencyDataFetched = false;

// Fetch currency data (list + rates) from reliable free API (ExchangeRate.Host)
async function fetchCurrencyData() {
  if (currencyDataFetched) return;
  try {
    // Fetch all available currencies (codes + names)
    const symbolsRes = await fetch('https://api.exchangerate.host/symbols');
    if (!symbolsRes.ok) throw new Error('Failed to fetch currencies');
    const symbolsData = await symbolsRes.json();
    if (!symbolsData.success) throw new Error('Invalid symbols response');
    units.currency.currencies = Object.keys(symbolsData.symbols); // e.g., ['AED', 'AFN', ..., 'ZWL']

    // Fetch latest rates (USD base)
    const ratesRes = await fetch('https://api.exchangerate.host/latest?base=USD');
    if (!ratesRes.ok) throw new Error('Failed to fetch rates');
    const ratesData = await ratesRes.json();
    if (!ratesData.success) throw new Error('Invalid rates response');
    units.currency.rates = ratesData.rates; // e.g., { 'AED': 3.67, 'EUR': 0.92, ... }

    currencyDataFetched = true;
    console.log(`Loaded ${units.currency.currencies.length} currencies with latest rates.`);
  } catch (e) {
    console.error('Currency fetch error:', e);
    // Fallback: Static full list of all 170+ ISO 4217 currencies (covers every country)
    units.currency.currencies = [
      'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
      'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
      'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR',
      'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK',
      'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD',
      'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD',
      'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'STX', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY',
      'TTD', 'TVD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XAG', 'XAU', 'XCD', 'XDR', 'XOF', 'XPF',
      'YER', 'ZAR', 'ZMW', 'ZWL'
    ];
    // Fallback rates: 1:1 (not ideal, but ensures functionality)
    units.currency.rates = units.currency.currencies.reduce((acc, curr) => { acc[curr] = 1; return acc; }, {});
    conversionResultEl.textContent = 'Using fallback data (1:1 rates). Check connection and retry.';
  }
}

// Affiliate products data (unchanged)
const products = [
  // ... (same as before, omitted for brevity)
  {
    name: 'One94store Crystal Ball Night Lamp',
    image: 'https://m.media-amazon.com/images/I/51rV+9X4CQL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/One94store-Crystal-Ball-Night-Lamp/dp/B0CYTCD6TH?crid=J1P5W28EKWVF&dib=eyJ2IjoiMSJ9._-XP_23ET5ax-UIywqZTes-QyvrepCP1sB_NejkFn8v_p4Is624IGUr5ibaEYKnzhWMH7BXVzQMJ8SPui5WnYnCaILv2tb-yr0Uvs5QWZ8RXMBBbRf1LGcexGEAQQ7heub8bITuCVa6ZK11IJuHtFcqDQWLVFHmwehVhqa-bs6maRkdAxnxEq2ipkWmW23KAZecoPbC0Lz2pIVx-RzVDAaXvKe8JISVJ8OlAEEC3qQa65vXUo2NsUkWCyc8bcJsMvfkx-PjceGEoSqrOR0KtyQo5-lQ6LoikWTWJ38HuR3M.raWM1O0ducoBK_yilu668G65g-p5phAWBmPpO9GqIL0&dib_tag=se&keywords=birthday%2Bgifts&qid=1758690566&sprefix=%2Caps%2C477&sr=8-1&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=39918f876a0a57dba40fd6fd2652f941&language=en_IN&ref_=as_li_ss_tl',
    alt: 'One94store Crystal Ball Night Lamp'
  },
  // Add the rest of your products here (same as previous version)
];

// Render affiliate products (unchanged)
function renderAffiliateProducts() {
  const container = $('#affiliate-products');
  container.innerHTML = '';
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-card';
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

// DOM refs (unchanged)
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
const categoryEl = $('#category');
const fromUnitEl = $('#from-unit');
const toUnitEl = $('#to-unit');
const swapBtn = $('#swap-units');
const inputValueEl = $('#input-value');
const convertBtn = $('#convert');
const conversionResultEl = $('#conversion-result');
const nValueEl = $('#n-value');
const rValueEl = $('#r-value');
const calculatePermBtn = $('#calculate-perm');
const calculateCombBtn = $('#calculate-comb');
const permResultEl = $('#perm-result');
const combResultEl = $('#comb-result');
const tabButtons = $all('.tab-button');
const panels = $all('.calculator-panel');

// Setup locale & timezone (unchanged)
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const userLocale = navigator.language || 'en-US';
tzEl.textContent = userTz;
localeEl.textContent = userLocale;

// Initialize inputs (unchanged)
currentEl.value = toDateTimeLocalValue(new Date());
dobEl.value = '';

// Tab switching (unchanged)
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    panels.forEach(panel => panel.style.display = 'none');
    const tabId = button.getAttribute('data-tab');
    $(`#${tabId}`).style.display = 'block';
  });
});

// Small-controls wiring (unchanged)
document.querySelectorAll('.small-controls button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.dataset.action;
    const delta = btn.dataset.delta;
    const target = action === 'dob' ? dobEl : currentEl;
    target.value = adjustDatetimeLocal(target.value, delta);
    calculateAndRender(true);
  });
});

// Event listeners for Age Calculator (unchanged)
dobEl.addEventListener('change', () => calculateAndRender(true));
currentEl.addEventListener('change', () => calculateAndRender(false));
recalcBtn.addEventListener('click', () => calculateAndRender(true));
resetBtn.addEventListener('click', () => {
  dobEl.value = '';
  currentEl.value = toDateTimeLocalValue(new Date());
  calculateAndRender(true);
});

// Live ticking for Age Calculator (unchanged)
let liveInterval = setInterval(() => calculateAndRender(false), 1000);

// Calculate and render for Age Calculator (unchanged)
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

  if (forceFetchCelebs && dobDate) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mm = monthNames[dobDate.getMonth()];
    const dd = dobDate.getDate();
    fetchCelebritiesForDate(mm, dd);
  }
}

// Fetch celebrities for Age Calculator (unchanged)
async function fetchCelebritiesForDate(monthName, day) {
  celebsList.innerHTML = `<div class="muted">Loading famous birthdays for ${monthName} ${day}…</div>`;
  try {
    const searchQuery = `born on ${monthName} ${day}`;
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srwhat=text&format=json&origin=*&srlimit=5`;
    const response = await fetch(apiUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
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
      left.innerHTML = `<div style="font-weight:600">${result.title}</div><div class="small">${result.snippet.replace(/<[^>]*>/g, '').trim()}...</div>`;
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

// Conversion Calculator Logic
function populateUnits(category) {
  fromUnitEl.innerHTML = '';
  toUnitEl.innerHTML = '';
  if (!category) return;
  let unitList;
  if (category === 'currency') {
    unitList = units.currency.currencies.sort(); // Alphabetical for easy search
  } else {
    unitList = Object.keys(units[category].factors);
  }
  unitList.forEach(unit => {
    const opt = document.createElement('option');
    opt.value = unit;
    opt.textContent = unit;
    fromUnitEl.appendChild(opt.cloneNode(true));
    toUnitEl.appendChild(opt);
  });
  // Default to first two options
  if (unitList.length > 1) {
    fromUnitEl.value = unitList[0]; // e.g., AED or mm
    toUnitEl.value = unitList[1]; // e.g., AFN or cm
  }
}

categoryEl.addEventListener('change', async () => {
  const category = categoryEl.value;
  if (category === 'currency' && !currencyDataFetched) {
    await fetchCurrencyData();
  }
  populateUnits(category);
});

swapBtn.addEventListener('click', () => {
  const fromVal = fromUnitEl.value;
  const toVal = toUnitEl.value;
  fromUnitEl.value = toVal;
  toUnitEl.value = fromVal;
});

convertBtn.addEventListener('click', async () => {
  const category = categoryEl.value;
  const fromUnit = fromUnitEl.value;
  const toUnit = toUnitEl.value;
  const value = parseFloat(inputValueEl.value);

  if (!category || !fromUnit || !toUnit || isNaN(value) || value < 0) {
    conversionResultEl.textContent = 'Please select a category, units, and enter a valid positive number';
    return;
  }

  if (fromUnit === toUnit) {
    conversionResultEl.textContent = `${value} ${fromUnit} = ${value} ${toUnit}`;
    return;
  }

  let result;
  if (category === 'currency') {
    if (!currencyDataFetched) await fetchCurrencyData();
    const rateFrom = units.currency.rates[fromUnit];
    const rateTo = units.currency.rates[toUnit];
    if (!rateFrom || !rateTo) {
      conversionResultEl.textContent = 'Rate not available for selected currencies';
      return;
    }
    result = (value / rateFrom) * rateTo; // Correct formula: from -> USD -> to
  } else {
    const baseValue = value * units[category].factors[fromUnit];
    result = baseValue / units[category].factors[toUnit];
  }

  conversionResultEl.textContent = `${value} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`;
});

// Permutation/Combination Calculator Logic (unchanged)
function permutation(n, r) {
  return factorial(n) / factorial(n - r);
}

function combination(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

calculatePermBtn.addEventListener('click', () => {
  const n = parseInt(nValueEl.value);
  const r = parseInt(rValueEl.value);
  if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || r > n) {
    permResultEl.textContent = 'Please enter valid n and r (0 ≤ r ≤ n)';
    return;
  }
  permResultEl.textContent = `Permutation (nPr) = ${permutation(n, r).toFixed(0)}`;
});

calculateCombBtn.addEventListener('click', () => {
  const n = parseInt(nValueEl.value);
  const r = parseInt(rValueEl.value);
  if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || r > n) {
    combResultEl.textContent = 'Please enter valid n and r (0 ≤ r ≤ n)';
    return;
  }
  combResultEl.textContent = `Combination (nCr) = ${combination(n, r).toFixed(0)}`;
});

// Initial render
document.addEventListener('DOMContentLoaded', async () => {
  renderAffiliateProducts();
  calculateAndRender(true);
  tabButtons[0].click();
  categoryEl.value = 'length';
  populateUnits('length');
  // Pre-fetch currency data in background
  fetchCurrencyData();
});

// Inline styles (unchanged)
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