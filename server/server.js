require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');

const app = express();
app.use(cors());
app.use(express.json());

// Fetch settings dynamically from Firebase RTDB or Env
async function getSnapInstance() {
  let serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  // Default to Sandbox mode — only switch to Production if explicitly set
  let isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  try {
    const dbUrl = process.env.FIREBASE_DATABASE_URL || '';
    const response = await fetch(`${dbUrl}/settings.json`);
    if (response.ok) {
      const settings = await response.json();
      if (settings && settings.midtransServerKey && !process.env.MIDTRANS_SERVER_KEY) {
        serverKey = settings.midtransServerKey;
      }
      // Only enable production if the admin explicitly toggled it on and no env override
      if (settings && settings.midtransIsProduction === true && !process.env.MIDTRANS_IS_PRODUCTION) {
        isProduction = true;
      }
    }
  } catch (err) {
    console.error("Error fetching settings from Firebase RTDB, using default credentials:", err);
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey
  });
}

app.post('/api/payment/create', async (req, res) => {
  try {
    const { order_id, gross_amount, first_name, email, phone, return_url } = req.body;

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(gross_amount) // Must be integer
      },
      customer_details: {
        first_name: first_name,
        email: email || 'passenger@mantara.com',
        phone: phone
      },
      callbacks: {
        finish: return_url || "http://localhost:5173",
        error: return_url || "http://localhost:5173",
        pending: return_url || "http://localhost:5173"
      }
    };

    const snapInstance = await getSnapInstance();
    const transaction = await snapInstance.createTransaction(parameter);
    res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (error) {
    console.error("Midtrans Error:", error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logMsg = `${new Date().toISOString()} - Midtrans Error:\nMessage: ${error.message}\nDetails: ${JSON.stringify(error)}\nStack: ${error.stack}\n\n`;
      fs.appendFileSync(path.join(__dirname, 'midtrans_errors.log'), logMsg);
    } catch (logErr) {
      console.error("Failed to write to log file:", logErr);
    }
    const msg = error.message || 'Failed to generate transaction token';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/payment/status/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    const snapInstance = await getSnapInstance();
    const response = await snapInstance.transaction.status(order_id);
    res.json(response);
  } catch (error) {
    console.error("Midtrans Status Error:", error);
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Midtrans Payment Bridge running on port ${PORT}`);
  console.log(`Dynamic API Keys loaded from Firebase RTDB settings`);
  console.log(`===================================================`);
});
