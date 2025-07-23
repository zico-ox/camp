// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow local frontend

app.get('/api/conversions', async (req, res) => {
  try {
    const apiUrl = 'https://api.hiqmobi.com/api/conversion?api_token=nvqyurckedgax0ajn3x0m5nlehmpk02e5yh4&page=1&limit=10';
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Proxy server error', error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
});