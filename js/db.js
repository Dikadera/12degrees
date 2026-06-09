// Firebase SDK Modular Imports
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    doc, 
    onSnapshot, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    increment, 
    getDocs,
    writeBatch
} from "firebase/firestore";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAk2epUFGW2PWvW3aq0EJWGlRepTxWKkzU",
  authDomain: "degree-ce3ad.firebaseapp.com",
  projectId: "degree-ce3ad",
  storageBucket: "degree-ce3ad.firebasestorage.app",
  messagingSenderId: "277688141959",
  appId: "1:277688141959:web:6c771f263929258b0c9022",
  measurementId: "G-P8DJ2ZFYC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestoreDb = getFirestore(app);
const storage = getStorage(app);

const DEFAULT_PRODUCTS = [
    {
        id: 'p1',
        name: 'Bath & Body Works "A Thousand Wishes" Mist',
        category: 'perfumes',
        price: 18500,
        description: 'A festive blend of pink prosecco, sparkling quince, crystal peonies, gilded amber and warm amaretto crème. Formulated to provide great coverage and beautiful scent.',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600&auto=format&fit=crop',
        stock: 15,
        rating: 4.8,
        badge: 'Best Seller'
    },
    {
        id: 'p2',
        name: 'Eos 24H Moisture Body Lotion - Coconut Waters',
        category: 'body-lotions',
        price: 15000,
        description: 'Our Coconut Waters body lotion is bright and clean, with notes of creamy coconut, lush hibiscus, and solar musk. Provides 24-hour hydration with shea butter.',
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
        stock: 22,
        rating: 4.7,
        badge: 'New'
    },
    {
        id: 'p3',
        name: 'Tree Hut Shea Sugar Scrub - Coco Colada',
        category: 'body-scrubs-oils',
        price: 21000,
        description: 'Boost your shower routine and reveal glowing skin with the scent of Coco Colada. Made with real sugar, shea butter, pineapple, and coconut oil to deeply nourish.',
        image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop',
        stock: 4,
        rating: 4.9,
        badge: 'Low Stock'
    },
    {
        id: 'p4',
        name: 'Bath & Body Works "Into the Night" Cream',
        category: 'body-lotions',
        price: 17000,
        description: 'Evocative, feminine, and alluring. A timeless blend of dark berries, midnight jasmine, and rich amber. Infused with fluffy shea and cocoa butter.',
        image: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop',
        stock: 12,
        rating: 4.6,
        badge: ''
    },
    {
        id: 'p5',
        name: 'Bio-Oil Skincare Body Oil (Multiuse)',
        category: 'body-scrubs-oils',
        price: 13500,
        description: 'Clinically proven to help improve the appearance of new or old scars, stretch marks, uneven skin tone, aging skin, and dehydrated skin.',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop',
        stock: 30,
        rating: 4.5,
        badge: 'Popular'
    },
    {
        id: 'p6',
        name: 'Olaplex No. 4 Bond Maintenance Shampoo',
        category: 'hair-products',
        price: 29500,
        description: 'A highly moisturizing, reparative shampoo that leaves hair easy to manage, shiny, and healthier with each use. Suitable for all hair types.',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop',
        stock: 8,
        rating: 4.8,
        badge: ''
    },
    {
        id: 'p7',
        name: 'Vagisil Sensitive Scents Intimate Wash',
        category: 'intimate-care',
        price: 12500,
        description: 'Formulated with sensitive skin in mind. Gently cleanses with a light, skin-friendly scent. pH-balanced, dermatologist-tested, and hypoallergenic.',
        image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop',
        stock: 14,
        rating: 4.4,
        badge: ''
    },
    {
        id: 'p8',
        name: 'Victoria\'s Secret "Bare Vanilla" Body Mist',
        category: 'perfumes',
        price: 20000,
        description: 'Bare Vanilla is a sweet, warm fragrance mist featuring whipped vanilla and soft cashmere. It feels cozy, rich, and lingers wonderfully all day.',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
        stock: 18,
        rating: 4.7,
        badge: 'Best Seller'
    }
];

const DEFAULT_ORDERS = [
    {
        id: 'ORD-1001',
        customerName: 'Chinedu Okafor',
        customerPhone: '08031234567',
        address: 'Dynamo Junction, Ifite Awka, Anambra State',
        items: [
            { productId: 'p1', name: 'Bath & Body Works "A Thousand Wishes" Mist', price: 18500, quantity: 1 },
            { productId: 'p3', name: 'Tree Hut Shea Sugar Scrub - Coco Colada', price: 21000, quantity: 2 }
        ],
        total: 60500,
        paymentMethod: 'Bank Transfer',
        status: 'completed',
        date: '2026-06-05T14:32:00.000Z'
    },
    {
        id: 'ORD-1002',
        customerName: 'Amara Ezeugo',
        customerPhone: '09012345678',
        address: 'Hostel 3, Unizik Campus, Awka, Anambra State',
        items: [
            { productId: 'p2', name: 'Eos 24H Moisture Body Lotion - Coconut Waters', price: 15000, quantity: 1 },
            { productId: 'p8', name: 'Victoria\'s Secret "Bare Vanilla" Body Mist', price: 20000, quantity: 1 }
        ],
        total: 35000,
        paymentMethod: 'WhatsApp Order',
        status: 'processing',
        date: '2026-06-06T09:15:00.000Z'
    },
    {
        id: 'ORD-1003',
        customerName: 'Kenechukwu Ndu',
        customerPhone: '07055566677',
        address: 'Dongreg Plaza, Shop A4, Ifite Awka, Anambra State',
        items: [
            { productId: 'p5', name: 'Bio-Oil Skincare Body Oil (Multiuse)', price: 13500, quantity: 1 }
        ],
        total: 13500,
        paymentMethod: 'WhatsApp Order',
        status: 'pending',
        date: '2026-06-07T10:45:00.000Z'
    }
];

const DEFAULT_REVIEWS = [
    {
        id: 'REV-1001',
        productId: 'p1',
        productName: 'Bath & Body Works "A Thousand Wishes" Mist',
        userName: 'Chinedu Okafor',
        rating: 5,
        comment: 'Amazing scent! Long-lasting and got so many compliments. Authentic product.',
        date: '2026-06-06T12:00:00.000Z'
    },
    {
        id: 'REV-1002',
        productId: 'p2',
        productName: 'Eos 24H Moisture Body Lotion - Coconut Waters',
        userName: 'Amara Ezeugo',
        rating: 4,
        comment: 'Super moisturizing! Love the coconut scent, very fresh and clean.',
        date: '2026-06-07T14:30:00.000Z'
    },
    {
        id: 'REV-1003',
        productId: 'p8',
        productName: 'Victoria\'s Secret "Bare Vanilla" Body Mist',
        userName: 'Kenechukwu Ndu',
        rating: 5,
        comment: 'Cozy, warm vanilla. Truly premium. Delivered extremely fast in Awka.',
        date: '2026-06-08T09:15:00.000Z'
    }
];

// In-memory cache synced in real time
let cachedProducts = [];
let cachedOrders = [];
let cachedReviews = [];
let cachedViews = 0;

let productsLoaded = false;
let ordersLoaded = false;
let reviewsLoaded = false;
let analyticsLoaded = false;

// Expose a database readiness promise
let resolveReady;
const readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
});

function checkReady() {
    if (productsLoaded && ordersLoaded && analyticsLoaded && reviewsLoaded) {
        console.log("Firebase sync completed successfully!");
        resolveReady();
    }
}

// Database Seeding Logic
async function seedProducts() {
    const batch = writeBatch(firestoreDb);
    DEFAULT_PRODUCTS.forEach(p => {
        const docRef = doc(firestoreDb, "products", p.id);
        batch.set(docRef, p);
    });
    await batch.commit();
}

async function seedOrders() {
    const batch = writeBatch(firestoreDb);
    DEFAULT_ORDERS.forEach(o => {
        const docRef = doc(firestoreDb, "orders", o.id);
        batch.set(docRef, o);
    });
    await batch.commit();
}

async function seedAnalytics() {
    await setDoc(doc(firestoreDb, "analytics", "storefront"), { views: 432 });
}

async function seedReviews() {
    const batch = writeBatch(firestoreDb);
    DEFAULT_REVIEWS.forEach(r => {
        const docRef = doc(firestoreDb, "reviews", r.id);
        batch.set(docRef, r);
    });
    await batch.commit();
}

// Initialize Real-time Listeners
onSnapshot(collection(firestoreDb, "products"), async (snapshot) => {
    if (snapshot.empty) {
        console.log("Products database is empty.");
        if (auth.currentUser) {
            try {
                await seedProducts();
                return; // Listener will re-fire with the new documents
            } catch (err) {
                console.error("Auto-seeding products failed:", err);
            }
        }
        cachedProducts = DEFAULT_PRODUCTS;
        productsLoaded = true;
        checkReady();
    } else {
        cachedProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        window.dispatchEvent(new Event('db_products_updated'));
        productsLoaded = true;
        checkReady();
    }
}, error => {
    console.error("Products subscription error: ", error);
    // Graceful fallback to default in-memory products if blocked or offline
    cachedProducts = DEFAULT_PRODUCTS;
    productsLoaded = true;
    checkReady();
});

let ordersListenerUnsubscribe = null;

onAuthStateChanged(auth, (user) => {
    if (ordersListenerUnsubscribe) {
        ordersListenerUnsubscribe();
        ordersListenerUnsubscribe = null;
    }

    ordersListenerUnsubscribe = onSnapshot(collection(firestoreDb, "orders"), async (snapshot) => {
        if (snapshot.empty) {
            console.log("Orders database is empty.");
            if (auth.currentUser) {
                try {
                    await seedOrders();
                    return; // Listener will re-fire with the new documents
                } catch (err) {
                    console.error("Auto-seeding orders failed:", err);
                }
            }
            cachedOrders = [];
            ordersLoaded = true;
            checkReady();
        } else {
            cachedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort newest first
            cachedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            window.dispatchEvent(new Event('db_orders_updated'));
            ordersLoaded = true;
            checkReady();
        }
    }, error => {
        console.error("Orders subscription error: ", error);
        cachedOrders = [];
        ordersLoaded = true;
        checkReady();
    });
});

onSnapshot(doc(firestoreDb, "analytics", "storefront"), async (snapshot) => {
    if (!snapshot.exists()) {
        console.log("Analytics database document is missing.");
        if (auth.currentUser) {
            try {
                await seedAnalytics();
                return; // Listener will re-fire with the new document
            } catch (err) {
                console.error("Auto-seeding analytics failed:", err);
            }
        }
        cachedViews = 432;
        analyticsLoaded = true;
        checkReady();
    } else {
        cachedViews = snapshot.data().views || 0;
        analyticsLoaded = true;
        checkReady();
    }
}, error => {
    console.error("Analytics subscription error: ", error);
    cachedViews = 432;
    analyticsLoaded = true;
    checkReady();
});

onSnapshot(collection(firestoreDb, "reviews"), async (snapshot) => {
    if (snapshot.empty) {
        console.log("Reviews database is empty.");
        if (auth.currentUser) {
            try {
                await seedReviews();
                return; // Listener will re-fire with the new documents
            } catch (err) {
                console.error("Auto-seeding reviews failed:", err);
            }
        }
        cachedReviews = DEFAULT_REVIEWS;
        reviewsLoaded = true;
        checkReady();
    } else {
        cachedReviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort newest reviews first
        cachedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        window.dispatchEvent(new Event('db_reviews_updated'));
        reviewsLoaded = true;
        checkReady();
    }
}, error => {
    console.error("Reviews subscription error: ", error);
    cachedReviews = DEFAULT_REVIEWS;
    reviewsLoaded = true;
    checkReady();
});

// Database operations
const db = {
    ready: readyPromise,
    auth: auth,

    getProducts() {
        return cachedProducts;
    },

    async saveProduct(product) {
        await setDoc(doc(firestoreDb, "products", product.id), product);
    },

    async deleteProduct(productId) {
        await deleteDoc(doc(firestoreDb, "products", productId));
    },

    getOrders() {
        return cachedOrders;
    },

    async addOrder(order) {
        const orderId = `ORD-${Date.now().toString().slice(-4)}`;
        const newOrder = {
            id: orderId,
            date: new Date().toISOString(),
            status: 'pending',
            ...order
        };
        
        await setDoc(doc(firestoreDb, "orders", orderId), newOrder);

        // Atomically decrease product stock (wrapped in try-catch since storefront customers under Option 2 secure rules cannot write to products)
        try {
            for (const item of order.items) {
                const product = cachedProducts.find(p => p.id === item.productId);
                if (product) {
                    const newStock = Math.max(0, product.stock - item.quantity);
                    let newBadge = product.badge;
                    if (newStock === 0) {
                        newBadge = 'Out of Stock';
                    } else if (newStock <= 5) {
                        newBadge = 'Low Stock';
                    }
                    await updateDoc(doc(firestoreDb, "products", item.productId), {
                        stock: newStock,
                        badge: newBadge
                    });
                }
            }
        } catch (stockErr) {
            console.warn("Could not decrease product stock (expected for storefront customers under Option 2 secure rules):", stockErr.message);
        }
        return newOrder;
    },

    async updateOrderStatus(orderId, status) {
        await updateDoc(doc(firestoreDb, "orders", orderId), { status });
        return true;
    },

    async incrementViews() {
        await updateDoc(doc(firestoreDb, "analytics", "storefront"), {
            views: increment(1)
        });
    },

    getViews() {
        return cachedViews;
    },

    getReviews() {
        return cachedReviews;
    },

    async addReview(review) {
        const reviewId = `REV-${Date.now().toString().slice(-4)}`;
        const newReview = {
            id: reviewId,
            date: new Date().toISOString(),
            ...review
        };
        await setDoc(doc(firestoreDb, "reviews", reviewId), newReview);
        await this.recalculateProductRating(review.productId);
        return newReview;
    },

    async updateReview(reviewId, updatedData) {
        await updateDoc(doc(firestoreDb, "reviews", reviewId), updatedData);
        const review = cachedReviews.find(r => r.id === reviewId);
        if (review) {
            await this.recalculateProductRating(review.productId);
        }
    },

    async deleteReview(reviewId) {
        const review = cachedReviews.find(r => r.id === reviewId);
        await deleteDoc(doc(firestoreDb, "reviews", reviewId));
        if (review) {
            await this.recalculateProductRating(review.productId);
        }
    },

    async recalculateProductRating(productId) {
        const productReviews = cachedReviews.filter(r => r.productId === productId);
        if (productReviews.length === 0) return;
        const totalRating = productReviews.reduce((sum, r) => sum + Number(r.rating), 0);
        const avgRating = Math.round((totalRating / productReviews.length) * 10) / 10;
        await updateDoc(doc(firestoreDb, "products", productId), { rating: avgRating });
    },

    // ── Firebase Auth ────────────────────────────────────────────
    /**
     * Sign in admin with email + password via Firebase Authentication.
     * Returns the Firebase user object on success.
     */
    async adminSignIn(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
    },

    /**
     * Sign out the currently authenticated admin.
     */
    async adminSignOut() {
        await signOut(auth);
    },

    /**
     * Returns the currently signed-in Firebase user, or null.
     */
    getCurrentUser() {
        return auth.currentUser;
    },

    /**
     * Subscribe to auth state changes. Callback receives (user | null).
     */
    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    },

    async uploadProductImage(file) {
        const filename = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `products/${filename}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    },

    async resetDatabase() {
        // Clear products
        const productsSnapshot = await getDocs(collection(firestoreDb, "products"));
        const prodBatch = writeBatch(firestoreDb);
        productsSnapshot.forEach(d => prodBatch.delete(d.ref));
        await prodBatch.commit();

        // Clear orders
        const ordersSnapshot = await getDocs(collection(firestoreDb, "orders"));
        const orderBatch = writeBatch(firestoreDb);
        ordersSnapshot.forEach(d => orderBatch.delete(d.ref));
        await orderBatch.commit();

        // Clear reviews
        const reviewsSnapshot = await getDocs(collection(firestoreDb, "reviews"));
        const reviewBatch = writeBatch(firestoreDb);
        reviewsSnapshot.forEach(d => reviewBatch.delete(d.ref));
        await reviewBatch.commit();

        // Reset views
        await setDoc(doc(firestoreDb, "analytics", "storefront"), { views: 432 });
    }
};

// Export to window so other scripts can access it directly
window.storeDb = db;
export default db;
