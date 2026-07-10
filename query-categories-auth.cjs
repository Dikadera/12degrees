const https = require('https');

const apiKey = "AIzaSyAk2epUFGW2PWvW3aq0EJWGlRepTxWKkzU";
const projectId = "degree-ce3ad";

async function run() {
    const passwords = ["123456", "admin"];
    let idToken = null;
    
    for (const pwd of passwords) {
        try {
            idToken = await authenticate(pwd);
            if (idToken) {
                console.log(`Authenticated successfully with password: ${pwd}`);
                break;
            }
        } catch (e) {
            console.log(`Failed auth with password ${pwd}: ${e.message}`);
        }
    }
    
    if (idToken) {
        fetchCategories(idToken);
    } else {
        console.log("Could not authenticate with any password.");
    }
}

function authenticate(password) {
    return new Promise((resolve, reject) => {
        const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
        const payload = JSON.stringify({
            email: "admin@12degrees.store",
            password: password,
            returnSecureToken: true
        });

        const req = https.request(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.idToken) {
                        resolve(parsed.idToken);
                    } else {
                        reject(new Error(parsed.error ? parsed.error.message : 'Unknown error'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function fetchCategories(idToken) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories`;
    
    const reqCats = https.request(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            console.log(`Fetch Categories Status: ${res.statusCode}`);
            try {
                const parsed = JSON.parse(data);
                if (parsed.documents) {
                    console.log(`Found ${parsed.documents.length} categories.`);
                    parsed.documents.forEach(doc => {
                        console.log(`- Category ID: ${doc.name.split('/').pop()}, Fields:`, JSON.stringify(doc.fields, null, 2));
                    });
                } else {
                    console.log("No categories found or empty collection.");
                    console.log(JSON.stringify(parsed, null, 2));
                }
            } catch (e) {
                console.log(data);
            }
        });
    });
    
    reqCats.on('error', (e) => { console.error(e); });
    reqCats.end();
}

run();
