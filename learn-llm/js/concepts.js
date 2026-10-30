// "Concept first" sections: plain-language idea, analogy, a paper/pencil game and further reading for each lab.
// Written in our own words; links point to the explainers we found clearest. Rendered by show() in core.js before the lab.
const CONCEPTS = {
  lab1: {
    analogy: 'Phone keyboard autocomplete. When you type "good", it suggests "morning" or "luck" by looking only at that last word, not at your whole message. That shortcut is the Markov assumption: the recent past is a good enough stand-in for the whole past.',
    steps: [
      'Count how often each word follows each other word in a pile of text.',
      'Divide: P(next | previous) = times "previous next" appeared ÷ times "previous" appeared.',
      'To write a sentence, keep picking a likely next word and moving forward one step.'
    ],
    flow: ['read text', 'count pairs', 'divide by the first word', 'next-word odds'],
    game: 'Take any book page. Pick a word such as "the", and tally every word that follows it. The tallies are your bigram table. Now try the same with the <i>two</i> previous words and notice how few matches you find: that is why we cut the history short.',
    links: [['N-gram modeling, step by step', 'https://sookocheff.com/post/nlp/n-gram-modeling/'], ['Intro to language models: n-gram (Towards Data Science)', 'https://towardsdatascience.com/introduction-to-language-models-n-gram-e323081503d9']]
  },
  lab2: {
    analogy: 'A fishing trip. You catch 18 fish: 10 carp, 3 perch, 2 whitefish, 1 trout, 1 salmon, 1 eel. How likely is the next fish to be a species you have never caught? Saying 0 is silly: you only fished for one afternoon. Smoothing keeps a small "just in case" share of probability for things you have not seen yet.',
    steps: [
      'Laplace / add-k: pretend every possible pair was seen k extra times. Simple, but it can steal too much from real counts.',
      'Good-Turing: the species caught exactly once (3 of 18) tell you how much of the next catch will be brand new, so the unseen share is 3/18. Seen counts shrink slightly to pay for it (the trout drops from 1/18 to 1/27).',
      'Interpolation / backoff: when the bigram is unseen, lean on the shorter unigram.',
      'Kneser-Ney: judge a word by how many different words it follows, not just how often it appears. "Francisco" is common but almost always follows "San", so it is a poor guess after "reading ___"; "glasses" fits many contexts.'
    ],
    flow: ['seen pairs', 'take a little off', 'give it to unseen pairs', 'no more zeros'],
    game: 'Write 10 words on slips, drawing from a hat with replacement, and note which words appeared only once. The count of once-only words is your estimate for how much of the next draw will be a word you have never seen.',
    links: [['Smoothing slides (Cornell CS5740)', 'https://courses.cs.cornell.edu/courses/cs5740/2024sp/res/lm-smoothing-extra-slides.pdf'], ['Stanford CS224n: smoothing handout', 'https://web.stanford.edu/class/archive/cs/cs224n/cs224n.1106/handouts/cs224n-lecture3-2010-melange.pdf']]
  },
  lab3: {
    analogy: 'A multiple-choice quiz. If a model is as unsure as someone guessing between 6 equally likely options each time, its perplexity is 6, like rolling a fair die. A perplexity of 1 would be a model that is never surprised; higher means more confused.',
    steps: [
      'Hold back some text the model never trained on.',
      'Measure how surprised the model is by each real next word (low probability = high surprise).',
      'Average the surprise and convert it into "effective number of choices": that is perplexity. Lower is better.'
    ],
    flow: ['held-out text', 'probability of each word', 'average surprise', 'perplexity'],
    game: 'Shannon game: a friend hides a sentence and you guess it letter by letter. Count your guesses. Text you predict quickly has low perplexity for you; text full of surprises has high perplexity.',
    links: [['Understanding perplexity: an information theory view', 'https://thelatentvariable.substack.com/p/understanding-perplexity-an-information'], ['Perplexity in language models (Baeldung)', 'https://www.baeldung.com/cs/language-models-perplexity']]
  },
  lab4: {
    analogy: 'A hand-built library catalogue for meaning. Words that mean the same thing share one card (a synset); each card points to a more general card ("motel" → "hotel" → "building"). Like folders inside folders, but for ideas.',
    steps: [
      'A synset is one meaning shared by several words (car, auto, automobile).',
      'A hypernym is the "is-a" parent: every dog is a canine. A hyponym is the more specific child.',
      'Follow parents upward to see how closely related two words are: nearby in the tree means similar meaning.'
    ],
    flow: ['word', 'synset (one meaning)', 'is-a parent', 'is-a grandparent'],
    game: 'Pick any noun and keep asking "what is it a kind of?" until you reach "thing". Do it for a second word and see where your two chains meet. The meeting point is how related they are.',
    links: [['Visuwords: explore WordNet as a graph', 'https://visuwords.com/page/about'], ['The structure of a wordnet (guide)', 'https://wn.readthedocs.io/en/latest/guides/wordnet.html']]
  },
  lab5: {
    analogy: 'A map of meaning. Cities that are alike sit close on a map; words that are used alike sit close in vector space. And just as "go 500 km north" moves you the same way from any city, a relation like man → woman is a consistent direction.',
    steps: [
      'Give every word a short list of numbers (its vector), learned from the company it keeps.',
      'Close vectors mean similar usage: measure with cosine similarity.',
      'Relations become arrows. king − man + woman lands near queen, as long as you leave the input words out of the answer list.'
    ],
    flow: ['word', 'vector (coordinates)', 'nearest neighbours', 'analogy arrows'],
    game: 'Plot five foods and five vehicles on a sheet of paper so that similar things are close. Then draw one arrow from "car" to "cars". Does the same arrow turn "dog" into "dogs"? That repeatable arrow is the whole analogy trick.',
    links: [['The intuition behind Word2Vec (dev.to)', 'https://dev.to/pmuens/the-intuition-behind-word2vec-1b72'], ['King − man + woman = king? A caveat', 'https://blog.esciencecenter.nl/king-man-woman-king-9a7fd2935a85'], ['The amazing power of word vectors', 'https://www.kdnuggets.com/2016/05/amazing-power-word-vectors.html']]
  },
  lab6: {
    analogy: 'Fill in the blank. Show a neural net "the ___ sat on the mat" and make it guess "cat". Its guess is built from the words around the blank, mixed together like paint colours into one average.',
    steps: [
      'Take the context words around a hidden centre word.',
      'Average their vectors into one summary vector.',
      'Use a softmax over the vocabulary to guess the centre word; nudge the vectors so the right word scores higher.'
    ],
    flow: ['context words', 'average vectors', 'softmax', 'guess the centre word'],
    game: 'Cover one word in a printed sentence and let a friend guess it from the rest. CBOW is exactly this game, played millions of times.',
    links: [['CBOW vs skip-gram, compared', 'https://wikidocs.net/22660'], ['Word2Vec Parameter Learning Explained (paper)', 'https://www.academia.edu/39356625/word2vec_Parameter_Learning_Explained']]
  },
  lab7: {
    analogy: 'The reverse game. Instead of guessing a hidden word from its neighbours, you are told one word and must name the words likely to stand next to it. One word yields many training pairs, so rare words get more practice than in CBOW.',
    steps: [
      'Choose a centre word and a window size (say 2 words each side).',
      'Make a (centre, neighbour) pair for every neighbour inside the window.',
      'Train the net to predict each neighbour from the centre. Computing a softmax over the whole vocabulary for every pair is the expensive part, which the next lab fixes.'
    ],
    flow: ['centre word', 'window', '(target, context) pairs', 'predict neighbours'],
    game: 'Write a sentence, circle one word, and list every word within two places of it. Those are the pairs. Repeat for each word and count how fast the list grows.',
    links: [['CBOW and skip-gram, side by side', 'https://wikidocs.net/22660'], ['Mikolov et al.: word2vec explained (Goldberg & Levy)', 'https://arxiv.org/abs/1402.3722']]
  },
  lab8: {
    analogy: 'Party seating. Real neighbours are friends you pull closer; a few randomly chosen strangers are pushed away. You do not need to check every guest in the room each time, just the real friends plus a handful of random strangers.',
    steps: [
      'For each real (word, context) pair, nudge the two vectors together.',
      'Pick a few random words (negatives) and nudge them apart from the word. This turns a huge multi-class problem into cheap yes/no questions.',
      'Subsampling drops very common words like "the" so they do not dominate; α (the learning rate) sets the step size.'
    ],
    flow: ['real pair → pull together', 'random pair → push apart', 'repeat', 'meaning-groups form'],
    game: 'Stick 10 word cards on a table. For each sentence you read, slide the words that appear together a bit closer and slide a random word away. After 20 sentences, look at the clusters.',
    links: [['word2vec Explained: negative sampling derivation', 'https://arxiv.org/abs/1402.3722'], ['Negative sampling overview (Baeldung)', 'https://www.baeldung.com/cs/nlps-word2vec-negative-sampling']]
  },
  lab9: {
    analogy: 'Lego bricks. A shop cannot stock every possible model, but with a good set of small bricks you can build any word, even one you have never seen. A subword vocabulary is that brick box: whole words for the common ones, small pieces for the rest.',
    steps: [
      'Start with single characters as the smallest bricks.',
      'BPE repeatedly merges the pair that occurs most often. WordPiece merges the pair that most improves how well the vocabulary explains the text (frequency of the pair relative to its parts).',
      'To tokenize a new word, WordPiece takes the longest piece in the vocabulary from the left, marks later pieces with ##, and repeats (hugs → hug + ##s).'
    ],
    flow: ['characters', 'merge best pair', 'repeat until vocab is full', 'split new words into known pieces'],
    game: 'Write 10 words that share endings (play, playing, played, walking, walked ...). Circle the repeated chunks ("play", "walk", "ing", "ed"). Those chunks are your vocabulary; now spell a new word like "walked" with them.',
    links: [['WordPiece tokenization (Hugging Face course)', 'https://huggingface.co/course/chapter6/6?fw=pt']]
  },
  lab10: {
    analogy: 'A game of telephone with notes. Each word, you update your one-line summary of everything so far and pass it on. The summary can carry meaning forward, but when it is copied and shrunk again and again, early words fade away.',
    steps: [
      'Keep a hidden state h. At each word: new h = a squashed mix of the old h and the new word.',
      'The same weights are reused at every step, so the model handles any length and is sensitive to word order.',
      'Learning sends the error signal backwards through every step, shrinking it each time (vanishing gradient). That is why plain RNNs forget the far past, and why LSTMs and GRUs add gates.'
    ],
    flow: ['word 1', 'h₁', 'word 2', 'h₂', 'word 3', 'h₃ (the fading summary)'],
    game: 'Whisper a sentence along a line of five people, each told to repeat it a bit more quietly and shorter. Compare the first and last versions: that gap is the vanishing memory.',
    links: [['Vanishing gradient problem (a clear walkthrough)', 'https://apxml.com/courses/nlp-fundamentals/chapter-5-nlp-sequence-models-intro/vanishing-gradient-problem'], ['Vanishing gradient problem (Wikipedia)', 'https://en.wikipedia.org/wiki/Vanishing_gradient_problem']]
  },
  lab11: {
    analogy: 'A human interpreter. The encoder reads the whole French sentence and forms a gist; the decoder then speaks English one word at a time. Plain seq2seq squeezes everything into one gist; attention lets the interpreter glance back at the source for each word. Beam search is trying a few promising sentence starts at once instead of betting everything on the first word.',
    steps: [
      'Encoder: read the source words into hidden states.',
      'Decoder: produce one target word per step, feeding its last word back in. Teacher forcing during training feeds it the true previous word.',
      'Attention: at each step, weigh the source words by relevance, and use that mix as extra context.',
      'Beam search: keep the best k partial sentences at each step, instead of only the single best (greedy), so one unlucky early choice does not ruin the sentence.'
    ],
    flow: ['source sentence', 'encoder', 'attention glance', 'decoder', 'beam of best k outputs'],
    game: 'Hike with a group of three: at each fork, each hiker takes the best-looking path but only the three best overall routes are kept. That is beam search with k = 3. Greedy is a lone hiker who never looks back.',
    links: [['Seq2Seq-Vis: seeing every stage of a seq2seq model', 'https://arxiv.org/pdf/1804.09299'], ['Interactive attention + beam-search visualisation (EMNLP demo)', 'https://aclanthology.org/D17-2021/']]
  },
  lab12: {
    analogy: 'A library search. Your query is what you are looking for; each book has a key (its label) and a value (its contents). Compare your query with every key, turn the scores into percentages, and read a blend of the values, mostly from the best matches.',
    steps: [
      'Each token makes three vectors: a query Q, a key K and a value V.',
      'Score = Q · K for every pair; high means relevant.',
      'Divide by √dₖ. A dot product of d random numbers has spread about √d, so without the division, scores for big d get huge, softmax saturates to nearly one-hot, and gradients vanish.',
      'Softmax the scores into weights, and output the weighted sum of the V vectors.'
    ],
    flow: ['Q · Kᵀ', '÷ √dₖ', 'softmax', '× V', 'new token vector'],
    game: 'A room of 8 people each shouts a number; you add them up. With 64 people the total is much louder even if everyone is equally loud. Dividing by the square root of the head-count keeps the volume steady, which is what √dₖ does for the dot product.',
    links: [['Attention Is All You Need (original paper)', 'https://arxiv.org/pdf/1706.03762'], ['Math behind attention: Q, K and V', 'https://outcomeschool.com/blog/math-behind-attention-qkv']]
  }
};

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
