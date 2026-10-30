// Illustrations and delight: hero art, per-lab icons, spotlight hover, confetti, rotating headline word.
const ART = {
  // 48x48 line icons, one per lab id; colour comes from CSS (.ic)
  icons: {
    lab1: '<circle cx="12" cy="24" r="7"/><circle cx="36" cy="24" r="7"/><path d="M19 24h10m-4-4 4 4-4 4"/>',
    lab2: '<path d="M6 40V28m10 12V18m10 22V24m10 12V30"/><path d="M4 14c10 0 14 14 40 6" stroke-dasharray="3 4"/>',
    lab3: '<path d="M8 34a16 16 0 0 1 32 0"/><path d="M24 34l9-10"/><circle cx="24" cy="34" r="2"/>',
    lab4: '<circle cx="24" cy="9" r="4"/><circle cx="10" cy="36" r="4"/><circle cx="24" cy="36" r="4"/><circle cx="38" cy="36" r="4"/><path d="M24 13v6M10 32v-6h28v6M24 19v13"/>',
    lab5: '<circle cx="12" cy="34" r="3"/><circle cx="34" cy="12" r="3"/><circle cx="38" cy="34" r="3"/><circle cx="14" cy="14" r="3"/><path d="M15 31l17-16m-5 0h5v5"/>',
    lab6: '<circle cx="8" cy="12" r="4"/><circle cx="8" cy="36" r="4"/><circle cx="8" cy="24" r="4"/><circle cx="40" cy="24" r="5"/><path d="M13 13l22 9M13 24h22M13 35l22-9"/>',
    lab7: '<circle cx="8" cy="24" r="5"/><circle cx="40" cy="12" r="4"/><circle cx="40" cy="36" r="4"/><circle cx="40" cy="24" r="4"/><path d="M13 22l22-9M13 24h23M13 26l22 9"/>',
    lab8: '<path d="M6 8v34h36"/><path d="M10 12c8 0 8 22 16 24s12 2 16 2"/>',
    lab9: '<rect x="5" y="16" width="20" height="16" rx="4"/><rect x="27" y="16" width="16" height="16" rx="4" stroke-dasharray="3 3"/><path d="M12 24h6"/>',
    lab10: '<path d="M34 14a14 14 0 1 0 4 10"/><path d="M34 6v8h-8"/><circle cx="24" cy="24" r="3"/>',
    lab11: '<rect x="4" y="14" width="14" height="20" rx="4"/><rect x="30" y="14" width="14" height="20" rx="4"/><path d="M20 24h8m-3-3 3 3-3 3"/>',
    lab12: '<rect x="6" y="6" width="36" height="36" rx="6"/><path d="M6 18h36M6 30h36M18 6v36M30 6v36"/><rect x="19" y="19" width="10" height="10" fill="currentColor" stroke="none" opacity=".35"/>'
  },
  icon(id) { return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${this.icons[id] || ''}</svg>`; },
  // Floating tokens joined by attention arcs that draw themselves.
  hero() {
    const toks = [['The', 30, 150, 1], ['cat', 130, 80, 3], ['sat', 235, 170, 4], ['on', 335, 90, 2], ['the', 420, 175, 1], ['mat', 520, 100, 3]];
    const arcs = [[1, 0], [2, 1], [3, 2], [4, 3], [5, 3], [5, 1], [2, 5]];
    const c = i => `var(--g${toks[i][3]})`;
    return `<svg class="hero-art" viewBox="0 0 600 260" role="img" aria-label="Words in a sentence linked by attention arcs">
      <defs><radialGradient id="o1"><stop offset="0" stop-color="var(--g1)" stop-opacity=".35"/><stop offset="1" stop-color="var(--g1)" stop-opacity="0"/></radialGradient>
      <radialGradient id="o2"><stop offset="0" stop-color="var(--g3)" stop-opacity=".3"/><stop offset="1" stop-color="var(--g3)" stop-opacity="0"/></radialGradient>
      <radialGradient id="o3"><stop offset="0" stop-color="var(--g4)" stop-opacity=".3"/><stop offset="1" stop-color="var(--g4)" stop-opacity="0"/></radialGradient></defs>
      <circle class="orb" cx="110" cy="70" r="110" fill="url(#o1)"/><circle class="orb d2" cx="470" cy="190" r="120" fill="url(#o2)"/><circle class="orb d3" cx="330" cy="60" r="90" fill="url(#o3)"/>
      ${arcs.map(([a, b], i) => { const x1 = toks[a][1] + 28, y1 = toks[a][2] + 14, x2 = toks[b][1] + 28, y2 = toks[b][2] + 14, my = Math.min(y1, y2) - 50 - i * 6; return `<path class="arc" style="--d:${i * .25}s" d="M${x1} ${y1} Q${(x1 + x2) / 2} ${my} ${x2} ${y2}" stroke="${c(a)}"/>`; }).join('')}
      ${toks.map(([t, x, y, k], i) => `<g class="tk" style="--d:${i * .4}s" transform="translate(${x} ${y})"><g class="bob"><rect width="56" height="28" rx="14" fill="var(--panel)" stroke="var(--g${k})" stroke-width="2"/><text x="28" y="19" text-anchor="middle" style="fill:var(--ink);font-size:14px;font-weight:600;font-family:var(--body)">${t}</text></g></g>`).join('')}
    </svg>`;
  },
  hello() {
    return `<section class="hero"><div class="hero-copy">
      <div class="eyebrow">Large Language Models · interactive</div>
      <h1>Learn how LLMs work by <span class="cyc" aria-live="off">breaking them</span>.</h1>
      <p class="lede">Twelve labs, one per exam topic. Every lab runs the real algorithm in your browser on data you can edit, shows what it produces, then shows what goes wrong without it.</p>
      <div class="cta"><a class="btn big-btn" href="#lab1">Start Lab 1</a><button class="btn ghost big-btn" type="button" data-scroll="#labgrid">Browse all labs</button></div>
      <div class="facts"><span><b>12</b> labs</span><span><b>0</b> installs</span><span><b>100%</b> in-browser</span></div>
    </div><div class="hero-fig">${this.hero()}</div></section>`;
  },
  burst() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 36; i++) { const p = document.createElement('i'); p.style.cssText = `--x:${(Math.random() - .5) * 700}px;--y:${-120 - Math.random() * 380}px;--r:${Math.random() * 720}deg;background:var(--g${1 + i % 4});animation-delay:${Math.random() * .12}s`; box.appendChild(p); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 1800);
  }
};

// spotlight follows the cursor on lab cards
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.lcard'); if (!c) return;
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-scroll]'); if (b) document.querySelector(b.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
});
// rotating headline word
const WORDS = ['breaking them', 'counting bigrams', 'training embeddings', 'unrolling RNNs', 'paying attention'];
let wi = 0;
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => {
  const el = document.querySelector('.view:not([hidden]) .cyc'); if (!el) return;
  el.classList.add('out'); setTimeout(() => { wi = (wi + 1) % WORDS.length; el.textContent = WORDS[wi]; el.classList.remove('out'); }, 260);
}, 2600);
