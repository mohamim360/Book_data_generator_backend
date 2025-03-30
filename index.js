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

// Initialize Faker instances for each locale
const localizedFakers = {
  'en': faker,
  'de': require('@faker-js/faker/locale/de'),
  'fr': require('@faker-js/faker/locale/fr')
};

// Realistic review generator
function generateBookReview(localizedFaker) {
  // Update review components for better localization
  const aspects = {
    en: ['plot', 'characters', 'writing style', 'pacing', 'themes', 'world-building'],
    de: ['Handlung', 'Charaktere', 'Schreibstil', 'Erzähltempo', 'Themen', 'Weltentwicklung'],
    fr: ['intrigue', 'personnages', 'style d\'écriture', 'rythme', 'thèmes', 'développement du monde']
  };

  const sentiments = {
    positive: {
      en: ['masterfully crafted', 'truly compelling', 'remarkably engaging'],
      de: ['meisterhaft gestaltet', 'absolut fesselnd', 'außergewöhnlich mitreißend'],
      fr: ['habilement conçu', 'vraiment passionnant', 'remarquablement engageant']
    },
    neutral: {
      en: ['generally well-executed', 'competently handled'],
      de: ['allgemein gut umgesetzt', 'kompetent gehandhabt'],
      fr: ['généralement bien exécuté', 'compétemment géré']
    },
    negative: {
      en: ['poorly realized', 'disappointingly shallow'],
      de: ['schlecht umgesetzt', 'enttäuschend oberflächlich'],
      fr: ['mal réalisé', 'décevamment superficiel']
    }
  };

  const rating = localizedFaker.number.float({ min: 0, max: 5 });
  const sentiment = rating > 3.5 ? 'positive' : rating > 2 ? 'neutral' : 'negative';
  const lang = localizedFaker.locale;

  const reviewParts = [
    `${lang === 'en' ? 'The' : ''} ${localizedFaker.helpers.arrayElement(aspects[lang.substring(0,2)])} ${{
      en: 'was',
      de: 'war',
      fr: 'était'
    }[lang]} ${localizedFaker.helpers.arrayElement(sentiments[sentiment][lang.substring(0,2)])}.`,
    
    localizedFaker.helpers.arrayElement([
      {
        en: 'While not without its flaws, the narrative maintains a steady momentum.',
        de: 'Trotz einiger Schwächen behält die Erzählung eine stetige Dynamik.',
        fr: 'Malgré quelques défauts, le récit maintient une dynamique régulière.'
      },
      {
        en: 'The author delivers satisfying character development.',
        de: 'Der Autor liefert eine zufriedenstellende Charakterentwicklung.',
        fr: 'L\'auteur propose un développement des personnages satisfaisant.'
      }
    ])[lang],
    
    localizedFaker.helpers.arrayElement([
      {
        en: `Readers of ${localizedFaker.word.noun()} will appreciate the ${localizedFaker.word.adjective()} details.`,
        de: `Leser von ${localizedFaker.word.noun()} werden die ${localizedFaker.word.adjective()} Details zu schätzen wissen.`,
        fr: `Les lecteurs de ${localizedFaker.word.noun()} apprécieront les détails ${localizedFaker.word.adjective()}.`
      }
    ])[lang]
  ];

  return localizedFaker.helpers.shuffle(reviewParts).join(' ');
}

function generateBooks(page, seed, language, avgLikes, avgReviews, count) {
  const langCode = localeConfig[language] || 'en';
  const localizedFaker = localizedFakers[langCode];
  localizedFaker.seed(Number(seed) + page * 1000);

  const books = [];
  for (let i = 0; i < count; i++) {
    // Generate localized content
    const title = localizedFaker.lorem.words({ min: 2, max: 5 });
    const author = localizedFaker.person.fullName();
    const publisher = localizedFaker.company.name();

    // Generate reviews with proper localization
    const reviews = [];
    const reviewCount = Math.floor(avgReviews) + (Math.random() < (avgReviews % 1) ? 1 : 0);
    
    for (let r = 0; r < reviewCount; r++) {
      reviews.push({
        text: generateBookReview(localizedFaker),
        author: `${author}, ${localizedFaker.helpers.arrayElement([
          localizedFaker.company.name(),
          localizedFaker.person.jobTitle(),
          localizedFaker.word.noun()
        ])}`
      });
    }

    // Generate localized book data
    books.push({
      id: page * 20 + i + 1,
      isbn: localizedFaker.commerce.isbn(),
      title: title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      author,
      publisher: `${publisher}, ${localizedFaker.number.int({ min: 1900, max: 2023 })}`,
      reviews,
      likes: Math.round(localizedFaker.number.float({
        min: avgLikes * 0.7,
        max: avgLikes * 1.3,
        precision: 0.1
      })),
      coverImage: `https://picsum.photos/seed/${Number(seed) + page * 1000 + i}/300/400`
    });
  }
  return books;
}

// API Endpoint
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
      details: error.message
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});