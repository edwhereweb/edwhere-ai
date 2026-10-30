// ===== LAB 9: WordPiece vs BPE =====
function parseWF(txt) { return txt.split('\n').map(l => l.trim().split(/\s+/)).filter(a => a[0]).map(a => [a[0].toLowerCase(), Math.max(1, parseInt(a[1]) || 1)]); }
function tkStart(c, kind) { return c.map(([w, n]) => ({ w, n, seg: kind === 'wp' ? [w[0], ...[...w.slice(1)].map(ch => '##' + ch)] : [...w, '</w>'] })); }
function tkCands(words, kind) {
  const fq = new Map(), pq = new Map();
  for (const x of words) { for (const t of x.seg) fq.set(t, (fq.get(t) || 0) + x.n); for (let i = 0; i < x.seg.length - 1; i++) { const k = x.seg[i] + '\u0001' + x.seg[i + 1]; pq.set(k, (pq.get(k) || 0) + x.n); } }
  const arr = [...pq.entries()].map(([k, c], order) => { const [a, b] = k.split('\u0001'); return { a, b, c, fa: fq.get(a), fb: fq.get(b), score: kind === 'wp' ? c / (fq.get(a) * fq.get(b)) : c, order }; });
  arr.sort((x, y) => (y.score - x.score) || (x.order - y.order)); return arr;
}
const tkJoin = (a, b, kind) => kind === 'wp' ? a + (b.startsWith('##') ? b.slice(2) : b) : a + b;
function tkMerge(st) {
  const c = tkCands(st.words, st.kind)[0]; if (!c) return null; const nt = tkJoin(c.a, c.b, st.kind);
  st.words.forEach(x => { const o = []; for (let i = 0; i < x.seg.length; i++) { if (i < x.seg.length - 1 && x.seg[i] === c.a && x.seg[i + 1] === c.b) { o.push(nt); i++; } else o.push(x.seg[i]); } x.seg = o; });
  st.vocab.add(nt); st.merges.push({ a: c.a, b: c.b, nt, score: c.score, c: c.c, fa: c.fa, fb: c.fb }); return c;
}
function wpTokenize(w, vocab) {
  const out = [], steps = []; let s = 0;
  while (s < w.length) { let e = w.length, found = null; while (e > s) { const sub = (s > 0 ? '##' : '') + w.slice(s, e); if (vocab.has(sub)) { found = sub; break; } e--; } if (!found) return { toks: ['[UNK]'], steps: [...steps, { rem: w.slice(s), m: 'no match → whole word becomes [UNK]' }], unk: true }; steps.push({ rem: w.slice(s), m: found }); out.push(found); s = e; }
  return { toks: out, steps };
}
function bpeTokenize(w, st) { let seg = [...w, '</w>'].map(c => st.base.has(c) ? c : '[UNK]'); for (const m of st.merges) { const o = []; for (let i = 0; i < seg.length; i++) { if (i < seg.length - 1 && seg[i] === m.a && seg[i + 1] === m.b) { o.push(m.nt); i++; } else o.push(seg[i]); } seg = o; } return seg; }
lab({
  id: 'lab9', n: 9, short: 'WordPiece', title: 'WordPiece vs BPE: building a subword vocabulary',
  does: 'Learns reusable pieces so new words are split into known parts instead of becoming unknown.',
  without: 'a word-level tokenizer maps every new word to [UNK]; a character-level one makes sequences many times longer.',
  lede: 'Both algorithms start from characters and merge pairs. BPE merges the most frequent pair. WordPiece merges the pair with the highest score f(xy) / (f(x)·f(y)). Step them side by side on the same corpus, then tokenize new words.',
  build(el) {
    const PRESETS = { slides: 'sunflower 1\nsun 2\nflower 1\nflow 1\nflowers 1\nflowing 2\nflows 2\nflowed 1', low: 'low 5\nlower 2\nnewest 6\nwidest 3', bpe: 'low 1\nlower 1\nlowest 1' };
    el.innerHTML = `
    <div class="card"><div class="kicker">Setup</div><h2>Training corpus (word frequency)</h2>
      <div class="ctl"><span class="chips"><button class="chip" data-pre="slides">WordPiece slide corpus</button><button class="chip" data-pre="low">low / newest / widest</button><button class="chip" data-pre="bpe">BPE slide corpus</button></span></div>
      <textarea id="l9-c" rows="5" spellcheck="false"></textarea>
      <div class="ctl"><button class="btn" id="l9-m1">Merge next (both)</button><button class="btn ghost" id="l9-m5">Merge ×5</button><button class="btn ghost" id="l9-r">Reset</button></div></div>
    <div class="grid2"><div class="card" id="l9-bpe"></div><div class="card" id="l9-wp"></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Tokenize a new word</h2>
      <div class="ctl"><input type="text" id="l9-w" value="flowering" style="width:200px" aria-label="Word to tokenize"><span class="chips">${['flowering', 'sunflowers', 'fused', 'flowwing', 'zebra'].map(w => `<button class="chip" data-w="${w}">${w}</button>`).join('')}</span></div>
      <div id="l9-out"></div></div>
    ${vs('Unseen words like "flowering" become known pieces (flow + ##er + ##ing). The vocabulary stays small, frequent words stay whole, and sequences stay short. No [UNK] as long as the characters were seen.',
      'Word-level tokenization turns "flowering" into [UNK], so its meaning is lost. Character-level tokenization never fails but makes every word 5–10 tokens long, and attention cost grows with the square of sequence length.')}
    <div class="card"><h2>The WordPiece score</h2><div class="eq">score(x, y) = f(xy) / ( f(x) · f(y) )

derivation:  P(xy) / (P(x)·P(y)) = (f(xy)/N) / ((f(x)/N)(f(y)/N)) = N · f(xy) / (f(x)f(y))
             N is the same for every pair, so it does not change the ranking.</div>
    <p class="muted" style="margin:0">On the slide corpus: s + ##u = 3/(3·3) = 0.33 wins, while ##l + ##o is far more frequent (9) but scores only 9/(9·9) = 0.11. Note slide 17 prints f(u) = 9; the count of ##u is 3, which is what gives 0.33.</p></div>
    ${tryList(['Press "Merge next" once. BPE and WordPiece already disagree: BPE takes the most frequent pair, WordPiece the most "associated" pair.', 'Merge ×5 a few times, then tokenize "flowering". Compare the pieces from each method.', 'Tokenize "flowwing" (a typo). The pieces change a lot: tokenizers are sensitive to small spelling changes.', 'Tokenize "zebra": WordPiece hits a character it has never seen and outputs [UNK] for the whole word.', 'Load the BPE slide corpus (low/lower/lowest) and reproduce the slide merges: lo, low, lowe, lower.'])}
    ${quiz('lab9', [
      { q: 'WordPiece chooses the pair that maximises', opts: ['f(xy)', 'f(xy) / (f(x) f(y))', 'f(x) + f(y)', 'f(x) f(y)'], a: 1, why: 'A likelihood-style (PMI-like) score: how much more often x and y occur together than independence predicts.' },
      { q: 'f(s,##u) = 3, f(s) = 3, f(##u) = 3. Score?', opts: ['1', '0.33', '0.11', '3'], a: 1, why: '3 / (3 × 3) = 0.33.' },
      { q: 'At inference, WordPiece segments a word by', opts: ['replaying merges in order', 'greedy longest match from the left', 'random sampling', 'dynamic programming over all splits'], a: 1, why: 'Longest-match-first using the final vocabulary; BPE replays merges.' },
      { q: 'In BERT, "##ing" means', opts: ['a suffix morpheme', 'a piece that continues the previous token inside the same word', 'an unknown token', 'end of sentence'], a: 1, why: '## marks a word-internal piece; it is position bookkeeping, not linguistics.' }
    ])}`;
    let bpe, wp;
    function init() { const c = parseWF($('#l9-c', el).value); bpe = { kind: 'bpe', words: tkStart(c, 'bpe'), merges: [] }; wp = { kind: 'wp', words: tkStart(c, 'wp'), merges: [] };[bpe, wp].forEach(st => { st.vocab = new Set(st.words.flatMap(x => x.seg)); st.base = new Set(st.vocab); }); render(); }
    function panel(st, id) {
      const cands = tkCands(st.words, st.kind).slice(0, 7); const last = st.merges[st.merges.length - 1];
      $(id, el).innerHTML = `<div class="kicker">${st.kind === 'bpe' ? 'Byte Pair Encoding' : 'WordPiece'}</div><h2>${st.kind === 'bpe' ? 'BPE: most frequent pair' : 'WordPiece: highest score'}</h2>
      ${last ? `<div class="note good">Merge ${st.merges.length}: <b class="mono">${esc(last.a)} + ${esc(last.b)} → ${esc(last.nt)}</b> ${st.kind === 'wp' ? `(${last.c} / (${last.fa}·${last.fb}) = ${f(last.score, 3)})` : `(count ${last.c})`}</div>` : '<div class="note">No merges yet. Next pick is the top row.</div>'}
      <div class="tbl"><table><tr><th>pair</th><th class="num">f(xy)</th>${st.kind === 'wp' ? '<th class="num">f(x)</th><th class="num">f(y)</th>' : ''}<th class="num">${st.kind === 'wp' ? 'score' : 'freq'}</th></tr>${cands.map((c, i) => `<tr class="${i === 0 ? 'kept' : ''}"><td class="mono">${esc(c.a)} + ${esc(c.b)}</td><td class="num">${c.c}</td>${st.kind === 'wp' ? `<td class="num">${c.fa}</td><td class="num">${c.fb}</td>` : ''}<td class="num">${st.kind === 'wp' ? f(c.score, 3) : c.c}</td></tr>`).join('')}</table></div>
      <h3 style="margin-top:10px">Corpus now</h3><div style="display:grid;gap:4px">${st.words.map(x => `<div class="chips"><span class="muted mono" style="font-size:12px;min-width:2.4em">×${x.n}</span>${x.seg.map(t => `<span class="tok">${esc(t)}</span>`).join('')}</div>`).join('')}</div>
      <h3 style="margin-top:10px">Vocabulary (${st.vocab.size})</h3><div class="chips">${[...st.vocab].map(t => `<span class="chip static ${st.merges.some(m => m.nt === t) ? 'on' : ''}">${esc(t)}</span>`).join('')}</div>`;
    }
    function toks(arr) { return arr.map(t => `<span class="tok ${t.includes('[UNK]') ? 'unk' : ''}">${esc(t)}</span>`).join(' '); }
    function out() {
      const w = $('#l9-w', el).value.trim().toLowerCase().split(/\s+/)[0] || ''; if (!w) { $('#l9-out', el).innerHTML = ''; return; }
      const words = new Set(parseWF($('#l9-c', el).value).map(x => x[0]));
      const wr = wpTokenize(w, wp.vocab), br = bpeTokenize(w, bpe), wl = words.has(w) ? [w] : ['[UNK]'], cl = [...w];
      $('#l9-out', el).innerHTML = `<div class="tbl"><table><tr><th>Tokenizer</th><th>Tokens</th><th class="num">count</th></tr>
      <tr><td>Word-level</td><td>${toks(wl)}</td><td class="num">1</td></tr>
      <tr><td>Character-level</td><td>${toks(cl)}</td><td class="num">${cl.length}</td></tr>
      <tr><td>BPE (${bpe.merges.length} merges)</td><td>${toks(br)}</td><td class="num">${br.length}</td></tr>
      <tr><td>WordPiece (${wp.merges.length} merges)</td><td>${toks(wr.toks)}</td><td class="num">${wr.toks.length}</td></tr></table></div>
      <h3 style="margin-top:10px">WordPiece greedy longest-match, step by step</h3><div class="tbl"><table><tr><th>remaining</th><th>longest piece in vocabulary</th></tr>${wr.steps.map(s => `<tr><td class="mono">${esc(s.rem)}</td><td class="mono ${s.m.startsWith('no') ? 'zero' : ''}">${esc(s.m)}</td></tr>`).join('')}</table></div>`;
    }
    function render() { panel(bpe, '#l9-bpe'); panel(wp, '#l9-wp'); out(); }
    $('#l9-c', el).value = PRESETS.slides;
    el.addEventListener('click', e => { const p = e.target.closest('[data-pre]'); if (p) { $('#l9-c', el).value = PRESETS[p.dataset.pre]; init(); } const w = e.target.closest('[data-w]'); if (w) { $('#l9-w', el).value = w.dataset.w; out(); } });
    $('#l9-m1', el).addEventListener('click', () => { tkMerge(bpe); tkMerge(wp); render(); });
    $('#l9-m5', el).addEventListener('click', () => { for (let i = 0; i < 5; i++) { tkMerge(bpe); tkMerge(wp); } render(); });
    $('#l9-r', el).addEventListener('click', init);
    $('#l9-c', el).addEventListener('change', init);
    $('#l9-w', el).addEventListener('input', out);
    init();
  }
});

// ===== LAB 10: RNN =====
lab({
  id: 'lab10', n: 10, short: 'RNN', title: 'Recurrent neural networks: memory that fades',
  does: 'Carries a hidden state from word to word, so the output depends on the whole history and on word order.',
  without: 'recurrence, "dog bites man" and "man bites dog" look the same; with long sequences, the gradient to early words vanishes.',
  lede: 'Step through the scalar RNN from the slides, then stretch the sequence to see how much of the first word survives, and why the gradient vanishes (or explodes).',
  build(el) {
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Scalar RNN, step by step</h2><p class="sub">Slide 18 defaults: x = (1.0, 0.5, 2.0), wₓ = 0.5, wₕ = 0.8, w_y = 2.0, h₀ = 0, target 1.0.</p>
      <div class="ctl"><label>inputs x <input type="text" id="l10-x" value="1.0, 0.5, 2.0" style="width:150px"></label><label>wₓ <input type="range" id="l10-wx" min="-2" max="2" step="0.1" value="0.5"><b id="l10-wxv"></b></label><label>wₕ <input type="range" id="l10-wh" min="-2" max="2" step="0.1" value="0.8"><b id="l10-whv"></b></label><label>w_y <input type="range" id="l10-wy" min="-3" max="3" step="0.1" value="2"><b id="l10-wyv"></b></label><label>target y* <input type="number" id="l10-t" value="1.0" step="0.1"></label></div>
      <div id="l10-unroll" class="unroll"></div><div id="l10-tab" style="margin-top:10px"></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Does word order matter?</h2><p class="sub">Encode dog = 1, bites = 0.3, man = −1. Compare the final state h₃ of three models.</p><div id="l10-order"></div></div>
    <div class="card"><div class="kicker">Experiment 3</div><h2>How long does the memory last?</h2><p class="sub">Feed x₁ = 1 and then zeros. Track the hidden state and the gradient ∂h_T/∂h₁ = Π wₕ·f′(z_t).</p>
      <div class="ctl"><label>sequence length T <input type="range" id="l10-T" min="2" max="60" value="30"><b id="l10-Tv"></b></label><label>wₕ <input type="range" id="l10-w2" min="0" max="2" step="0.05" value="0.8"><b id="l10-w2v"></b></label><label>activation ${seg('l10-act', [['tanh', 'tanh'], ['lin', 'linear (no squash)']], 'tanh')}</label></div>
      <div class="grid2"><div><h3>|h_t| (what the network remembers)</h3><div id="l10-h"></div></div><div><h3>|∂h_t/∂h₁| (learning signal back to word 1, log scale)</h3><div id="l10-g"></div></div></div><div id="l10-gmsg"></div></div>
    <div class="card"><div class="kicker">Experiment 4</div><h2>Parameter count</h2>
      <div class="ctl"><label>dₓ <input type="number" id="l10-dx" value="300"></label><label>dₕ <input type="number" id="l10-dh" value="512"></label><label>V <input type="number" id="l10-V" value="10000"></label><label>sentence length T <input type="number" id="l10-TT" value="20"></label></div><div id="l10-par"></div></div>
    <div class="card"><h2>Forward equations</h2><div class="eq">h_t = tanh(W_hh h_(t−1) + W_xh x_t + b_h)          W_hh: dₕ×dₕ   W_xh: dₕ×dₓ
ŷ_t = softmax(W_hy h_t + b_y)                     W_hy: V×dₕ
L_t = −log ŷ_t[y*_t]        L = (1/T) Σ L_t
BPTT: ∂h_t/∂h_k = Π(j=k+1..t) diag(1 − h_j²) W_hh   → shrinks (vanishes) or grows (explodes) with t − k</div></div>
    ${vs('The hidden state carries earlier words forward, so h₃ depends on x₁, x₂ and x₃, and "dog bites man" differs from "man bites dog". The same three weight matrices handle any sentence length.',
      'With wₕ = 0 there is no memory: the output depends only on the last word. A bag-of-words sum gives identical results for both word orders. And even with recurrence, after 20–30 steps the gradient to the first word is near zero, which is why LSTM/GRU gates were invented.')}
    ${tryList(['Experiment 1: confirm h₁ = 0.46, h₂ = 0.55, h₃ = 0.89, y = 1.78, loss ≈ 0.30 (the slide uses rounded h₃).', 'Set wₕ = 0. h₃ now only depends on x₃.', 'Experiment 3: with tanh and wₕ = 0.8, how many steps until the gradient drops below 10⁻⁶?', 'Switch to linear and set wₕ = 1.2: the gradient explodes. That is why we use gradient clipping.', 'Parameter count: change T. The count does not move (weight sharing).'])}
    ${quiz('lab10', [
      { q: 'In h_t = tanh(W_hh h_(t−1) + W_xh x_t + b), the term W_hh h_(t−1) represents', opts: ['the new input', 'memory of previous words', 'the output', 'the loss'], a: 1, why: 'It carries information from earlier time steps.' },
      { q: 'With wₓ = 0.5, wₕ = 0.8, x = (1, 0.5) and h₀ = 0, h₂ is about', opts: ['0.46', '0.55', '0.62', '0.89'], a: 1, why: 'h₁ = tanh(0.5) = 0.46; z₂ = 0.25 + 0.8·0.46 = 0.62; tanh(0.62) = 0.55.' },
      { q: 'Vanishing gradients in plain RNNs are caused by', opts: ['softmax', 'repeated multiplication by factors smaller than 1 (wₕ·tanh′)', 'too many output classes', 'teacher forcing'], a: 1, why: 'BPTT multiplies one factor per step; tanh′ ≤ 1.' },
      { q: 'The number of RNN parameters depends on sentence length T?', opts: ['Yes, linearly', 'No, weights are shared across time', 'Only for the output layer', 'Yes, quadratically'], a: 1, why: 'Same W_xh, W_hh, W_hy at every step.' }
    ])}`;
    function step1() {
      const xs = $('#l10-x', el).value.split(/[ ,]+/).map(Number).filter(Number.isFinite); const wx = +$('#l10-wx', el).value, wh = +$('#l10-wh', el).value, wy = +$('#l10-wy', el).value, tg = +$('#l10-t', el).value;
      $('#l10-wxv', el).textContent = wx; $('#l10-whv', el).textContent = wh; $('#l10-wyv', el).textContent = wy;
      let h = 0; const rows = [];
      xs.forEach((x, i) => { const z = wx * x + wh * h; const nh = Math.tanh(z); rows.push({ t: i + 1, x, hp: h, z, h: nh }); h = nh; });
      const y = wy * h, L = 0.5 * (y - tg) ** 2;
      $('#l10-unroll', el).innerHTML = `<div class="cell">h₀<div class="hv">0</div></div>` + rows.map(r => `<div class="arrow mono muted" style="align-self:center">→</div><div class="cell" style="background:color-mix(in srgb, ${r.h < 0 ? 'var(--bad)' : 'var(--accent)'} ${Math.round(Math.abs(r.h) * 60)}%, var(--panel2))">x${r.t}=${r.x}<div class="hv">h${r.t}=${f(r.h, 2)}</div></div>`).join('') + `<div class="arrow mono muted" style="align-self:center">→</div><div class="cell">y = w_y·h<div class="hv">${f(y, 2)}</div></div>`;
      $('#l10-tab', el).innerHTML = `<div class="tbl"><table><tr><th>t</th><th class="num">x_t</th><th>z_t = wₓx_t + wₕh_(t−1)</th><th class="num">h_t = tanh(z_t)</th></tr>${rows.map(r => `<tr><td>${r.t}</td><td class="num">${r.x}</td><td class="mono">${wx}(${r.x}) + ${wh}(${f(r.hp, 3)}) = ${f(r.z, 3)}</td><td class="num">${f(r.h, 3)}</td></tr>`).join('')}</table></div>
      <div class="stat" style="margin-top:8px"><div><div class="k">prediction y</div><div class="v">${f(y, 3)}</div></div><div><div class="k">loss ½(y − y*)²</div><div class="v ${L < .05 ? 'good' : 'warn'}">${f(L, 3)}</div></div></div>`;
    }
    function order() {
      const E = { dog: 1, bites: 0.3, man: -1 }; const S = [['dog', 'bites', 'man'], ['man', 'bites', 'dog']];
      const rnn = (s, wh) => s.reduce((h, w) => Math.tanh(1 * E[w] + wh * h), 0); const bag = s => Math.tanh(sum(s.map(w => E[w])));
      const res = S.map(s => [bag(s), rnn(s, 0), rnn(s, 0.8)]);
      const M = ['Bag of words (sum)', 'No memory (wₕ = 0)', 'RNN (wₕ = 0.8)'];
      $('#l10-order', el).innerHTML = `<div class="tbl"><table><tr><th>Model</th><th class="num">dog bites man</th><th class="num">man bites dog</th><th>Can it tell them apart?</th></tr>${M.map((m, i) => `<tr><td>${m}</td><td class="num">${f(res[0][i], 3)}</td><td class="num">${f(res[1][i], 3)}</td><td>${Math.abs(res[0][i] - res[1][i]) < 1e-9 ? '<b style="color:var(--bad)">No, identical</b>' : i === 1 ? '<span style="color:var(--warn)">Only via the last word</span>' : '<b style="color:var(--good)">Yes, uses order and history</b>'}</td></tr>`).join('')}</table></div>`;
    }
    let act = 'tanh';
    function memory() {
      const T = +$('#l10-T', el).value, wh = +$('#l10-w2', el).value; $('#l10-Tv', el).textContent = T; $('#l10-w2v', el).textContent = wh;
      let h = 0, g = 1; const hp = [], gp = [];
      for (let t = 1; t <= T; t++) { const x = t === 1 ? 1 : 0; const z = x + wh * h; const nh = act === 'tanh' ? Math.tanh(z) : z; if (t > 1) g *= wh * (act === 'tanh' ? 1 - nh * nh : 1); h = nh; hp.push([t, Math.abs(h)]); gp.push([t, Math.max(Math.abs(g), 1e-30)]); }
      $('#l10-h', el).innerHTML = lineChart([{ pts: hp, color: 'var(--accent)' }], { h: 200, xlabel: 'time step t', ymin: 0, title: 'hidden state magnitude' });
      $('#l10-g', el).innerHTML = lineChart([{ pts: gp, color: 'var(--bad)' }], { h: 200, xlabel: 'time step t', logy: true, title: 'gradient magnitude' });
      const gT = Math.abs(g); let below = gp.findIndex(p => p[1] < 1e-6);
      $('#l10-gmsg', el).innerHTML = gT > 1e3 ? `<div class="note bad">Exploding gradient: after ${T} steps the gradient is ${f(gT, 2)}. Updates would be enormous. Fix: gradient clipping.</div>` : gT < 1e-4 ? `<div class="note bad">Vanishing gradient: the learning signal reaching word 1 is ${f(gT, 2)}${below >= 0 ? `, below 10⁻⁶ from step ${below + 1}` : ''}. The network cannot learn long-range dependencies. Fix: LSTM/GRU gates.</div>` : `<div class="note good">The gradient after ${T} steps is ${f(gT, 3)}, still usable. Try a longer sequence.</div>`;
    }
    function params() {
      const dx = +$('#l10-dx', el).value, dh = +$('#l10-dh', el).value, V = +$('#l10-V', el).value, T = +$('#l10-TT', el).value;
      const p = dh * dx + dh * dh + V * dh + dh + V;
      $('#l10-par', el).innerHTML = `<div class="eq">dₕ·dₓ + dₕ² + V·dₕ + dₕ + V = ${dh * dx} + ${dh * dh} + ${V * dh} + ${dh} + ${V} = ${p.toLocaleString()}</div><div class="stat"><div><div class="k">shared weights (RNN)</div><div class="v good">${p.toLocaleString()}</div></div><div><div class="k">if every step had its own weights</div><div class="v bad">${(p * T).toLocaleString()}</div></div></div>`;
    }
    $$('#l10-x,#l10-wx,#l10-wh,#l10-wy,#l10-t', el).forEach(i => i.addEventListener('input', step1));
    $$('#l10-T,#l10-w2', el).forEach(i => i.addEventListener('input', memory));
    bindSeg($('#l10-act', el), v => { act = v; memory(); });
    $$('#l10-dx,#l10-dh,#l10-V,#l10-TT', el).forEach(i => i.addEventListener('input', params));
    step1(); order(); memory(); params();
  }
});

// ===== LAB 11: Seq2Seq =====
const BT = {
  '': { 'मैं': .82, 'हम': .10, 'मुझे': .08 },
  'मैं': { 'हूँ': .41, 'खुश': .38, 'बहुत': .15, '<END>': .06 },
  'हम': { 'खुश': .50, 'हैं': .30, '<END>': .20 },
  'मुझे': { 'खुशी': .70, '<END>': .30 },
  'मैं हूँ': { 'खुश': .30, 'बहुत': .20, 'था': .15, '<END>': .05 },
  'मैं खुश': { 'हूँ': .90, 'था': .05, '<END>': .05 },
  'मैं बहुत': { 'खुश': .85, '<END>': .15 },
  'हम खुश': { 'हैं': .90, '<END>': .10 },
  'हम हैं': { '<END>': .90, 'खुश': .10 },
  'मुझे खुशी': { 'है': .90, '<END>': .10 },
  'मैं खुश हूँ': { '<END>': .95, 'आज': .02, '।': .03 },
  'मैं हूँ खुश': { '<END>': .60, 'था': .15, 'हूँ': .25 },
  'मैं हूँ बहुत': { 'खुश': .90, '<END>': .10 },
  'मैं बहुत खुश': { 'हूँ': .92, '<END>': .08 },
  'हम खुश हैं': { '<END>': .95, 'आज': .05 },
  'मुझे खुशी है': { '<END>': .97, '।': .03 }
};
const BT_DEF = { '<END>': .9, '।': .1 };
function beamCands(beam, k) { const c = []; beam.forEach(h => { const d = BT[h.toks.join(' ')] || BT_DEF; Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, k).forEach(([w, p]) => c.push({ toks: [...h.toks, w], score: h.score + Math.log(p), parent: h.score, w, p })); }); c.sort((a, b) => b.score - a.score); return c; }
function beamRun(k) { let beam = [{ toks: [], score: 0 }], fin = []; for (let t = 0; t < 6 && beam.length; t++) { const c = beamCands(beam, k).slice(0, k); beam = []; c.forEach(x => (x.w === '<END>' ? fin : beam).push(x)); } fin.sort((a, b) => b.score - a.score); return fin[0]; }
lab({
  id: 'lab11', n: 11, short: 'Seq2Seq & beam', title: 'Seq2Seq: encoder, decoder, attention and beam search',
  does: 'Reads a whole sentence into a vector, generates the translation word by word, and searches for the best output.',
  without: 'beam search, one early greedy choice locks in a worse translation; without attention, long sentences get squeezed through one vector.',
  lede: 'Run the translation "I am happy" → मैं खुश हूँ from the slides. Walk through the pipeline, see why teacher forcing and attention help, then play beam search yourself.',
  build(el) {
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>The pipeline, one step at a time</h2>
      <div class="ctl"><button class="btn small ghost" id="l11-prev">← Back</button><button class="btn small" id="l11-next">Next step →</button><span class="mono muted" id="l11-sn"></span></div>
      <div class="flow" id="l11-diag" style="margin:10px 0"></div><div id="l11-st"></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Beam search game</h2>
      <div class="ctl"><label>beam size k ${seg('l11-k', [['1', '1 (greedy)'], ['2', '2'], ['3', '3']], '2')}</label><label><input type="checkbox" id="l11-play"> Let me pick the survivors</label><label><input type="checkbox" id="l11-norm" checked> rank finished by length-normalised score</label></div>
      <div class="ctl"><button class="btn" id="l11-step">Next time step</button><button class="btn ghost" id="l11-all">Run to the end</button><button class="btn ghost" id="l11-reset">Reset</button></div>
      <div id="l11-beam"></div><div id="l11-cmp" style="margin-top:12px"></div></div>
    <div class="grid2">
      <div class="card"><div class="kicker">Experiment 3</div><h2>Teacher forcing</h2><p class="sub">During training, what does the decoder receive as its previous word? The model makes a mistake with probability p at each step.</p>
        <div class="ctl"><label>error rate p <input type="range" id="l11-p" min="0" max="0.4" step="0.02" value="0.15"><b id="l11-pv"></b></label></div><div id="l11-tf"></div></div>
      <div class="card"><div class="kicker">Experiment 4</div><h2>The bottleneck and attention</h2><p class="sub">Illustrative model: without attention, the encoder state keeps a fraction 0.85 of each word per step it has to travel.</p>
        <div class="ctl"><label>source length <input type="range" id="l11-L" min="3" max="40" value="12"><b id="l11-Lv"></b></label></div><div id="l11-bn"></div></div>
    </div>
    <div class="card"><div class="kicker">Experiment 5</div><h2>Attention at decoder step 1 (slide 55–59 numbers)</h2><p class="sub">Change the decoder state s₁ and see where the decoder looks.</p>
      <div class="ctl" id="l11-s"></div><div class="grid2"><div id="l11-att"></div><div id="l11-att2"></div></div></div>
    ${vs('The encoder–decoder maps any-length input to any-length output. Teacher forcing makes training stable. Attention gives the decoder direct access to every source word. Beam search keeps alternatives alive and finds मैं खुश हूँ (−1.33).',
      'Greedy decoding grabs हूँ at step 2 because 0.41 > 0.38 and ends with the worse मैं हूँ खुश (−2.80). Without attention, early words of long sentences fade from the single vector c. Without teacher forcing, one early training mistake corrupts every later input.')}
    <div class="card"><h2>Equations</h2><div class="eq">encoder:   h_t = tanh(W_hh h_(t−1) + W_xh x_t + b)        c = h_T,  s₀ = c
decoder:   s_t = tanh(U_ss s_(t−1) + U_ys y_(t−1) + b)      P(y_t) = softmax(W_o s_t)
sentence:  P(Y | X) = Π_t P(y_t | y_(<t), X)                loss = −Σ_t log P(y*_t)
attention: e_t,i = s_tᵀ h_i   α_t = softmax(e_t)   a_t = Σ α_t,i h_i   c_t = [a_t ; s_t]
beam:      score_t = score_(t−1) + log P(y_t | y_(<t), x)    final: score / length</div></div>
    ${tryList(['Run beam search with k = 1 and then k = 2. Which translation does each find?', 'Turn on "Let me pick the survivors" and play k = 2 yourself.', 'Teacher forcing: raise p to 0.3 and see how quickly the free-running decoder loses the correct history.', 'Bottleneck: set the source length to 40 and look at how much of word 1 survives without attention.', 'Attention: make s₁ close to h₃ and watch the weight move to हूँ.'])}
    ${quiz('lab11', [
      { q: 'Beam search with k = 2 keeps', opts: ['the 2 best full sentences only at the end', 'the 2 highest-scoring partial hypotheses at every step', '2 random hypotheses', 'every hypothesis with probability above 0.2'], a: 1, why: 'Expand → score → keep top k → repeat.' },
      { q: 'Parent score −0.20, P(next) = 0.38. New score is', opts: ['−0.58', '−1.17', '−0.076', '−0.97'], a: 1, why: '−0.20 + ln 0.38 = −0.20 − 0.97 = −1.17.' },
      { q: 'Teacher forcing means', opts: ['the decoder is fed the correct previous word during training', 'the teacher model labels data', 'using beam search in training', 'freezing the encoder'], a: 0, why: 'Feed y*_(t−1), not the model\'s own guess, while training.' },
      { q: 'Why normalise beam scores by length?', opts: ['To make them positive', 'Each extra word adds a negative log-prob, so raw scores favour short outputs', 'To speed up search', 'Softmax requires it'], a: 1, why: 'Without normalisation the search prefers ending early.' },
      { q: 'The main problem attention solves in seq2seq is', opts: ['vocabulary size', 'compressing the whole source into one fixed vector c', 'teacher forcing', 'slow softmax'], a: 1, why: 'The bottleneck; attention lets each decoder step look at all encoder states.' }
    ])}`;
    // pipeline
    const H = [[0.91, 0.46, 0.76, -0.46], [0.90, -0.26, -0.12, -0.84], [-0.05, -0.81, -0.86, -0.40]];
    const nodes = [['x1', 'I'], ['x2', 'am'], ['x3', 'happy'], ['h1', 'h₁'], ['h2', 'h₂'], ['h3', 'h₃'], ['c', 'c = h₃'], ['s1', 's₁'], ['y1', 'मैं'], ['s2', 's₂'], ['y2', 'खुश'], ['s3', 's₃'], ['y3', 'हूँ'], ['y4', '<END>']];
    const ST = [
      ['x1 x2 x3', 'Step 1 · Embeddings', 'Each source word is looked up in a learned embedding table: "I", "am", "happy" → three vectors of size 3, e.g. x₁ = [1.0, 0.5, −0.5].'],
      ['x1 x2 x3 h1 h2 h3', 'Step 2 · Encoder', 'h_t = tanh(W_hh h_(t−1) + W_xh x_t + b), with W_hh = 0.5 I.\nh₁ = [0.91, 0.46, 0.76, −0.46]   h₂ = [0.90, −0.26, −0.12, −0.84]   h₃ = [−0.05, −0.81, −0.86, −0.40]'],
      ['h3 c', 'Step 3 · Sentence encoding', 'The final encoder state summarises the sentence: c = h₃. It becomes the decoder\'s starting state s₀ = c. Everything the decoder knows about the source must pass through these 4 numbers.'],
      ['c s1', 'Step 4 · Decoder update', 's_t = tanh(U_ss s_(t−1) + U_ys y_(t−1) + b), starting from s₀ = c and input <START>. s₁ = [0.75, 0.09, 0.52, −0.60].'],
      ['s1 y1', 'Step 5 · Choose a word', 'P(y₁) = softmax(W_o s₁) scores every Hindi word: मैं = 0.82, हम = 0.10, … Greedy takes मैं.'],
      ['y1 s2 y2 s3 y3 y4', 'Step 6 · Feed back and repeat', 'Each output becomes the next input. P(Y | X) = P(मैं | X)·P(खुश | मैं, X)·P(हूँ | मैं खुश, X)·P(<END> | …). The conditional part comes from c; the language-model part from feeding words back.'],
      ['y1 y2 y3 y4', 'Step 7 · Training loss', 'L = −Σ log P(y*_t). −log 0.82 ≈ 0.2 (good) vs −log 0.05 ≈ 3.0 (bad). With teacher forcing the decoder gets the correct previous word during training. Errors flow back decoder → c → encoder; all weights train together.'],
      ['h1 h2 h3 s1', 'Step 8 · Attention', 'Instead of relying only on c, decoder step 1 scores every encoder state: e = s₁ᵀh_i = [1.40, 1.09, −0.32] → α = [0.52, 0.38, 0.09] → a₁ = Σ α_i h_i = [0.81, 0.07, 0.27, −0.59] → predict from [a₁; s₁]. See Experiment 5.']
    ];
    let si = 0;
    function stage() {
      const on = ST[si][0].split(' ');
      $('#l11-diag', el).innerHTML = nodes.map(([id, t], i) => `${[3, 6, 7].includes(i) ? '<span class="arrow">⇒</span>' : ''}<span class="cell stage ${on.includes(id) ? 'on' : ''}" style="min-width:56px">${esc(t)}</span>`).join('');
      $('#l11-st', el).innerHTML = `<h3>${ST[si][1]}</h3><div class="eq" style="white-space:pre-wrap">${esc(ST[si][2])}</div>`;
      $('#l11-sn', el).textContent = `${si + 1} / ${ST.length}`;
    }
    $('#l11-next', el).addEventListener('click', () => { si = Math.min(ST.length - 1, si + 1); stage(); });
    $('#l11-prev', el).addEventListener('click', () => { si = Math.max(0, si - 1); stage(); });
    // beam game
    let k = 2, B, hist, pending, picked;
    function breset() { B = { beam: [{ toks: [], score: 0 }], fin: [], t: 0, done: false }; hist = []; pending = null; picked = new Set(); brender(); }
    const norm = h => h.score / h.toks.length;
    function resolve(c) { const keep = c.slice(0, k); hist.push({ t: B.t + 1, c, keep }); B.beam = []; keep.forEach(x => (x.w === '<END>' ? B.fin : B.beam).push(x)); B.t++; if (!B.beam.length || B.t >= 6) B.done = true; pending = null; picked = new Set(); }
    function bstep() {
      if (B.done) return;
      if (pending) { return; }
      const c = beamCands(B.beam, k);
      if ($('#l11-play', el).checked) { pending = c; picked = new Set(); } else resolve(c);
      brender();
    }
    function row(x, cls, i) { return `<tr class="${cls}" ${i != null ? `data-pk="${i}"` : ''}><td class="mono">${esc(x.toks.slice(0, -1).join(' ') || '<START>')}</td><td class="num">${f(x.parent, 2)}</td><td class="mono">${esc(x.w)}</td><td class="num">${f(x.p, 2)}</td><td class="num">${f(Math.log(x.p), 2)}</td><td class="num"><b>${f(x.score, 2)}</b></td></tr>`; }
    const thead = '<tr><th>hypothesis</th><th class="num">parent</th><th>next</th><th class="num">P</th><th class="num">log P</th><th class="num">new score</th></tr>';
    function brender() {
      let h = hist.map(s => `<h3 style="margin-top:12px">t = ${s.t}</h3><div class="tbl"><table>${thead}${s.c.map(x => row(x, s.keep.includes(x) ? (x.w === '<END>' ? 'done' : 'kept') : 'pruned')).join('')}</table></div>`).join('');
      if (pending) h += `<h3 style="margin-top:12px">t = ${B.t + 1}: pick the ${k} survivor${k > 1 ? 's' : ''} (${picked.size} chosen)</h3><div class="tbl"><table>${thead}${pending.map((x, i) => row(x, 'pick ' + (picked.has(i) ? 'picked' : ''), i)).join('')}</table></div><button class="btn small" id="l11-check" ${picked.size === k || picked.size === pending.length ? '' : 'disabled'}>Check my pick</button>`;
      if (!hist.length && !pending) h = '<div class="note">Start: one hypothesis &lt;START&gt; with score 0. Press "Next time step".</div>';
      const fin = [...B.fin].sort((a, b) => ($('#l11-norm', el).checked ? norm(b) - norm(a) : b.score - a.score));
      if (fin.length) h += `<h3 style="margin-top:12px">Finished hypotheses</h3><div class="tbl"><table><tr><th>translation</th><th class="num">score</th><th class="num">score / length</th></tr>${fin.map((x, i) => `<tr class="${i === 0 && B.done ? 'kept' : ''}"><td class="mono">${esc(x.toks.join(' '))}</td><td class="num">${f(x.score, 2)}</td><td class="num">${f(norm(x), 3)}</td></tr>`).join('')}</table></div>`;
      if (B.done) h += `<div class="note ${fin[0] && fin[0].toks[1] === 'खुश' ? 'good' : 'bad'}">Output: <b>${esc(fin[0] ? fin[0].toks.slice(0, -1).join(' ') : '(none)')}</b>. ${k === 1 ? 'Greedy committed to हूँ at t = 2 and could not recover.' : 'Keeping more than one hypothesis let खुश survive t = 2 and win later.'}</div>`;
      $('#l11-beam', el).innerHTML = h;
      const res = [1, 2, 3].map(kk => [kk, beamRun(kk)]);
      $('#l11-cmp', el).innerHTML = `<h3>Final answer for each beam size</h3><div class="tbl"><table><tr><th>k</th><th>translation</th><th class="num">score</th></tr>${res.map(([kk, r]) => `<tr><td>${kk}${kk === 1 ? ' (greedy)' : ''}</td><td class="mono">${esc(r.toks.slice(0, -1).join(' '))}</td><td class="num">${f(r.score, 2)}</td></tr>`).join('')}</table></div>`;
    }
    $('#l11-beam', el).addEventListener('click', e => {
      const r = e.target.closest('[data-pk]'); if (r && pending) { const i = +r.dataset.pk; picked.has(i) ? picked.delete(i) : picked.size < k && picked.add(i); brender(); return; }
      if (e.target.id === 'l11-check') { const right = new Set(pending.slice(0, k).map((_, i) => i)); const ok = [...picked].every(i => right.has(i)); const c = pending; resolve(c); brender(); $('#l11-beam', el).insertAdjacentHTML('afterbegin', `<div class="note ${ok ? 'good' : 'bad'}">${ok ? 'Correct: you kept the top-' + k + ' scores.' : 'Not quite. Beam search keeps the ' + k + ' highest total scores, shown in green.'}</div>`); }
    });
    bindSeg($('#l11-k', el), v => { k = +v; breset(); });
    $('#l11-step', el).addEventListener('click', bstep);
    $('#l11-all', el).addEventListener('click', () => { $('#l11-play', el).checked = false; pending = null; while (!B.done) resolve(beamCands(B.beam, k)); brender(); });
    $('#l11-reset', el).addEventListener('click', breset);
    $('#l11-norm', el).addEventListener('change', brender);
    $('#l11-play', el).addEventListener('change', () => { if (!$('#l11-play', el).checked && pending) { resolve(pending); brender(); } });
    // teacher forcing
    function tf() {
      const p = +$('#l11-p', el).value; $('#l11-pv', el).textContent = p; const L = 10, trials = 600; const r = rng(4);
      const ok = new Array(L).fill(0);
      for (let n = 0; n < trials; n++) { let good = true; for (let t = 0; t < L; t++) { if (good) ok[t]++; const pc = good ? 1 - p : 0.3; if (r() > pc) good = false; else if (!good && r() < 0.0) good = true; } }
      const fr = ok.map((v, t) => [t + 1, v / trials]), tfp = ok.map((_, t) => [t + 1, 1]);
      const target = ['the', 'cat', 'sat', 'on', 'the', 'mat', 'near', 'the', 'old', 'door']; const r2 = rng(Math.round(p * 1000) + 3);
      let good = true; const own = target.map((w, t) => { const outw = good ? (r2() < 1 - p ? w : ['a', 'dog', 'ran', 'in'][t % 4]) : ['a', 'dog', 'ran', 'in', 'big'][Math.floor(r2() * 5)]; if (outw !== w) good = false; return outw; });
      $('#l11-tf', el).innerHTML = lineChart([{ pts: tfp, color: 'var(--good)' }, { pts: fr, color: 'var(--bad)' }], { h: 190, ymin: 0, ymax: 1, xlabel: 'output position', ylabel: 'share with correct history', title: 'teacher forcing' }) + legend([{ color: 'var(--good)', label: 'teacher forcing (gold previous word)' }, { color: 'var(--bad)', label: 'free-running (own previous word)' }]) +
        `<div class="tbl" style="margin-top:8px"><table><tr><th>target</th>${target.map(w => `<td class="mono">${w}</td>`).join('')}</tr><tr><th>input, teacher forcing</th><td class="mono">&lt;S&gt;</td>${target.slice(0, -1).map(w => `<td class="mono okc">${w}</td>`).join('')}</tr><tr><th>input, free-running</th><td class="mono">&lt;S&gt;</td>${own.slice(0, -1).map((w, i) => `<td class="mono ${w === target[i] ? 'okc' : 'zero'}">${w}</td>`).join('')}</tr></table></div>`;
    }
    $('#l11-p', el).addEventListener('input', tf);
    function bn() {
      const L = +$('#l11-L', el).value; $('#l11-Lv', el).textContent = L;
      const items = Array.from({ length: L }, (_, i) => ({ label: 'word ' + (i + 1), v: 0.85 ** (L - 1 - i), cls: 0.85 ** (L - 1 - i) < 0.2 ? 'bad' : '' }));
      const shown = L > 14 ? [...items.slice(0, 7), ...items.slice(-7)] : items;
      $('#l11-bn', el).innerHTML = `<div class="grid2"><div><h3>Without attention</h3>${hbars(shown, { max: 1, fmt: v => f(v * 100, 0) + '%' })}</div><div><h3>With attention</h3>${hbars(shown.map(s => ({ label: s.label, v: 1, cls: 'good' })), { max: 1, fmt: () => 'direct' })}</div></div><div class="note">${L > 14 ? 'Middle words hidden. ' : ''}Word 1 keeps about ${f(0.85 ** (L - 1) * 100, 1)}% of its signal in c. With attention, the decoder reads every hᵢ directly at every step.</div>`;
    }
    $('#l11-L', el).addEventListener('input', bn);
    // attention inspector
    const s0 = [0.75, 0.09, 0.52, -0.60]; const SRC = ['मैं', 'खुश', 'हूँ'];
    $('#l11-s', el).innerHTML = s0.map((v, i) => `<label>s₁[${i + 1}] <input type="range" id="l11-s${i}" min="-1" max="1" step="0.01" value="${v}"><b id="l11-s${i}v"></b></label>`).join('') + '<button class="btn small ghost" id="l11-s-reset">Slide values</button>';
    function att() {
      const s = s0.map((_, i) => +$('#l11-s' + i, el).value); s.forEach((v, i) => $('#l11-s' + i + 'v', el).textContent = v.toFixed(2));
      const e = H.map(h => dot(s, h)); const a = softmax(e); const av = [0, 1, 2, 3].map(j => sum(H.map((h, i) => a[i] * h[j])));
      $('#l11-att', el).innerHTML = `<h3>Scores and weights</h3><div class="tbl"><table><tr><th>source</th><th class="num">e = s₁ᵀhᵢ</th><th class="num">exp(e)</th><th class="num">α</th></tr>${e.map((v, i) => `<tr><td>${SRC[i]}</td><td class="num">${f(v, 2)}</td><td class="num">${f(Math.exp(v), 2)}</td><td class="num"><b>${f(a[i], 2)}</b></td></tr>`).join('')}</table></div>` + hbars(SRC.map((w, i) => ({ label: w, v: a[i] })), { max: 1 });
      $('#l11-att2', el).innerHTML = `<h3>Context and output</h3><div class="eq">a₁ = Σ αᵢ hᵢ = [${av.map(x => f(x, 2)).join(', ')}]
c₁ = [a₁ ; s₁] = [${[...av, ...s].map(x => f(x, 2)).join(', ')}]
ŷ₁ = softmax(W_o c₁)</div><p class="muted">The decoder now "looks at" ${SRC[a.indexOf(Math.max(...a))]} most.</p>`;
    }
    $$('[id^="l11-s"]', el).forEach(i => i.addEventListener('input', att));
    $('#l11-s-reset', el).addEventListener('click', () => { s0.forEach((v, i) => $('#l11-s' + i, el).value = v); att(); });
    stage(); breset(); tf(); bn(); att();
  }
});

// ===== LAB 12: Scaled dot-product attention =====
lab({
  id: 'lab12', n: 12, short: 'Scaled attention', title: 'Scaled dot-product attention and the √dₖ',
  does: 'Lets every token build a new vector from the tokens most relevant to it.',
  without: 'the √dₖ scaling, large dimensions make softmax nearly one-hot and its gradients vanish.',
  lede: 'First, compute attention by hand on the slide example and edit the numbers. Then increase the key dimension and watch the unscaled softmax saturate while the scaled one stays healthy.',
  build(el) {
    const PRE = {
      money: { t: ['money', 'bank', 'grows'], Q: [[.18, .28], [.08, .22], [.14, .28]], K: [[.20, .21], [.34, .19], [.26, .26]], V: [[.13, .24], [.33, .10], [.20, .10]] },
      river: { t: ['river', 'bank', 'floods'], Q: [[2.7, .3], [2.4, .9], [2.1, .6]], K: [[3.0, .3], [.6, 2.7], [1.8, .9]], V: [[.9, .1], [.5, .5], [.7, .2]] }
    };
    let cur = JSON.parse(JSON.stringify(PRE.money)), scale = true;
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Attention by hand</h2>
      <div class="ctl"><span class="chips"><button class="chip on" data-pre="money">money bank grows (slide 7)</button><button class="chip" data-pre="river">river bank floods</button></span><label><input type="checkbox" id="l12-sc" checked> divide by √dₖ</label></div>
      <div class="grid3" id="l12-in"></div><div class="grid2" style="margin-top:12px"><div id="l12-S"></div><div id="l12-A"></div></div><div id="l12-O" style="margin-top:12px"></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Why divide by √dₖ?</h2><p class="sub">Random query and keys with independent N(0, 1) components, 8 keys. Drag the dimension up.</p>
      <div class="ctl"><label>dₖ <input type="range" id="l12-d" min="0" max="9" step="1" value="6"><b id="l12-dv"></b></label><button class="btn small ghost" id="l12-rs">New random vectors</button></div>
      <div class="grid2"><div><h3>Unscaled softmax(qkᵀ)</h3><div id="l12-u"></div></div><div><h3>Scaled softmax(qkᵀ / √dₖ)</h3><div id="l12-s"></div></div></div>
      <div class="grid2" style="margin-top:10px"><div><h3>Variance of scores vs dₖ</h3><div id="l12-var"></div></div><div><h3>Average largest attention weight vs dₖ</h3><div id="l12-max"></div></div></div></div>
    <div class="card"><div class="kicker">Experiment 3</div><h2>The slide's variance example</h2><p class="sub">Five vectors. Adding one dimension adds one more product to every score.</p><div id="l12-ex"></div></div>
    <div class="card"><h2>Equations</h2><div class="eq">Attention(Q, K, V) = softmax( Q Kᵀ / √dₖ ) V          Q = XW_Q, K = XW_K, V = XW_V
s_ij = q_i · k_j        a_ij = exp(s_ij) / Σ_k exp(s_ik)        o_i = Σ_j a_ij v_j

If q, k have independent components with mean 0 and variance 1:
Var(q · k) = Σ_(i=1..dₖ) Var(q_i k_i) = dₖ        Var(q · k / √dₖ) = dₖ / dₖ = 1
softmax gradient: ∂a_i/∂s_i = a_i (1 − a_i) → 0 when a_i → 0 or 1</div></div>
    ${vs('Scores keep variance ≈ 1 whatever the dimension, so softmax spreads attention over several tokens and every score still gets a gradient. Training stays stable at dₖ = 64 or 128.',
      'At dₖ = 256 the raw scores have variance ≈ 256. Softmax puts nearly all weight on one key, a(1 − a) ≈ 0 everywhere, and learning stalls: only the "tallest" score is ever adjusted.')}
    ${tryList(['Experiment 1: check that each attention row sums to 1, and that the "money" output is about [0.22, 0.15].', 'Switch to "river bank floods": "bank" now attends mostly to "river". Untick the √dₖ box and see the weights sharpen even more.', 'Experiment 2: move dₖ from 1 to 512. Watch the unscaled max weight approach 1 and its gradient approach 0.', 'Compare the variance chart with the theory lines Var = dₖ and Var = 1.'])}
    ${quiz('lab12', [
      { q: 'If q and k components are independent with variance 1, Var(q·k) for dₖ = 64 is', opts: ['1', '8', '64', '4096'], a: 2, why: 'Sum of 64 independent terms each with variance 1.' },
      { q: 'Dividing by √dₖ makes the variance', opts: ['dₖ', '√dₖ', '1', '0'], a: 2, why: 'Var(X/c) = Var(X)/c² = dₖ/dₖ = 1.' },
      { q: 'Without scaling, at large dₖ the softmax output tends to be', opts: ['uniform', 'nearly one-hot', 'negative', 'unchanged'], a: 1, why: 'Large score gaps push almost all mass onto the largest score.' },
      { q: 'Each row of the attention matrix A', opts: ['sums to dₖ', 'sums to 1', 'is one-hot', 'equals V'], a: 1, why: 'Row-wise softmax gives a probability distribution over keys.' },
      { q: 'Shape of QKᵀ for n tokens is', opts: ['n × dₖ', 'dₖ × dₖ', 'n × n', 'n × 1'], a: 2, why: 'One score for every query–key pair, which is why attention cost is quadratic in n.' }
    ])}`;
    function inputs() {
      $('#l12-in', el).innerHTML = ['Q', 'K', 'V'].map(M => `<div class="box"><b>${M}</b> <span class="muted mono" style="font-size:12px">(3 × 2)</span><table>${cur.t.map((t, i) => `<tr><td class="mono" style="padding:3px 6px">${t}</td>${cur[M][i].map((v, j) => `<td style="padding:2px"><input type="number" step="0.01" data-m="${M}" data-i="${i}" data-j="${j}" value="${v}" style="width:72px" aria-label="${M} ${t} ${j + 1}"></td>`).join('')}</tr>`).join('')}</table></div>`).join('');
    }
    function compute() {
      const { t, Q, K, V } = cur; const dk = 2; const S = Q.map(q => K.map(k => dot(q, k))); const Ss = S.map(r => r.map(v => scale ? v / Math.sqrt(dk) : v)); const A = Ss.map(softmax); const O = A.map(a => [0, 1].map(j => sum(a.map((w, i) => w * V[i][j]))));
      $('#l12-S', el).innerHTML = `<h3>${scale ? 'S / √2' : 'S = QKᵀ (unscaled)'}</h3>` + heat(Ss, t, t, { fmt: v => f(v, 3) });
      $('#l12-A', el).innerHTML = `<h3>A = softmax (row-wise)</h3>` + heat(A, t, t, { max: 1 });
      $('#l12-O', el).innerHTML = `<h3>O = AV: new contextual vectors</h3><div class="tbl"><table><tr><th>token</th><th>weights</th><th>o_i</th></tr>${t.map((w, i) => `<tr><td class="mono">${w}</td><td class="mono" style="white-space:normal">${A[i].map((a, j) => `${f(a, 2)}·v(${t[j]})`).join(' + ')}</td><td class="mono"><b>[${O[i].map(x => f(x, 3)).join(', ')}]</b></td></tr>`).join('')}</table></div>`;
    }
    $('#l12-in', el).addEventListener('input', e => { const i = e.target; if (!i.dataset.m) return; cur[i.dataset.m][+i.dataset.i][+i.dataset.j] = +i.value; compute(); });
    el.addEventListener('click', e => { const p = e.target.closest('[data-pre]'); if (!p) return; $$('[data-pre]', el).forEach(b => b.classList.toggle('on', b === p)); cur = JSON.parse(JSON.stringify(PRE[p.dataset.pre])); inputs(); compute(); });
    $('#l12-sc', el).addEventListener('change', e => { scale = e.target.checked; compute(); });
    // scaling lab
    let seed = 3; const DIMS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
    function draw(q, ks, d, scaled) { const s = ks.map(k => dot(q, k) / (scaled ? Math.sqrt(d) : 1)); const a = softmax(s); const H = -sum(a.map(x => x > 0 ? x * Math.log2(x) : 0)); const g = sum(a.map(x => x * (1 - x))); return hbars(a.map((x, i) => ({ label: 'k' + (i + 1) + ' s=' + f(s[i], 1), v: x })), { max: 1 }) + `<div class="stat" style="margin-top:8px"><div><div class="k">largest weight</div><div class="v ${Math.max(...a) > .9 ? 'bad' : 'good'}">${f(Math.max(...a), 3)}</div></div><div><div class="k">entropy</div><div class="v">${f(H, 2)} bits</div></div><div><div class="k">gradient size Σa(1−a)</div><div class="v ${g < .1 ? 'bad' : 'good'}">${f(g, 3)}</div></div></div>`; }
    function scaling() {
      const d = DIMS[+$('#l12-d', el).value]; $('#l12-dv', el).textContent = d; const r = rng(seed * 13 + d);
      const q = Array.from({ length: d }, () => gauss(r)); const ks = Array.from({ length: 8 }, () => Array.from({ length: d }, () => gauss(r)));
      $('#l12-u', el).innerHTML = draw(q, ks, d, false); $('#l12-s', el).innerHTML = draw(q, ks, d, true);
    }
    function curves() {
      const r = rng(99); const vu = [], vs2 = [], mu = [], ms = [];
      DIMS.forEach(d => { const su = [], ssc = []; let mxu = 0, mxs = 0; for (let n = 0; n < 60; n++) { const q = Array.from({ length: d }, () => gauss(r)); const s = Array.from({ length: 8 }, () => dot(q, Array.from({ length: d }, () => gauss(r)))); su.push(...s); ssc.push(...s.map(x => x / Math.sqrt(d))); mxu += Math.max(...softmax(s)); mxs += Math.max(...softmax(s.map(x => x / Math.sqrt(d)))); } vu.push([d, variance(su)]); vs2.push([d, variance(ssc)]); mu.push([d, mxu / 60]); ms.push([d, mxs / 60]); });
      $('#l12-var', el).innerHTML = lineChart([{ pts: DIMS.map(d => [d, d]), color: 'var(--muted)', dash: true }, { pts: vu, color: 'var(--bad)', dots: true }, { pts: vs2, color: 'var(--good)', dots: true }], { logx: true, logy: true, h: 210, xlabel: 'dₖ (log)', title: 'variance' }) + legend([{ color: 'var(--bad)', label: 'unscaled (measured)' }, { color: 'var(--good)', label: 'scaled (measured)' }, { color: 'var(--muted)', label: 'theory: Var = dₖ' }]);
      $('#l12-max', el).innerHTML = lineChart([{ pts: mu, color: 'var(--bad)', dots: true }, { pts: ms, color: 'var(--good)', dots: true }], { logx: true, h: 210, ymin: 0, ymax: 1, xlabel: 'dₖ (log)', title: 'max weight' }) + legend([{ color: 'var(--bad)', label: 'unscaled' }, { color: 'var(--good)', label: 'scaled' }]);
    }
    function example() {
      const X2 = [[-1, -1], [1, -2], [2, 0], [-1, 2], [-1, 1]], X3 = [[-1, -1, 1], [1, -2, -2], [2, 0, 1], [-1, 2, 1], [-1, 1, -1]];
      const one = (X, d) => { const S = X.map(a => X.map(b => dot(a, b))); const v = mean(S.flat().map(x => x * x)); const lab = X.map((_, i) => 'x' + (i + 1)); return `<div><h3>d = ${d}</h3>${heat(S, lab, lab, { fmt: v => v })}<div class="stat" style="margin-top:6px"><div><div class="k">Var(S) = (1/25)Σ s²</div><div class="v ${d === 3 ? 'warn' : ''}">${f(v, 2)}</div></div><div><div class="k">after ÷ √${d}</div><div class="v good">${f(v / d, 2)}</div></div></div></div>`; };
      $('#l12-ex', el).innerHTML = `<div class="grid2">${one(X2, 2)}${one(X3, 3)}</div><div class="note">s₂₄ = x₂·x₄: (1)(−1) + (−2)(2) = −5 in 2-D, and −7 once the third dimension adds (−2)(1). Scaling by 1/√d brings both back to a comparable spread.</div>`;
    }
    $('#l12-d', el).addEventListener('input', scaling); $('#l12-rs', el).addEventListener('click', () => { seed++; scaling(); });
    inputs(); compute(); scaling(); curves(); example();
  }
});
