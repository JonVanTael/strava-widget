const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/rides', async (req, res) => {
  let browser;
  try {
    // Launch a headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Navigate to the club page
    await page.goto('https://www.strava.com/clubs/1298408', {
      waitUntil: 'networkidle2'
    });

    // Wait for the group events section to load (adjust selector as needed)
    await page.waitForSelector('[data-testid="group-events-section"], .group-events', { timeout: 10000 });

    // Scrape the upcoming group rides
    const rides = await page.evaluate(() => {
      const rideElements = document.querySelectorAll('[data-testid="group-event"], .group-event-card');
      const ridesArray = [];

      rideElements.forEach((element, index) => {
        if (index >= 3) return; // Limit to 3 rides

        const title = element.querySelector('[data-testid="event-title"], .title')?.innerText.trim() || 'No title';
        const date = element.querySelector('[data-testid="event-date"], .date')?.innerText.trim() || 'No date';
        const distance = element.querySelector('[data-testid="event-distance"], .distance')?.innerText.trim() || 'No distance';
        const speed = element.querySelector('[data-testid="event-pace"], .pace')?.innerText.trim() || 'No speed';
        const location = element.querySelector('[data-testid="event-location"], .location')?.innerText.trim() || 'No location';

        ridesArray.push({
          title,
          date,
          distance,
          speed,
          location
        });
      });

      return ridesArray;
    });

    console.log('Scraped upcoming group rides:', rides);
    res.json(rides);
  } catch (error) {
    console.error('Error scraping group rides with puppeteer:', error.message);
    res.status(500).json({ error: 'Failed to scrape group rides', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

module.exports = app;
