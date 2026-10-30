// CONCEPTS (from ../concepts.json) is inlined by index.php so crawlers and the app share one source.
function conceptCard(id) {
  const c = CONCEPTS[id]; if (!c) return '';
  return `<div class="card concept"><div class="kicker">Concept first</div><h2>The idea in plain words</h2>
    <div class="note good"><b>Think of it like this.</b> ${c.analogy}</div>
    <h3>Step by step</h3><ol class="try">${c.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <div class="flow mono" style="font-size:13px;margin:10px 0">${c.flow.map((t, i) => (i ? '<span class="arrow">→</span>' : '') + `<span class="chip static">${t}</span>`).join('')}</div>
    <h3>Play it on paper first</h3><p>${c.game}</p>
    <p class="sub">Explained well elsewhere: ${c.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p></div>
    <div class="eyebrow" style="margin-top:28px">Now the lab</div>`;
}
