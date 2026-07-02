import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const pathname = req.url.split('?')[0].split('#')[0];
    const isApiRoute = pathname === '/api/verify-payment' ||
        pathname === '/api/verify-payment.js' ||
        pathname === '/api/paystack/initialize' ||
        pathname === '/api/paystack/verify';

    if (isApiRoute) {
        handleApiRoute(req, res).catch(error => {
            console.error('❌ API route error:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API route failed' }));
        });
        return;
    }

    serveStaticFile(req, res);
});

async function handleApiRoute(req, res) {
    const apiHandlerPath = pathToFileURL(path.join(__dirname, 'api', 'verify-payment.js')).href;
    const { default: handler } = await import(apiHandlerPath);
    handler(req, res);
}

function serveStaticFile(req, res) {
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
}

server.listen(PORT, () => {
    console.log(`\n🚀 12 Degrees local server is running!`);
    console.log(`   👉 Storefront:  http://localhost:${PORT}/index.html`);
    console.log(`   👉 Admin Panel: http://localhost:${PORT}/admin.html\n`);
});
