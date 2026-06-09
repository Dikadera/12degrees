const https = require('https');

const apiKey = "AIzaSyAk2epUFGW2PWvW3aq0EJWGlRepTxWKkzU";
const projectId = "degree-ce3ad";

// Authenticate via REST API to get ID token
const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
const payload = JSON.stringify({
    email: "admin@12degrees.store",
    password: "admin", // Let's try default mock credentials
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
            const parsedAuth = JSON.parse(data);
            if (parsedAuth.idToken) {
                console.log("Authenticated successfully! Fetching orders...");
                fetchOrders(parsedAuth.idToken);
            } else {
                console.log("Auth failed. Response:");
                console.log(data);
            }
        } catch (e) {
            console.error(e);
        }
    });
});

req.on('error', (e) => { console.error(e); });
req.write(payload);
req.end();

function fetchOrders(idToken) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders`;
    
    const reqOrders = https.request(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            console.log(`Fetch Orders Status: ${res.statusCode}`);
            try {
                const parsed = JSON.parse(data);
                if (parsed.documents) {
                    console.log(`Found ${parsed.documents.length} orders in database.`);
                    parsed.documents.forEach(doc => {
                        console.log(`- Order ID: ${doc.name.split('/').pop()}, Fields:`, JSON.stringify(doc.fields, null, 2));
                    });
                } else {
                    console.log("No orders found or empty collection.");
                    console.log(JSON.stringify(parsed, null, 2));
                }
            } catch (e) {
                console.log(data);
            }
        });
    });
    
    reqOrders.on('error', (e) => { console.error(e); });
    reqOrders.end();
}
