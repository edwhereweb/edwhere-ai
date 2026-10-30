// CONCEPTS (from ../concepts.json) is inlined by index.php so crawlers and the app share one source.
function conceptCard(id) {
  const c = CONCEPTS[id]; if (!c) return '';
  return `<div class="card concept"><div class="kicker">Concept first</div><h2>The idea in plain words</h2>
    <div class="note good"><b>Think of it like this.</b> ${c.analogy}</div>
    <h3>Step by step</h3><ol class="try">${c.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <div class="flow mono" style="font-size:13px;margin:10px 0">${c.flow.map((t, i) => (i ? '<span class="arrow">→</span>' : '') + `<span class="chip static">${t}</span>`).join('')}</div>
    <h3>Play it on paper first</h3><p>${c.game}</p>
    ${videoList(c.videos)}
    <p class="sub">Explained well elsewhere: ${c.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p></div>
    <div class="eyebrow" style="margin-top:28px">Now the lab</div>`;
}

// "Watch it explained": YouTube picks per lab. Shows a thumbnail first and only loads the
// player on click, so the page stays light and nothing talks to YouTube until asked.
function videoList(vs) {
  if (!vs || !vs.length) return '';
  return `<h3>Watch it explained</h3><p class="sub">Beginner-friendly videos with everyday examples. Start with the first one.</p>
    <div class="vids">${vs.map(v => `<figure class="vid">
      <button type="button" class="vthumb" data-yt="${esc(v.id)}" aria-label="Play: ${esc(v.title)}">
        <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360" onerror="this.style.visibility='hidden'"><span class="vplay" aria-hidden="true"></span>
      </button>
      <figcaption><span class="vtag">${esc(v.level)}</span><b>${esc(v.title)}</b><span class="vch">${esc(v.channel)} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">open on YouTube</a></span><span class="vwhy">${esc(v.why)}</span></figcaption>
    </figure>`).join('')}</div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('.vthumb'); if (!b) return;
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(b.dataset.yt)}?autoplay=1&rel=0`;
  f.title = b.getAttribute('aria-label').replace(/^Play: /, '');
  f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  f.allowFullscreen = true; f.loading = 'lazy'; f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.className = 'vframe';
  b.replaceWith(f);
});
