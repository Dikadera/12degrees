import https from 'https';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';

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

function initFlutterwaveTransaction(email, amount, metadata, host) {
  return new Promise((resolve, reject) => {
    if (!FLUTTERWAVE_SECRET_KEY) {
      reject(new Error('FLUTTERWAVE_SECRET_KEY is not configured.'));
      return;
    }

    const txRef = `12deg-tx-${Date.now()}`;
    const callbackUrl = `http://${host}/index.html?gateway=flutterwave`;
    
    const postData = JSON.stringify({
      tx_ref: txRef,
      amount: amount / 100, // Convert kobo to standard currency unit (Naira)
      currency: 'NGN',
      redirect_url: callbackUrl,
      meta: {
        customerName: metadata.customerName,
        customerPhone: metadata.customerPhone,
        address: metadata.address
      },
      customer: {
        email: email || 'customer@12degrees.com',
        phonenumber: metadata.customerPhone,
        name: metadata.customerName
      },
      customizations: {
        title: '12 Degrees',
        logo: `http://${host}/images/logo.png`
      }
    });

    const options = {
      hostname: 'api.flutterwave.com',
      port: 443,
      path: '/v3/payments',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
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
          if (parsed.status === 'success') {
            resolve({ authorization_url: parsed.data.link });
          } else {
            reject(new Error(parsed.message || 'Flutterwave initialization failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Flutterwave response: ' + data));
        }
      });
    });

    request.on('error', reject);
    request.write(postData);
    request.end();
  });
}

function verifyFlutterwaveTransaction(transactionId) {
  return new Promise((resolve, reject) => {
    if (!FLUTTERWAVE_SECRET_KEY) {
      reject(new Error('FLUTTERWAVE_SECRET_KEY is not configured.'));
      return;
    }

    const options = {
      hostname: 'api.flutterwave.com',
      port: 443,
      path: `/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'success' && parsed.data && parsed.data.status === 'successful') {
            resolve({
              status: 'success',
              data: parsed.data,
              metadata: parsed.data.meta || {}
            });
          } else {
            reject(new Error(parsed.message || 'Flutterwave verification failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Flutterwave verify response: ' + data));
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
        const { email, amount, metadata, gateway } = data;
        
        if (gateway === 'flutterwave') {
          const flwRes = await initFlutterwaveTransaction(email, amount, metadata, req.headers.host || 'localhost:3000');
          sendJson(res, 200, flwRes);
        } else {
          const paystackRes = await initPaystackTransaction(email, amount, metadata, req.headers.host || 'localhost:3000');
          sendJson(res, 200, paystackRes);
        }
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Invalid request' });
      }
    });
    return;
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const reference = url.searchParams.get('reference');
    const transactionId = url.searchParams.get('transaction_id');
    const gateway = url.searchParams.get('gateway');

    if (gateway === 'flutterwave' || transactionId) {
      if (!transactionId) {
        sendJson(res, 400, { error: 'Missing transaction_id parameter' });
        return;
      }
      verifyFlutterwaveTransaction(transactionId)
        .then((flwData) => sendJson(res, 200, flwData))
        .catch((error) => sendJson(res, 500, { error: error.message }));
      return;
    }

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
