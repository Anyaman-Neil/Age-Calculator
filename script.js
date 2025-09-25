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

function adjustDatetimeLocal(value, delta) {
  const dt = parseLocalDateTimeLocal(value) || new Date();
  const sign = delta[0] === '-' ? -1 : 1;
  const unit = delta.slice(-1);
  const amount = parseInt(delta.slice(1, -1) || delta.slice(1)) || 1;
  if (delta.includes('d')) dt.setDate(dt.getDate() + sign * amount);
  if (delta.includes('m') && !delta.includes('mo')) dt.setMonth(dt.getMonth() + sign * amount);
  if (delta.includes('y')) dt.setFullYear(dt.getFullYear() + sign * amount);
  return toDateTimeLocalValue(dt);
}

function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

const units = {
  length: {
    base: 'm',
    factors: {
      mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.34,
      nautical_mile: 1852, light_year: 9.4607e15, au: 1.496e11, parsec: 3.0857e16, planck_length: 1.616255e-35
    }
  },
  time: {
    base: 's',
    factors: {
      ms: 0.001, s: 1, min: 60, h: 3600, day: 86400, week: 604800, month: 2629746, year: 31556952
    }
  },
  speed: {
    base: 'm/s',
    factors: {
      'm/s': 1, 'km/h': 0.277778, mph: 0.44704, 'ft/s': 0.3048, knot: 0.514444, 'km/s': 1000, 'mile/s': 1609.34, 'c': 299792458
    }
  },
  currency: {
    base: 'USD',
    currencies: ['AED', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'INR', 'JPY', 'USD'],
    rates: {}
  }
};

let currencyDataFetched = false;

const fallbackRates = {
  'AED': 3.67, 'AUD': 1.50, 'BRL': 5.60, 'CAD': 1.38, 'CHF': 0.86, 'CNY': 7.10,
  'EUR': 0.92, 'GBP': 0.77, 'INR': 83.50, 'JPY': 145.00, 'USD': 1.00
};

const products = [
  {
    name: 'One94store Crystal Ball Night Lamp',
    image: 'https://m.media-amazon.com/images/I/51rV+9X4CQL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/One94store-Crystal-Ball-Night-Lamp/dp/B0CYTCD6TH',
    alt: 'One94store Crystal Ball Night Lamp'
  },
  {
    name: 'GIFTMEBAZAR Valentine Loveable Anniversary Birthday',
    image: 'https://m.media-amazon.com/images/I/61j2j1G5VJL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/GIFTMEBAZAR-Valentine-Loveable-Anniversary-Birthday/dp/B0DB7W1BB6',
    alt: 'GIFTMEBAZAR Valentine Loveable Anniversary Birthday'
  },
  {
    name: 'VRB-Dec-Artificial-Crochet-Bouquet',
    image: 'https://m.media-amazon.com/images/I/61U6C1d6Y0L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/VRB-Dec-Artificial-Crochet-Bouquet/dp/B0DVQ75LVP',
    alt: 'VRB-Dec-Artificial-Crochet-Bouquet'
  },
  {
    name: 'Motorola-g45-Pantone-Moss-128',
    image: 'https://m.media-amazon.com/images/I/61l7U4d+1XL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/Motorola-g45-Pantone-Moss-128/dp/B0FL21SZXQ',
    alt: 'Motorola-g45-Pantone-Moss-128'
  },
  {
    name: 'iQOO-Dimensity-Processor-Military-Shock-Resistance',
    image: 'https://m.media-amazon.com/images/I/71Y7UjX0eJL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/iQOO-Dimensity-Processor-Military-Shock-Resistance/dp/B0FC5XK9WZ',
    alt: 'iQOO-Dimensity-Processor-Military-Shock-Resistance'
  },
  {
    name: 'OnePlus-Super-Silver-128GB-Storage',
    image: 'https://m.media-amazon.com/images/I/71Kn99V4x7L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/OnePlus-Super-Silver-128GB-Storage/dp/B0D5YCYS1G',
    alt: 'OnePlus-Super-Silver-128GB-Storage'
  },
  {
    name: 'Modern-Living-Tables-Furniture-Shelves',
    image: 'https://m.media-amazon.com/images/I/61T0M4I3KXL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/Modern-Living-Tables-Furniture-Shelves/dp/B0FNWMP3S2',
    alt: 'Modern-Living-Tables-Furniture-Shelves'
  },
  {
    name: 'ObalTure-Entryway-Corduroy-Decorative-Furniture',
    image: 'https://m.media-amazon.com/images/I/61P2F5Q0uHL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/ObalTure-Entryway-Corduroy-Decorative-Furniture/dp/B0D583FXQ4',
    alt: 'ObalTure-Entryway-Corduroy-Decorative-Furniture'
  }
];

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

async function fetchCurrencyData() {
  if (currencyDataFetched) return;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { mode: 'cors' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error('Invalid rates data');
    units.currency.rates = data.rates;
    currencyDataFetched = true;
    conversionResultEl.textContent = `Live rates loaded (${data.time_last_update_utc}).`;
    setTimeout(() => { conversionResultEl.textContent = '—'; }, 3000);
  } catch (e) {
    console.error('Currency fetch error:', e);
    units.currency.rates = fallbackRates;
    conversionResultEl.textContent = 'Using cached rates (live fetch unavailable).';
    setTimeout(() => { conversionResultEl.textContent = '—'; }, 3000);
  }
}

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
const sciDisplay = $('#sci-display');
const tabButtons = $all('.tab-button');
const panels = $all('.calculator-panel');

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const userLocale = navigator.language || 'en-US';
tzEl.textContent = userTz;
localeEl.textContent = userLocale;

currentEl.value = toDateTimeLocalValue(new Date());
dobEl.value = '';

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    console.log('Tab clicked:', button.getAttribute('data-tab'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    panels.forEach(panel => panel.style.display = 'none');
    const tabId = button.getAttribute('data-tab');
    const panel = $(`#${tabId}`);
    if (panel) {
      panel.style.display = 'block';
      if (tabId === 'conv-calc') {
        populateUnits(categoryEl.value);
        if (categoryEl.value === 'currency') fetchCurrencyData();
      }
    }
  });
});

document.querySelectorAll('.small-controls button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.dataset.action;
    const delta = btn.dataset.delta;
    const target = action === 'dob' ? dobEl : currentEl;
    target.value = adjustDatetimeLocal(target.value, delta);
    calculateAndRender(true);
  });
});

dobEl.addEventListener('change', () => calculateAndRender(true));
currentEl.addEventListener('change', () => calculateAndRender(false));
recalcBtn.addEventListener('click', () => calculateAndRender(true));
resetBtn.addEventListener('click', () => {
  dobEl.value = '';
  currentEl.value = toDateTimeLocalValue(new Date());
  calculateAndRender(true);
});

let liveInterval = setInterval(() => calculateAndRender(false), 1000);

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
    console.error('Celebrity fetch error:', error);
    celebsList.innerHTML = `<div class="muted">Failed to load famous birthdays. Error: ${error.message}</div>`;
  }
}

function populateUnits(category) {
  fromUnitEl.innerHTML = '';
  toUnitEl.innerHTML = '';
  if (!category) return;
  const unitList = category === 'currency' ? units.currency.currencies : Object.keys(units[category].factors);
  unitList.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    fromUnitEl.appendChild(opt.cloneNode(true));
    toUnitEl.appendChild(opt);
  });
}

categoryEl.addEventListener('change', (e) => {
  const cat = e.target.value;
  console.log('Category changed:', cat);
  populateUnits(cat);
  if (cat === 'currency') fetchCurrencyData();
});

swapBtn.addEventListener('click', () => {
  const from = fromUnitEl.value;
  const to = toUnitEl.value;
  fromUnitEl.value = to;
  toUnitEl.value = from;
  console.log('Units swapped:', from, to);
});

convertBtn.addEventListener('click', () => {
  console.log('Convert button clicked');
  const type = categoryEl.value;
  const value = parseFloat(inputValueEl.value);
  const from = fromUnitEl.value;
  const to = toUnitEl.value;
  if (isNaN(value) || value < 0) {
    conversionResultEl.textContent = 'Please enter a valid positive number';
    return;
  }
  if (!from || !to) {
    conversionResultEl.textContent = 'Please select valid units';
    return;
  }
  let result;
  if (type === 'currency') {
    const rateFrom = units.currency.rates[from] || fallbackRates[from];
    const rateTo = units.currency.rates[to] || fallbackRates[to];
    if (!rateFrom || !rateTo) {
      conversionResultEl.textContent = 'Currency rates unavailable';
      return;
    }
    result = (value / rateFrom) * rateTo;
  } else {
    const factorFrom = units[type].factors[from];
    const factorTo = units[type].factors[to];
    if (!factorFrom || !factorTo) {
      conversionResultEl.textContent = 'Invalid units selected';
      return;
    }
    result = (value * factorFrom) / factorTo;
  }
  conversionResultEl.textContent = `${value} ${from} = ${result.toFixed(2)} ${to}`;
});

function permutation(n, r) {
  return factorial(n) / factorial(n - r);
}

function combination(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

calculatePermBtn.addEventListener('click', () => {
  console.log('Permutation button clicked');
  const n = parseInt(nValueEl.value);
  const r = parseInt(rValueEl.value);
  if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || r > n) {
    permResultEl.innerHTML = 'Please enter valid n and r (0 ≤ r ≤ n) <span class="formula">Formula: n! / (n - r)!</span>';
    return;
  }
  permResultEl.innerHTML = `Permutation (nPr) = ${permutation(n, r).toFixed(0)} <span class="formula">Formula: n! / (n - r)!</span>`;
});

calculateCombBtn.addEventListener('click', () => {
  console.log('Combination button clicked');
  const n = parseInt(nValueEl.value);
  const r = parseInt(rValueEl.value);
  if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || r > n) {
    combResultEl.innerHTML = 'Please enter valid n and r (0 ≤ r ≤ n) <span class="formula">Formula: n! / (r! * (n - r)!)</span>';
    return;
  }
  combResultEl.innerHTML = `Combination (nCr) = ${combination(n, r).toFixed(0)} <span class="formula">Formula: n! / (r! * (n - r)!)</span>`;
});

let sciExpression = '';
function sciAppend(val) {
  sciExpression += val;
  sciDisplay.value = sciExpression;
  console.log('Sci append:', val, 'Expression:', sciExpression);
}

function sciClear() {
  sciExpression = '';
  sciDisplay.value = '';
  console.log('Sci cleared');
}

function sciBackspace() {
  sciExpression = sciExpression.slice(0, -1);
  sciDisplay.value = sciExpression;
  console.log('Sci backspace, Expression:', sciExpression);
}

function sciCalculate() {
  console.log('Sci calculate, Expression:', sciExpression);
  try {
    const result = math.evaluate(sciExpression);
    sciDisplay.value = Number.isFinite(result) ? result.toFixed(4) : 'Error';
    sciExpression = result.toString();
    console.log('Sci result:', sciDisplay.value);
  } catch (error) {
    console.error('Sci error:', error);
    sciDisplay.value = 'Error';
    sciExpression = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  renderAffiliateProducts();
  calculateAndRender(true);
  tabButtons[0].click();
  categoryEl.value = 'length';
  populateUnits('length');
});