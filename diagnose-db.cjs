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
        console.log("Querying Firestore database...");
        const products = await queryFirestore("products?pageSize=300");
        console.log(`Products in Firestore: ${products.documents ? products.documents.length : 0}`);
        if (products.documents) {
            console.log("First 5 products:");
            products.documents.slice(0, 5).forEach((d, i) => {
                const fields = d.fields || {};
                console.log(`  ${i+1}. ${fields.name ? fields.name.stringValue : 'No Name'} (ID: ${d.name.split('/').pop()})`);
            });
        }
        
        const orders = await queryFirestore("orders?pageSize=100");
        console.log(`Orders in Firestore: ${orders.documents ? orders.documents.length : 0}`);
        if (orders.documents) {
            console.log("First 5 orders:");
            orders.documents.slice(0, 5).forEach((d, i) => {
                const fields = d.fields || {};
                console.log(`  ${i+1}. Order ID: ${d.name.split('/').pop()} - Status: ${fields.status ? fields.status.stringValue : 'No Status'}`);
            });
        }
    } catch (e) {
        console.error("Diagnostic error:", e.message);
    }
}

run();
