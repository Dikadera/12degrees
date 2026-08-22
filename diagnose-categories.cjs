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
        console.log("Querying Firestore categories...");
        const categories = await queryFirestore("categories?pageSize=100");
        console.log(`Categories in Firestore: ${categories.documents ? categories.documents.length : 0}`);
        if (categories.documents) {
            categories.documents.forEach((d, i) => {
                const fields = d.fields || {};
                console.log(`  ${i+1}. Category ID (Doc ID): ${d.name.split('/').pop()} - Name: ${fields.name ? fields.name.stringValue : 'No Name'}`);
            });
        }
    } catch (e) {
        console.error("Diagnostic error:", e.message);
    }
}

run();
