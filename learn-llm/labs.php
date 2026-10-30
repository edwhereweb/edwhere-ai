<?php
// Lab metadata for server-rendered SEO (titles, descriptions, sitemap). Keep in sync with lab() in js/labs-*.js.
const SITE = 'https://ai.edwhere.com';
const LABS_META = [
  'lab1'  => ['Bigram & Markov', 'The Markov assumption and the bigram model', 'Turns raw counts into next-word probabilities using only the previous word.'],
  'lab2'  => ['Smoothing', 'Smoothing: giving unseen N-grams a chance', 'Moves a little probability from seen word pairs to unseen ones: Laplace, add-k, interpolation, Good-Turing and Kneser-Ney.'],
  'lab3'  => ['Evaluation', 'Evaluating language models: perplexity and friends', 'Gives one number to compare two language models on held-out text.'],
  'lab4'  => ['WordNet', 'WordNet: meaning written down by hand', 'Groups words into synsets with glosses and is-a links, so "motel" is known to be a kind of "hotel".'],
  'lab5'  => ['Word2Vec', 'Word2Vec: meaning as a position in space', 'Gives every word a dense vector so similar words sit close and relations become directions.'],
  'lab6'  => ['CBOW', 'CBOW: predict the missing word from its neighbours', 'Averages the context word vectors and predicts the centre word with a softmax.'],
  'lab7'  => ['Skip-gram', 'Skip-gram: one word, many training pairs', 'Uses the centre word to predict each neighbour, producing (target, context) training pairs.'],
  'lab8'  => ['Training Word2Vec', 'Training Word2Vec live: negative sampling, α and subsampling', 'Pulls real (word, context) pairs together and pushes random pairs apart until meaning-groups form.'],
  'lab9'  => ['WordPiece', 'WordPiece vs BPE: building a subword vocabulary', 'Learns reusable pieces so new words are split into known parts instead of becoming unknown.'],
  'lab10' => ['RNN', 'Recurrent neural networks: memory that fades', 'Carries a hidden state from word to word, so the output depends on the whole history and on word order.'],
  'lab11' => ['Seq2Seq & beam', 'Seq2Seq: encoder, decoder, attention and beam search', 'Reads a whole sentence into a vector, generates the translation word by word, and searches for the best output.'],
  'lab12' => ['Scaled attention', 'Scaled dot-product attention and the √dₖ', 'Lets every token build a new vector from the tokens most relevant to it.'],
];
