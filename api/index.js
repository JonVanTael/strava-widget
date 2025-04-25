const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/rides', async (req, res) => {
  try {
    // Try to fetch the group events page (this URL might not work directly)
    const response = await axios.get('https://www.strava.com/clubs/1298408/group_events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = response.data;

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(html);

    // Scrape upcoming group rides (adjust selectors based on actual HTML)
    const rides = [];
    $('.group-event-card').each((index, element) => {
      if (index >= 3) return false; // Limit to 3 rides

      const title = $(element).find('.group-event-card__title').text().trim();
      const date = $(element).find('.group-event-card__date').text().trim();
      const distance = $(element).find('.group-event-card__distance').text().trim();
      const speed = $(element).find('.group-event-card__pace').text().trim();
      const location = $(element).find('.group-event-card__location').text().trim();

      rides.push({
        title: title || 'No title',
        date: date || 'No date',
        distance: distance || 'No distance',
        speed: speed || 'No speed',
        location: location || 'No location'
      });
    });

    if (rides.length === 0) {
      console.log('No upcoming group rides found on the page.');
      // Fallback: Scrape the main club page for any event-related content
      const mainPageResponse = await axios.get('https://www.strava.com/clubs/1298408', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const mainHtml = mainPageResponse.data;
      const $main = cheerio.load(mainHtml);

      $main('.group-event-card, .event-card, [data-testid="group-event"]').each((index, element) => {
        if (index >= 3) return false;

        const title = $main(element).find('[data-testid="event-title"], .title').text().trim();
        const date = $main(element).find('[data-testid="event-date"], .date').text().trim();
        const distance = $main(element).find('[data-testid="event-distance"], .distance').text().trim();
        const speed = $main(element).find('[data-testid="event-pace"], .pace').text().trim();
        const location = $main(element).find('[data-testid="event-location"], .location').text().trim();

        rides.push({
          title: title || 'No title',
          date: date || 'No date',
          distance: distance || 'No distance',
          speed: speed || 'No speed',
          location: location || 'No location'
        });
      });
    }

    console.log('Scraped upcoming group rides:', rides);
    res.json(rides);
  } catch (error) {
    console.error('Error scraping group rides:', error.message);
    res.status(500).json({ error: 'Failed to scrape group rides', details: error.message });
  }
});

module.exports = app;
