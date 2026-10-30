// ===== LAB 5: Word2Vec space =====
const EMB_DIMS = 18;
const EMB_RAW = [
  ['man', { 0: 1 }, [1, 1], 'people'], ['woman', { 0: 1, 1: 1 }, [1, 2.6], 'people'], ['boy', { 0: 1, 3: 1 }, [-0.2, 1.3], 'people'], ['girl', { 0: 1, 1: 1, 3: 1 }, [-0.2, 2.9], 'people'],
  ['king', { 0: 1, 2: 1 }, [3, 1.1], 'people'], ['queen', { 0: 1, 1: 1, 2: 1 }, [3, 2.7], 'people'], ['prince', { 0: 1, 2: 1, 3: 1 }, [1.9, 1.5], 'people'], ['princess', { 0: 1, 1: 1, 2: 1, 3: 1 }, [1.9, 3.1], 'people'],
  ['apple', { 4: 1 }, [-4, 4.6], 'food'], ['mango', { 4: 1, 9: .3 }, [-4.7, 5.4], 'food'], ['banana', { 4: 1 }, [-3.3, 5.3], 'food'], ['orange', { 4: 1, 1: .05 }, [-4.1, 6.2], 'food'],
  ['dog', { 5: 1 }, [-4, -1.5], 'animal'], ['puppy', { 5: 1, 3: 1 }, [-5.1, -0.6], 'animal'], ['cat', { 5: 1, 6: 1 }, [-2.6, -2.7], 'animal'], ['kitten', { 5: 1, 6: 1, 3: 1 }, [-3.7, -1.8], 'animal'],
  ['france', { 7: 1, 10: 1 }, [4.8, 5.2], 'place'], ['paris', { 8: 1, 10: 1 }, [6.4, 6.4], 'place'], ['india', { 7: 1, 9: 1 }, [4.8, 3.6], 'place'], ['delhi', { 8: 1, 9: 1 }, [6.4, 4.8], 'place'], ['japan', { 7: 1, 9: 1, 11: 1 }, [4.2, 6.8], 'place'], ['tokyo', { 8: 1, 9: 1, 11: 1 }, [5.8, 8], 'place'],
  ['walk', { 12: 1 }, [3.4, -2.6], 'verb'], ['walked', { 12: 1, 13: 1 }, [4.9, -3.6], 'verb'], ['swim', { 12: 1, 14: 1 }, [2.2, -3.8], 'verb'], ['swam', { 12: 1, 14: 1, 13: 1 }, [3.7, -4.8], 'verb'], ['run', { 12: 1, 15: 1 }, [4.6, -1.6], 'verb'], ['ran', { 12: 1, 15: 1, 13: 1 }, [6.1, -2.6], 'verb'],
  ['hotel', { 16: 1 }, [-1.4, -5], 'thing'], ['motel', { 16: 1, 17: 1 }, [-0.4, -5.7], 'thing'], ['car', { 17: 1, 15: .5 }, [0.9, -6.3], 'thing']
];
const EMB = (() => { const r = rng(7); return EMB_RAW.map(([w, ft, p, g]) => { const v = Array.from({ length: EMB_DIMS }, (_, i) => (ft[i] || 0) + (r() - .5) * 0.16); return { w, v, p, g }; }); })();
const GCOL = { people: 'var(--g1)', food: 'var(--g2)', animal: 'var(--g3)', place: 'var(--g5)', verb: 'var(--g4)', thing: 'var(--g6)', vehicle: 'var(--g6)', function: 'var(--g7)' };
lab({
  id: 'lab5', n: 5, short: 'Word2Vec', title: 'Word2Vec: meaning as a position in space',
  does: 'Gives every word a dense vector so similar words sit close and relations become directions.',
  without: 'words stay one-hot: no similarity, no analogies, and 50,000-dimensional sparse inputs.',
  lede: 'These are toy 18-dimensional embeddings drawn on a 2-D map. Click words to compare them, build analogies with vector arithmetic, and flip to one-hot to see everything you lose.',
  build(el) {
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>The embedding map</h2><p class="sub">Click two words to compare them. Colours are semantic groups the model was never told about; they emerge from context.</p>
      <div class="ctl">${seg('l5-rep', [['emb', 'Dense embeddings'], ['oh', 'One-hot']], 'emb')}</div>
      <div class="grid2"><div id="l5-map"></div><div><div id="l5-cmp"></div><div id="l5-nn" style="margin-top:10px"></div></div></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Analogies by arithmetic</h2><p class="sub">Compute A − B + C and find the nearest word (excluding A, B, C) by cosine similarity.</p>
      <div class="ctl"><select id="l5-a"></select><span class="big">−</span><select id="l5-b"></select><span class="big">+</span><select id="l5-c"></select><span class="big">≈</span><span class="big" id="l5-res" style="color:var(--good)"></span></div>
      <div class="chips">${[['king', 'man', 'woman'], ['paris', 'france', 'india'], ['walked', 'walk', 'swim'], ['kitten', 'cat', 'dog'], ['princess', 'prince', 'king']].map(t => `<button class="chip" data-an="${t.join('|')}">${t[0]} − ${t[1]} + ${t[2]}</button>`).join('')}</div>
      <div id="l5-an" style="margin-top:10px"></div></div>
    <div class="card"><div class="kicker">Experiment 3</div><h2>Similarity matrix</h2><p class="sub">Cosine similarity between eight words, in both representations.</p><div class="grid2"><div><h3>Dense embeddings</h3><div id="l5-h1"></div></div><div><h3>One-hot</h3><div id="l5-h2"></div></div></div></div>
    ${vs('Similar words get similar vectors: cos(motel, hotel) is high, cos(motel, banana) is near 0. Relations are directions, so king − man + woman lands on queen. A search for "Delhi motel" can also match "Delhi hotel". Vectors are 100–300 numbers instead of 50,000.',
      'With one-hot vectors every pair of different words has similarity 0, so nothing generalises: learning about "dog" teaches the model nothing about "puppy". Analogy arithmetic gives meaningless results.')}
    <div class="card"><h2>Where these vectors come from</h2><p style="margin:0">Word2Vec learns them from the <b>distributional hypothesis</b>: a word is known by the company it keeps. Two ways to set up the prediction task: <a href="#lab6">CBOW</a> predicts a word from its context; <a href="#lab7">skip-gram</a> predicts the context from the word. <a href="#lab8">Lab 8</a> trains real vectors live.</p></div>
    ${tryList(['Click "motel" then "hotel", then "motel" and "banana". Compare the cosine values.', 'Switch to one-hot and click the same pairs.', 'Try every analogy chip. Then build your own, e.g. tokyo − japan + france.', 'In the similarity matrix, notice that cat/kitten and dog/puppy pairs are bright and cross-group cells are dark.'])}
    ${quiz('lab5', [
      { q: 'king − man + woman ≈ queen works because', opts: ['The vectors are one-hot', 'The male→female offset is roughly the same direction for different word pairs', 'king and queen are spelled similarly', 'The model was given a dictionary'], a: 1, why: 'Embedding spaces encode relations as roughly consistent vector offsets.' },
      { q: 'Main advantage of dense embeddings over one-hot?', opts: ['They are longer', 'Similar words get similar vectors, so knowledge generalises', 'They need no training', 'They are always exactly orthogonal'], a: 1, why: 'Shared structure lets statistics learned for one word help similar words.' },
      { q: 'The distributional hypothesis says', opts: ['Frequent words are important', 'Words in similar contexts have similar meanings', 'Every word has one meaning', 'Word order does not matter'], a: 1, why: '"You shall know a word by the company it keeps."' }
    ])}`;
    let rep = 'emb'; let sel = ['motel', 'hotel'];
    const vec = w => EMB.find(e => e.w === w).v;
    const simf = (a, b) => rep === 'oh' ? (a === b ? 1 : 0) : cos(vec(a), vec(b));
    function map(an) {
      const W = 560, H = 430, X = x => 30 + (x + 6) / 13.5 * (W - 60), Y = y => H - 26 - (y + 7) / 15.5 * (H - 50);
      let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Embedding map">`;
      if (rep === 'oh') s += `<text x="${W / 2}" y="22" text-anchor="middle" style="fill:var(--bad)">one-hot: every word is equally far from every other</text>`;
      if (an) { const P = w => EMB.find(e => e.w === w).p; const [a, b, c, r] = an; s += `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--warn)"/></marker></defs>`; s += `<line x1="${X(P(b)[0])}" y1="${Y(P(b)[1])}" x2="${X(P(a)[0])}" y2="${Y(P(a)[1])}" stroke="var(--warn)" stroke-width="2" marker-end="url(#ah)"/>`; if (r) s += `<line x1="${X(P(c)[0])}" y1="${Y(P(c)[1])}" x2="${X(P(r)[0])}" y2="${Y(P(r)[1])}" stroke="var(--warn)" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#ah)"/>`; }
      EMB.forEach((e, i) => {
        const p = rep === 'oh' ? [Math.cos(i / EMB.length * 6.283) * 5.5 + 0.5, Math.sin(i / EMB.length * 6.283) * 6 + 0.5] : e.p;
        const on = sel.includes(e.w);
        s += `<g data-w="${e.w}" style="cursor:pointer"><circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${on ? 7 : 5}" fill="${rep === 'oh' ? 'var(--g7)' : GCOL[e.g]}" stroke="${on ? 'var(--ink)' : 'none'}" stroke-width="2"/><text x="${X(p[0]) + 8}" y="${Y(p[1]) + 4}" style="fill:var(--ink);font-size:12px;${on ? 'font-weight:700' : ''}">${e.w}</text></g>`;
      });
      $('#l5-map', el).innerHTML = s + '</svg>' + legend(Object.entries({ people: 1, food: 1, animal: 1, place: 1, verb: 1, thing: 1 }).map(([g]) => ({ label: g, color: GCOL[g] })));
    }
    function cmp() {
      const [a, b] = sel; const s = simf(a, b);
      $('#l5-cmp', el).innerHTML = `<div class="stat"><div><div class="k">cos(${a}, ${b})</div><div class="v ${s > .6 ? 'good' : s < .2 ? 'bad' : 'warn'}">${f(s, 3)}</div></div><div><div class="k">dimensions</div><div class="v">${rep === 'oh' ? EMB.length + ' (one per word)' : EMB_DIMS}</div></div></div>
      <div style="margin-top:8px" class="mono">${a} ${rep === 'oh' ? vecStrip(EMB.map(e => e.w === a ? 1 : 0), 1) : vecStrip(vec(a), 1)}<br>${b} ${rep === 'oh' ? vecStrip(EMB.map(e => e.w === b ? 1 : 0), 1) : vecStrip(vec(b), 1)}</div>`;
      const nn = EMB.filter(e => e.w !== a).map(e => ({ label: e.w, v: simf(a, e.w) })).sort((x, y) => y.v - x.v).slice(0, 6);
      $('#l5-nn', el).innerHTML = `<h3>Nearest to “${a}”</h3>` + hbars(nn.map(n => ({ ...n, v: Math.max(0, n.v), txt: f(n.v, 3) })), { max: 1 });
    }
    const opts = EMB.map(e => `<option>${e.w}</option>`).join('');
    ['a', 'b', 'c'].forEach(k => $('#l5-' + k, el).innerHTML = opts);
    function analogy() {
      const a = $('#l5-a', el).value, b = $('#l5-b', el).value, c = $('#l5-c', el).value;
      const t = vec(a).map((x, i) => x - vec(b)[i] + vec(c)[i]);
      const scored = EMB.filter(e => ![a, b, c].includes(e.w)).map(e => ({ label: e.w, v: rep === 'oh' ? 0 : cos(t, e.v) })).sort((x, y) => y.v - x.v);
      const best = rep === 'oh' ? null : scored[0].label;
      $('#l5-res', el).textContent = best || '?';
      $('#l5-an', el).innerHTML = rep === 'oh' ? `<div class="note bad">With one-hot vectors, ${a} − ${b} + ${c} is a vector with +1, −1, +1 in three slots. Its cosine with every other word is 0, so there is no answer.</div>` : hbars(scored.slice(0, 5).map(s => ({ ...s, v: Math.max(0, s.v), txt: f(s.v, 3), cls: s.label === best ? 'good' : '' })), { max: 1 }) + `<p class="muted" style="font-size:13.5px">The solid arrow is the offset ${b} → ${a}. The dashed arrow applies the same offset starting from ${c}.</p>`;
      map([a, b, c, best]);
    }
    function heats() {
      const ws = ['motel', 'hotel', 'cat', 'kitten', 'dog', 'puppy', 'apple', 'king'];
      $('#l5-h1', el).innerHTML = heat(ws.map(a => ws.map(b => cos(vec(a), vec(b)))), ws, ws, { max: 1 });
      $('#l5-h2', el).innerHTML = heat(ws.map(a => ws.map(b => a === b ? 1 : 0)), ws, ws, { max: 1, fmt: v => v });
    }
    bindSeg($('#l5-rep', el), v => { rep = v; cmp(); analogy(); });
    $('#l5-map', el).addEventListener('click', e => { const g = e.target.closest('[data-w]'); if (!g) return; sel = [sel[1], g.dataset.w]; if (sel[0] === sel[1]) sel[0] = 'man'; cmp(); analogy(); });
    el.addEventListener('click', e => { const c = e.target.closest('[data-an]'); if (!c) return; const [a, b, d] = c.dataset.an.split('|'); $('#l5-a', el).value = a; $('#l5-b', el).value = b; $('#l5-c', el).value = d; analogy(); });
    ['a', 'b', 'c'].forEach(k => $('#l5-' + k, el).addEventListener('change', analogy));
    $('#l5-a', el).value = 'king'; $('#l5-b', el).value = 'man'; $('#l5-c', el).value = 'woman';
    cmp(); analogy(); heats();
  }
});

// ===== shared corpus for labs 6–8 =====
function w2vCorpus(n, seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  const T = [
    () => ['the', pick(['cat', 'kitten']), pick(['drinks', 'laps']), 'milk'],
    () => ['the', pick(['dog', 'puppy']), pick(['eats', 'chews']), pick(['meat', 'bone'])],
    () => ['the', pick(['cow', 'horse']), pick(['eats', 'chews']), 'grass'],
    () => ['the', pick(['king', 'queen']), 'rules', 'the', pick(['kingdom', 'land'])],
    () => ['the', pick(['man', 'woman']), 'walks', 'to', 'the', pick(['market', 'office'])],
    () => ['the', pick(['car', 'bus']), 'drives', 'on', 'the', 'road'],
    () => ['the', pick(['boat', 'ship']), 'sails', 'on', 'the', pick(['river', 'sea'])]
  ];
  return Array.from({ length: n }, () => pick(T)());
}
const W2V_GROUP = { cat: 'animal', kitten: 'animal', dog: 'animal', puppy: 'animal', cow: 'animal', horse: 'animal', milk: 'food', meat: 'food', bone: 'food', grass: 'food', king: 'people', queen: 'people', man: 'people', woman: 'people', car: 'vehicle', bus: 'vehicle', boat: 'vehicle', ship: 'vehicle', kingdom: 'place', land: 'place', market: 'place', office: 'place', road: 'place', river: 'place', sea: 'place', drinks: 'verb', laps: 'verb', eats: 'verb', chews: 'verb', rules: 'verb', walks: 'verb', drives: 'verb', sails: 'verb', the: 'function', to: 'function', on: 'function' };
function vocabOf(corpus) { const cnt = {}; corpus.flat().forEach(w => cnt[w] = (cnt[w] || 0) + 1); const vocab = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]); const idx = {}; vocab.forEach((w, i) => idx[w] = i); return { cnt, vocab, idx }; }

// ===== LAB 6: CBOW =====
lab({
  id: 'lab6', n: 6, short: 'CBOW', title: 'CBOW: predict the missing word from its neighbours',
  does: 'Averages the context word vectors and predicts the centre word with a softmax.',
  without: 'no context means no information: the best the model can do is guess uniformly (or guess "the").',
  lede: 'A real CBOW network, trained in your browser on 400 short sentences (vocabulary of 36 words, 12-dimensional embeddings, full softmax). Click a word to hide it and see what the network predicts from its neighbours.',
  build(el) {
    const corpus = w2vCorpus(400, 3); const { vocab, idx } = vocabOf(corpus); const V = vocab.length, d = 12;
    const r = rng(5); const Win = vocab.map(() => Array.from({ length: d }, () => (r() - .5) * 0.5)); const Wout = vocab.map(() => Array.from({ length: d }, () => (r() - .5) * 0.5));
    const losses = [];
    for (let ep = 0; ep < 30; ep++) {
      let L = 0, n = 0; const lr = 0.08;
      for (const s of corpus) for (let t = 0; t < s.length; t++) {
        const ctx = []; for (let j = -2; j <= 2; j++) if (j && s[t + j]) ctx.push(idx[s[t + j]]);
        if (!ctx.length) continue;
        const h = new Array(d).fill(0); ctx.forEach(c => Win[c].forEach((x, i) => h[i] += x / ctx.length));
        const p = softmax(Wout.map(u => dot(u, h))); const y = idx[s[t]]; L += -Math.log(p[y]); n++;
        const gh = new Array(d).fill(0);
        for (let j = 0; j < V; j++) { const e = p[j] - (j === y ? 1 : 0); for (let i = 0; i < d; i++) { gh[i] += e * Wout[j][i]; Wout[j][i] -= lr * e * h[i]; } }
        ctx.forEach(c => { for (let i = 0; i < d; i++) Win[c][i] -= lr * gh[i] / ctx.length; });
      }
      losses.push([ep + 1, L / n]);
    }
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Hide a word, let CBOW guess it</h2>
      <p class="sub">Click any word to make it the target. Green words are the context inside the window. Click a green word's ✕ to drop it.</p>
      <div class="ctl"><button class="btn small ghost" id="l6-new">Another sentence</button><label>window m <input type="range" id="l6-m" min="0" max="3" step="1" value="2"><b id="l6-mv"></b></label><button class="btn small ghost" id="l6-shuf">Shuffle context order</button></div>
      <div id="l6-sent" class="chips" style="font-size:16px;margin:10px 0"></div>
      <div class="grid2"><div id="l6-flow"></div><div><h3>Top predictions</h3><div id="l6-pred"></div></div></div></div>
    <div class="grid2">
      <div class="card"><div class="kicker">Architecture</div><h2>What the network computes</h2><div class="eq">context one-hots x(t−m) … x(t+m)
        ↓ shared input matrix W (V × d)
h = (1/2m) Σ W[context word]          average, order ignored
        ↓ output matrix W′ (d × V)
z = W′ᵀ h,   ŷ = softmax(z)
loss = −log ŷ[target]

backprop:  e = ŷ − y
  W′ −= η · h eᵀ
  each context vector −= η · (1/2m) W′ e</div></div>
      <div class="card"><div class="kicker">Training run</div><h2>Loss while training</h2><p class="sub">Average cross-entropy per prediction over 30 passes. log(36) = ${f(Math.log(V), 2)} is a uniform guess.</p><div id="l6-loss"></div></div>
    </div>
    ${vs('The context "the ___ drinks milk" is enough to put cat/kitten at the top. Neighbouring words carry the meaning, and words that appear in the same slots (cat and kitten) end up with similar vectors.',
      'With window 0 the hidden vector is all zeros and the prediction is a flat 1/V for every word: the model has nothing to go on. Drop the most informative neighbour ("milk") and the prediction gets much less certain.')}
    ${tryList(['Hide "cat" in "the cat drinks milk". Then drop "milk" and see the prediction spread to other animals.', 'Press "Shuffle context order". The prediction does not change at all: CBOW is a bag of words.', 'Set the window to 0. Every word gets probability 1/36.', 'Hide "the". It is easy to predict: frequent words dominate CBOW, which is one reason CBOW is better on frequent words and skip-gram on rare ones.'])}
    ${quiz('lab6', [
      { q: 'CBOW predicts', opts: ['context words from the centre word', 'the centre word from the context words', 'the next sentence', 'the word frequency'], a: 1, why: 'Continuous Bag Of Words: context → target.' },
      { q: 'How does CBOW combine context vectors into h?', opts: ['Concatenation', 'Average (or sum)', 'Maximum', 'Product'], a: 1, why: 'h = (1/2m) Σ vectors, which is why word order inside the window is lost.' },
      { q: 'Why does shuffling the context words leave the prediction unchanged?', opts: ['Because of softmax', 'Averaging is order-independent', 'Because the window is small', 'Because of negative sampling'], a: 1, why: 'The mean of a set does not depend on order.' },
      { q: 'Compared with skip-gram, CBOW is usually', opts: ['slower, better on rare words', 'faster, better on frequent words', 'identical', 'unable to learn embeddings'], a: 1, why: 'One prediction per position instead of 2m; averaging smooths over context.' }
    ])}`;
    $('#l6-loss', el).innerHTML = lineChart([{ pts: losses, color: 'var(--accent)' }], { xlabel: 'epoch', ylabel: 'loss', ymin: 0, title: 'CBOW loss' });
    let sent = corpus[0], tgt = 1, dropped = new Set(), shuffled = false, sr = rng(9);
    function render() {
      const m = +$('#l6-m', el).value; $('#l6-mv', el).textContent = m;
      const ctxPos = []; for (let j = -m; j <= m; j++) if (j && sent[tgt + j] !== undefined) ctxPos.push(tgt + j);
      $('#l6-sent', el).innerHTML = sent.map((w, i) => i === tgt ? `<button class="chip on" data-i="${i}">?</button>` : ctxPos.includes(i) ? `<button class="chip ctx ${dropped.has(i) ? 'dim' : ''}" data-i="${i}" data-drop="${i}">${esc(w)} ${dropped.has(i) ? '↺' : '✕'}</button>` : `<button class="chip" data-i="${i}">${esc(w)}</button>`).join('');
      let used = ctxPos.filter(i => !dropped.has(i)); if (shuffled) used = [...used].sort(() => sr() - .5);
      const h = new Array(d).fill(0); used.forEach(i => Win[idx[sent[i]]].forEach((x, k) => h[k] += x / used.length));
      const p = softmax(Wout.map(u => dot(u, h)));
      const mx = Math.max(.5, ...used.flatMap(i => Win[idx[sent[i]]].map(Math.abs)));
      $('#l6-flow', el).innerHTML = `<h3>Inside the network</h3>` + (used.length ? used.map(i => `<div class="mono" style="font-size:13px">${esc(sent[i]).padEnd(8, ' ')} ${vecStrip(Win[idx[sent[i]]], mx)}</div>`).join('') + `<div class="mono" style="font-size:13px;margin-top:6px"><b>h = avg</b> ${vecStrip(h, mx)}</div><p class="muted" style="font-size:13px">Order used: ${used.map(i => sent[i]).join(', ')}</p>` : `<div class="note bad">No context words. h = 0, so every score is 0 and softmax gives 1/${V} = ${f(1 / V, 3)} to every word.</div>`);
      const top = p.map((v, i) => ({ label: vocab[i], v, cls: vocab[i] === sent[tgt] ? 'good' : '' })).sort((a, b) => b.v - a.v).slice(0, 8);
      const rank = p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).findIndex(x => vocab[x[1]] === sent[tgt]) + 1;
      $('#l6-pred', el).innerHTML = hbars(top, { max: 1 }) + `<div class="note ${rank === 1 ? 'good' : rank <= 3 ? '' : 'warn'}">True word “${esc(sent[tgt])}” is ranked #${rank} with P = ${f(p[idx[sent[tgt]]], 3)}.</div>`;
    }
    $('#l6-sent', el).addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; if (b.dataset.drop) { const i = +b.dataset.drop; dropped.has(i) ? dropped.delete(i) : dropped.add(i); } else { tgt = +b.dataset.i; dropped = new Set(); } shuffled = false; render(); });
    $('#l6-new', el).addEventListener('click', () => { sent = corpus[Math.floor(sr() * corpus.length)]; tgt = Math.min(1, sent.length - 1); dropped = new Set(); shuffled = false; render(); });
    $('#l6-shuf', el).addEventListener('click', () => { shuffled = true; render(); });
    $('#l6-m', el).addEventListener('input', () => { dropped = new Set(); render(); });
    render();
  }
});

// ===== LAB 7: Skip-gram =====
lab({
  id: 'lab7', n: 7, short: 'Skip-gram', title: 'Skip-gram: one word, many training pairs',
  does: 'Uses the centre word to predict each neighbour, producing (target, context) training pairs.',
  without: 'negative sampling, each pair needs a softmax over the whole vocabulary, which is millions of operations.',
  lede: 'Turn a sentence into skip-gram training data, add negative samples, and use the cost calculator to see why the full-softmax version is impractical.',
  build(el) {
    const bg = w2vCorpus(400, 3); const base = vocabOf(bg).cnt;
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Generate training pairs</h2>
      <div class="ctl"><input type="text" id="l7-s" value="the quick brown fox jumps over the lazy dog" style="flex:1;min-width:240px" aria-label="Sentence"></div>
      <div class="ctl"><label>window ±m <input type="range" id="l7-m" min="1" max="4" value="2"><b id="l7-mv"></b></label><label>negatives K <input type="range" id="l7-k" min="0" max="8" value="4"><b id="l7-kv"></b></label><label>α ${seg('l7-a', [['0', '0'], ['0.75', '0.75'], ['1', '1']], '0.75')}</label><button class="btn small ghost" id="l7-rs">Resample negatives</button></div>
      <p class="sub">Click a word to make it the target.</p><div id="l7-chips" class="chips" style="font-size:16px"></div>
      <div class="grid2" style="margin-top:12px"><div id="l7-pairs"></div><div><div class="stat" id="l7-cnt"></div><h3 style="margin-top:12px">Noise distribution P<sub>α</sub>(w)</h3><div id="l7-noise"></div></div></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Why not a full softmax?</h2>
      <div class="ctl"><label>vocabulary V <input type="range" id="l7-v" min="3" max="6.5" step="0.1" value="5.5"><b id="l7-vv"></b></label><label>corpus tokens <input type="range" id="l7-t" min="6" max="10" step="0.5" value="9"><b id="l7-tv"></b></label><label>K <input type="range" id="l7-k2" min="1" max="20" value="5"><b id="l7-k2v"></b></label></div>
      <div id="l7-cost"></div></div>
    <div class="card"><h2>The model</h2><div class="eq">Objective (full softmax):  J = (1/T) Σt Σ(−m≤j≤m, j≠0) log P(w(t+j) | w(t))
                           P(c | t) = exp(u_cᵀ v_t) / Σ(w=1..V) exp(u_wᵀ v_t)      ← sum over all V words

Negative sampling:         P(+ | t, c) = σ(u_cᵀ v_t)        P(− | t, c) = σ(−u_cᵀ v_t)
Two matrices:              W (target vectors v), C (context vectors u), both |V| × d</div></div>
    ${vs('Each pair needs only K + 1 dot products, so training on billions of words is feasible. Each occurrence of a word produces 2m updates as a target, which helps rare words get good vectors.',
      'A full softmax computes a score for every word in the vocabulary for every single pair. With V = 1,000,000 that is a million dot products per pair, making training thousands of times slower.')}
    ${tryList(['Increase the window from 1 to 4 and watch the number of skip-gram pairs grow while CBOW stays at one example per word.', 'Set K = 0: there are no negative pairs at all. Lab 8 shows what that does to the vectors.', 'Switch α from 1 to 0.75 and look at the noise bars: "the" shrinks and rare words grow.', 'In the cost calculator, push V to 3 million and compare the two times.'])}
    ${quiz('lab7', [
      { q: 'Sentence "quick brown fox jumps over", target fox, window ±2. How many positive pairs?', opts: ['2', '4', '5', '8'], a: 1, why: '(fox, quick), (fox, brown), (fox, jumps), (fox, over).' },
      { q: 'With negative sampling, a positive pair plus K negatives costs about', opts: ['V dot products', '(K + 1) dot products', 'K² dot products', '1 dot product'], a: 1, why: 'One for the positive and one per negative sample.' },
      { q: 'Skip-gram keeps two matrices because', opts: ['one for training and one for testing', 'a word has different roles as target and as context', 'to double the vocabulary', 'for CBOW compatibility'], a: 1, why: 'W stores target vectors v, C stores context vectors u; scores are u_cᵀ v_t.' }
    ])}`;
    let tgt = 3, alpha = 0.75, seed = 1;
    function noiseDist(words) { const cnt = { ...base }; words.forEach(w => cnt[w] = (cnt[w] || 0) + 1); const ks = Object.keys(cnt); const z = sum(ks.map(k => cnt[k] ** alpha)); return { ks, p: ks.map(k => cnt[k] ** alpha / z), cnt }; }
    function render() {
      const ws = tokenize($('#l7-s', el).value); const m = +$('#l7-m', el).value, K = +$('#l7-k', el).value;
      $('#l7-mv', el).textContent = m; $('#l7-kv', el).textContent = K; if (tgt >= ws.length) tgt = 0;
      $('#l7-chips', el).innerHTML = ws.map((w, i) => `<button class="chip ${i === tgt ? 'on' : Math.abs(i - tgt) <= m ? 'ctx' : ''}" data-i="${i}">${esc(w)}</button>`).join('');
      const pos = []; for (let j = -m; j <= m; j++) if (j && ws[tgt + j]) pos.push(ws[tgt + j]);
      const nd = noiseDist(ws); const r = rng(seed * 97 + tgt);
      const negs = []; while (negs.length < K * pos.length && negs.length < 60) { let x = r(), i = 0; while (i < nd.ks.length - 1 && (x -= nd.p[i]) > 0) i++; if (nd.ks[i] !== ws[tgt]) negs.push(nd.ks[i]); }
      $('#l7-pairs', el).innerHTML = `<div class="tbl"><table><tr><th>target</th><th>context</th><th>label</th></tr>${pos.map(c => `<tr><td class="mono">${esc(ws[tgt])}</td><td class="mono">${esc(c)}</td><td><span class="chip ctx static">+1 real</span></td></tr>`).join('')}${negs.slice(0, 24).map(c => `<tr><td class="mono">${esc(ws[tgt])}</td><td class="mono">${esc(c)}</td><td><span class="chip neg static">0 noise</span></td></tr>`).join('')}</table></div>${negs.length > 24 ? `<p class="muted">… and ${negs.length - 24} more negatives</p>` : ''}`;
      let sg = 0; ws.forEach((_, i) => { for (let j = -m; j <= m; j++) if (j && ws[i + j]) sg++; });
      $('#l7-cnt', el).innerHTML = `<div><div class="k">CBOW examples (whole sentence)</div><div class="v">${ws.length}</div></div><div><div class="k">skip-gram positive pairs</div><div class="v">${sg}</div></div><div><div class="k">with K = ${K} negatives</div><div class="v">${sg * (K + 1)}</div></div>`;
      const show = ['the', 'on', 'to', ...ws.filter(w => !['the', 'on', 'to'].includes(w)).slice(0, 6)];
      const raw = noiseDist.call(null, ws);
      $('#l7-noise', el).innerHTML = hbars([...new Set(show)].map(w => { const i = raw.ks.indexOf(w); return { label: w, v: raw.p[i] || 0, txt: f((raw.p[i] || 0) * 100, 2) + '%' }; })) + `<p class="muted" style="font-size:13px">Counts come from the Lab 6 corpus plus this sentence. α = 1 lets "the" dominate; α = 0 makes all words equally likely; 0.75 sits between.</p>`;
    }
    function cost() {
      const V = 10 ** +$('#l7-v', el).value, T = 10 ** +$('#l7-t', el).value, K = +$('#l7-k2', el).value, d = 300, m = 5;
      $('#l7-vv', el).textContent = Math.round(V).toLocaleString(); $('#l7-tv', el).textContent = Math.round(T).toLocaleString(); $('#l7-k2v', el).textContent = K;
      const pairs = T * 2 * m; const full = pairs * V * d * 2, neg = pairs * (K + 1) * d * 2; const flops = 1e11;
      const t = s => s < 60 ? f(s, 1) + ' s' : s < 3600 ? f(s / 60, 1) + ' min' : s < 86400 * 2 ? f(s / 3600, 1) + ' h' : s < 86400 * 365 * 2 ? f(s / 86400, 1) + ' days' : f(s / 86400 / 365, 1) + ' years';
      $('#l7-cost', el).innerHTML = `<div class="stat"><div><div class="k">training pairs per epoch (m = 5)</div><div class="v">${pairs.toExponential(1)}</div></div><div><div class="k">full softmax, one epoch</div><div class="v bad">${t(full / flops)}</div></div><div><div class="k">negative sampling, one epoch</div><div class="v good">${t(neg / flops)}</div></div><div><div class="k">speed-up</div><div class="v">${Math.round(V / (K + 1)).toLocaleString()}×</div></div></div><p class="muted" style="font-size:13px">Assumes d = 300 and 100 GFLOP/s. Full softmax: V·d multiply-adds per pair. Negative sampling: (K+1)·d.</p>`;
    }
    $('#l7-chips', el).addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { tgt = +b.dataset.i; render(); } });
    ['#l7-s', '#l7-m', '#l7-k'].forEach(s => $(s, el).addEventListener('input', render));
    bindSeg($('#l7-a', el), v => { alpha = +v; render(); });
    $('#l7-rs', el).addEventListener('click', () => { seed++; render(); });
    ['#l7-v', '#l7-t', '#l7-k2'].forEach(s => $(s, el).addEventListener('input', cost));
    render(); cost();
  }
});

// ===== LAB 8: train SGNS =====
lab({
  id: 'lab8', n: 8, short: 'Training Word2Vec', title: 'Training Word2Vec live: negative sampling, α and subsampling',
  does: 'Pulls real (word, context) pairs together and pushes random pairs apart until meaning-groups form.',
  without: 'negatives, every vector is pulled together and all words collapse into one blob (everything looks similar).',
  lede: 'Skip-gram with negative sampling running in your browser on 500 sentences. Press Train and watch groups form. Then set K = 0, reset and train again to see what negative samples are for.',
  build(el) {
    const corpus = w2vCorpus(500, 11); const { cnt, vocab, idx } = vocabOf(corpus); const V = vocab.length, d = 10, total = sum(Object.values(cnt));
    const P = { lr: 0.1, K: 5, alpha: 0.75, sub: false, m: 2 };
    let Wv, Cu, running = false, raf = 0, steps = 0, epoch = 0, queue = [], lossEMA = null, hist = [], selWord = 'cat';
    function reset() { const r = rng(42); Wv = vocab.map(() => Array.from({ length: d }, () => (r() - .5) * 0.2)); Cu = vocab.map(() => Array.from({ length: d }, () => (r() - .5) * 0.2)); steps = 0; epoch = 0; queue = []; lossEMA = null; hist = []; }
    let noise = [];
    function buildNoise() { const z = sum(vocab.map(w => cnt[w] ** P.alpha)); let c = 0; noise = vocab.map(w => (c += cnt[w] ** P.alpha / z)); }
    const r = rng(77);
    function sampleNeg() { const x = r(); let lo = 0, hi = V - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (noise[mid] < x) lo = mid + 1; else hi = mid; } return lo; }
    const tkeep = 0.01; const keepP = w => { const z = cnt[w] / total; return Math.min(1, (Math.sqrt(z / tkeep) + 1) * tkeep / z); };
    function makeEpoch() { const pairs = []; for (const s0 of corpus) { const s = P.sub ? s0.filter(w => r() < keepP(w)) : s0; for (let t = 0; t < s.length; t++) for (let j = -P.m; j <= P.m; j++) if (j && s[t + j]) pairs.push([idx[s[t]], idx[s[t + j]]]); } for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; } return pairs; }
    function step(t, c) {
      const v = Wv[t], u = Cu[c]; const sp = sigmoid(dot(u, v)); let L = -Math.log(sp + 1e-12); const gv = u.map(x => (sp - 1) * x);
      for (let i = 0; i < d; i++) u[i] -= P.lr * (sp - 1) * v[i];
      for (let k = 0; k < P.K; k++) { const n = sampleNeg(); if (n === c) continue; const un = Cu[n]; const sn = sigmoid(dot(un, v)); L += -Math.log(1 - sn + 1e-12); for (let i = 0; i < d; i++) { gv[i] += sn * un[i]; un[i] -= P.lr * sn * v[i]; } }
      for (let i = 0; i < d; i++) v[i] -= P.lr * gv[i];
      return L;
    }
    const content = vocab.filter(w => W2V_GROUP[w] !== 'function');
    function metrics() {
      let a = 0, n = 0, wi = 0, wn = 0, ac = 0, an = 0;
      for (let i = 0; i < content.length; i++) for (let j = i + 1; j < content.length; j++) { const c = cos(Wv[idx[content[i]]], Wv[idx[content[j]]]); a += c; n++; if (W2V_GROUP[content[i]] === W2V_GROUP[content[j]]) { wi += c; wn++; } else { ac += c; an++; } }
      return { avg: a / n, within: wi / wn, across: ac / an };
    }
    function pca() {
      const X = Wv.map(v => v.slice()); const mu = new Array(d).fill(0); X.forEach(v => v.forEach((x, i) => mu[i] += x / V)); X.forEach(v => v.forEach((x, i) => v[i] -= mu[i]));
      const Cm = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => sum(X.map(v => v[i] * v[j]))));
      const pw = (M) => { let b = Array.from({ length: d }, (_, i) => Math.sin(i + 1)); for (let it = 0; it < 60; it++) { const nb = M.map(row => dot(row, b)); const nn = norm(nb) || 1; b = nb.map(x => x / nn); } return b; };
      const e1 = pw(Cm); const l1 = dot(e1, Cm.map(row => dot(row, e1))); const C2 = Cm.map((row, i) => row.map((x, j) => x - l1 * e1[i] * e1[j])); const e2 = pw(C2);
      return X.map(v => [dot(v, e1), dot(v, e2)]);
    }
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Train it</h2>
      <div class="ctl"><button class="btn" id="l8-go">Train</button><button class="btn ghost" id="l8-reset">Reset vectors</button><span class="mono muted" id="l8-ep"></span></div>
      <div class="ctl"><label>learning rate <input type="range" id="l8-lr" min="0.005" max="0.3" step="0.005" value="0.1"><b id="l8-lrv"></b></label>
      <label>negatives K ${seg('l8-k', [['0', '0'], ['1', '1'], ['5', '5'], ['10', '10']], '5')}</label>
      <label>α ${seg('l8-a', [['0', '0'], ['0.75', '0.75'], ['1', '1']], '0.75')}</label>
      <label>window ${seg('l8-m', [['1', '±1'], ['2', '±2'], ['3', '±3']], '2')}</label>
      <label><input type="checkbox" id="l8-sub"> subsample frequent words</label></div>
      <div class="grid2"><div id="l8-plot"></div><div><div class="stat" id="l8-stats"></div><div id="l8-hist" style="margin-top:8px"></div><h3 style="margin-top:8px">Nearest to <select id="l8-sel"></select></h3><div id="l8-nn"></div></div></div>
      <div id="l8-msg"></div></div>
    <div class="grid2">
      <div class="card"><div class="kicker">Experiment 2</div><h2>Which words get picked as negatives?</h2><p class="sub">P<sub>α</sub>(w) = count(w)<sup>α</sup> / Σ count<sup>α</sup>. Changes with the α buttons above.</p><div id="l8-neg"></div></div>
      <div class="card"><div class="kicker">Experiment 3</div><h2>Subsampling frequent words</h2><p class="sub">Probability of keeping each occurrence (t = 0.01, scaled up for this tiny corpus).</p><div id="l8-subtab"></div></div>
    </div>
    <div class="card"><div class="kicker">Exam calculator</div><h2>One SGD step by hand</h2><p class="sub">Defaults are the worked example in your notes (d = 2, K = 1). Change any number.</p>
      <div class="ctl"><label>v_t <input type="number" id="c-v1" value="0.5" step="0.1"><input type="number" id="c-v2" value="0.2" step="0.1"></label><label>u_pos <input type="number" id="c-p1" value="0.4" step="0.1"><input type="number" id="c-p2" value="0.1" step="0.1"></label><label>u_neg <input type="number" id="c-n1" value="-0.3" step="0.1"><input type="number" id="c-n2" value="0.6" step="0.1"></label><label>η <input type="number" id="c-eta" value="0.1" step="0.05"></label></div>
      <div class="eq" id="c-out"></div></div>
    ${vs('Real pairs are pulled together and random pairs pushed apart, so animals, foods, vehicles and places form separate clusters. α = 0.75 gives rare words enough negative updates. Subsampling stops "the" from flooding the training pairs.',
      'With K = 0 only the attraction term exists. All vectors drift toward each other and the average similarity between unrelated words approaches 1: the embedding says everything means the same thing. With α = 1 the negatives are mostly "the", "on" and "to", so content words learn slowly.')}
    <div class="card"><h2>The equations being run</h2><div class="eq">L = −log σ(u_posᵀ v_t) − Σk log σ(−u_kᵀ v_t)
∂L/∂v_t   = [σ(u_posᵀ v_t) − 1] u_pos + Σk σ(u_kᵀ v_t) u_k
∂L/∂u_pos = [σ(u_posᵀ v_t) − 1] v_t          ∂L/∂u_k = σ(u_kᵀ v_t) v_t
update:     θ ← θ − η ∂L/∂θ                  identity used: 1 − σ(−x) = σ(x)
keep word:  P(w) = (√(z(w)/t) + 1) · t / z(w)</div></div>
    ${tryList(['Train with the defaults for about 10 epochs. The within-group similarity should climb well above the across-group value.', 'Reset, set K = 0, train again. Watch "average similarity" race toward 1 and the clusters merge.', 'Reset with α = 1 and compare how fast clusters form versus α = 0.75.', 'Turn on subsampling and look at the "pairs with the" count in Experiment 3.', 'Use the exam calculator to check a hand-computed answer.'])}
    ${quiz('lab8', [
      { q: 'If you train skip-gram with K = 0 negatives, the vectors tend to', opts: ['form perfect clusters', 'all become similar to each other', 'stay random', 'become one-hot'], a: 1, why: 'Only the attraction term is optimised, and pushing every dot product up is easiest by making all vectors point the same way.' },
      { q: 'With counts a: 99%, b: 1%, α = 0.75 changes P(b) to about', opts: ['1%', '3%', '25%', '0.75%'], a: 1, why: '0.01^0.75 / (0.99^0.75 + 0.01^0.75) ≈ 0.03.' },
      { q: '∂L/∂v_t for the positive term alone is', opts: ['σ(uᵀv) u', '[σ(uᵀv) − 1] u', '[1 − σ(uᵀv)] v', 'σ(−uᵀv) v'], a: 1, why: 'd/dx[−log σ(x)] = σ(x) − 1, times ∂x/∂v = u.' },
      { q: 'Why subsample instead of deleting all stop words?', opts: ['It is faster to code', 'Frequent words can still carry meaning ("not good")', 'Stop words are rare', 'To increase the vocabulary'], a: 1, why: 'Frequency is not uselessness; random dropping keeps some occurrences.' }
    ])}`;
    $('#l8-sel', el).innerHTML = content.map(w => `<option ${w === 'cat' ? 'selected' : ''}>${w}</option>`).join('');
    function draw() {
      const pts = pca(); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const W = 520, H = 400, X = x => 20 + (x - x0) / ((x1 - x0) || 1) * (W - 100), Y = y => H - 20 - (y - y0) / ((y1 - y0) || 1) * (H - 40);
      let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Embedding projection">`;
      vocab.forEach((w, i) => { const g = W2V_GROUP[w]; s += `<circle cx="${X(pts[i][0])}" cy="${Y(pts[i][1])}" r="${w === selWord ? 7 : 4.5}" fill="${GCOL[g]}"/><text x="${X(pts[i][0]) + 7}" y="${Y(pts[i][1]) + 4}" style="fill:var(--ink);font-size:11.5px">${w}</text>`; });
      $('#l8-plot', el).innerHTML = s + '</svg>' + legend(['animal', 'food', 'people', 'vehicle', 'place', 'verb', 'function'].map(g => ({ label: g, color: GCOL[g] }))) + '<p class="muted" style="font-size:12.5px">2-D PCA projection of the 10-D target vectors.</p>';
      const m = metrics(); hist.push([epoch + (queue.length ? 1 - queue.length / Math.max(1, queue.total) : 0), m.avg, m.within, m.across]); if (hist.length > 300) hist.shift();
      $('#l8-stats', el).innerHTML = `<div><div class="k">loss (moving avg)</div><div class="v">${lossEMA == null ? '—' : f(lossEMA, 3)}</div></div><div><div class="k">avg similarity, all pairs</div><div class="v ${m.avg > .7 ? 'bad' : ''}">${f(m.avg, 3)}</div></div><div><div class="k">within group</div><div class="v good">${f(m.within, 3)}</div></div><div><div class="k">across groups</div><div class="v">${f(m.across, 3)}</div></div>`;
      if (hist.length > 1) $('#l8-hist', el).innerHTML = lineChart([{ pts: hist.map(h => [h[0], h[2]]), color: 'var(--good)' }, { pts: hist.map(h => [h[0], h[3]]), color: 'var(--accent)' }, { pts: hist.map(h => [h[0], h[1]]), color: 'var(--bad)', dash: true }], { h: 170, xlabel: 'epoch', ymin: -0.5, ymax: 1, title: 'similarity over training' }) + legend([{ color: 'var(--good)', label: 'within group' }, { color: 'var(--accent)', label: 'across groups' }, { color: 'var(--bad)', label: 'all pairs' }]);
      const sv = Wv[idx[selWord]]; const nn = content.filter(w => w !== selWord).map(w => ({ label: w, v: cos(sv, Wv[idx[w]]) })).sort((a, b) => b.v - a.v).slice(0, 5);
      $('#l8-nn', el).innerHTML = hbars(nn.map(n => ({ ...n, v: Math.max(0, n.v), txt: f(n.v, 3), cls: W2V_GROUP[n.label] === W2V_GROUP[selWord] ? 'good' : 'bad' })), { max: 1 });
      $('#l8-ep', el).textContent = `epoch ${epoch} · ${steps.toLocaleString()} pair updates`;
      $('#l8-msg', el).innerHTML = P.K === 0 && epoch >= 2 ? `<div class="note bad">K = 0: no negative samples. Average similarity is ${f(m.avg, 2)} and climbing. The vectors are collapsing together.</div>` : m.within - m.across > 0.15 && epoch >= 2 ? `<div class="note good">Clusters have formed: words in the same group are ${f(m.within - m.across, 2)} more similar than words in different groups.</div>` : '';
    }
    function negPanel() {
      buildNoise(); const z = sum(vocab.map(w => cnt[w] ** P.alpha)); const z1 = sum(vocab.map(w => cnt[w]));
      const ws = ['the', 'on', 'to', 'eats', 'cat', 'ship', 'laps', 'kingdom'];
      $('#l8-neg', el).innerHTML = `<div class="tbl"><table><tr><th>word</th><th class="num">count</th><th class="num">P (α = 1)</th><th class="num">P (α = ${P.alpha})</th></tr>${ws.map(w => `<tr><td class="mono">${w}</td><td class="num">${cnt[w]}</td><td class="num">${f(cnt[w] / z1 * 100, 2)}%</td><td class="num ${cnt[w] ** P.alpha / z > cnt[w] / z1 ? 'okc' : ''}">${f(cnt[w] ** P.alpha / z * 100, 2)}%</td></tr>`).join('')}</table></div>`;
    }
    function subPanel() {
      const ws = ['the', 'on', 'to', 'eats', 'cat', 'ship', 'laps']; let withThe = 0, all = 0; corpus.forEach(s => s.forEach((w, t) => { for (let j = -P.m; j <= P.m; j++) if (j && s[t + j]) { all++; if (w === 'the' || s[t + j] === 'the') withThe++; } }));
      const kt = keepP('the');
      $('#l8-subtab', el).innerHTML = `<div class="tbl"><table><tr><th>word</th><th class="num">freq z(w)</th><th class="num">P(keep)</th></tr>${ws.map(w => `<tr><td class="mono">${w}</td><td class="num">${f(cnt[w] / total, 3)}</td><td class="num">${f(keepP(w), 2)}</td></tr>`).join('')}</table></div><div class="stat" style="margin-top:8px"><div><div class="k">pairs containing "the", no subsampling</div><div class="v bad">${withThe} of ${all}</div></div><div><div class="k">expected with subsampling</div><div class="v good">≈ ${Math.round(withThe * kt)}</div></div></div>`;
    }
    function frame() {
      if (!running) return;
      for (let b = 0; b < 600; b++) { if (!queue.length) { if (steps) epoch++; queue = makeEpoch(); queue.total = queue.length; } const [t, c] = queue.pop(); const L = step(t, c); lossEMA = lossEMA == null ? L : lossEMA * 0.995 + L * 0.005; steps++; }
      draw(); raf = requestAnimationFrame(frame);
    }
    const go = $('#l8-go', el);
    function setRun(v) { running = v; go.textContent = v ? 'Pause' : 'Train'; if (v) raf = requestAnimationFrame(frame); else cancelAnimationFrame(raf); }
    this.pause = () => setRun(false);
    go.addEventListener('click', () => setRun(!running));
    $('#l8-reset', el).addEventListener('click', () => { reset(); draw(); });
    $('#l8-lr', el).addEventListener('input', e => { P.lr = +e.target.value; $('#l8-lrv', el).textContent = P.lr; });
    bindSeg($('#l8-k', el), v => { P.K = +v; });
    bindSeg($('#l8-a', el), v => { P.alpha = +v; negPanel(); });
    bindSeg($('#l8-m', el), v => { P.m = +v; queue = []; subPanel(); });
    $('#l8-sub', el).addEventListener('change', e => { P.sub = e.target.checked; queue = []; });
    $('#l8-sel', el).addEventListener('change', e => { selWord = e.target.value; draw(); });
    function calc() {
      const g = id => +$('#' + id, el).value; const v = [g('c-v1'), g('c-v2')], up = [g('c-p1'), g('c-p2')], un = [g('c-n1'), g('c-n2')], eta = g('c-eta');
      const dp = dot(up, v), dn = dot(un, v), sp = sigmoid(dp), sn = sigmoid(dn); const L = -Math.log(sp) - Math.log(sigmoid(-dn));
      const gv = v.map((_, i) => (sp - 1) * up[i] + sn * un[i]); const gup = v.map(x => (sp - 1) * x), gun = v.map(x => sn * x);
      const F = a => '[' + a.map(x => f(x, 3)).join(', ') + ']';
      $('#c-out', el).textContent = `u_posᵀv = ${f(dp, 4)}   σ = ${f(sp, 4)}
u_negᵀv = ${f(dn, 4)}   σ = ${f(sn, 4)}
L = −log ${f(sp, 4)} − log σ(${f(-dn, 3)}) = ${f(-Math.log(sp), 4)} + ${f(-Math.log(sigmoid(-dn)), 4)} = ${f(L, 4)}
∂L/∂v_t   = (${f(sp, 3)} − 1)·${F(up)} + ${f(sn, 3)}·${F(un)} = ${F(gv)}
∂L/∂u_pos = ${F(gup)}      ∂L/∂u_neg = ${F(gun)}
new v_t   = ${F(v)} − ${eta}·${F(gv)} = ${F(v.map((x, i) => x - eta * gv[i]))}
new u_pos = ${F(up.map((x, i) => x - eta * gup[i]))}      new u_neg = ${F(un.map((x, i) => x - eta * gun[i]))}`;
    }
    $$('[id^="c-"]', el).forEach(i => i.addEventListener('input', calc));
    $('#l8-lrv', el).textContent = P.lr;
    reset(); buildNoise(); negPanel(); subPanel(); draw(); calc();
  }
});
