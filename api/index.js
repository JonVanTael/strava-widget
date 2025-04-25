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
    // Fetch the club page HTML
    const response = await axios.get('https://www.strava.com/clubs/1298408');
    const html = response.data;

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(html);

    // Scrape upcoming group rides
    const rides = [];
    // Targeting the group events section (adjust selector based on Strava's HTML structure)
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

    // If no rides are found, log a message
    if (rides.length === 0) {
      console.log('No upcoming group rides found on the page.');
    }

    console.log('Scraped upcoming group rides:', rides);
    res.json(rides);
  } catch (error) {
    console.error('Error scraping group rides:', error.message);
    res.status(500).json({ error: 'Failed to scrape group rides', details: error.message });
  }
});

module.exports = app;
