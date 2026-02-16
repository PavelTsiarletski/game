export const $ = (id) => document.getElementById(id);

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function fmt(n){
  // Compact-ish formatter without external deps.
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.floor(n));
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
  let u = -1;
  let v = abs;
  while (v >= 1000 && u < units.length - 1){
    v /= 1000;
    u++;
  }
  const sign = n < 0 ? "-" : "";
  const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${sign}${v.toFixed(digits)}${units[u]}`;
}

export function now(){ return Date.now(); }
