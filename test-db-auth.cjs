const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAk2epUFGW2PWvW3aq0EJWGlRepTxWKkzU",
  authDomain: "degree-ce3ad.firebaseapp.com",
  projectId: "degree-ce3ad",
  storageBucket: "degree-ce3ad.firebasestorage.app",
  messagingSenderId: "277688141959",
  appId: "1:277688141959:web:6c771f263929258b0c9022",
  measurementId: "G-P8DJ2ZFYC0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
    try {
        console.log("Authenticating as admin...");
        const userCredential = await signInWithEmailAndPassword(auth, "admin@12degrees.store", "123456");
        console.log("Authenticated successfully as:", userCredential.user.email);

        console.log("\nFetching categories...");
        const catSnapshot = await getDocs(collection(db, "categories"));
        const categories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Categories in Firestore:");
        categories.forEach(c => {
            console.log(` - ID: "${c.id}" | Name: "${c.name}"`);
        });

        console.log("\nFetching products...");
        const prodSnapshot = await getDocs(collection(db, "products"));
        const products = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Products in Firestore:");
        products.forEach(p => {
            console.log(` - ID: "${p.id}" | Name: "${p.name}" | Category: "${p.category}"`);
        });

        console.log("\nSimulation of renderProducts() under isDefaultAllView:");
        categories.forEach(cat => {
            const catProducts = products.filter(p => p.category === cat.id);
            console.log(`Category: "${cat.name}" (ID: "${cat.id}") -> Matching Products: ${catProducts.length}`);
            catProducts.forEach(p => {
                console.log(`    * ${p.name}`);
            });
        });

    } catch (e) {
        console.error("Error during execution:", e);
    }
    process.exit(0);
}

run();
