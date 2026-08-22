const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index > -1) {
          const key = trimmed.substring(0, index).trim();
          const value = trimmed.substring(index + 1).trim().replace(/^['"]|['\"]$/g, '');
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const reference = 'test-ref-' + Date.now();

console.log("Starting Paystack verification test request...");

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: `/transaction/verify/${encodeURIComponent(reference)}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 5000 // 5 seconds timeout
};

const request = https.request(options, (response) => {
  let data = '';
  console.log(`Status Code: ${response.statusCode}`);
  response.on('data', chunk => { data += chunk; });
  response.on('end', () => {
    console.log("Response received:");
    console.log(data);
    process.exit(0);
  });
});

request.on('error', (err) => {
  console.error("Request failed with error:", err);
  process.exit(1);
});

request.on('timeout', () => {
  console.error("Request timed out!");
  request.destroy();
  process.exit(1);
});

request.end();
