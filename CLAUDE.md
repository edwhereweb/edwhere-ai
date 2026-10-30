# LLM Concept Lab – notes for Claude

- Plain HTML/CSS/vanilla JS, no build, no dependencies. Scripts are classic (not modules) and share globals; the labs app lives in `learn-llm/`; the root `index.php` is the ai.edwhere.com landing page (reuses learn-llm CSS and art.js); load order in `learn-llm/index.php` matters: core.js → labs-*.js → art.js → main.js. Hosted on Hostinger (PHP), auto-deployed from GitHub; test with `php -S localhost:8080`.
- Every lab registers with `lab({ id, n, short, title, does, without, lede, build(el), refresh?, pause? })` from `js/core.js`. `build` runs once on first visit; `refresh` runs on revisits; `pause` stops animations when leaving.
- Routing uses `location.hash` (`#home`, `#lab1` … `#lab12`). Quiz completion is stored in localStorage key `llm-lab-done` (wrapped in try/catch).
- Colours are CSS tokens in `css/styles.css` with light and dark variants; use `var(--accent)`, `var(--good)`, `var(--bad)`, `var(--warn)` rather than literal colours.
- Content follows Dr. Vinod P.'s slides (Module 1-1, Tokenization, WordPiece, RNN, Seq2Seq+Attention, Scaled Dot Product Attention). Worked examples (beam search table, attention step, scalar RNN, Good-Turing birds, WordPiece corpus) use the slide numbers; keep them matching.
- Test by running `php -S localhost:8080`, opening `/` and `/learn-llm/` and visiting every lab; check the browser console for errors and that nothing scrolls horizontally at 400px width.
