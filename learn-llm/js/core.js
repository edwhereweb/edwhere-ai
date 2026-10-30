// ===== core helpers =====
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function f(x, d = 3) {
  if (x === Infinity) return '∞';
  if (x === -Infinity) return '−∞';
  if (typeof x !== 'number' || Number.isNaN(x)) return '—';
  if (x !== 0 && Math.abs(x) < 1e-3) return x.toExponential(2);
  return (+x.toFixed(d)).toString();
}
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
const sigmoid = x => 1 / (1 + Math.exp(-x));
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const norm = a => Math.sqrt(dot(a, a));
const cos = (a, b) => dot(a, b) / ((norm(a) * norm(b)) || 1e-12);
function softmax(z) { const m = Math.max(...z); const e = z.map(v => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); }
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => sum(a) / a.length;
const variance = a => { const m = mean(a); return mean(a.map(v => (v - m) ** 2)); };

function hbars(items, opt = {}) {
  const max = opt.max ?? Math.max(1e-12, ...items.map(i => i.v));
  const fv = opt.fmt || (v => f(v, 3));
  return '<div class="hbars">' + items.map(i => `<div class="hb ${i.cls || ''}"><span class="hl" title="${esc(i.label)}">${esc(i.label)}</span><span class="ht"><span class="hf" style="width:${Math.max(0, Math.min(100, i.v / max * 100))}%"></span></span><span class="hv">${i.txt ?? fv(i.v)}</span></div>`).join('') + '</div>';
}
function heat(M, rows, cols, opt = {}) {
  const fmt = opt.fmt || (v => f(v, 2));
  const vals = M.flat(); const mx = opt.max ?? Math.max(...vals.map(Math.abs), 1e-9);
  let h = '<div class="tbl"><table class="heat"><tr><th></th>' + cols.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>';
  M.forEach((r, i) => {
    h += `<tr><th>${esc(rows[i])}</th>` + r.map(v => { const p = Math.round(Math.min(1, Math.abs(v) / mx) * 70); const col = v < 0 ? 'var(--bad)' : 'var(--accent)'; return `<td style="background:color-mix(in srgb, ${col} ${p}%, transparent)">${fmt(v)}</td>`; }).join('') + '</tr>';
  });
  return h + '</table></div>';
}
// simple SVG line chart: series [{pts:[[x,y]], color, label, dash}]
function lineChart(series, o = {}) {
  const W = o.w || 640, H = o.h || 240, L = 52, R = 14, T = 14, B = 34;
  const tx = v => o.logx ? Math.log10(v) : v, ty = v => o.logy ? Math.log10(Math.max(v, 1e-300)) : v;
  const xs = series.flatMap(s => s.pts.map(p => tx(p[0]))), ys = series.flatMap(s => s.pts.map(p => ty(p[1]))).filter(Number.isFinite);
  let x0 = o.xmin != null ? tx(o.xmin) : Math.min(...xs), x1 = o.xmax != null ? tx(o.xmax) : Math.max(...xs);
  let y0 = o.ymin != null ? ty(o.ymin) : Math.min(...ys), y1 = o.ymax != null ? ty(o.ymax) : Math.max(...ys);
  if (y1 - y0 < 1e-9) { y1 += 1; y0 -= 1; } if (x1 - x0 < 1e-9) x1 += 1;
  const X = v => L + (tx(v) - x0) / (x1 - x0) * (W - L - R), Y = v => { const t = ty(v); const c = Math.max(y0, Math.min(y1, Number.isFinite(t) ? t : y1)); return H - B - (c - y0) / (y1 - y0) * (H - T - B); };
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || 'chart')}">`;
  const yt = 4; for (let i = 0; i <= yt; i++) { const v = y0 + (y1 - y0) * i / yt; const yy = H - B - (v - y0) / (y1 - y0) * (H - T - B); const lab = o.logy ? (Math.abs(v) < 4 ? f(10 ** v, 2) : '1e' + Math.round(v)) : f(v, 2); s += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${lab}</text>`; }
  const xt = 5; for (let i = 0; i <= xt; i++) { const v = x0 + (x1 - x0) * i / xt; const xx = L + (v - x0) / (x1 - x0) * (W - L - R); const lab = o.logx ? f(10 ** v, 3) : f(v, 1); s += `<text x="${xx}" y="${H - B + 16}" text-anchor="middle">${lab}</text>`; }
  s += `<line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/>`;
  if (o.xlabel) s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">${esc(o.xlabel)}</text>`;
  if (o.ylabel) s += `<text x="12" y="${T + 4}" text-anchor="start">${esc(o.ylabel)}</text>`;
  series.forEach(se => {
    const pts = se.pts.filter(p => Number.isFinite(ty(p[1])) || ty(p[1]) === Infinity);
    if (!pts.length) return;
    s += `<polyline fill="none" stroke="${se.color || 'var(--accent)'}" stroke-width="2.2" ${se.dash ? 'stroke-dasharray="5 4"' : ''} points="${pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}"/>`;
    if (se.dots) pts.forEach(p => s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3" fill="${se.color || 'var(--accent)'}"/>`);
  });
  (o.marks || []).forEach(m => { s += `<circle cx="${X(m.x)}" cy="${Y(m.y)}" r="5.5" fill="${m.color || 'var(--bad)'}" stroke="var(--panel)" stroke-width="2"/>`; if (m.label) s += `<text x="${X(m.x) + 8}" y="${Y(m.y) - 8}" style="fill:${m.color || 'var(--bad)'}">${esc(m.label)}</text>`; });
  return s + '</svg>';
}
function legend(items) { return '<div class="legend">' + items.map(i => `<span><i style="background:${i.color}"></i>${esc(i.label)}</span>`).join('') + '</div>'; }
function seg(id, opts, on) { return `<div class="seg" id="${id}" role="group">` + opts.map(o => `<button type="button" data-v="${esc(o[0])}" class="${o[0] === on ? 'on' : ''}">${esc(o[1])}</button>`).join('') + '</div>'; }
function bindSeg(el, cb) { el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', el).forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); }); }
function vs(withTxt, withoutTxt) { return `<div class="vs"><div class="with"><div class="lab">With it</div><p>${withTxt}</p></div><div class="without"><div class="lab">Without it</div><p>${withoutTxt}</p></div></div>`; }
function tryList(items) { return `<div class="card"><h2>Try this</h2><ol class="try">${items.map(i => `<li>${i}</li>`).join('')}</ol></div>`; }
function vecStrip(v, mx) { mx = mx || Math.max(1e-9, ...v.map(Math.abs)); return '<span class="vecstrip">' + v.map(x => `<span title="${f(x, 3)}" style="background:color-mix(in srgb, ${x < 0 ? 'var(--bad)' : 'var(--accent)'} ${Math.round(Math.min(1, Math.abs(x) / mx) * 90 + 6)}%, var(--panel2))"></span>`).join('') + '</span>'; }

// ===== progress =====
let DONE = new Set();
try { DONE = new Set(JSON.parse(localStorage.getItem('llm-lab-done') || '[]')); } catch (e) { }
function markDone(id) { if (!DONE.has(id) && typeof ART !== 'undefined') ART.burst(); DONE.add(id); try { localStorage.setItem('llm-lab-done', JSON.stringify([...DONE])); } catch (e) { } renderNav(); }

// ===== quiz =====
function quiz(labId, qs) {
  const id = 'qz-' + labId;
  setTimeout(() => {
    const root = document.getElementById(id); if (!root) return;
    const got = new Set();
    root.addEventListener('click', e => {
      const b = e.target.closest('.opts button'); if (!b) return;
      const qi = +b.dataset.q, oi = +b.dataset.o, q = qs[qi];
      const box = b.closest('.q');
      $$('button', box).forEach(x => x.classList.remove('right', 'wrong'));
      b.classList.add(oi === q.a ? 'right' : 'wrong');
      $('.why', box).innerHTML = (oi === q.a ? '<b style="color:var(--good)">Correct.</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + q.why;
      if (oi === q.a) got.add(qi);
      $('.score', root).textContent = `${got.size} of ${qs.length} correct` + (got.size === qs.length ? ' · lab complete ✓' : '');
      if (got.size === qs.length) markDone(labId);
    });
  });
  return `<div class="card quiz" id="${id}"><h2>Check yourself</h2><div class="score">Answer all ${qs.length} correctly to mark this lab complete.</div>` +
    qs.map((q, qi) => `<div class="q"><b>${qi + 1}. ${q.q}</b><div class="opts">${q.opts.map((o, oi) => `<button type="button" data-q="${qi}" data-o="${oi}">${o}</button>`).join('')}</div><div class="why"></div></div>`).join('') + '</div>';
}

// ===== registry & router =====
const LABS = [];
function lab(def) { LABS.push(def); }
const built = {};
function renderNav() {
  const cur = location.hash.slice(1) || 'home';
  $('#rnav').innerHTML = `<a href="#home" class="${cur === 'home' ? 'on' : ''}"><span class="n">··</span><span>Start here</span><span></span></a>` +
    LABS.map(l => `<a href="#${l.id}" class="${cur === l.id ? 'on' : ''}"><span class="n">${String(l.n).padStart(2, '0')}</span><span>${esc(l.short)}</span><span class="tick">${DONE.has(l.id) ? '✓' : ''}</span></a>`).join('');
  $('#mnav').innerHTML = `<option value="home">Start here</option>` + LABS.map(l => `<option value="${l.id}" ${cur === l.id ? 'selected' : ''}>${l.n}. ${esc(l.short)}${DONE.has(l.id) ? ' ✓' : ''}</option>`).join('');
  const n = LABS.filter(l => DONE.has(l.id)).length;
  $('#ptext').textContent = `${n} of ${LABS.length} labs completed`;
  $('#pbar').style.width = (n / LABS.length * 100) + '%';
}
function homeView() {
  return `${ART.hello()}
  <div class="home-grid" id="labgrid">${LABS.map((l, i) => `<a class="lcard c${1 + i % 4}" style="--i:${i}" href="#${l.id}"><span class="ic">${ART.icon(l.id)}</span><span class="n">LAB ${String(l.n).padStart(2, '0')}</span>${DONE.has(l.id) ? '<span class="done">✓ done</span>' : ''}<h3>${esc(l.title)}</h3><p>${l.does}</p><p class="wo">Without it: ${l.without}</p></a>`).join('')}</div>
  <div class="card"><h2>How the labs connect</h2><p class="sub">Each technique fixes a failure you will see in the lab before it.</p>
  <div class="flow mono" style="font-size:13px">${['Bigram counts', 'zeros → smoothing', 'perplexity to compare', 'WordNet: meaning by hand', 'Word2Vec: meaning from context', 'CBOW / skip-gram', 'negative sampling', 'subwords fix unknown words', 'RNN: unlimited context', 'Seq2Seq + beam search', 'attention, scaled by √dₖ'].map((t, i) => (i ? '<span class="arrow">→</span>' : '') + `<span class="chip static">${t}</span>`).join('')}</div></div>`;
}
function show() {
  const id = location.hash.slice(1) || 'home';
  const main = $('#main');
  $$('.view', main).forEach(v => v.hidden = true);
  let v = document.getElementById('view-' + id);
  const L = LABS.find(l => l.id === id);
  if (!v) {
    v = document.createElement('section'); v.className = 'view'; v.id = 'view-' + id; main.appendChild(v);
  }
  if (id === 'home' || !L) { v.innerHTML = homeView(); }
  else if (!built[id]) {
    const i = LABS.indexOf(L), prev = LABS[i - 1], next = LABS[i + 1];
    v.innerHTML = `<div class="eyebrow">Lab ${String(L.n).padStart(2, '0')} · ${esc(L.short)}</div><h1>${esc(L.title)}</h1><p class="lede">${L.lede}</p>${conceptCard(id)}<div class="labbody"></div>
    <div class="foot-nav">${prev ? `<a class="btn ghost" href="#${prev.id}">← ${esc(prev.short)}</a>` : '<a class="btn ghost" href="#home">← Start</a>'}${next ? `<a class="btn" href="#${next.id}">Next: ${esc(next.short)} →</a>` : '<a class="btn" href="#home">Back to all labs</a>'}</div>`;
    try { L.build($('.labbody', v)); } catch (err) { $('.labbody', v).innerHTML = '<div class="note bad">This lab failed to load: ' + esc(err.message) + '</div>'; console.error(err); }
    built[id] = true;
  } else if (L.refresh) { try { L.refresh(); } catch (e) { console.error(e); } }
  v.hidden = false;
  LABS.forEach(l => { if (l.id !== id && l.pause) l.pause(); });
  renderNav();
  document.title = L ? `${L.title} – LLM Concept Lab` : HOME_TITLE;
  window.scrollTo(0, 0);
}
const HOME_TITLE = document.title;
function boot() {
  // Server-rendered text is for crawlers; the app replaces it. A crawlable ?lab=labN URL opens that lab.
  $('#ssr')?.remove();
  const q = new URLSearchParams(location.search).get('lab');
  if (q && !location.hash && LABS.some(l => l.id === q)) history.replaceState(null, '', location.pathname + '#' + q);
  $('#mnav').addEventListener('change', e => { location.hash = e.target.value; });
  window.addEventListener('hashchange', show);
  show();
}
