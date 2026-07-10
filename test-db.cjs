const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAk2epUFGW2PWvW3aq0EJWGlRepTxWKkzU",
  authDomain: "degree-ce3ad.firebaseapp.com",
  projectId: "degree-ce3ad",
  storageBucket: "degree-ce3ad.firebasestorage.app",
  messagingSenderId: "277688141959",
  appId: "1:277688141959:web:6c771f263929258b0c9022",
  measurementId: "G-P8DJ2ZFYC0"
};

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Perfumes & Mists', title: 'Perfumes & <em>Mists</em>' },
    { id: '2', name: 'Body Lotions', title: 'Body <em>Lotions</em>' },
    { id: '3', name: 'Scrubs & Oils', title: 'Scrubs & <em>Oils</em>' },
    { id: '4', name: 'Hair Products', title: 'Hair <em>Products</em>' },
    { id: '5', name: 'Intimate Care', title: 'Intimate <em>Care</em>' }
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnostic() {
    try {
        let categories = [];
        try {
            console.log("Fetching categories...");
            const catSnapshot = await getDocs(collection(db, "categories"));
            categories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.log("Categories fetch failed, falling back to DEFAULT_CATEGORIES:", e.message);
            categories = DEFAULT_CATEGORIES;
        }
        
        console.log("Categories used:");
        categories.forEach(c => {
            console.log(` - ID: "${c.id}" | Name: "${c.name}"`);
        });

        console.log("\nFetching products...");
        const prodSnapshot = await getDocs(collection(db, "products"));
        const products = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Products in DB:");
        products.forEach(p => {
            console.log(` - ID: "${p.id}" | Name: "${p.name}" | Category: "${p.category}" (type: ${typeof p.category})`);
        });
        
        console.log("\nSimulating Shop Page Filtering (isDefaultAllView)...");
        categories.forEach(cat => {
            const catProducts = products.filter(p => p.category === cat.id);
            console.log(`Category: "${cat.name}" (ID: "${cat.id}") -> Matching Products: ${catProducts.length}`);
            catProducts.forEach(p => {
                console.log(`    * ${p.name}`);
            });
        });

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

diagnostic();
