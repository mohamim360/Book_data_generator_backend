const express = require('express');
const cors = require('cors');
const { Faker } = require('@faker-js/faker');

const app = express();
app.use(cors());
app.use(express.json());

// Configure locales properly
const locales = {
  'English (US)': 'en',
  'German (Germany)': 'de',
  'French (France)': 'fr'
};

function generateBooks(page, seed, language, avgLikes, avgReviews, count) {
  // Create a NEW Faker instance for each request
  const locale = locales[language] || 'en';
  const faker = new Faker({ locale });

  const books = [];
  for (let i = 0; i < count; i++) {
    const bookSeed = Number(seed) + page * 1000 + i;
    faker.seed(bookSeed);

    const title = faker.lorem.words({ min: 1, max: 5 });
    const author = faker.person.fullName();
    const publisher = faker.company.name();

    // Generate reviews
    const reviews = [];
    const reviewCount = Math.floor(avgReviews) + (Math.random() < (avgReviews % 1) ? 1 : 0);
    
    for (let r = 0; r < reviewCount; r++) {
      reviews.push({
        text: faker.lorem.sentences({ min: 1, max: 3 }),
        author: `${faker.person.fullName()}, ${faker.company.name()}`
      });
    }

    // Generate likes
    const likes = Math.floor(avgLikes) + (Math.random() < (avgLikes % 1) ? 1 : 0);

    books.push({
      id: page * 20 + i + 1,
      isbn: faker.commerce.isbn(),
      title: title.charAt(0).toUpperCase() + title.slice(1),
      author,
      publisher: `${publisher}, ${faker.number.int({ min: 1900, max: 2023 })}`,
      reviews,
      likes,
      coverImage: `https://picsum.photos/seed/${bookSeed}/300/400`
    });
  }
  return books;
}

// API Endpoint
app.get('/api/books', (req, res) => {
  const { page = 0, seed = '42', language = 'English (US)', likes = 0, reviews = 0 } = req.query;
  
  if (!locales[language]) {
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
    res.status(500).json({ error: 'Failed to generate books' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});