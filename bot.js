async function startBot() {
  document.getElementById("signal").innerText = "🔄 Fetching 5m data...";

  const prices = await fetchCandleCloses(); // 5m candles
  const rsiValues = calculateRSI(prices, 14);
  const ema9 = calculateEMA(prices, 9);
  const ema21 = calculateEMA(prices, 21);

  const lastRSI = rsiValues[rsiValues.length - 1];
  const lastEMA9 = ema9[ema9.length - 1];
  const lastEMA21 = ema21[ema21.length - 1];

  let signal = "HOLD";

  if (lastRSI < 30 && lastEMA9 > lastEMA21) {
    signal = "BUY";
    await sendOrder("BTCUSDT", "BUY", 0.001);
  } else if (lastRSI > 70 && lastEMA9 < lastEMA21) {
    signal = "SELL";
    await sendOrder("BTCUSDT", "SELL", 0.001);
  }

  document.getElementById("signal").innerText = `Signal: ${signal} (RSI: ${lastRSI.toFixed(2)})`;
}

// --- Utilities ---

async function fetchCandleCloses() {
  const url = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=100";
  const res = await fetch(url);
  const data = await res.json();
  return data.map(c => parseFloat(c[4])); // close prices
}

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let emaArray = [];
  emaArray[0] = prices.slice(0, period).reduce((a, b) => a + b) / period; // SMA first
  for (let i = period; i < prices.length; i++) {
    emaArray.push(prices[i] * k + emaArray[emaArray.length - 1] * (1 - k));
  }
  return emaArray;
}

function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    let diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / losses;
  let rsiArray = [100 - 100 / (1 + rs)];

  for (let i = period + 1; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];
    gains = diff > 0 ? diff : 0;
    losses = diff < 0 ? -diff : 0;
    rs = ((rs * (period - 1)) + (gains / losses)) / period;
    rsiArray.push(100 - 100 / (1 + rs));
  }

  // Pad initial empty values with nulls for alignment
  return Array(prices.length - rsiArray.length).fill(null).concat(rsiArray);
}

async function sendOrder(symbol, side, quantity) {
  try {
    const res = await fetch("http://localhost:3000/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, side, quantity })
    });
    const data = await res.json();
    console.log("✅ Trade:", data);
  } catch (err) {
    console.error("❌ Trade Error:", err);
  }
}
document.getElementById("start").addEventListener("click", startBot);