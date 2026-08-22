const https = require('https');

function queryFirestore(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            port: 443,
            path: `/v1/projects/degree-ce3ad/databases/(default)/documents/${path}`,
            method: 'GET'
        };
        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Status ${response.statusCode}: ${data}`));
                }
            });
        });
        request.on('error', reject);
        request.end();
    });
}

async function run() {
    try {
        const products = await queryFirestore("products?pageSize=300");
        console.log(`Total Products in Firestore: ${products.documents ? products.documents.length : 0}`);
        if (products.documents) {
            products.documents.forEach((d, i) => {
                const fields = d.fields || {};
                const name = fields.name ? fields.name.stringValue : 'No Name';
                const cat = fields.category ? (fields.category.stringValue || fields.category.integerValue) : 'No Category';
                console.log(`  ${i+1}. Name: "${name}" - Category: "${cat}"`);
            });
        }
    } catch (e) {
        console.error("Diagnostic error:", e.message);
    }
}

run();
