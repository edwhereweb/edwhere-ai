<?php
// Served as /sitemap.xml (see .htaccess); built from the lab list so it never drifts.
require __DIR__ . '/learn-llm/labs.php';
header('Content-Type: application/xml; charset=utf-8');
$urls = ['/', '/learn-llm/'];
foreach (array_keys(LABS_META) as $k) $urls[] = "/learn-llm/?lab=$k";
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $u) echo '  <url><loc>' . SITE . htmlspecialchars($u) . "</loc></url>\n";
echo "</urlset>\n";
