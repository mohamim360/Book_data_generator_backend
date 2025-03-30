const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');

const app = express();
app.use(cors());
app.use(express.json());

// Configure locales properly
const localeConfig = {
  'English (US)': 'en',
  'German (Germany)': 'de',
  'French (France)': 'fr'
};

// Realistic review generator
function generateBookReview(localizedFaker) {
  const aspects = ['plot', 'characters', 'writing style', 'pacing', 'themes', 'world-building'];
  const sentiments = {
    positive: [
      'masterfully crafted', 'truly compelling', 'remarkably engaging',
      'deeply moving', 'exceptionally well-written', 'visually stunning'
    ],
    neutral: [
      'generally well-executed', 'competently handled', 'adequately developed',
      'serviceable but unremarkable', 'moderately successful'
    ],
    negative: [
      'poorly realized', 'disappointingly shallow', 'awkwardly executed',
      'unconvincing', 'badly paced'
    ]
  };

  const rating = localizedFaker.number.float({ min: 0, max: 5 });
  const sentiment = rating > 3.5 ? 'positive' : rating > 2 ? 'neutral' : 'negative';
  
  const reviewParts = [
    `The ${localizedFaker.helpers.arrayElement(aspects)} was ${localizedFaker.helpers.arrayElement(sentiments[sentiment])}.`,
    `${localizedFaker.helpers.arrayElement([
      'While not without its flaws,',
      'Despite some shortcomings,',
      'Building on the strengths of previous chapters,'
    ])} ${localizedFaker.helpers.arrayElement([
      'the narrative maintains a steady momentum',
      'the author delivers satisfying character arcs',
      'the story offers fresh perspectives'
    ])}.`,
    `Readers who enjoy ${localizedFaker.music.genre()} ${localizedFaker.helpers.arrayElement([
      'will appreciate',
      'might find resonance in',
      'should connect with'
    ])} ${localizedFaker.helpers.arrayElement([
      'the intricate symbolism',
      'the moral dilemmas presented',
      'the emotional depth'
    ])}.`
  ];

  return localizedFaker.helpers.shuffle(reviewParts).join(' ');
}

function generateBooks(page, seed, language, avgLikes, avgReviews, count) {
  const localizedFaker = require('@faker-js/faker').faker;
  localizedFaker.locale = localeConfig[language] || 'en';
  localizedFaker.seed(Number(seed) + page * 1000);

  const books = [];
  for (let i = 0; i < count; i++) {
    const title = localizedFaker.lorem.words({ min: 1, max: 5 });
    const author = localizedFaker.person.fullName();
    const publisher = localizedFaker.company.name();

    // Generate meaningful reviews
    const reviews = [];
    const reviewCount = Math.floor(avgReviews) + (Math.random() < (avgReviews % 1) ? 1 : 0);
    
    for (let r = 0; r < reviewCount; r++) {
      reviews.push({
        text: generateBookReview(localizedFaker),
        author: `${localizedFaker.person.fullName()}, ${localizedFaker.helpers.arrayElement([
          'Editor at ' + localizedFaker.company.name(),
          'Award-winning critic',
          'Independent Book Blogger',
          'Contributing Literary Analyst'
        ])}`
      });
    }

    // Generate likes with Poisson distribution for more realism
    const likes = Math.round(localizedFaker.number.float({
      min: avgLikes * 0.7,
      max: avgLikes * 1.3,
      precision: 0.1
    }));

    books.push({
      id: page * 20 + i + 1,
      isbn: localizedFaker.commerce.isbn(),
      title: title.charAt(0).toUpperCase() + title.slice(1),
      author,
      publisher: `${publisher}, ${localizedFaker.number.int({ min: 1900, max: 2023 })}`,
      reviews,
      likes,
      coverImage: `https://picsum.photos/seed/${Number(seed) + page * 1000 + i}/300/400`
    });
  }
  return books;
}

// API Endpoint remains the same
app.get('/api/books', (req, res) => {
  const { page = 0, seed = '42', language = 'English (US)', likes = 0, reviews = 0 } = req.query;
  
  if (!localeConfig[language]) {
    return res.status(400).json({ error: 'Invalid language' });
  }

  try {
    const books = generateBooks(
      parseInt(page),
      seed,
      language,
      parseFloat(likes),
      parseFloat(reviews),
      20
    );
    res.json(books);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate books',
      details: error.message,
  
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});