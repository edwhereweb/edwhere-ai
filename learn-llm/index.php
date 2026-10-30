<?php
// Cache-bust assets by file mtime so every GitHub auto-deploy refreshes browsers.
function asset(string $p): string { return $p . '?v=' . (@filemtime(__DIR__ . '/' . $p) ?: 0); }
require __DIR__ . '/labs.php';
$id = $_GET['lab'] ?? '';
$m = LABS_META[$id] ?? null;
$title = $m ? $m[3] : 'LLM Concept Lab: 12 Interactive Labs on How LLMs Work';
$desc = $m ? $m[4] : 'Twelve interactive labs on how language models work: n-grams, Word2Vec, tokenization, RNNs and attention. Edit the data and run the real algorithm in-browser.';
$concepts = json_decode(file_get_contents(__DIR__ . '/concepts.json'), true);
$c = $concepts[$id] ?? null;
$url = SITE . '/learn-llm/' . ($m ? "?lab=$id" : '');
$h = fn($x) => htmlspecialchars($x, ENT_QUOTES);
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= $h($title) ?></title>
<meta name="description" content="<?= $h($desc) ?>">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="<?= $url ?>">
<meta property="og:type" content="website"><meta property="og:site_name" content="LLM Concept Lab">
<meta property="og:title" content="<?= $h($title) ?>"><meta property="og:description" content="<?= $h($desc) ?>"><meta property="og:url" content="<?= $url ?>">
<meta name="twitter:card" content="summary_large_image"><meta property="og:image" content="<?= SITE ?>/og-image.png"><meta name="twitter:image" content="<?= SITE ?>/og-image.png"><meta name="twitter:title" content="<?= $h($title) ?>"><meta name="twitter:description" content="<?= $h($desc) ?>">
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@graph' => [
  $m ? ['@type' => 'LearningResource', 'name' => $m[1], 'description' => $m[2], 'url' => $url, 'inLanguage' => 'en', 'learningResourceType' => 'Interactive lab', 'isPartOf' => ['@type' => 'Course', 'name' => 'LLM Concept Lab', 'url' => SITE . '/learn-llm/']]
     : ['@type' => 'Course', 'name' => 'LLM Concept Lab', 'description' => $desc, 'url' => $url, 'provider' => ['@type' => 'Organization', 'name' => 'edwhere', 'url' => SITE . '/'],
        'hasPart' => array_map(fn($k, $v) => ['@type' => 'LearningResource', 'name' => $v[1], 'url' => SITE . "/learn-llm/?lab=$k"], array_keys(LABS_META), LABS_META)],
  ['@type' => 'BreadcrumbList', 'itemListElement' => array_values(array_filter([
    ['@type' => 'ListItem', 'position' => 1, 'name' => 'edwhere AI', 'item' => SITE . '/'],
    ['@type' => 'ListItem', 'position' => 2, 'name' => 'LLM Concept Lab', 'item' => SITE . '/learn-llm/'],
    $m ? ['@type' => 'ListItem', 'position' => 3, 'name' => $m[0], 'item' => $url] : null]))],
]], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
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
    <div class="brand"><a href="/" style="color:inherit;text-decoration:none">LLM Concept Lab</a><small>12 HANDS-ON LABS · M.TECH</small></div>
    <nav id="rnav" aria-label="Labs"></nav>
    <div class="progress"><span id="ptext">0 of 12 labs completed</span><div class="pbar"><span id="pbar"></span></div></div>
  </aside>
  <main id="main"><div id="ssr">
    <?php if ($m): ?><h1><?= $h($m[1]) ?></h1><p class="lede"><?= $h($m[2]) ?></p><?php else: ?><h1>LLM Concept Lab: 12 interactive labs on how language models work</h1><p class="lede"><?= $h($desc) ?></p><?php endif; ?>
    <?php if ($c): ?><h2>The idea in plain words</h2><p><?= $c['analogy'] ?></p><h2>Step by step</h2><ol><?php foreach ($c['steps'] as $st): ?><li><?= $st ?></li><?php endforeach; ?></ol><h2>Play it on paper first</h2><p><?= $c['game'] ?></p><h2>Other labs</h2><?php endif; ?>
    <ul><?php foreach (LABS_META as $k => $v): ?><li><a href="?lab=<?= $k ?>"><?= $h($v[1]) ?></a></li><?php endforeach; ?></ul>
  </div></main>
</div>
<script>const CONCEPTS = <?= json_encode($concepts, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;</script>
<?php foreach (['core', 'labs-ngram', 'labs-embeddings', 'labs-sequence', 'concepts', 'art', 'main'] as $s): ?>
<script defer src="<?= asset("js/$s.js") ?>"></script>
<?php endforeach; ?>
</body>
</html>
