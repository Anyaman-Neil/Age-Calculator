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

  let years