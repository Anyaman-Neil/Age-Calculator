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
    currencies: [], // Will be populated dynamically
    rates: {} // Will be populated dynamically
  }
};

let currencyDataFetched = false;

// Fetch currency data (list + rates) from reliable free API
async function fetchCurrencyData() {
  if (currencyDataFetched) return;
  try {
    // Fetch all available currencies
    const currenciesRes = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json');
    if (!currenciesRes.ok) throw new Error('Failed to fetch currencies');
    const currenciesData = await currenciesRes.json();
    units.currency.currencies = Object.keys(currenciesData);

    // Fetch latest rates (USD base)
    const ratesRes = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json');
    if (!ratesRes.ok) throw new Error('Failed to fetch rates');
    const ratesData = await ratesRes.json();
    units.currency.rates = ratesData.usd; // e.g., { eur: 0.92, gbp: 0.77, ... }

    currencyDataFetched = true;
    console.log(`Loaded ${units.currency.currencies.length} currencies with latest rates.`);
  } catch (e) {
    console.error('Currency fetch error:', e);
    conversionResultEl.textContent = 'Failed to load currency data. Please check your connection.';
    // Fallback: Use a minimal set if fetch fails (but API is reliable, so rare)
    units.currency.currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'BRL', 'RUB', 'ZAR'];
    units.currency.rates = units.currency.currencies.reduce((acc, curr) => { acc[curr.toLowerCase()] = 1; return acc; }, {});
  }
}

// Affiliate products data
const products = [
  {
    name: 'One94store Crystal Ball Night Lamp',
    image: 'https://m.media-amazon.com/images/I/51rV+9X4CQL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/One94store-Crystal-Ball-Night-Lamp/dp/B0CYTCD6TH?crid=J1P5W28EKWVF&dib=eyJ2IjoiMSJ9._-XP_23ET5ax-UIywqZTes-QyvrepCP1sB_NejkFn8v_p4Is624IGUr5ibaEYKnzhWMH7BXVzQMJ8SPui5WnYnCaILv2tb-yr0Uvs5QWZ8RXMBBbRf1LGcexGEAQQ7heub8bITuCVa6ZK11IJuHtFcqDQWLVFHmwehVhqa-bs6maRkdAxnxEq2ipkWmW23KAZecoPbC0Lz2pIVx-RzVDAaXvKe8JISVJ8OlAEEC3qQa65vXUo2NsUkWCyc8bcJsMvfkx-PjceGEoSqrOR0KtyQo5-lQ6LoikWTWJ38HuR3M.raWM1O0ducoBK_yilu668G65g-p5phAWBmPpO9GqIL0&dib_tag=se&keywords=birthday%2Bgifts&qid=1758690566&sprefix=%2Caps%2C477&sr=8-1&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=39918f876a0a57dba40fd6fd2652f941&language=en_IN&ref_=as_li_ss_tl',
    alt: 'One94store Crystal Ball Night Lamp'
  },
  {
    name: 'GIFTMEBAZAR Valentine Loveable Anniversary Birthday',
    image: 'https://m.media-amazon.com/images/I/61j2j1G5VJL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/GIFTMEBAZAR-Valentine-Loveable-Anniversary-Birthday/dp/B0DB7W1BB6?crid=J1P5W28EKWVF&dib=eyJ2IjoiMSJ9._-XP_23ET5ax-UIywqZTes-QyvrepCP1sB_NejkFn8v_p4Is624IGUr5ibaEYKnzhWMH7BXVzQMJ8SPui5WnYnCaILv2tb-yr0Uvs5QWZ8RXMBBbRf1LGcexGEAQQ7heub8bITuCVa6ZK11IJuHtFcqDQWLVFHmwehVhqa-bs6maRkdAxnxEq2ipkWmW23KAZecoPbC0Lz2pIVx-RzVDAaXvKe8JISVJ8OlAEEC3qQa65vXUo2NsUkWCyc8bcJsMvfkx-PjceGEoSqrOR0KtyQo5-lQ6LoikWTWJ38HuR3M.raWM1O0ducoBK_yilu668G65g-p5phAWBmPpO9GqIL0&dib_tag=se&keywords=birthday%2Bgifts&qid=1758690566&sprefix=%2Caps%2C477&sr=8-7&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=b74ea1afcaebb59f4e164add5b6f16e8&language=en_IN&ref_=as_li_ss_tl',
    alt: 'GIFTMEBAZAR Valentine Loveable Anniversary Birthday'
  },
  {
    name: 'VRB-Dec-Artificial-Crochet-Bouquet',
    image: 'https://m.media-amazon.com/images/I/61U6C1d6Y0L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/VRB-Dec-Artificial-Crochet-Bouquet/dp/B0DVQ75LVP?crid=J1P5W28EKWVF&dib=eyJ2IjoiMSJ9._-XP_23ET5ax-UIywqZTes-QyvrepCP1sB_NejkFn8v_p4Is624IGUr5ibaEYKnzhWMH7BXVzQMJ8SPui5WnYnCaILv2tb-yr0Uvs5QWZ8RXMBBbRf1LGcexGEAQQ7heub8bITuCVa6ZK11IJuHtFcqDQWLVFHmwehVhqa-bs6maRkdAxnxEq2ipkWmW23KAZecoPbC0Lz2pIVx-RzVDAaXvKe8JISVJ8OlAEEC3qQa65vXUo2NsUkWCyc8bcJsMvfkx-PjceGEoSqrOR0KtyQo5-lQ6LoikWTWJ38HuR3M.raWM1O0ducoBK_yilu668G65g-p5phAWBmPpO9GqIL0&dib_tag=se&keywords=birthday%2Bgifts&qid=1758690566&sprefix=%2Caps%2C477&sr=8-10&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=08c142b799529104ee2f8323d66c4351&language=en_IN&ref_=as_li_ss_tl',
    alt: 'VRB-Dec-Artificial-Crochet-Bouquet'
  },
  {
    name: 'Motorola-g45-Pantone-Moss-128',
    image: 'https://m.media-amazon.com/images/I/61l7U4d+1XL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/Motorola-g45-Pantone-Moss-128/dp/B0FL21SZXQ?crid=2J1N6GKVULD80&dib=eyJ2IjoiMSJ9.nGS-vOpupiunqzbpB_8YBB8KWWjEw4KimDXF3EH0r-SyJapaViTwvB5S6c5oEFQLrI_YsmpyRQqvXRNdN4bLHdyAYARing8nLhpAp5gfjC4qUMIGikGuSgjkHs3eLYU9M-2z_YMUd1ZLjcTqKed3jEIKJ7OcgPb7C2YjxQagtLOMWYMesHeyefopz2nYFHa8lYQ64rNNmzhXcYP1HNNc5o_-WqgpxbO7KHAq2QUq2cY.Dr3bLTg8TPU2MQyLcwneCeIQpaCtpJ5s7JKUXagNiiw&dib_tag=se&keywords=mobile&qid=1758690893&sprefix=%2Caps%2C347&sr=8-13&linkCode=ll1&tag=birthdaytools-21&linkId=9d89fc68c76f7ce3c2cc1b788222c0ec&language=en_IN&ref_=as_li_ss_tl',
    alt: 'Motorola-g45-Pantone-Moss-128'
  },
  {
    name: 'iQOO-Dimensity-Processor-Military-Shock-Resistance',
    image: 'https://m.media-amazon.com/images/I/71Y7UjX0eJL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/iQOO-Dimensity-Processor-Military-Shock-Resistance/dp/B0FC5XK9WZ?crid=2J1N6GKVULD80&dib=eyJ2IjoiMSJ9.nGS-vOpupiunqzbpB_8YBB8KWWjEw4KimDXF3EH0r-SyJapaViTwvB5S6c5oEFQLrI_YsmpyRQqvXRNdN4bLHdyAYARing8nLhpAp5gfjC4qUMIGikGuSgjkHs3eLYU9M-2z_YMUd1ZLjcTqKed3jEIKJ7OcgPb7C2YjxQagtLOMWYMesHeyefopz2nYFHa8lYQ64rNNmzhXcYP1HNNc5o_-WqgpxbO7KHAq2QUq2cY.Dr3bLTg8TPU2MQyLcwneCeIQpaCtpJ5s7JKUXagNiiw&dib_tag=se&keywords=mobile&qid=1758690893&sprefix=%2Caps%2C347&sr=8-5&linkCode=ll1&tag=birthdaytools-21&linkId=a6165a9c77996478e54ed01ee2b5af64&language=en_IN&ref_=as_li_ss_tl',
    alt: 'iQOO-Dimensity-Processor-Military-Shock-Resistance'
  },
  {
    name: 'OnePlus-Super-Silver-128GB-Storage',
    image: 'https://m.media-amazon.com/images/I/71Kn99V4x7L._AC_UL320_.jpg',
    link: 'https://www.amazon.in/OnePlus-Super-Silver-128GB-Storage/dp/B0D5YCYS1G?crid=2J1N6GKVULD80&dib=eyJ2IjoiMSJ9.nGS-vOpupiunqzbpB_8YBB8KWWjEw4KimDXF3EH0r-SyJapaViTwvB5S6c5oEFQLrI_YsmpyRQqvXRNdN4bLHdyAYARing8nLhpAp5gfjC4qUMIGikGuSgjkHs3eLYU9M-2z_YMUd1ZLjcTqKed3jEIKJ7OcgPb7C2YjxQagtLOMWYMesHeyefopz2nYFHa8lYQ64rNNmzhXcYP1HNNc5o_-WqgpxbO7KHAq2QUq2cY.Dr3bLTg8TPU2MQyLcwneCeIQpaCtpJ5s7JKUXagNiiw&dib_tag=se&keywords=mobile&qid=1758690893&sprefix=%2Caps%2C347&sr=8-3&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=11e371b8fbfd0177a94933aba0c6f7bf&language=en_IN&ref_=as_li_ss_tl',
    alt: 'OnePlus-Super-Silver-128GB-Storage'
  },
  {
    name: 'Modern-Living-Tables-Furniture-Shelves',
    image: 'https://via.placeholder.com/200x200?text=Product+Image',
    link: 'https://www.amazon.in/Modern-Living-Tables-Furniture-Shelves/dp/B0FNWMP3S2?crid=2DHGSN9IL3XSG&dib=eyJ2IjoiMSJ9.vh7NgkUqLi2ssOaGYN92PTyZu8fySIR70bmo0NqCw9WaBJmnbDJThRZhIsmXa3-upazTiCNVwDtD8OU9Ty8RBoBYvsSql5R_AmdHMdrMahdNnzVRty_VLd7DoFLm2v2fkW0l-Y-uUq_v3RbvE900Fg37pqB4b6bbX5O9aQXAftVbi4o-WZe-6IEGBRx1klSAdm6aqO0xWpMLQp-8C3HCMsWsvD0EoY9UoIzLtRaUGrRPqpEJ2WfoK97Iyq_-JWlHZORydY8VgVtEttAnwAy_zYiyPk7CxF73NC6sbcgLmWc.5CfsOfQGpkigankrn3BOcER4Tonq-FxYQR-W-87_MP0&dib_tag=se&keywords=furniture&qid=1758690962&sprefix=%2Caps%2C352&sr=8-6&linkCode=ll1&tag=birthdaytools-21&linkId=97e0e5bc6667f70a94d42b3c957c5541&language=en_IN&ref_=as_li_ss_tl',
    alt: 'Modern-Living-Tables-Furniture-Shelves'
  },
  {
    name: 'ObalTure-Entryway-Corduroy-Decorative-Furniture',
    image: 'https://via.placeholder.com/200x200?text=Product+Image',
    link: 'https://www.amazon.in/ObalTure-Entryway-Corduroy-Decorative-Furniture/dp/B0D583FXQ4?crid=2DHGSN9IL3XSG&dib=eyJ2IjoiMSJ9.vh7NgkUqLi2ssOaGYN92PTyZu8fySIR70bmo0NqCw9WaBJmnbDJThRZhIsmXa3-upazTiCNVwDtD8OU9Ty8RBoBYvsSql5R_AmdHMdrMahdNnzVRty_VLd7DoFLm2v2fkW0l-Y-uUq_v3RbvE900Fg37pqB4b6bbX5O9aQXAftVbi4o-WZe-6IEGBRx1klSAdm6aqO0xWpMLQp-8C3HCMsWsvD0EoY9UoIzLtRaUGrRPqpEJ2WfoK97Iyq_-JWlHZORydY8VgVtEttAnwAy_zYiyPk7CxF73NC6sbcgLmWc.5CfsOfQGpkigankrn3BOcER4Tonq-FxYQR-W-87_MP0&dib_tag=se&keywords=furniture&qid=1758690962&sprefix=%2Caps%2C352&sr=8-10&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=3c0a20b1131f89fdb0f4f919c9d8f14b&language=en_IN&ref_=as_li_ss_tl',
    alt: 'ObalTure-Entryway-Corduroy-Decorative-Furniture'
  }
];

// Render affiliate products
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

// Setup locale & timezone
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const userLocale = navigator.language || 'en-US';
tzEl.textContent = userTz;
localeEl.textContent = userLocale;

// Initialize inputs
currentEl.value = toDateTimeLocalValue(new Date());
dobEl.value = '';

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    panels.forEach(panel => panel.style.display = 'none');
    const tabId = button.getAttribute('data-tab');
    $(`#${tabId}`).style.display = 'block';
  });
});

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

// Event listeners for Age Calculator
dobEl.addEventListener('change', () => calculateAndRender(true));
currentEl.addEventListener('change', () => calculateAndRender(false));
recalcBtn.addEventListener('click', () => calculateAndRender(true));
resetBtn.addEventListener('click', () => {
  dobEl.value = '';
  currentEl.value = toDateTimeLocalValue(new Date());
  calculateAndRender(true);
});

// Live ticking for Age Calculator
let liveInterval = setInterval(() => calculateAndRender(false), 1000);

// Calculate and render for Age Calculator
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

// Fetch celebrities for Age Calculator
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
    unitList = units.currency.currencies;
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
  // Default to first options if populated
  if (unitList.length > 0) {
    fromUnitEl.value = unitList[0];
    toUnitEl.value = unitList[1] || unitList[0];
  }
}

categoryEl.addEventListener('change', async () => {
  const category = categoryEl.value;
  if (category === 'currency') {
    await fetchCurrencyData(); // Fetch on demand
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
    const rateFrom = units.currency.rates[fromUnit.toLowerCase()];
    const rateTo = units.currency.rates[toUnit.toLowerCase()];
    if (!rateFrom || !rateTo) {
      conversionResultEl.textContent = 'Rate not available for selected currencies';
      return;
    }
    result = (value * rateFrom) / rateTo; // Convert: value * (from_to_base / to_to_base)
  } else {
    const baseValue = value * units[category].factors[fromUnit];
    result = baseValue / units[category].factors[toUnit];
  }

  conversionResultEl.textContent = `${value} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`;
});

// Permutation/Combination Calculator Logic
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
  // Pre-fetch currency data in background for faster first use
  fetchCurrencyData();
});

// Inline styles (move to style.css later if needed)
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