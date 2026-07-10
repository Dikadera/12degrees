const https = require('https');

const projectId = 'degree-ce3ad';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.documents) {
                parsed.documents.forEach(doc => {
                    const id = doc.name.split('/').pop();
                    const fields = doc.fields || {};
                    const flat = {};
                    for (const key in fields) {
                        flat[key] = Object.values(fields[key])[0];
                    }
                    console.log(`ID: ${id} | Fields: ${JSON.stringify(flat)}`);
                });
            } else {
                console.log("No documents found:", parsed);
            }
        } catch (e) {
            console.log(e, data);
        }
    });
}).on('error', err => {
    console.error(err);
});
