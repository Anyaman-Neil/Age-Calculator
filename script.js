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
    currencies: [
      'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
      'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF', 'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF',
      'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL',
      'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW',
      'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK',
      'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
      'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT',
      'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER',
      'ZAR', 'ZMW', 'ZWL'
    ],
    rates: {}
  }
};

let currencyDataFetched = false;

const fallbackRates = {
  'AED': 3.67, 'AFN': 70.45, 'ALL': 91.20, 'AMD': 387.50, 'ANG': 1.79, 'AOA': 890.00, 'ARS': 970.00, 'AUD': 1.50, 'AWG': 1.80, 'AZN': 1.70,
  'BAM': 1.80, 'BBD': 2.00, 'BDT': 119.50, 'BGN': 1.80, 'BHD': 0.38, 'BIF': 2880.00, 'BMD': 1.00, 'BND': 1.35, 'BOB': 6.90, 'BRL': 5.60,
  'BSD': 1.00, 'BTN': 83.50, 'BWP': 13.50, 'BYN': 3.25, 'BZD': 2.00, 'CAD': 1.38, 'CDF': 2800.00, 'CHE': 0.92, 'CHF': 0.86, 'CHW': 0.86,
  'CLF': 0.034, 'CLP': 950.00, 'CNY': 7.10, 'COP': 4300.00, 'CRC': 510.00, 'CUC': 1.00, 'CUP': 24.00, 'CVE': 101.00, 'CZK': 23.00, 'DJF': 178.00,
  'DKK': 6.85, 'DOP': 60.00, 'DZD': 134.00, 'EGP': 48.50, 'ERN': 15.00, 'ETB': 57.00, 'EUR': 0.92, 'FJD': 2.25, 'FKP': 0.77, 'GBP': 0.77,
  'GEL': 2.70, 'GGP': 0.77, 'GHS': 15.50, 'GIP': 0.77, 'GMD': 69.00, 'GNF': 8600.00, 'GTQ': 7.80, 'GYD': 209.00, 'HKD': 7.80, 'HNL': 24.70,
  'HRK': 7.00, 'HTG': 132.00, 'HUF': 360.00, 'IDR': 15500.00, 'ILS': 3.75, 'IMP': 0.77, 'INR': 83.50, 'IQD': 1310.00, 'IRR': 42000.00, 'ISK': 138.00,
  'JEP': 0.77, 'JMD': 156.00, 'JOD': 0.71, 'JPY': 145.00, 'KES': 129.00, 'KGS': 88.00, 'KHR': 4100.00, 'KMF': 450.00, 'KPW': 900.00, 'KRW': 1350.00,
  'KWD': 0.31, 'KYD': 0.83, 'KZT': 480.00, 'LAK': 22000.00, 'LBP': 89500.00, 'LKR': 300.00, 'LRD': 195.00, 'LSL': 18.00, 'LYD': 4.80, 'MAD': 9.90,
  'MDL': 17.50, 'MGA': 4500.00, 'MKD': 56.00, 'MMK': 2100.00, 'MNT': 3450.00, 'MOP': 8.05, 'MRU': 39.50, 'MUR': 46.50, 'MVR': 15.40, 'MWK': 1730.00,
  'MXN': 19.50, 'MYR': 4.35, 'MZN': 64.00, 'NAD': 18.00, 'NGN': 1600.00, 'NIO': 36.50, 'NOK': 10.75, 'NPR': 134.00, 'NZD': 1.65, 'OMR': 0.385,
  'PAB': 1.00, 'PEN': 3.75, 'PGK': 3.90, 'PHP': 56.00, 'PKR': 278.00, 'PLN': 4.00, 'PYG': 7500.00, 'QAR': 3.64, 'RON': 4.60, 'RSD': 109.00,
  'RUB': 97.00, 'RWF': 1320.00, 'SAR': 3.75, 'SBD': 8.40, 'SCR': 13.50, 'SDG': 620.00, 'SEK': 10.50, 'SGD': 1.35, 'SHP': 0.77, 'SLE': 23.00,
  'SLL': 22700.00, 'SOS': 570.00, 'SRD': 36.50, 'SSP': 1300.00, 'STN': 22.50, 'SYP': 13000.00, 'SZL': 18.00, 'THB': 33.50, 'TJS': 10.70,
  'TMT': 3.50, 'TND': 3.10, 'TOP': 2.35, 'TRY': 34.00, 'TTD': 6.80, 'TWD': 32.00, 'TZS': 2700.00, 'UAH': 41.00, 'UGX': 3700.00, 'USD': 1.00,
  'UYU': 40.50, 'UZS': 12600.00, 'VES': 36.50, 'VND': 25000.00, 'VUV': 119.00, 'WST': 2.75, 'XAF': 600.00, 'XCD': 2.70, 'XOF': 600.00,
  'XPF': 111.00, 'YER': 250.00, 'ZAR': 18.00, 'ZMW': 27.00, 'ZWL': 322.00
};

const products = [
  {
    name: 'One94store Crystal Ball Night Lamp',
    image: 'https://m.media-amazon.com/images/I/51rV+9X4CQL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/One94store-Crystal-Ball-Night-Lamp/dp/B0CYTCD6TH?crid=J1P5W28EKWVF&keywords=birthday+gifts&tag=birthdaytools-21',
    alt: 'Crystal Ball Night Lamp for Birthday Gifts'
  },
  {
    name: 'GIFTMEBAZAR Valentine Loveable Anniversary Birthday',
    image: 'https://m.media-amazon.com/images/I/61j2j1G5VJL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/GIFTMEBAZAR-Valentine-Loveable-Anniversary-Birthday/dp/B0DB7W1BB6?crid=J1P5W28EKWVF&keywords=birthday+gifts&tag=birthdaytools-21',
    alt: 'Valentine Loveable Anniversary Birthday Gift'
  },
  {
    name: 'VRB-Dec-Artificial-Crochet-Bouquet',
    image: 'https://m.media-amazon.com/images/I/61U6C1d6Y0L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/VRB-Dec-Artificial-Crochet-Bouquet/dp/B0DVQ75LVP?crid=J1P5W28EKWVF&keywords=birthday+gifts&tag=birthdaytools-21',
    alt: 'Artificial Crochet Bouquet for Birthday Gifts'
  },
  {
    name: 'Motorola-g45-Pantone-Moss-128',
    image: 'https://m.media-amazon.com/images/I/61l7U4d+1XL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/Motorola-g45-Pantone-Moss-128/dp/B0FL21SZXQ?crid=2J1N6GKVULD80&keywords=mobile&tag=birthdaytools-21',
    alt: 'Motorola g45 Pantone Moss Smartphone'
  },
  {
    name: 'iQOO-Dimensity-Processor-Military-Shock-Resistance',
    image: 'https://m.media-amazon.com/images/I/71Y7UjX0eJL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/iQOO-Dimensity-Processor-Military-Shock-Resistance/dp/B0FC5XK9WZ?crid=2J1N6GKVULD80&keywords=mobile&tag=birthdaytools-21',
    alt: 'iQOO Dimensity Processor Smartphone'
  },
  {
    name: 'OnePlus-Super-Silver-128GB-Storage',
    image: 'https://m.media-amazon.com/images/I/71Kn99V4x7L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/OnePlus-Super-Silver-128GB-Storage/dp/B0D5YCYS1G?crid=2J1N6GKVULD80&keywords=mobile&tag=birthdaytools-21',
    alt: 'OnePlus Super Silver 128GB Smartphone'
  },
  {
    name: 'Modern-Living-Tables-Furniture-Shelves',
    image: 'https://m.media-amazon.com/images/I/61T0M4I3KXL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/Modern-Living-Tables-Furniture-Shelves/dp/B0FNWMP3S2?crid=2DHGSN9IL3XSG&keywords=furniture&tag=birthdaytools-21',
    alt: 'Modern Living Tables and Shelves'
  },
  {
    name: 'ObalTure-Entryway-Corduroy-Decorative-Furniture',
    image: 'https://m.media-amazon.com/images/I/61P2F5Q0uHL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/ObalTure-Entryway-Corduroy-Decorative-Furniture/dp/B0D583FXQ4?crid=2DHGSN9IL3XSG&keywords=furniture&tag=birthdaytools-21',
    alt: 'ObalTure Corduroy Decorative Furniture'
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
      if (tabId === 'sci-calc') sciDisplay.focus(); // Auto-focus sci display
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

sciDisplay.addEventListener('keydown', (e) => {
  if ($('#sci-calc').style.display !== 'block') return; // Only handle when sci-calc is active
  console.log('Key pressed:', e.key);
  const keyMap = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '+': '+', '-': '-', '*': '*', '/': '/', '^': '^', '.': '.', '(': '(', ')': ')',
    'Enter': sciCalculate, 'Escape': sciClear, 'Backspace': sciBackspace,
    's': 'sin(', 'c': 'cos(', 't': 'tan(', 'l': '