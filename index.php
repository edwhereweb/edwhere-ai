<?php
// Landing page for ai.edwhere.com. Reuses the labs' design tokens and illustrations.
function asset(string $p): string { return $p . '?v=' . (@filemtime(__DIR__ . '/' . $p) ?: 0); }
require __DIR__ . '/learn-llm/labs.php';
$title = 'edwhere AI – Learn How Large Language Models Work with Interactive Labs';
$desc = 'Learn AI by playing with it. Interactive, in-browser labs that run the real algorithms so you see how language models work and what breaks without each idea.';
$url = SITE . '/';
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= $title ?></title>
<meta name="description" content="<?= $desc ?>">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="<?= $url ?>">
<meta property="og:type" content="website"><meta property="og:site_name" content="edwhere AI">
<meta property="og:title" content="<?= $title ?>"><meta property="og:description" content="<?= $desc ?>"><meta property="og:url" content="<?= $url ?>">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="<?= $title ?>"><meta name="twitter:description" content="<?= $desc ?>">
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@graph' => [
  ['@type' => 'WebSite', 'name' => 'edwhere AI', 'url' => $url, 'description' => $desc],
  ['@type' => 'Organization', 'name' => 'edwhere', 'url' => $url],
]], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
<meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231a73e8'/%3E%3Cpath d='M8 20l5-8 4 6 3-4 4 6' stroke='%23fff' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="<?= asset('learn-llm/css/styles.css') ?>">
<style>
.top { position: sticky; top: 0; z-index: 6; display: flex; align-items: center; justify-content: space-between; padding: 12px max(20px, env(safe-area-inset-right)) 12px max(20px, env(safe-area-inset-left)); background: color-mix(in srgb, var(--panel) 72%, transparent); backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid var(--line); }
.top .brand { margin: 0; font-size: 18px; } .top a { text-decoration: none; color: var(--ink); }
.top nav a { color: var(--accent); font-weight: 600; font-size: 15px; }
.page { max-width: 1060px; margin: 0 auto; padding: 24px max(16px, env(safe-area-inset-left)) 80px; }
.hero { padding-top: 40px; }
.section-h { margin: 56px 0 4px; }
.tracks { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 16px; margin-top: 16px; }
.track { display: flex; flex-direction: column; gap: 6px; text-decoration: none; color: var(--ink); background: var(--panel); border-radius: 24px; padding: 24px; box-shadow: var(--shadow); transition: transform .25s, box-shadow .25s; min-height: 260px; }
.track:hover { transform: translateY(-4px); box-shadow: 0 2px 4px rgba(0,0,0,.05), 0 18px 40px rgba(0,0,0,.14); }
.track.wide { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: center; min-height: 0; }
.track h3 { font-size: 26px; letter-spacing: -.03em; margin: 4px 0; } .track p { color: var(--muted); margin: 0 0 8px; }
.track .go { color: var(--accent); font-weight: 700; margin-top: auto; }
.track.soon { opacity: .6; cursor: default; } .track.soon:hover { transform: none; box-shadow: var(--shadow); }
.pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 14px; }
.steps { counter-reset: s; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; margin-top: 16px; }
.steps > div { background: var(--panel); border-radius: 20px; padding: 20px; box-shadow: var(--shadow); }
.steps b { display: block; font-size: 17px; letter-spacing: -.02em; margin: 6px 0 4px; } .steps p { margin: 0; color: var(--muted); font-size: 15px; }
.steps .ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; }
.steps .ic svg { width: 26px; height: 26px; }
footer { text-align: center; color: var(--muted); font-size: 14px; padding: 32px 16px; }
@media (max-width: 760px) { .track.wide { grid-template-columns: minmax(0, 1fr); } }
</style>
</head>
<body>
<header class="top"><a class="brand" href="/">edwhere AI</a><nav><a href="learn-llm/">Learn LLM →</a></nav></header>
<div class="page">
  <section class="hero view">
    <div class="hero-copy">
      <div class="eyebrow">Interactive AI education</div>
      <h1>Learn AI by <span class="cyc">breaking it</span>.</h1>
      <p class="lede">No slides, no installs. Hands-on labs that run the real algorithms in your browser, so you see how language models work and what fails without each idea.</p>
      <div class="cta"><a class="btn big-btn" href="learn-llm/">Start Learn LLM</a><button class="btn ghost big-btn" type="button" data-scroll="#tracks">Explore topics</button></div>
    </div>
    <div class="hero-fig" id="art"></div>
  </section>

  <h2 class="section-h" id="tracks">Topics</h2>
  <div class="tracks">
    <a class="track wide" href="learn-llm/">
      <div>
        <div class="eyebrow">Available now</div>
        <h3>Learn LLM</h3>
        <p>Twelve labs from bigram counts to scaled dot-product attention. Edit the data, watch the algorithm run, then see what breaks without it.</p>
        <div class="pills"><span class="chip static">Smoothing</span><span class="chip static">Word2Vec</span><span class="chip static">WordPiece</span><span class="chip static">RNN</span><span class="chip static">Attention</span></div>
        <span class="go">Open the labs →</span>
      </div>
      <div id="peek" class="home-grid" style="margin:0"></div>
    </a>
    <div class="track soon"><div class="eyebrow">Coming soon</div><h3>More topics</h3><p>New sections will appear here as they are published.</p></div>
  </div>

  <h2 class="section-h">How it works</h2>
  <div class="steps" id="steps"></div>

  <h2 class="section-h">All labs</h2>
  <div class="pills"><?php foreach (LABS_META as $id => $m): ?><a class="chip" href="learn-llm/?lab=<?= $id ?>"><?= htmlspecialchars($m[0]) ?></a> <?php endforeach; ?></div>
</div>
<footer>© <?= date('Y') ?> edwhere · ai.edwhere.com</footer>
<script src="<?= asset('learn-llm/js/art.js') ?>"></script>
<script>
document.getElementById('art').innerHTML = ART.hero();
// A few lab icons as a teaser; same icon set as the labs.
document.getElementById('peek').innerHTML = ['lab5', 'lab9', 'lab12'].map((id, i) =>
  `<span class="lcard c${1 + i}" style="--i:${i};padding:12px"><span class="ic" style="margin:0">${ART.icon(id)}</span></span>`).join('');
document.getElementById('steps').innerHTML = [
  ['lab1', 'c1', 'Run the real thing', 'Each lab executes the actual algorithm in your browser on small data you can edit.'],
  ['lab3', 'c2', 'See what breaks', 'Turn a technique off and watch the failure it was invented to fix.'],
  ['lab12', 'c4', 'Check yourself', 'A short quiz per lab ticks off your progress, saved on your device.']
].map(([id, c, t, d]) => `<div class="lcard ${c}" style="animation:none"><span class="ic">${ART.icon(id)}</span><b>${t}</b><p>${d}</p></div>`).join('');
</script>
</body>
</html>
