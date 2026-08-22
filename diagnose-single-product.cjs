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
        const doc = await queryFirestore("products/p000423");
        const fields = doc.fields || {};
        const flat = { id: doc.name.split('/').pop() };
        for (const key in fields) {
            const valObj = fields[key];
            const type = Object.keys(valObj)[0];
            let val = valObj[type];
            if (type === 'integerValue') {
                val = parseInt(val, 10);
            } else if (type === 'doubleValue') {
                val = parseFloat(val);
            }
            flat[key] = val;
        }
        console.log("Flattened product fields:");
        console.log(flat);
    } catch (e) {
        console.error("Diagnostic error:", e.message);
    }
}

run();
