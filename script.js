// script.js
// Multi Calculator Tool: Age, Conversions (expanded), Permutation/Combination
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

// Affiliate products data (manage here)
const products = [
  {
    name: 'One94store Crystal Ball Night Lamp',
    image: 'https://m.media-amazon.com/images/I/51rV+9X4CQL._AC_UL320_.jpg',
    link: 'https://www.amazon.in/One94store-Crystal-Ball-Night-Lamp/dp/B0CYTCD6TH?crid=J1P5W28EKWVF&dib=eyJ2IjoiMSJ9._-XP_23ET5ax-UIywqZTes-QyvrepCP1sB_NejkFn8v_p4Is624IGUr5ibaEYKnzhWMH7BXVzQMJ8SPui5WnYnCaILv2tb-yr0Uvs5QWZ8RXMBBbRf1LGcexGEAQQ7heub8bITuCVa6ZK11IJuHtFcqDQWLVFHmwehVhqa-bs6maRkdAxnxEq2ipkWmW23KAZecoPbC0Lz2pIVx-RzVDAaXvKe8JISVJ8OlAEEC3qQa65vXUo2NsUkWCyc8bcJsMvfkx-PjceGEoSqrOR0KtyQo5-lQ6LoikWTWJ38HuR3M.raWM1O0ducoBK_yilu668G65g-p5phAWBmPpO9GqIL0&dib_tag=se&keywords=birthday%2Bgifts&qid=1758690566&sprefix=%2Caps%2C477&sr=8-1&th=1&linkCode=ll1&tag=birthdaytools-21&linkId=39918f876a0a57dba40fd6fd2652f941&language=en_IN&ref_=as_li_ss_tl',
    alt: 'One94store Crystal Ball Night Lamp'
  },
  // Add the other products from your list here
];

// Render affiliate products
function renderAffiliateProducts() {
  const container = $('#affiliate-products');
  container.innerHTML = ''; // Clear existing content
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
const categoryButtons = $all('.category-button');
const fromValueEl = $('#from-value');
const toValueEl = $('#to-value');
const fromUnitEl = $('#from-unit');
const toUnitEl = $('#to-unit');
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

// Category switching for Conversions
categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    const category = button.getAttribute('data-category');
    populateUnits(category);
  });
});

// Conversion Factors (expanded)
const conversionFactors = {
  length: {
    'Astronomical Unit (AU)': 1.495978707e11,
    'Light Year': 9.460730472e15,
    'Parsec': 3.08568e16,
    'Meter (m)': 1,
    'Centimeter (cm)': 0.01,
    'Millimeter (mm)': 0.001,
    'Micrometer (µm)': 1e-6,
    'Nanometer (nm)': 1e-9,
    'Angstrom (Å)': 1e-10,
    'Planck Length': 1.616255e-35
  },
  speed: {
    'Light Speed (c)': 299792458,
    'Kilometer per Hour (km/h)': 0.277778,
    'Meter per Second (m/s)': 1,
    'Miles per Hour (mph)': 0.44704,
    'Knot (kn)': 0.514444,
    'Centimeter per Second (cm/s)': 0.01,
    'Planck Speed': 299792458
  },
  time: {
    'Light Year Time': 31557600, // 1 year for light to travel light year
    'Year': 31557600,
    'Day': 86400,
    'Hour': 3600,
    'Minute': 60,
    'Second': 1,
    'Millisecond': 0.001,
    'Microsecond': 1e-6,
    'Nanosecond': 1e-9,
    'Planck Time': 5.391247e-44
  },
  currency: {} // Populated dynamically
};

// Populate units for from/to selects
function populateUnits(category) {
  const units = conversionFactors[category];
  fromUnitEl.innerHTML = '';
  toUnitEl.innerHTML = '';
  for (const unit in units) {
    const option1 = document.createElement('option');
    option1.value = unit;
    option1.textContent = unit;
    fromUnitEl.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = unit;
    option2.textContent = unit;
    toUnitEl.appendChild(option2);
  }
}

// Conversion logic
convertBtn.addEventListener('click', () => {
  const category = document.querySelector('.category-button.active')?.getAttribute('data-category');
  if (!category) return;

  const fromValue = parseFloat(fromValueEl.value);
  const toValue = parseFloat(toValueEl.value);
  const fromUnit = fromUnitEl.value;
  const toUnit = toUnitEl.value;

  if (isNaN(fromValue) && isNaN(toValue)) {
    conversionResultEl.textContent = 'Enter at least one value.';
    return;
  }

  const units = conversionFactors[category];
  let result = '';
  if (!isNaN(fromValue)) {
    const fromFactor = units[fromUnit];
    const toFactor = units[toUnit];
    const converted = fromValue * (fromFactor / toFactor);
    result += `${fromValue} ${fromUnit} = ${converted.toFixed(6)} ${toUnit}\n`;
  }
  if (!isNaN(toValue)) {
    const fromFactor = units[fromUnit];
    const toFactor = units[toUnit];
    const converted = toValue * (toFactor / fromFactor);
    result += `${toValue} ${toUnit} = ${converted.toFixed(6)} ${fromUnit}`;
  }
  conversionResultEl.textContent = result;
});

// Load currency on start
async function loadCurrencyRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    conversionFactors.currency = data.rates;
    conversionFactors.currency['USD'] = 1;
  } catch (error) {
    console.error('Currency fetch error:', error);
    conversionResultEl.textContent = 'Failed to load currency rates.';
  }
}
loadCurrencyRates();

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderAffiliateProducts();
  calculateAndRender(true);
  // Activate the first tab by default
  tabButtons[0].click();
  // Activate the first category for conversions
  categoryButtons[0].click();
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