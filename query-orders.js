const https = require('https');

const projectId = 'degree-ce3ad';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log(`HTTP Status: ${res.statusCode}`);
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', err => {
    console.error(err);
});
