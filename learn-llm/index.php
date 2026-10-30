<?php
// Cache-bust assets by file mtime so every GitHub auto-deploy refreshes browsers.
function asset(string $p): string { return $p . '?v=' . (@filemtime(__DIR__ . '/' . $p) ?: 0); }
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>LLM Concept Lab</title>
<meta name="description" content="Twelve interactive labs that teach how language models work: n-grams, embeddings, tokenization, RNNs and attention. Runs in your browser.">
<meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231a73e8'/%3E%3Cpath d='M8 20l5-8 4 6 3-4 4 6' stroke='%23fff' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="<?= asset('css/styles.css') ?>">
</head>
<body>
<div class="mtop">
  <div class="row1"><div class="brand">LLM Concept Lab</div>
  <select id="mnav" aria-label="Go to lab"></select></div>
</div>
<div class="app">
  <aside class="rail">
    <div class="brand">LLM Concept Lab<small>12 HANDS-ON LABS · M.TECH</small></div>
    <nav id="rnav" aria-label="Labs"></nav>
    <div class="progress"><span id="ptext">0 of 12 labs completed</span><div class="pbar"><span id="pbar"></span></div></div>
  </aside>
  <main id="main"></main>
</div>
<?php foreach (['core', 'labs-ngram', 'labs-embeddings', 'labs-sequence', 'art', 'main'] as $s): ?>
<script src="<?= asset("js/$s.js") ?>"></script>
<?php endforeach; ?>
</body>
</html>
