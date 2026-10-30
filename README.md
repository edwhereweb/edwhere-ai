# LLM Concept Lab

Twelve interactive labs for the M.Tech Large Language Models exam topics. Every lab runs the real algorithm in the browser on small, editable data and shows what breaks when the technique is removed.

| # | Lab | File |
|---|-----|------|
| 1 | Markov assumption & bigram model | `js/labs-ngram.js` |
| 2 | Smoothing (Laplace, add-k, interpolation, Good-Turing, Kneser-Ney) | `js/labs-ngram.js` |
| 3 | Evaluation (perplexity, choosing k, Shannon game) | `js/labs-ngram.js` |
| 4 | WordNet | `js/labs-ngram.js` |
| 5 | Word2Vec embedding space & analogies | `js/labs-embeddings.js` |
| 6 | CBOW (trained in the browser) | `js/labs-embeddings.js` |
| 7 | Skip-gram pairs & cost of full softmax | `js/labs-embeddings.js` |
| 8 | Training Word2Vec live (SGNS, α, subsampling) | `js/labs-embeddings.js` |
| 9 | WordPiece vs BPE | `js/labs-sequence.js` |
| 10 | RNN, memory and vanishing gradients | `js/labs-sequence.js` |
| 11 | Seq2Seq, teacher forcing, attention, beam search | `js/labs-sequence.js` |
| 12 | Scaled dot-product attention and √dₖ | `js/labs-sequence.js` |

## Run it

No build step and no dependencies, but the entry point is `index.php` so it needs PHP:

```
php -S localhost:8080
```

## Deploy to Hostinger (auto-deploy from GitHub)

1. Push this folder to a GitHub repo.
2. hPanel → Websites → Manage → Advanced → **Git** → create repository: paste the repo URL, branch `main`, install path empty (= `public_html`).
3. Add the deploy key shown in hPanel to the GitHub repo (Settings → Deploy keys), if the repo is private.
4. Copy the **Webhook URL** from hPanel into GitHub (Settings → Webhooks, content type `application/json`, push events). Every push to `main` now redeploys.

Asset URLs carry the file's mtime (`?v=`), so browsers pick up new CSS/JS after each deploy.

## Structure

- `index.php` – page shell, loads the scripts in order (`.htaccess` sets caching, gzip, security headers)
- `js/art.js` – hero and lab-icon illustrations, hover spotlight, confetti
- `css/styles.css` – design tokens (light/dark) and components
- `js/core.js` – helpers (charts, heatmaps, bars, quiz, RNG), lab registry `lab({...})`, hash router
- `js/labs-*.js` – one `lab({ id, n, title, build(el) })` call per lab
- `js/main.js` – calls `boot()`

## Adding a lab

Call `lab({ id: 'lab13', n: 13, short, title, does, without, lede, build(el) { ... } })` in a new script and include it in `index.html` before `main.js`. Use `quiz('lab13', [...])`, `vs(withText, withoutText)` and `tryList([...])` for the standard sections.
