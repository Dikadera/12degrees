const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// ── Load Paystack secret key from config.json ────────────────────────────────
let PAYSTACK_SECRET_KEY = '';
try {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    PAYSTACK_SECRET_KEY = config.PAYSTACK_SECRET_KEY || '';
} catch (e) {
    console.error('⚠️  Could not read config.json:', e.message);
}

if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === 'PASTE_YOUR_SECRET_KEY_HERE') {
    console.warn('\n⚠️  WARNING: Paystack secret key is not set in config.json!');
    console.warn('   Open config.json and paste your secret key from:');
    console.warn('   https://dashboard.paystack.com/#/settings/developers\n');
} else {
    console.log(`✅ Paystack key loaded: ${PAYSTACK_SECRET_KEY.slice(0, 18)}...${PAYSTACK_SECRET_KEY.slice(-6)}`);
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // ── Paystack API: Initialize Transaction ─────────────────────────────────
    if (req.method === 'POST' && req.url === '/api/paystack/initialize') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { email, amount, metadata } = data;

                initPaystackTransaction(email, amount, metadata, req.headers.host)
                    .then(paystackRes => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(paystackRes));
                    })
                    .catch(err => {
                        console.error('❌ Paystack init error:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                    });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // ── Paystack API: Verify Transaction ─────────────────────────────────────
    if (req.method === 'GET' && req.url.startsWith('/api/paystack/verify')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const reference = urlParams.searchParams.get('reference');

        if (!reference) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing reference parameter' }));
            return;
        }

        verifyPaystackTransaction(reference)
            .then(paystackData => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(paystackData));
            })
            .catch(err => {
                console.error('❌ Paystack verify error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            });
        return;
    }

    // ── Static File Serving ──────────────────────────────────────────────────
    let filePath = '.' + req.url.split('?')[0].split('#')[0];
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile('./index.html', (err, indexContent) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexContent, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            });
            res.end(content, 'utf-8');
        }
    });
});

// ── Paystack Helper: Initialize ──────────────────────────────────────────────
function initPaystackTransaction(email, amount, metadata, host) {
    return new Promise((resolve, reject) => {
        const callbackUrl = `http://${host}/index.html`;
        const postData = JSON.stringify({ email, amount, metadata, callback_url: callbackUrl });

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                console.log(`   Paystack HTTP ${response.statusCode}: ${data.slice(0, 200)}`);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status) {
                        resolve(parsed.data);
                    } else {
                        reject(new Error(parsed.message || 'Paystack initialization failed'));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Paystack response: ' + data.slice(0, 100)));
                }
            });
        });

        request.on('error', reject);
        request.write(postData);
        request.end();
    });
}

// ── Paystack Helper: Verify ──────────────────────────────────────────────────
function verifyPaystackTransaction(reference) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${encodeURIComponent(reference)}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                console.log(`   Paystack verify HTTP ${response.statusCode}: ${data.slice(0, 200)}`);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status) {
                        resolve(parsed.data);
                    } else {
                        reject(new Error(parsed.message || 'Paystack verification failed'));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Paystack verify response: ' + data.slice(0, 100)));
                }
            });
        });

        request.on('error', reject);
        request.end();
    });
}

server.listen(PORT, () => {
    console.log(`\n🚀 12 Degrees local server is running!`);
    console.log(`   👉 Storefront:  http://localhost:${PORT}/index.html`);
    console.log(`   👉 Admin Panel: http://localhost:${PORT}/admin.html\n`);
});
