const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = '156548';
const CLIENT_SECRET = 'a2e6928a8fe8a9461dafb60f799d30da5a0d20e8';
let accessToken = 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c';
let refreshToken = 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d';
let tokenExpiresAt = 1745863200 * 1000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

async function refreshAccessToken() {
  if (!refreshToken) {
    console.error('No refresh token available');
    throw new Error('No refresh token available');
  }
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
    console.log('Token refreshed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

app.get('/api/rides', async (req, res) => {
  try {
    if (!accessToken || Date.now() > tokenExpiresAt) {
      console.log('Access token expired or missing, refreshing token...');
      await refreshAccessToken();
    }

    console.log('Fetching athlete activities with access token:', accessToken);
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 3 }
    });
    console.log('Activities fetched successfully:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error in /api/rides:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch rides', details: error.response ? error.response.data : error.message });
  }
});

module.exports = app;
