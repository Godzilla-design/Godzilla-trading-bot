const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_SECRET_KEY;

app.post('/trade', async (req, res) => {
  const { symbol, side, quantity } = req.body;
  const timestamp = Date.now();

  const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(query).digest('hex');

  try {
    const result = await axios.post(`https://api.binance.com/api/v3/order?${query}&signature=${signature}`, null, {
      headers: { 'X-MBX-APIKEY': apiKey }
    });
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.response.data });
  }
});

app.listen(3000, () => console.log("🚀 Backend running at http://localhost:3000"));
