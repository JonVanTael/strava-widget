const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = '156548';
const CLIENT_SECRET = 'a2e6928a8fe8a9461dafb60f799d30da5a0d20e8';
let accessToken = 'YOUR_ACCESS_TOKEN'; // I’ll provide this after deployment
let refreshToken = 'YOUR_REFRESH_TOKEN'; // I’ll provide this after deployment
let tokenExpiresAt = 1714133910 * 1000; // I’ll update this with the correct timestamp

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('No refresh token available');
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpiresAt = response.data.expires_at * 1000;
    console.log('Token refreshed');
  } catch (error) {
    console.error('Token refresh error:', error.response?.data);
    throw error;
  }
}

app.get('/api/rides', async (req, res) => {
  if (!accessToken || Date.now() > tokenExpiresAt) {
    try {
      await refreshAccessToken();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to refresh token' });
    }
  }

  try {
    const response = await axios.get('https://www.strava.com/api/v3/clubs/1298408/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 3 }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Strava API error:', error.response?.data);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

module.exports = app;
