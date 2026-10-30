// ===== shared n-gram model (labs 1–3) =====
const LMSTATE = {
  text: `i like apples
i like bananas
i like apples
i like mangoes
i eat apples
you like bananas
you eat mangoes
we eat apples
they like mangoes
i like you`
};
function tokenize(s) { return s.toLowerCase().replace(/[^\p{L}\p{N}\s'<>\/]/gu, ' ').split(/\s+/).filter(Boolean); }
function lmBuild(text) {
  const sents = text.split(/\n+/).map(tokenize).filter(s => s.length).map(s => ['<s>', ...s, '</s>']);
  const uni = {}, bi = {}, ctx = {}; let N = 0;
  for (const w of sents) {
    for (let i = 0; i < w.length; i++) {
      if (i > 0) { uni[w[i]] = (uni[w[i]] || 0) + 1; N++; }
      if (i < w.length - 1) { ctx[w[i]] = (ctx[w[i]] || 0) + 1; (bi[w[i]] ||= {}); bi[w[i]][w[i + 1]] = (bi[w[i]][w[i + 1]] || 0) + 1; }
    }
  }
  const vocab = Object.keys(uni).sort((a, b) => a === '</s>' ? 1 : b === '</s>' ? -1 : a.localeCompare(b));
  const cont = {}, follow = {}; let B = 0;
  for (const u in bi) { follow[u] = Object.keys(bi[u]).length; for (const w in bi[u]) { cont[w] = (cont[w] || 0) + 1; B++; } }
  return { sents, uni, bi, ctx, N, vocab, V: vocab.length, cont, follow, B };
}
function pBi(m, prev, w, method, o = {}) {
  const c = (m.bi[prev] && m.bi[prev][w]) || 0, cp = m.ctx[prev] || 0, V = m.V;
  switch (method) {
    case 'mle': return cp ? c / cp : 0;
    case 'laplace': return (c + 1) / (cp + V);
    case 'addk': return (c + o.k) / (cp + o.k * V);
    case 'interp': { const pb = cp ? c / cp : 0; const pu = ((m.uni[w] || 0) + 1) / (m.N + V); return o.l * pb + (1 - o.l) * pu; }
    case 'kn': { const d = o.d ?? 0.75; const pc = ((m.cont[w] || 0) + 0.5) / (m.B + 0.5 * V); if (!cp) return pc; const lam = d * (m.follow[prev] || 0) / cp; return Math.max(c - d, 0) / cp + lam * pc; }
    case 'uni': return ((m.uni[w] || 0) + 1) / (m.N + V);
  }
}
function sentScore(m, words, method, o) {
  const w = ['<s>', ...words, '</s>']; let lp = 0, p = 1; const steps = [];
  for (let i = 1; i < w.length; i++) { const q = pBi(m, w[i - 1], w[i], method, o); steps.push({ prev: w[i - 1], w: w[i], p: q }); p *= q; lp += Math.log2(q); }
  const N = w.length - 1; return { p, lp, N, pp: p === 0 ? Infinity : Math.pow(2, -lp / N), steps };
}
function sampleFrom(dist, r) { const tot = sum(Object.values(dist)); let x = r() * tot; for (const k in dist) { x -= dist[k]; if (x <= 0) return k; } return Object.keys(dist).pop(); }

// ===== LAB 1 =====
lab({
  id: 'lab1', n: 1, short: 'Bigram & Markov', title: 'The Markov assumption and the bigram model',
  does: 'Turns raw counts into next-word probabilities using only the previous word.',
  without: 'the model needs the whole history, which has almost never been seen, so it outputs 0.',
  lede: 'Edit the training corpus, then watch how a bigram model scores and writes sentences. The "full history" column shows what happens if you drop the Markov assumption and condition on everything before the word.',
  build(el) {
    el.innerHTML = `
    <div class="grid2">
      <div class="card"><div class="kicker">Experiment 1</div><h2>Your training corpus</h2><p class="sub">One sentence per line. Every lab from 1 to 3 trains on this text.</p>
        <textarea id="l1-corpus" rows="10" spellcheck="false"></textarea>
        <div class="stat" id="l1-stats" style="margin-top:10px"></div></div>
      <div class="card"><div class="kicker">Experiment 2</div><h2>What comes next?</h2><p class="sub">Pick the previous word. Bars show P(next | previous) = C(previous next) / C(previous).</p>
        <div class="chips" id="l1-ctx"></div><div id="l1-next" style="margin-top:12px"></div></div>
    </div>
    <div class="card"><div class="kicker">Experiment 3</div><h2>Score a sentence: bigram vs. full history</h2>
      <p class="sub">The bigram column uses the Markov assumption. The full-history column counts how often the exact prefix (from &lt;s&gt;) occurs in the corpus and how often it is followed by the word.</p>
      <div class="ctl"><input type="text" id="l1-sent" value="you like apples" style="flex:1;min-width:200px" aria-label="Sentence to score">
      <span class="chips"><button class="chip" data-s="i like apples">i like apples</button><button class="chip" data-s="you like apples">you like apples</button><button class="chip" data-s="we like mangoes">we like mangoes</button><button class="chip" data-s="apples like i">apples like i</button></span></div>
      <div id="l1-score"></div></div>
    <div class="card"><div class="kicker">Experiment 4</div><h2>Let the model write</h2><p class="sub">Sampling one word at a time. The unigram model ignores the previous word; the bigram model uses it.</p>
      <div class="ctl"><button class="btn" id="l1-genb">Generate 5 with bigram</button><button class="btn ghost" id="l1-genu">Generate 5 with unigram</button></div>
      <div id="l1-gen" class="tbl"></div></div>
    ${vs('Every sentence gets a usable probability from short, frequent pieces. "you like apples" never appears in the corpus, yet the bigram model scores it because "you like" and "like apples" both appear. Generated text is locally fluent.',
      'Conditioning on the full history means counting the exact prefix. Any sentence not copied from the corpus hits a history seen 0 times, so its probability is 0 or undefined. The unigram extreme (no history at all) produces word salad like "apples i like".')}
    <div class="card"><h2>The equations at work</h2><div class="eq">Chain rule (exact):     P(w1..wn) = Π P(wk | w1..wk−1)
Markov (bigram):        P(wk | w1..wk−1) ≈ P(wk | wk−1)
MLE estimate:           P(wk | wk−1) = C(wk−1 wk) / C(wk−1)
Sentence:               P(&lt;s&gt; w1..wn &lt;/s&gt;) ≈ Π P(wk | wk−1)     (use log-probs to avoid underflow)</div>
    <p class="muted" style="margin:0">A bigram model is a first-order Markov chain: states are words, transition probabilities are bigram probabilities.</p></div>
    ${tryList(['Score "you like apples". Note the full-history column fails at "apples" while the bigram column does not. That gap is the reason for the Markov assumption.', 'Score "we like mangoes". "we like" never occurs, so even the bigram model gives 0. Lab 2 fixes this with smoothing.', 'Add the line "we like mangoes" to the corpus and score it again.', 'Watch the sparsity meter: add five new sentences with new words and see how the share of possible bigrams that were ever seen drops.', 'Generate with the unigram model and compare: same word frequencies, no word order.'])}
    ${quiz('lab1', [
      { q: 'The bigram model approximates P(wₖ | w₁…wₖ₋₁) by…', opts: ['P(wₖ)', 'P(wₖ | wₖ₋₁)', 'P(wₖ₋₁ | wₖ)', 'P(wₖ | w₁)'], a: 1, why: 'First-order Markov assumption: only the previous word matters.' },
      { q: 'Corpus counts: C(like) = 4, C(like apples) = 2. P(apples | like) by MLE is', opts: ['0.25', '0.5', '2', '0.2'], a: 1, why: '2 / 4 = 0.5. Bigram count over context count.' },
      { q: 'Why do we sum log-probabilities instead of multiplying probabilities?', opts: ['Logs are more accurate', 'Products of many small numbers underflow to 0', 'It changes which sentence is most likely', 'Required by the Markov assumption'], a: 1, why: 'Logs turn products into sums and avoid numerical underflow; the ranking does not change.' },
      { q: 'Without the Markov assumption, "you like apples" (not in the corpus) gets probability 0 mainly because of…', opts: ['Long-range dependencies', 'Data sparsity: the full history was never observed', 'Too many parameters', 'Vocabulary size'], a: 1, why: 'The exact history "<s> you like" followed by "apples" was never seen, so the count is 0.' }
    ])}`;
    const ta = $('#l1-corpus', el); ta.value = LMSTATE.text;
    let ctxWord = 'like';
    function render() {
      LMSTATE.text = ta.value; const m = lmBuild(ta.value);
      const types = sum(Object.values(m.follow)); const poss = (m.V) * (m.V);
      $('#l1-stats', el).innerHTML = `<div><div class="k">sentences</div><div class="v">${m.sents.length}</div></div><div><div class="k">tokens N</div><div class="v">${m.N}</div></div><div><div class="k">vocabulary V</div><div class="v">${m.V}</div></div><div><div class="k">bigrams seen / possible</div><div class="v ${types / poss < .2 ? 'bad' : 'warn'}">${types} / ${poss} (${f(types / poss * 100, 1)}%)</div></div>`;
      const ctxs = ['<s>', ...m.vocab.filter(w => w !== '</s>')];
      if (!ctxs.includes(ctxWord)) ctxWord = ctxs[0];
      $('#l1-ctx', el).innerHTML = ctxs.map(w => `<button class="chip ${w === ctxWord ? 'on' : ''}" data-w="${esc(w)}">${esc(w)}</button>`).join('');
      const row = m.bi[ctxWord] || {}; const cp = m.ctx[ctxWord] || 0;
      const items = m.vocab.map(w => ({ label: w, v: cp ? (row[w] || 0) / cp : 0, txt: `${row[w] || 0}/${cp}`, cls: row[w] ? '' : 'unseen' })).sort((a, b) => b.v - a.v);
      $('#l1-next', el).innerHTML = hbars(items, { max: 1 }) + `<p class="muted" style="font-size:13.5px">${items.filter(i => !i.v).length} of ${m.V} possible next words were never seen after “${esc(ctxWord)}” and get probability 0.</p>`;
      score(m);
    }
    function score(m) {
      m = m || lmBuild(ta.value);
      const words = tokenize($('#l1-sent', el).value); if (!words.length) { $('#l1-score', el).innerHTML = ''; return; }
      const w = ['<s>', ...words, '</s>']; let pb = 1, pf = 1, fullDead = false;
      let rows = '';
      for (let i = 1; i < w.length; i++) {
        const c = (m.bi[w[i - 1]] || {})[w[i]] || 0, cp = m.ctx[w[i - 1]] || 0, p = cp ? c / cp : 0; pb *= p;
        const hist = w.slice(0, i); let ch = 0, chw = 0;
        m.sents.forEach(s => { if (s.length >= hist.length && hist.every((x, j) => s[j] === x)) { ch++; if (s[i] === w[i]) chw++; } });
        const pfull = ch ? chw / ch : 0; if (!ch) fullDead = true; pf *= pfull;
        rows += `<tr><td class="mono">${esc(w[i - 1])} → ${esc(w[i])}</td><td class="num">${c}/${cp}</td><td class="num ${p ? '' : 'zero'}">${f(p, 3)}</td><td class="mono" style="white-space:normal;min-width:180px">${esc(hist.join(' '))} → ${esc(w[i])}</td><td class="num">${chw}/${ch}</td><td class="num ${pfull ? '' : 'zero'}">${ch ? f(pfull, 3) : '0/0'}</td></tr>`;
      }
      $('#l1-score', el).innerHTML = `<div class="tbl"><table><tr><th>Bigram</th><th class="num">counts</th><th class="num">P bigram</th><th>Full history</th><th class="num">counts</th><th class="num">P full</th></tr>${rows}
      <tr><td><b>Sentence</b></td><td></td><td class="num ${pb ? 'okc' : 'zero'}">${f(pb, 5)}</td><td></td><td></td><td class="num ${pf ? 'okc' : 'zero'}">${f(pf, 5)}</td></tr></table></div>
      <div class="note ${pb && !pf ? 'good' : pb ? '' : 'bad'}">${pb && !pf ? 'The Markov assumption saves this sentence: the bigram model gives it a real probability while the full-history model gives 0, because the exact history never occurred.' : !pb ? 'Even the bigram model gives 0: one of its bigrams was never seen. This is the sparsity problem that smoothing (Lab 2) solves.' : 'This sentence (or its history) appears in the corpus, so both models can score it. Try one that is not in the corpus.'}
      Bigram log₂P = ${pb ? f(Math.log2(pb), 3) : '−∞'}.</div>`;
    }
    function gen(kind) {
      const m = lmBuild(ta.value); const r = rng(Date.now() % 100000); const out = [];
      for (let k = 0; k < 5; k++) {
        let prev = '<s>', s = [];
        for (let t = 0; t < 12; t++) {
          let nx;
          if (kind === 'bi') nx = sampleFrom(m.bi[prev] || { '</s>': 1 }, r);
          else nx = sampleFrom(m.uni, r);
          if (nx === '</s>') break; s.push(nx); prev = nx;
        }
        const inCorpus = m.sents.some(x => x.slice(1, -1).join(' ') === s.join(' '));
        out.push(`<tr><td class="mono">${esc(s.join(' ') || '(empty)')}</td><td>${inCorpus ? '<span class="muted">copied from corpus</span>' : kind === 'bi' ? '<span style="color:var(--good)">new sentence</span>' : '<span style="color:var(--bad)">no word order</span>'}</td></tr>`);
      }
      $('#l1-gen', el).innerHTML = `<table><tr><th>${kind === 'bi' ? 'Bigram' : 'Unigram'} output</th><th>Note</th></tr>${out.join('')}</table>`;
    }
    ta.addEventListener('input', render);
    $('#l1-ctx', el).addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { ctxWord = b.dataset.w; render(); } });
    $('#l1-sent', el).addEventListener('input', () => score());
    el.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { $('#l1-sent', el).value = b.dataset.s; score(); }));
    $('#l1-genb', el).addEventListener('click', () => gen('bi'));
    $('#l1-genu', el).addEventListener('click', () => gen('uni'));
    render(); gen('bi');
  }
});

// ===== LAB 2 =====
lab({
  id: 'lab2', n: 2, short: 'Smoothing', title: 'Smoothing: giving unseen N-grams a chance',
  does: 'Moves a little probability from seen word pairs to unseen ones.',
  without: 'one unseen bigram makes a perfectly good sentence impossible (P = 0).',
  lede: 'Pick a smoothing method and drag its parameter. Orange bars are words never seen after the context word. Watch probability mass move onto them, and watch the sentence table turn red zeros into small, sensible numbers.',
  build(el) {
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Where does the probability mass go?</h2>
      <div class="ctl">${seg('l2-m', [['mle', 'MLE (none)'], ['laplace', 'Laplace +1'], ['addk', 'Add-k'], ['interp', 'Interpolation'], ['kn', 'Kneser-Ney']], 'mle')}</div>
      <div class="ctl"><label>context word <select id="l2-ctx"></select></label>
      <label id="l2-kw">k <input type="range" id="l2-k" min="-3" max="1" step="0.1" value="-1"><b id="l2-kv"></b></label>
      <label id="l2-lw">λ bigram <input type="range" id="l2-l" min="0" max="1" step="0.05" value="0.7"><b id="l2-lv"></b></label>
      <label id="l2-dw">discount d <input type="range" id="l2-d" min="0" max="1" step="0.05" value="0.75"><b id="l2-dv"></b></label></div>
      <div class="eq" id="l2-eq"></div>
      <div class="grid2"><div id="l2-bars"></div><div><div class="stat" id="l2-mass"></div><div id="l2-note"></div></div></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Same sentences, five methods</h2><p class="sub">One sentence per line. Red cells are probability 0: the model says the sentence cannot happen.</p>
      <textarea id="l2-sents" rows="4" spellcheck="false">i like apples
we like mangoes
they eat bananas
apples like i</textarea><div id="l2-table" class="tbl" style="margin-top:10px"></div></div>
    <div class="grid2">
    <div class="card"><div class="kicker">Experiment 3</div><h2>Back-off vs. interpolation</h2><p class="sub">Slide 54 numbers. Set the trigram probability to 0 to see how each method reacts.</p>
      <div class="ctl"><label>P₃ trigram <input type="number" id="l2-p3" value="0.10" step="0.01" min="0" max="1"></label><label>P₂ bigram <input type="number" id="l2-p2" value="0.20" step="0.01" min="0" max="1"></label><label>P₁ unigram <input type="number" id="l2-p1" value="0.05" step="0.01" min="0" max="1"></label></div>
      <div class="ctl"><label>λ₁ <input type="number" id="l2-l1" value="0.5" step="0.1"></label><label>λ₂ <input type="number" id="l2-l2" value="0.3" step="0.1"></label><label>λ₃ <input type="number" id="l2-l3" value="0.2" step="0.1"></label></div>
      <div id="l2-bo"></div></div>
    <div class="card"><div class="kicker">Experiment 4</div><h2>Good-Turing birdwatching</h2><p class="sub">Your sightings so far. Change the counts and see how much probability is reserved for a species you have not seen yet.</p>
      <div id="l2-birds"></div><div class="ctl"><input type="text" id="l2-newb" placeholder="new species" style="width:150px" aria-label="New species name"><button class="btn small" id="l2-addb">Add sighting</button><button class="btn small ghost" id="l2-resetb">Reset to slide example</button></div>
      <div id="l2-gt"></div></div>
    </div>
    ${vs('Unseen but valid sentences ("we like mangoes") get a small probability, so the model can rank them and perplexity stays finite. Kneser-Ney additionally prefers words that appear in many contexts.',
      'A single unseen bigram makes the whole product 0. The model cannot tell a slightly new sentence from nonsense, and perplexity on any new text is infinite.')}
    ${tryList(['Switch from MLE to Laplace with context "like" and compare the bar for "apples": add-one takes a lot of mass away from seen words.', 'Use Add-k and drag k toward 0.001: you get back close to MLE. Drag it to 10: everything becomes nearly uniform. Lab 3 shows how to pick k with a dev set.', 'In Experiment 3 set P₃ = 0. Back-off jumps to the bigram; interpolation still blends.', 'Birdwatching: add a sighting of a new species. N₁ rises, so P(unseen) rises.', 'Set Flamingo to 10 and note c* cannot be computed when N₁₁ = 0. That is why real systems smooth the Nc values.'])}
    ${quiz('lab2', [
      { q: 'Laplace smoothing for a bigram is', opts: ['(C+1)/(C(prev)+1)', '(C+1)/(C(prev)+V)', '(C+V)/(C(prev)+1)', 'C/(C(prev)+V)'], a: 1, why: 'We add 1 to each of V possible next words, so the denominator grows by V.' },
      { q: 'With P₃=0.10, P₂=0.20, P₁=0.05 and λ=(0.5, 0.3, 0.2), interpolation gives', opts: ['0.10', '0.12', '0.35', '0.117'], a: 1, why: '0.05 + 0.06 + 0.01 = 0.12.' },
      { q: '18 birds observed, 3 species seen exactly once. Good-Turing P(next bird is a new species) =', opts: ['0', '1/18', '3/18', '1/27'], a: 2, why: 'P(unseen) = N₁/N = 3/18.' },
      { q: 'Kneser-Ney prefers "coffee" over "Angeles" in "a cup of ___" because', opts: ['coffee is more frequent', 'coffee follows many different words (high continuation probability)', 'Angeles is a proper noun', 'it uses a larger discount'], a: 1, why: 'Angeles almost only follows "Los"; continuation probability counts distinct left contexts.' },
      { q: 'Why can k not be chosen on the training set?', opts: ['It is too slow', 'Training likelihood is always maximised at k = 0', 'k must be an integer', 'The test set is smaller'], a: 1, why: 'Any smoothing lowers the probability of the data you counted. Tune k on a held-out dev set.' }
    ])}`;
    let method = 'mle'; const ctxSel = $('#l2-ctx', el);
    const o = () => ({ k: 10 ** +$('#l2-k', el).value, l: +$('#l2-l', el).value, d: +$('#l2-d', el).value });
    const eqs = {
      mle: 'P(w | prev) = C(prev w) / C(prev)                      unseen → 0',
      laplace: 'P(w | prev) = (C(prev w) + 1) / (C(prev) + V)',
      addk: 'P(w | prev) = (C(prev w) + k) / (C(prev) + kV)',
      interp: 'P̂(w | prev) = λ·P_MLE(w | prev) + (1 − λ)·P_unigram(w)',
      kn: 'P_KN(w | prev) = max(C(prev w) − d, 0)/C(prev) + λ(prev)·P_cont(w)\nλ(prev) = d·|{w : C(prev w) > 0}| / C(prev)     P_cont(w) ∝ |{v : C(v w) > 0}|'
    };
    function render() {
      const m = lmBuild(LMSTATE.text); const p = o();
      $('#l2-kv', el).textContent = f(p.k, 3); $('#l2-lv', el).textContent = f(p.l, 2); $('#l2-dv', el).textContent = f(p.d, 2);
      $('#l2-kw', el).hidden = method !== 'addk'; $('#l2-lw', el).hidden = method !== 'interp'; $('#l2-dw', el).hidden = method !== 'kn';
      $('#l2-eq', el).textContent = eqs[method];
      const ctxs = ['<s>', ...m.vocab.filter(w => w !== '</s>')]; const cur = ctxSel.value || 'like';
      ctxSel.innerHTML = ctxs.map(w => `<option ${w === cur ? 'selected' : ''}>${esc(w)}</option>`).join('');
      const prev = ctxSel.value; const row = m.bi[prev] || {};
      const items = m.vocab.map(w => ({ label: w, v: pBi(m, prev, w, method, p), cls: row[w] ? '' : 'unseen' })).sort((a, b) => (b.cls ? 0 : 1) - (a.cls ? 0 : 1) || b.v - a.v);
      $('#l2-bars', el).innerHTML = hbars(items) + legend([{ color: 'var(--accent)', label: 'seen after context' }, { color: 'var(--warn)', label: 'never seen after context' }]);
      const seenM = sum(items.filter(i => !i.cls).map(i => i.v)), unM = sum(items.filter(i => i.cls).map(i => i.v));
      const ap = pBi(m, prev, 'apples', method, p), cp = m.ctx[prev] || 0;
      $('#l2-mass', el).innerHTML = `<div><div class="k">mass on seen words</div><div class="v">${f(seenM * 100, 1)}%</div></div><div><div class="k">mass on unseen words</div><div class="v ${unM ? 'good' : 'bad'}">${f(unM * 100, 1)}%</div></div>` + (method === 'laplace' || method === 'addk' ? `<div><div class="k">reconstituted c*(${esc(prev)} apples)</div><div class="v">${f(ap * cp, 2)} <span class="muted" style="font-size:12px">was ${(row.apples || 0)}</span></div></div>` : '');
      $('#l2-note', el).innerHTML = `<div class="note ${unM ? 'good' : 'bad'}">${{ mle: 'No smoothing: every orange word has probability exactly 0.', laplace: 'Add-one: with a vocabulary of ' + m.V + ' words, each unseen word gets 1/(C+V). In real corpora (V in the thousands) this steals far too much from seen words.', addk: 'Add-k with a small k keeps more of the original shape while still avoiding zeros. Too large a k flattens everything toward uniform.', interp: 'Interpolation mixes in the unigram distribution, so unseen bigrams inherit the general popularity of the word.', kn: 'Kneser-Ney subtracts a fixed discount d from each seen count and gives that saved mass to words in proportion to how many different contexts they follow.' }[method]}</div>`;
      table(m, p);
    }
    function table(m, p) {
      const lines = $('#l2-sents', el).value.split('\n').map(tokenize).filter(x => x.length);
      const ms = [['mle', 'MLE'], ['laplace', 'Laplace'], ['addk', 'Add-k (k=' + f(p.k, 3) + ')'], ['interp', 'Interp (λ=' + f(p.l, 2) + ')'], ['kn', 'Kneser-Ney']];
      $('#l2-table', el).innerHTML = `<table><tr><th>Sentence</th>${ms.map(x => `<th class="num">${x[1]}</th>`).join('')}</tr>` + lines.map(ws => `<tr><td class="mono">${esc(ws.join(' '))}</td>${ms.map(x => { const r = sentScore(m, ws, x[0], p); return `<td class="num ${r.p === 0 ? 'zero' : ''}">${f(r.p, 6)}</td>`; }).join('')}</tr>`).join('') + '</table>';
    }
    function backoff() {
      const P3 = +$('#l2-p3', el).value, P2 = +$('#l2-p2', el).value, P1 = +$('#l2-p1', el).value;
      let l1 = +$('#l2-l1', el).value, l2 = +$('#l2-l2', el).value, l3 = +$('#l2-l3', el).value; const s = l1 + l2 + l3;
      const bo = P3 > 0 ? ['trigram', P3] : P2 > 0 ? ['bigram', P2] : ['unigram', P1];
      const ip = (l1 * P3 + l2 * P2 + l3 * P1) / (s || 1);
      $('#l2-bo', el).innerHTML = `<div class="stat"><div><div class="k">Back-off uses</div><div class="v">${bo[0]}: ${f(bo[1], 3)}</div></div><div><div class="k">Interpolation</div><div class="v">${f(ip, 4)}</div></div></div>
      <div class="eq">${f(l1, 2)}×${f(P3, 2)} + ${f(l2, 2)}×${f(P2, 2)} + ${f(l3, 2)}×${f(P1, 2)} = ${f(l1 * P3 + l2 * P2 + l3 * P1, 4)}${Math.abs(s - 1) > 1e-6 ? `   (λs sum to ${f(s, 2)}, normalised)` : ''}</div>`;
    }
    const BIRDS0 = [['Flamingo', 10], ['Kingfisher', 3], ['Indian Roller', 2], ['Woodpecker', 1], ['Peacock', 1], ['Crane', 1]];
    let birds = BIRDS0.map(b => [...b]);
    function gt() {
      const N = sum(birds.map(b => b[1])); const Nc = {}; birds.forEach(b => { if (b[1] > 0) Nc[b[1]] = (Nc[b[1]] || 0) + 1; });
      $('#l2-birds', el).innerHTML = `<div class="tbl"><table><tr><th>Species</th><th class="num">c</th><th></th><th class="num">MLE c/N</th><th class="num">c* = (c+1)N₍c+1₎/N꜀</th><th class="num">P_GT = c*/N</th></tr>` + birds.map((b, i) => {
        const c = b[1]; const ok = c > 0 && Nc[c + 1]; const cs = ok ? (c + 1) * Nc[c + 1] / Nc[c] : null;
        return `<tr><td>${esc(b[0])}</td><td class="num">${c}</td><td><button class="btn small ghost" data-b="${i}" data-d="-1" aria-label="one fewer">−</button> <button class="btn small ghost" data-b="${i}" data-d="1" aria-label="one more">+</button></td><td class="num">${f(c / N, 4)}</td><td class="num ${c > 0 && !ok ? 'zero' : ''}">${c > 0 ? (ok ? f(cs, 3) : 'N' + (c + 1) + '=0') : '—'}</td><td class="num">${ok ? f(cs / N, 4) : c > 0 ? '—' : ''}</td></tr>`;
      }).join('') + '</table></div>';
      const N1 = Nc[1] || 0;
      $('#l2-gt', el).innerHTML = `<div class="stat"><div><div class="k">total birds N</div><div class="v">${N}</div></div><div><div class="k">N₁ (seen once)</div><div class="v">${N1}</div></div><div><div class="k">P(next is a new species)</div><div class="v ${N1 ? 'good' : 'bad'}">${N1}/${N} = ${f(N1 / N, 3)}</div></div></div>
      <div class="note">Nc table: ${Object.keys(Nc).sort((a, b) => a - b).map(c => `N${c}=${Nc[c]}`).join(', ')}. Red cells show where Good-Turing breaks down: no species was seen c+1 times, so c* is undefined. Practical systems smooth the Nc curve or keep MLE for large c.</div>`;
    }
    bindSeg($('#l2-m', el), v => { method = v; render(); });
    ['#l2-k', '#l2-l', '#l2-d'].forEach(s => $(s, el).addEventListener('input', render));
    ctxSel.addEventListener('change', render);
    $('#l2-sents', el).addEventListener('input', () => table(lmBuild(LMSTATE.text), o()));
    $$('#l2-p3,#l2-p2,#l2-p1,#l2-l1,#l2-l2,#l2-l3', el).forEach(i => i.addEventListener('input', backoff));
    $('#l2-birds', el).addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (!b) return; const i = +b.dataset.b; birds[i][1] = Math.max(0, birds[i][1] + +b.dataset.d); gt(); });
    $('#l2-addb', el).addEventListener('click', () => { const n = $('#l2-newb', el).value.trim(); if (!n) return; const ex = birds.find(b => b[0].toLowerCase() === n.toLowerCase()); if (ex) ex[1]++; else birds.push([n, 1]); $('#l2-newb', el).value = ''; gt(); });
    $('#l2-resetb', el).addEventListener('click', () => { birds = BIRDS0.map(b => [...b]); gt(); });
    this.refresh = render;
    ctxSel.innerHTML = '<option>like</option>';
    render(); backoff(); gt();
  }
});

// ===== LAB 3 =====
lab({
  id: 'lab3', n: 3, short: 'Evaluation', title: 'Evaluating language models: perplexity and friends',
  does: 'Gives one number to compare two models on held-out text.',
  without: 'you cannot tell which model is better, or you tune on the test set and fool yourself.',
  lede: 'Perplexity is the inverse probability of the test text, normalised by length. Lower is better. Here you compute it for several models, tune add-k on a dev set, and play the Shannon game yourself.',
  build(el) {
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>Perplexity scoreboard</h2><p class="sub">Models are trained on the Lab 1 corpus. The dev/test sentences below were not in training.</p>
      <textarea id="l3-test" rows="4" spellcheck="false">i like mangoes
you like apples
we like bananas
they eat apples</textarea>
      <div class="ctl"><label>add-k: k <input type="range" id="l3-k" min="-3" max="1" step="0.05" value="-1"><b id="l3-kv"></b></label></div>
      <div id="l3-board" class="tbl"></div>
      <div class="eq">PP(W) = P(w1 … wN)^(−1/N) = 2^H,   H = −(1/N) Σ log₂ P(wi | wi−1)      (N counts &lt;/s&gt;, not &lt;s&gt;)</div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Choosing k: dev set vs. training set</h2><p class="sub">The blue curve is perplexity on your dev sentences. The dashed curve is perplexity on the training corpus itself.</p>
      <div id="l3-curve"></div><div id="l3-best"></div></div>
    <div class="grid2">
    <div class="card"><div class="kicker">Experiment 3</div><h2>Perplexity = branching factor</h2><p class="sub">A model choosing among n next words. Skew moves probability onto one favourite word.</p>
      <div class="ctl"><label>n choices <input type="range" id="l3-n" min="2" max="20" step="1" value="10"><b id="l3-nv"></b></label><label>skew <input type="range" id="l3-s" min="0" max="0.95" step="0.05" value="0"><b id="l3-sv"></b></label></div>
      <div id="l3-bf"></div></div>
    <div class="card"><div class="kicker">Experiment 4</div><h2>The Shannon game</h2><p class="sub">Guess the next word of a held-out sentence. Then see how surprised the Kneser-Ney bigram model was.</p>
      <div id="l3-sg"></div></div>
    </div>
    <div class="card"><div class="kicker">Experiment 5</div><h2>Intrinsic or extrinsic?</h2><p class="sub">Sort each measurement.</p><div id="l3-sort"></div></div>
    ${vs('Two models can be compared in seconds on held-out data. Hyperparameters like k and λ are tuned on a dev set, and the test set gives an honest final number.',
      'You would have to run the full downstream application (translation, speech recogniser) for every model variant, which is slow. Or you tune on training data and always pick k = 0, which then fails with infinite perplexity on new text.')}
    ${tryList(['In the scoreboard, MLE shows ∞ for any sentence with an unseen bigram. That is why smoothing is required before evaluation.', 'Move the k slider until the dev perplexity is lowest. Compare with the marked best k.', 'Notice the dashed training curve keeps falling as k → 0. Tuning on training data would pick no smoothing.', 'Branching factor: with skew 0 and n = 10, PP is exactly 10. Raise skew and PP drops, even though n stays 10.'])}
    ${quiz('lab3', [
      { q: 'Model A has test perplexity 120, model B has 85 on the same test set and vocabulary. Which predicts the text better?', opts: ['A', 'B', 'Cannot compare perplexities', 'They are equal'], a: 1, why: 'Lower perplexity means higher probability on the test data.' },
      { q: 'A sentence of 4 predicted tokens has probability 0.02. Its perplexity is about', opts: ['0.02', '2.66', '50', '4'], a: 1, why: '0.02^(−1/4) ≈ 2.66.' },
      { q: 'Which is an extrinsic evaluation?', opts: ['Perplexity on Wikipedia text', 'Cross-entropy', 'BLEU of a translation system using the LM', 'Log-likelihood'], a: 2, why: 'Extrinsic = measure performance on a downstream task.' },
      { q: 'A uniform model over 10 digits has perplexity', opts: ['1', '10', '0.1', 'log₂10'], a: 1, why: 'Perplexity is the effective branching factor: 10 equally likely choices.' }
    ])}`;
    function models(k) { return [['uni', 'Unigram (add-1)', {}], ['mle', 'Bigram MLE', {}], ['laplace', 'Bigram Laplace', {}], ['addk', 'Bigram add-k', { k }], ['kn', 'Bigram Kneser-Ney', { d: 0.75 }]]; }
    function setPP(m, sents, method, o) { let lp = 0, N = 0; for (const s of sents) { const r = sentScore(m, s, method, o); lp += r.lp; N += r.N; } return lp === -Infinity ? Infinity : Math.pow(2, -lp / N); }
    function render() {
      const m = lmBuild(LMSTATE.text); const k = 10 ** +$('#l3-k', el).value; $('#l3-kv', el).textContent = f(k, 3);
      const sents = $('#l3-test', el).value.split('\n').map(tokenize).filter(x => x.length);
      const ms = models(k);
      const res = ms.map(([id, name, o]) => ({ name, per: sents.map(s => sentScore(m, s, id, o).pp), all: setPP(m, sents, id, o) }));
      const best = Math.min(...res.map(r => r.all));
      $('#l3-board', el).innerHTML = `<table><tr><th>Model</th>${sents.map(s => `<th class="num">${esc(s.join(' '))}</th>`).join('')}<th class="num">Dev set PP</th></tr>` + res.map(r => `<tr><td>${esc(r.name)}</td>${r.per.map(p => `<td class="num ${p === Infinity ? 'zero' : ''}">${f(p, 2)}</td>`).join('')}<td class="num ${r.all === Infinity ? 'zero' : r.all === best ? 'okc' : ''}">${f(r.all, 2)}${r.all === best ? ' ★' : ''}</td></tr>`).join('') + '</table>';
      const pts = [], tr = []; let bk = 1, bp = Infinity;
      for (let e = -3; e <= 1.0001; e += 0.1) { const kk = 10 ** e; const p = setPP(m, sents, 'addk', { k: kk }); pts.push([kk, p]); if (p < bp) { bp = p; bk = kk; } tr.push([kk, setPP(m, m.sents.map(s => s.slice(1, -1)), 'addk', { k: kk })]); }
      const cur = setPP(m, sents, 'addk', { k });
      $('#l3-curve', el).innerHTML = lineChart([{ pts, color: 'var(--accent)' }, { pts: tr, color: 'var(--muted)', dash: true }], { logx: true, xlabel: 'k (log scale)', ylabel: 'perplexity', marks: [{ x: k, y: cur, label: 'your k', color: 'var(--warn)' }, { x: bk, y: bp, label: 'best', color: 'var(--good)' }], title: 'Perplexity versus k' }) + legend([{ color: 'var(--accent)', label: 'dev set (held out)' }, { color: 'var(--muted)', label: 'training set' }]);
      $('#l3-best', el).innerHTML = `<div class="note">Best k on the dev set ≈ <b>${f(bk, 3)}</b> (PP ${f(bp, 2)}). Your k gives PP ${f(cur, 2)}. On the training set, smaller k always looks better, which is why k is tuned on held-out data and the test set is used once at the end.</div>`;
    }
    function bf() {
      const n = +$('#l3-n', el).value, s = +$('#l3-s', el).value; $('#l3-nv', el).textContent = n; $('#l3-sv', el).textContent = f(s, 2);
      const p = Array.from({ length: n }, (_, i) => i === 0 ? 1 / n + s * (1 - 1 / n) : (1 - (1 / n + s * (1 - 1 / n))) / (n - 1));
      const H = -sum(p.map(q => q > 0 ? q * Math.log2(q) : 0));
      $('#l3-bf', el).innerHTML = hbars(p.map((q, i) => ({ label: 'word ' + (i + 1), v: q })), { max: 1 }) + `<div class="stat" style="margin-top:8px"><div><div class="k">entropy H</div><div class="v">${f(H, 3)} bits</div></div><div><div class="k">perplexity 2^H</div><div class="v good">${f(2 ** H, 2)}</div></div></div>`;
    }
    // Shannon game
    let sg = { i: 1, s: 0, lp: 0, right: 0, n: 0 };
    function sgSents() { return $('#l3-test', el).value.split('\n').map(tokenize).filter(x => x.length); }
    function sgRender(reveal, guess) {
      const m = lmBuild(LMSTATE.text); const ss = sgSents(); if (!ss.length) return;
      const s = ['<s>', ...ss[sg.s % ss.length], '</s>']; const truth = s[sg.i]; const prev = s[sg.i - 1];
      const r = rng(sg.s * 31 + sg.i); const pool = m.vocab.filter(w => w !== truth); const opts = [truth];
      while (opts.length < Math.min(4, m.vocab.length)) { const c = pool[Math.floor(r() * pool.length)]; if (!opts.includes(c)) opts.push(c); }
      opts.sort(() => r() - 0.5);
      let h = `<div class="mono" style="font-size:16px;margin:6px 0">${s.slice(0, sg.i).map(esc).join(' ')} <b style="color:var(--accent)">___</b></div><div class="chips">` + opts.map(w => `<button class="chip ${reveal && w === truth ? 'on' : ''} ${reveal && w === guess && w !== truth ? 'neg' : ''}" data-g="${esc(w)}" ${reveal ? 'disabled' : ''}>${esc(w)}</button>`).join('') + '</div>';
      if (reveal) {
        const items = opts.map(w => ({ label: w, v: pBi(m, prev, w, 'kn', { d: .75 }), cls: w === truth ? 'good' : '' })).sort((a, b) => b.v - a.v);
        const pt = pBi(m, prev, truth, 'kn', { d: .75 });
        h += `<div style="margin-top:10px">${hbars(items)}</div><div class="note">${guess === truth ? 'You got it.' : 'The answer was “' + esc(truth) + '”.'} Model surprise: −log₂ P = ${f(-Math.log2(pt), 2)} bits.</div><button class="btn small" id="l3-next">Next word</button>`;
      }
      h += `<p class="muted" style="font-size:13.5px">Your score: ${sg.right}/${sg.n}. Model perplexity so far: ${sg.n ? f(2 ** (-sg.lp / sg.n), 2) : '—'}</p>`;
      $('#l3-sg', el).innerHTML = h;
    }
    $('#l3-sg', el).addEventListener('click', e => {
      const g = e.target.closest('[data-g]');
      if (g && !g.disabled) { const m = lmBuild(LMSTATE.text); const ss = sgSents(); const s = ['<s>', ...ss[sg.s % ss.length], '</s>']; const truth = s[sg.i]; sg.n++; if (g.dataset.g === truth) sg.right++; sg.lp += Math.log2(pBi(m, s[sg.i - 1], truth, 'kn', { d: .75 })); sgRender(true, g.dataset.g); }
      if (e.target.id === 'l3-next') { const ss = sgSents(); const s = ['<s>', ...ss[sg.s % ss.length], '</s>']; sg.i++; if (sg.i >= s.length) { sg.s++; sg.i = 1; } sgRender(false); }
    });
    // sort game
    const SORT = [['Perplexity on held-out news text', 'in'], ['Word error rate of a speech recogniser using the LM', 'ex'], ['BLEU score of a translation system', 'ex'], ['Cross-entropy in bits per word', 'in'], ['Accuracy of next-word suggestions on a phone keyboard', 'ex'], ['Log-likelihood of the test set', 'in']];
    $('#l3-sort', el).innerHTML = '<div class="tbl"><table>' + SORT.map((s, i) => `<tr><td style="white-space:normal">${esc(s[0])}</td><td><button class="btn small ghost" data-i="${i}" data-c="in">Intrinsic</button> <button class="btn small ghost" data-i="${i}" data-c="ex">Extrinsic</button></td><td id="l3-sr${i}"></td></tr>`).join('') + '</table></div>';
    $('#l3-sort', el).addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i; const ok = SORT[i][1] === b.dataset.c; $('#l3-sr' + i, el).innerHTML = ok ? '<b style="color:var(--good)">✓</b>' : '<b style="color:var(--bad)">✗ ' + (SORT[i][1] === 'in' ? 'measures the LM itself' : 'measures a downstream task') + '</b>'; });
    $('#l3-k', el).addEventListener('input', render); $('#l3-test', el).addEventListener('input', () => { render(); sg = { i: 1, s: 0, lp: 0, right: 0, n: 0 }; sgRender(false); });
    $('#l3-n', el).addEventListener('input', bf); $('#l3-s', el).addEventListener('input', bf);
    this.refresh = render;
    render(); bf(); sgRender(false);
  }
});

// ===== LAB 4: WordNet =====
const WN = {
  syn: {
    'car.n.01': { w: ['car', 'auto', 'automobile', 'machine', 'motorcar'], g: 'a motor vehicle with four wheels; usually propelled by an internal combustion engine', ex: 'he needs a car to get to work', h: 'motor_vehicle.n.01' },
    'car.n.02': { w: ['car', 'railcar', 'railway_car', 'railroad_car'], g: 'a wheeled vehicle adapted to the rails of railroad', ex: 'three cars had jumped the rails', h: 'wheeled_vehicle.n.01' },
    'car.n.03': { w: ['car', 'gondola'], g: 'the compartment that is suspended from an airship and that carries personnel and cargo', h: 'compartment.n.01' },
    'machine.n.01': { w: ['machine'], g: 'any mechanical or electrical device that transmits or modifies energy to perform or assist in human tasks', h: 'device.n.01' },
    'machine.n.02': { w: ['machine'], g: 'an efficient person', ex: 'the boxer was a magnificent fighting machine', h: 'person.n.01' },
    'machine.n.03': { w: ['machine', 'political_machine'], g: 'a group that controls the activities of a political party', h: 'organization.n.01' },
    'motor_vehicle.n.01': { w: ['motor_vehicle', 'automotive_vehicle'], g: 'a self-propelled wheeled vehicle that does not run on rails', h: 'wheeled_vehicle.n.01' },
    'bus.n.01': { w: ['bus', 'autobus', 'coach', 'omnibus'], g: 'a vehicle carrying many passengers; used for public transport', h: 'public_transport.n.01' },
    'bicycle.n.01': { w: ['bicycle', 'bike', 'cycle', 'wheel'], g: 'a wheeled vehicle that has two wheels and is moved by foot pedals', h: 'wheeled_vehicle.n.01' },
    'public_transport.n.01': { w: ['public_transport'], g: 'conveyance for passengers or mail or freight', h: 'conveyance.n.03' },
    'wheeled_vehicle.n.01': { w: ['wheeled_vehicle'], g: 'a vehicle that moves on wheels', h: 'vehicle.n.01' },
    'vehicle.n.01': { w: ['vehicle'], g: 'a conveyance that transports people or objects', h: 'conveyance.n.03' },
    'conveyance.n.03': { w: ['conveyance', 'transport'], g: 'something that serves as a means of transportation', h: 'artifact.n.01' },
    'compartment.n.01': { w: ['compartment'], g: 'a space that is marked off by partitions', h: 'artifact.n.01' },
    'device.n.01': { w: ['device'], g: 'an instrumentality invented for a particular purpose', h: 'artifact.n.01' },
    'hotel.n.01': { w: ['hotel'], g: 'a building where travelers can pay for lodging and meals and other services', h: 'building.n.01' },
    'motel.n.01': { w: ['motel'], g: 'a hotel for motorists; provides direct access from rooms to parking area', h: 'hotel.n.01' },
    'building.n.01': { w: ['building', 'edifice'], g: 'a structure that has a roof and walls and stands more or less permanently in one place', h: 'artifact.n.01' },
    'artifact.n.01': { w: ['artifact', 'artefact'], g: 'a man-made object taken as a whole', h: 'object.n.01' },
    'dog.n.01': { w: ['dog', 'domestic_dog', 'canis_familiaris'], g: 'a member of the genus Canis that has been domesticated by man since prehistoric times', ex: 'the dog barked all night', h: 'canine.n.02' },
    'cat.n.01': { w: ['cat', 'true_cat'], g: 'feline mammal usually having thick soft fur and no ability to roar', h: 'feline.n.01' },
    'canine.n.02': { w: ['canine', 'canid'], g: 'any of various fissiped mammals with nonretractile claws', h: 'carnivore.n.01' },
    'feline.n.01': { w: ['feline', 'felid'], g: 'any of various lithe-bodied roundheaded fissiped mammals', h: 'carnivore.n.01' },
    'carnivore.n.01': { w: ['carnivore'], g: 'a terrestrial or aquatic flesh-eating mammal', h: 'mammal.n.01' },
    'horse.n.01': { w: ['horse', 'equus_caballus'], g: 'solid-hoofed herbivorous quadruped domesticated since prehistoric times', h: 'ungulate.n.01' },
    'ungulate.n.01': { w: ['ungulate', 'hoofed_mammal'], g: 'any of a number of mammals with hooves', h: 'mammal.n.01' },
    'mammal.n.01': { w: ['mammal'], g: 'any warm-blooded vertebrate having the skin more or less covered with hair', h: 'animal.n.01' },
    'animal.n.01': { w: ['animal', 'animate_being', 'beast', 'creature', 'fauna'], g: 'a living organism characterized by voluntary movement', h: 'organism.n.01' },
    'person.n.01': { w: ['person', 'individual', 'someone', 'somebody'], g: 'a human being', h: 'organism.n.01' },
    'organism.n.01': { w: ['organism', 'being'], g: 'a living thing that has (or can develop) the ability to act or function independently', h: 'object.n.01' },
    'organization.n.01': { w: ['organization', 'organisation'], g: 'a group of people who work together', h: 'object.n.01' },
    'bank.n.01': { w: ['bank'], g: 'sloping land (especially the slope beside a body of water)', ex: 'they pulled the canoe up on the bank', h: 'slope.n.01' },
    'bank.n.02': { w: ['depository_financial_institution', 'bank', 'banking_concern', 'banking_company'], g: 'a financial institution that accepts deposits and channels the money into lending activities', ex: 'he cashed a check at the bank', h: 'organization.n.01' },
    'slope.n.01': { w: ['slope', 'incline', 'side'], g: 'an elevated geological formation', h: 'object.n.01' },
    'object.n.01': { w: ['object', 'physical_entity'], g: 'a tangible and visible entity', h: 'entity.n.01' },
    'entity.n.01': { w: ['entity'], g: 'that which is perceived or known or inferred to have its own distinct existence', h: null },
    'good.a.01': { w: ['good'], g: 'having desirable or positive qualities especially those suitable for a thing specified', ex: 'good news from the hospital', h: null },
    'good.a.06': { w: ['adept', 'expert', 'good', 'practiced', 'proficient', 'skillful', 'skilful'], g: 'having or showing knowledge and skill and aptitude', ex: 'good at mathematics', h: null },
    'good.a.07': { w: ['beneficial', 'good'], g: 'promoting or enhancing well-being', ex: 'the experience was good for her', h: null },
    'good.a.04': { w: ['estimable', 'good', 'honorable', 'respectable'], g: 'deserving of esteem and respect', ex: 'ruined the family\'s good name', h: null }
  },
  order: { car: ['car.n.01', 'car.n.02', 'car.n.03'], machine: ['machine.n.01', 'machine.n.02', 'machine.n.03', 'car.n.01'], good: ['good.a.01', 'good.a.04', 'good.a.06', 'good.a.07'], bank: ['bank.n.01', 'bank.n.02'] }
};
function wnSenses(w) {
  w = w.toLowerCase().replace(/\s+/g, '_');
  if (WN.order[w]) return WN.order[w];
  return Object.keys(WN.syn).filter(k => WN.syn[k].w.includes(w));
}
function wnChain(s) { const c = []; while (s) { c.push(s); s = WN.syn[s] && WN.syn[s].h; } return c; }
function wnPath(a, b) {
  const A = wnChain(a), B = wnChain(b); let best = null;
  A.forEach((x, i) => { const j = B.indexOf(x); if (j >= 0 && (!best || i + j < best.d)) best = { d: i + j, lcs: x, i, j }; });
  return best;
}
lab({
  id: 'lab4', n: 4, short: 'WordNet', title: 'WordNet: meaning written down by hand',
  does: 'Groups words into synsets with glosses and is-a links, so "motel" is known to be a kind of "hotel".',
  without: 'words are one-hot symbols and "motel" · "hotel" = 0, so a search for one misses the other.',
  lede: 'A simplified extract of WordNet you can explore. Look up senses, measure similarity through the hypernym tree, then try the synonym-swap game to see where hand-built synonymy breaks.',
  build(el) {
    const words = [...new Set(Object.values(WN.syn).flatMap(s => s.w))].filter(w => !w.includes('_')).sort();
    el.innerHTML = `
    <div class="card"><div class="kicker">Experiment 1</div><h2>One-hot vectors: every word is a stranger</h2><p class="sub">Vocabulary of 8 words. Each word is a vector with a single 1.</p><div id="l4-oh"></div></div>
    <div class="card"><div class="kicker">Experiment 2</div><h2>Look up a word</h2><p class="sub">Senses are numbered by how common they are for that word. Click a hypernym to follow the is-a chain.</p>
      <div class="ctl"><input type="text" id="l4-q" list="l4-list" value="car" style="width:200px" aria-label="Word to look up"><datalist id="l4-list">${words.map(w => `<option value="${w}">`).join('')}</datalist>
      <span class="chips">${['car', 'machine', 'bank', 'good', 'motel', 'selfie'].map(w => `<button class="chip" data-look="${w}">${w}</button>`).join('')}</span></div>
      <div id="l4-senses"></div></div>
    <div class="card"><div class="kicker">Experiment 3</div><h2>Similarity through the hypernym tree</h2><p class="sub">Path similarity = 1 / (1 + shortest path length through the lowest common ancestor).</p>
      <div class="ctl"><select id="l4-a"></select><select id="l4-b"></select><span class="chips">${[['motel.n.01', 'hotel.n.01'], ['car.n.01', 'bus.n.01'], ['dog.n.01', 'cat.n.01'], ['dog.n.01', 'car.n.01'], ['bank.n.01', 'bank.n.02']].map(p => `<button class="chip" data-p="${p.join('|')}">${p.map(x => x.split('.')[0]).join(' / ')}</button>`).join('')}</span></div>
      <div id="l4-sim"></div></div>
    <div class="card"><div class="kicker">Experiment 4</div><h2>The synonym-swap game</h2><p class="sub">WordNet lists these as synonyms of "good". Decide whether each swapped sentence sounds natural, then reveal.</p><div id="l4-swap"></div></div>
    ${vs('Words get explicit senses and relations. "motel" is linked to "hotel", "car" to "bus" through "vehicle", and "bank" is split into its river and money senses. Search, word-sense disambiguation and simple similarity become possible.',
      'One-hot vectors make every pair of different words orthogonal: similarity 0 for motel/hotel and for motel/banana alike. A search engine cannot tell synonyms from unrelated words.')}
    <div class="card"><h2>Why NLP moved on from WordNet</h2><div class="grid3">
      <div class="box"><b>Missing nuance</b><br><span class="muted">Synonymy is all-or-nothing. "proficient" = "good" only in some contexts.</span></div>
      <div class="box"><b>Missing new meanings</b><br><span class="muted">WordNet 3.0 dates from 2006: no "selfie", "doomscroll", "rizz".</span></div>
      <div class="box"><b>No connotation</b><br><span class="muted">Neutral and offensive words can share a synset.</span></div>
      <div class="box"><b>Subjective</b><br><span class="muted">Linguists disagree on sense boundaries, yet it is used as gold labels.</span></div>
      <div class="box"><b>Expensive</b><br><span class="muted">Every sense, gloss and link is written by experts, per language.</span></div>
      <div class="box"><b>No graded similarity</b><br><span class="muted">Path counts are coarse; Lab 5 shows learned vectors do better.</span></div></div></div>
    ${tryList(['Look up "machine": the car sense is only its 4th sense, while it is the 1st sense of "car".', 'Compare motel/hotel (very close) with dog/car (they only meet at "object").', 'Compare bank.n.01 with bank.n.02: the same word, but far apart in meaning.', 'Look up "selfie". It is not there. Language moved on; the resource did not.'])}
    ${quiz('lab4', [
      { q: 'In WordNet a word sense is defined by', opts: ['A one-hot vector', 'A synset plus a gloss', 'Its frequency', 'A dense embedding'], a: 1, why: 'Synset (near-synonyms for that meaning) + gloss (definition) = one sense.' },
      { q: '"car" sense 1 and "machine" sense 4 are the same synset. What does the number 4 tell you?', opts: ['The synset has 4 words', 'That meaning is rare for "machine"', 'It is the 4th synset created', 'The path length'], a: 1, why: 'Sense numbers rank how common a meaning is for that particular word.' },
      { q: 'The dot product of the one-hot vectors for "motel" and "hotel" is', opts: ['1', '0.5', '0', 'Depends on the corpus'], a: 2, why: 'Distinct one-hot vectors are orthogonal.' },
      { q: 'Which is NOT a drawback of WordNet?', opts: ['Misses new slang', 'Ignores connotation', 'Needs expert labour', 'Cannot represent multiple senses of a word'], a: 3, why: 'WordNet does represent multiple senses; that is one of its strengths.' }
    ])}`;
    const OH = ['motel', 'hotel', 'car', 'bus', 'dog', 'cat', 'apple', 'bank'];
    $('#l4-oh', el).innerHTML = heat(OH.map((a, i) => OH.map((b, j) => i === j ? 1 : 0)), OH, OH, { fmt: v => v, max: 1 }) + `<div class="note bad">Every off-diagonal value is 0. To a one-hot system, motel is exactly as unrelated to hotel as it is to apple.</div>`;
    function senses() {
      const q = $('#l4-q', el).value.trim().toLowerCase(); const ss = wnSenses(q);
      if (!q) { $('#l4-senses', el).innerHTML = ''; return; }
      if (!ss.length) { $('#l4-senses', el).innerHTML = `<div class="note bad">No entry for “${esc(q)}”. ${['selfie', 'doomscroll', 'rizz', 'emoji', 'podcast'].includes(q) ? 'This word became common after WordNet 3.0 (2006). A hand-built resource cannot keep up with new words.' : 'This mini extract only holds a few dozen synsets; try car, machine, bank, good, dog, hotel.'}</div>`; return; }
      $('#l4-senses', el).innerHTML = ss.map((s, i) => { const S = WN.syn[s]; const ch = wnChain(s); return `<div class="box" style="margin-top:8px"><b>${esc(q)} · sense ${i + 1}</b> <span class="mono muted">${s}</span><div class="chips" style="margin:6px 0">${S.w.map(x => `<span class="chip static ${x === q ? 'on' : ''}">${esc(x)}</span>`).join('')}</div><div>${esc(S.g)}</div>${S.ex ? `<div class="muted"><i>“${esc(S.ex)}”</i></div>` : ''}${ch.length > 1 ? `<div class="mono" style="font-size:12.5px;margin-top:6px">is-a: ${ch.slice(1).map(c => `<button class="chip" data-look="${c.split('.')[0]}">${c.split('.')[0]}</button>`).join(' → ')}</div>` : '<div class="muted" style="font-size:13px;margin-top:4px">Adjectives have no hypernym tree in WordNet.</div>'}</div>`; }).join('');
    }
    const nouns = Object.keys(WN.syn).filter(k => k.includes('.n.'));
    $('#l4-a', el).innerHTML = nouns.map(n => `<option ${n === 'motel.n.01' ? 'selected' : ''}>${n}</option>`).join('');
    $('#l4-b', el).innerHTML = nouns.map(n => `<option ${n === 'hotel.n.01' ? 'selected' : ''}>${n}</option>`).join('');
    function sim() {
      const a = $('#l4-a', el).value, b = $('#l4-b', el).value; const p = wnPath(a, b);
      const A = wnChain(a).slice(0, p.i + 1), B = wnChain(b).slice(0, p.j).reverse();
      const path = [...A, ...B];
      const s = 1 / (1 + p.d);
      $('#l4-sim', el).innerHTML = `<div class="flow mono" style="font-size:12.5px;margin:8px 0">${path.map((x, i) => (i ? '<span class="arrow">—</span>' : '') + `<span class="chip static ${x === p.lcs ? 'on' : ''}">${x.split('.')[0]}</span>`).join('')}</div>
      <div class="stat"><div><div class="k">path length</div><div class="v">${p.d}</div></div><div><div class="k">common ancestor</div><div class="v">${p.lcs.split('.')[0]}</div></div><div><div class="k">path similarity</div><div class="v ${s > .3 ? 'good' : s < .15 ? 'bad' : 'warn'}">${f(s, 3)}</div></div><div><div class="k">one-hot similarity</div><div class="v bad">0</div></div></div>`;
    }
    const SW = [['She is <u>good</u> at French.', [['proficient', 1], ['skillful', 1], ['beneficial', 0], ['respectable', 0]]], ['That is a <u>good</u> sandwich.', [['proficient', 0], ['beneficial', 0], ['estimable', 0], ['respectable', 0]]], ['Exercise is <u>good</u> for you.', [['beneficial', 1], ['expert', 0], ['honorable', 0]]]];
    const rows = []; SW.forEach(([s, subs]) => subs.forEach(([w, ok]) => rows.push({ s: s.replace(/<u>good<\/u>/, `<b>${w}</b>`), ok })));
    $('#l4-swap', el).innerHTML = `<div class="tbl"><table>${rows.map((r, i) => `<tr><td style="white-space:normal">${r.s}</td><td><button class="btn small ghost" data-sw="${i}" data-v="1">Sounds fine</button> <button class="btn small ghost" data-sw="${i}" data-v="0">Sounds wrong</button></td><td id="l4-r${i}"></td></tr>`).join('')}</table></div><p class="muted" style="font-size:13.5px" id="l4-swsc"></p>`;
    let swScore = 0, swN = 0; const swDone = new Set();
    $('#l4-swap', el).addEventListener('click', e => { const b = e.target.closest('[data-sw]'); if (!b) return; const i = +b.dataset.sw; if (swDone.has(i)) return; swDone.add(i); const ok = (+b.dataset.v) === rows[i].ok; swN++; if (ok) swScore++; $('#l4-r' + i, el).innerHTML = `<span style="color:${rows[i].ok ? 'var(--good)' : 'var(--bad)'}">${rows[i].ok ? 'natural' : 'odd: WordNet calls it a synonym anyway'}</span>`; $('#l4-swsc', el).textContent = `You matched ${swScore} of ${swN}. ${rows.filter(r => !r.ok).length} of ${rows.length} WordNet "synonym" swaps produce odd sentences: synonymy depends on context.`; });
    $('#l4-q', el).addEventListener('input', senses);
    el.addEventListener('click', e => { const q = e.target.closest('[data-look]'); if (q) { $('#l4-q', el).value = q.dataset.look; senses(); } const p = e.target.closest('[data-p]'); if (p) { const [a, b] = p.dataset.p.split('|'); $('#l4-a', el).value = a; $('#l4-b', el).value = b; sim(); } });
    $('#l4-a', el).addEventListener('change', sim); $('#l4-b', el).addEventListener('change', sim);
    senses(); sim();
  }
});
