import https from 'https';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function initPaystackTransaction(email, amount, metadata, host) {
  return new Promise((resolve, reject) => {
    if (!PAYSTACK_SECRET_KEY) {
      reject(new Error('PAYSTACK_SECRET_KEY is not configured.'));
      return;
    }

    const callbackUrl = `http://${host}/index.html`;
    const postData = JSON.stringify({ email, amount, metadata, callback_url: callbackUrl });
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status) {
            resolve(parsed.data);
          } else {
            reject(new Error(parsed.message || 'Paystack initialization failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Paystack response: ' + data));
        }
      });
    });

    request.on('error', reject);
    request.write(postData);
    request.end();
  });
}

function verifyPaystackTransaction(reference) {
  return new Promise((resolve, reject) => {
    if (!PAYSTACK_SECRET_KEY) {
      reject(new Error('PAYSTACK_SECRET_KEY is not configured.'));
      return;
    }

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status) {
            resolve(parsed.data);
          } else {
            reject(new Error(parsed.message || 'Paystack verification failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Paystack verify response: ' + data));
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { email, amount, metadata } = data;
        const paystackRes = await initPaystackTransaction(email, amount, metadata, req.headers.host || 'localhost:3000');
        sendJson(res, 200, paystackRes);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Invalid request' });
      }
    });
    return;
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const reference = url.searchParams.get('reference');

    if (!reference) {
      sendJson(res, 400, { error: 'Missing reference parameter' });
      return;
    }

    verifyPaystackTransaction(reference)
      .then((paystackData) => sendJson(res, 200, paystackData))
      .catch((error) => sendJson(res, 500, { error: error.message }));
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
