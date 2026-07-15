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
};

const isOffline = window.location.protocol === 'file:';
if (isOffline) {
    console.warn("⚠️ Local file protocol (file://) detected. Database features will use local storage mock fallback.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
    analytics = getAnalytics(app);
} catch (err) {
    console.warn("Firebase Analytics initialization skipped:", err.message);
}

let auth;
try {
    auth = getAuth(app);
} catch (err) {
    console.error("Firebase Auth initialization failed:", err.message);
}

let firestoreDb;
try {
    firestoreDb = getFirestore(app);
} catch (err) {
    console.error("Firebase Firestore initialization failed:", err.message);
}

let storage;
try {
    storage = getStorage(app);
} catch (err) {
    console.error("Firebase Storage initialization failed:", err.message);
}

const DEFAULT_PRODUCTS = [];

const DEFAULT_ORDERS = [];

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

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Perfumes & Mists', title: 'Perfumes & <em>Mists</em>' },
    { id: '2', name: 'Body Lotions', title: 'Body <em>Lotions</em>' },
    { id: '3', name: 'Scrubs & Oils', title: 'Scrubs & <em>Oils</em>' },
    { id: '4', name: 'Hair Products', title: 'Hair <em>Products</em>' },
    { id: '5', name: 'Intimate Care', title: 'Intimate <em>Care</em>' }
];

// In-memory cache synced in real time
let cachedProducts = [];
let cachedOrders = [];
let cachedReviews = [];
let cachedCategories = [];
let cachedViews = 0;
let cachedDiscount = 10;

let productsLoaded = false;
let ordersLoaded = false;
let reviewsLoaded = false;
let categoriesLoaded = false;
let analyticsLoaded = false;

// Expose a database readiness promise
let resolveReady;
const readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
});

function checkReady() {
    if (productsLoaded && ordersLoaded && analyticsLoaded && reviewsLoaded && categoriesLoaded) {
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

async function seedCategories() {
    const batch = writeBatch(firestoreDb);
    DEFAULT_CATEGORIES.forEach(c => {
        const docRef = doc(firestoreDb, "categories", c.id);
        batch.set(docRef, c);
    });
    await batch.commit();
}

// Global listener unsubscribers
let productsListenerUnsubscribe = null;
let categoriesListenerUnsubscribe = null;
let ordersListenerUnsubscribe = null;
let analyticsListenerUnsubscribe = null;
let reviewsListenerUnsubscribe = null;

try {
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            // Unsubscribe existing listeners
            if (productsListenerUnsubscribe) { productsListenerUnsubscribe(); productsListenerUnsubscribe = null; }
            if (categoriesListenerUnsubscribe) { categoriesListenerUnsubscribe(); categoriesListenerUnsubscribe = null; }
            if (ordersListenerUnsubscribe) { ordersListenerUnsubscribe(); ordersListenerUnsubscribe = null; }
            if (analyticsListenerUnsubscribe) { analyticsListenerUnsubscribe(); analyticsListenerUnsubscribe = null; }
            if (reviewsListenerUnsubscribe) { reviewsListenerUnsubscribe(); reviewsListenerUnsubscribe = null; }

            // Reset loaded flags
            productsLoaded = false;
            categoriesLoaded = false;
            ordersLoaded = false;
            analyticsLoaded = false;
            reviewsLoaded = false;

            if (firestoreDb) {
                // 1. Categories
                categoriesListenerUnsubscribe = onSnapshot(collection(firestoreDb, "categories"), async (snapshot) => {
                    if (snapshot.empty) {
                        console.log("Categories database is empty.");
                        if (auth && auth.currentUser) {
                            try {
                                await seedCategories();
                                return;
                            } catch (err) {
                                console.error("Auto-seeding categories failed:", err);
                            }
                        }
                        cachedCategories = DEFAULT_CATEGORIES;
                        categoriesLoaded = true;
                        checkReady();
                    } else {
                        cachedCategories = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        window.dispatchEvent(new Event('db_categories_updated'));
                        categoriesLoaded = true;
                        checkReady();
                    }
                }, error => {
                    console.error("Categories subscription error: ", error);
                    cachedCategories = DEFAULT_CATEGORIES;
                    categoriesLoaded = true;
                    checkReady();
                });

                // 2. Products
                productsListenerUnsubscribe = onSnapshot(collection(firestoreDb, "products"), async (snapshot) => {
                    if (snapshot.empty) {
                        console.log("Products database is empty.");
                        if (auth && auth.currentUser) {
                            try {
                                await seedProducts();
                                return;
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
                    cachedProducts = DEFAULT_PRODUCTS;
                    productsLoaded = true;
                    checkReady();
                });

                // 3. Orders
                ordersListenerUnsubscribe = onSnapshot(collection(firestoreDb, "orders"), async (snapshot) => {
                    if (snapshot.empty) {
                        console.log("Orders database is empty.");
                        if (auth && auth.currentUser) {
                            try {
                                await seedOrders();
                                return;
                            } catch (err) {
                                console.error("Auto-seeding orders failed:", err);
                            }
                        }
                        cachedOrders = DEFAULT_ORDERS;
                        ordersLoaded = true;
                        checkReady();
                    } else {
                        cachedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        cachedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
                        window.dispatchEvent(new Event('db_orders_updated'));
                        ordersLoaded = true;
                        checkReady();
                    }
                }, error => {
                    console.error("Orders subscription error: ", error);
                    cachedOrders = DEFAULT_ORDERS;
                    ordersLoaded = true;
                    checkReady();
                });

                // 4. Analytics
                analyticsListenerUnsubscribe = onSnapshot(doc(firestoreDb, "analytics", "storefront"), async (snapshot) => {
                    if (!snapshot.exists()) {
                        console.log("Analytics database document is missing.");
                        if (auth && auth.currentUser) {
                            try {
                                await seedAnalytics();
                                return;
                            } catch (err) {
                                console.error("Auto-seeding analytics failed:", err);
                            }
                        }
                        cachedViews = 432;
                        cachedDiscount = 10;
                        analyticsLoaded = true;
                        checkReady();
                    } else {
                        cachedViews = snapshot.data().views || 0;
                        cachedDiscount = snapshot.data().discount !== undefined ? Number(snapshot.data().discount) : 10;
                        window.dispatchEvent(new Event('db_analytics_updated'));
                        analyticsLoaded = true;
                        checkReady();
                    }
                }, error => {
                    console.error("Analytics subscription error: ", error);
                    cachedViews = 432;
                    cachedDiscount = 10;
                    analyticsLoaded = true;
                    checkReady();
                });

                // 5. Reviews
                reviewsListenerUnsubscribe = onSnapshot(collection(firestoreDb, "reviews"), async (snapshot) => {
                    if (snapshot.empty) {
                        console.log("Reviews database is empty.");
                        if (auth && auth.currentUser) {
                            try {
                                await seedReviews();
                                return;
                            } catch (err) {
                                console.error("Auto-seeding reviews failed:", err);
                            }
                        }
                        cachedReviews = DEFAULT_REVIEWS;
                        reviewsLoaded = true;
                        checkReady();
                    } else {
                        cachedReviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
            } else {
                // Fallbacks when firestoreDb is not defined
                cachedProducts = DEFAULT_PRODUCTS;
                cachedCategories = DEFAULT_CATEGORIES;
                cachedOrders = DEFAULT_ORDERS;
                cachedReviews = DEFAULT_REVIEWS;
                cachedViews = 432;
                cachedDiscount = 10;
                productsLoaded = true;
                categoriesLoaded = true;
                ordersLoaded = true;
                analyticsLoaded = true;
                reviewsLoaded = true;
                checkReady();
            }
        });
    } else {
        // Fallbacks when auth is not defined
        cachedProducts = DEFAULT_PRODUCTS;
        cachedCategories = DEFAULT_CATEGORIES;
        cachedOrders = DEFAULT_ORDERS;
        cachedReviews = DEFAULT_REVIEWS;
        cachedViews = 432;
        cachedDiscount = 10;
        productsLoaded = true;
        categoriesLoaded = true;
        ordersLoaded = true;
        analyticsLoaded = true;
        reviewsLoaded = true;
        checkReady();
    }
} catch (err) {
    console.error("Auth state observer setup failed:", err);
    cachedProducts = DEFAULT_PRODUCTS;
    cachedCategories = DEFAULT_CATEGORIES;
    cachedOrders = DEFAULT_ORDERS;
    cachedReviews = DEFAULT_REVIEWS;
    cachedViews = 432;
    cachedDiscount = 10;
    productsLoaded = true;
    categoriesLoaded = true;
    ordersLoaded = true;
    analyticsLoaded = true;
    reviewsLoaded = true;
    checkReady();
}

// Database operations
const db = {
    ready: readyPromise,
    auth: auth,

    getProducts() {
        const localProducts = JSON.parse(localStorage.getItem('12degrees_local_products') || '[]');
        const deletedProducts = JSON.parse(localStorage.getItem('12degrees_deleted_products') || '[]');
        const merged = [...cachedProducts];
        localProducts.forEach(localProd => {
            const idx = merged.findIndex(p => p.id === localProd.id);
            if (idx > -1) {
                merged[idx] = localProd;
            } else {
                merged.push(localProd);
            }
        });
        return merged.filter(p => !deletedProducts.includes(p.id));
    },

    async saveProduct(product) {
        let deletedProducts = JSON.parse(localStorage.getItem('12degrees_deleted_products') || '[]');
        if (deletedProducts.includes(product.id)) {
            deletedProducts = deletedProducts.filter(id => id !== product.id);
            localStorage.setItem('12degrees_deleted_products', JSON.stringify(deletedProducts));
        }
        try {
            await setDoc(doc(firestoreDb, "products", product.id), product);
            let localProducts = JSON.parse(localStorage.getItem('12degrees_local_products') || '[]');
            localProducts = localProducts.filter(p => p.id !== product.id);
            localStorage.setItem('12degrees_local_products', JSON.stringify(localProducts));
        } catch (err) {
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                console.warn("Storing product locally (Firestore write denied):", err.message);
                const localProducts = JSON.parse(localStorage.getItem('12degrees_local_products') || '[]');
                const idx = localProducts.findIndex(p => p.id === product.id);
                if (idx > -1) {
                    localProducts[idx] = product;
                } else {
                    localProducts.push(product);
                }
                localStorage.setItem('12degrees_local_products', JSON.stringify(localProducts));
                window.dispatchEvent(new Event('db_products_updated'));
            } else {
                throw err;
            }
        }
    },

    async deleteProduct(productId) {
        try {
            await deleteDoc(doc(firestoreDb, "products", productId));
            let localProducts = JSON.parse(localStorage.getItem('12degrees_local_products') || '[]');
            localProducts = localProducts.filter(p => p.id !== productId);
            localStorage.setItem('12degrees_local_products', JSON.stringify(localProducts));
            let deletedProducts = JSON.parse(localStorage.getItem('12degrees_deleted_products') || '[]');
            deletedProducts = deletedProducts.filter(id => id !== productId);
            localStorage.setItem('12degrees_deleted_products', JSON.stringify(deletedProducts));
        } catch (err) {
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                console.warn("Deleting product locally (Firestore write denied):", err.message);
                let localProducts = JSON.parse(localStorage.getItem('12degrees_local_products') || '[]');
                localProducts = localProducts.filter(p => p.id !== productId);
                localStorage.setItem('12degrees_local_products', JSON.stringify(localProducts));
                
                const deletedProducts = JSON.parse(localStorage.getItem('12degrees_deleted_products') || '[]');
                if (!deletedProducts.includes(productId)) {
                    deletedProducts.push(productId);
                    localStorage.setItem('12degrees_deleted_products', JSON.stringify(deletedProducts));
                }
                window.dispatchEvent(new Event('db_products_updated'));
            } else {
                throw err;
            }
        }
    },

    getCategories() {
        const localCategories = JSON.parse(localStorage.getItem('12degrees_local_categories') || '[]');
        const deletedCategories = JSON.parse(localStorage.getItem('12degrees_deleted_categories') || '[]');
        const merged = [...cachedCategories];
        localCategories.forEach(localCat => {
            const idx = merged.findIndex(c => c.id === localCat.id);
            if (idx > -1) {
                merged[idx] = localCat;
            } else {
                merged.push(localCat);
            }
        });
        return merged.filter(c => !deletedCategories.includes(c.id));
    },

    async saveCategory(category) {
        let deletedCategories = JSON.parse(localStorage.getItem('12degrees_deleted_categories') || '[]');
        if (deletedCategories.includes(category.id)) {
            deletedCategories = deletedCategories.filter(id => id !== category.id);
            localStorage.setItem('12degrees_deleted_categories', JSON.stringify(deletedCategories));
        }
        try {
            await setDoc(doc(firestoreDb, "categories", category.id), category);
            let localCategories = JSON.parse(localStorage.getItem('12degrees_local_categories') || '[]');
            localCategories = localCategories.filter(c => c.id !== category.id);
            localStorage.setItem('12degrees_local_categories', JSON.stringify(localCategories));
        } catch (err) {
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                console.warn("Storing category locally (Firestore write denied):", err.message);
                const localCategories = JSON.parse(localStorage.getItem('12degrees_local_categories') || '[]');
                const idx = localCategories.findIndex(c => c.id === category.id);
                if (idx > -1) {
                    localCategories[idx] = category;
                } else {
                    localCategories.push(category);
                }
                localStorage.setItem('12degrees_local_categories', JSON.stringify(localCategories));
                window.dispatchEvent(new Event('db_categories_updated'));
            } else {
                throw err;
            }
        }
    },

    async deleteCategory(categoryId) {
        try {
            await deleteDoc(doc(firestoreDb, "categories", categoryId));
            let localCategories = JSON.parse(localStorage.getItem('12degrees_local_categories') || '[]');
            localCategories = localCategories.filter(c => c.id !== categoryId);
            localStorage.setItem('12degrees_local_categories', JSON.stringify(localCategories));
            let deletedCategories = JSON.parse(localStorage.getItem('12degrees_deleted_categories') || '[]');
            deletedCategories = deletedCategories.filter(id => id !== categoryId);
            localStorage.setItem('12degrees_deleted_categories', JSON.stringify(deletedCategories));
        } catch (err) {
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                console.warn("Deleting category locally (Firestore write denied):", err.message);
                let localCategories = JSON.parse(localStorage.getItem('12degrees_local_categories') || '[]');
                localCategories = localCategories.filter(c => c.id !== categoryId);
                localStorage.setItem('12degrees_local_categories', JSON.stringify(localCategories));
                
                const deletedCategories = JSON.parse(localStorage.getItem('12degrees_deleted_categories') || '[]');
                if (!deletedCategories.includes(categoryId)) {
                    deletedCategories.push(categoryId);
                    localStorage.setItem('12degrees_deleted_categories', JSON.stringify(deletedCategories));
                }
                window.dispatchEvent(new Event('db_categories_updated'));
            } else {
                throw err;
            }
        }
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

    async deleteOrder(orderId) {
        await deleteDoc(doc(firestoreDb, "orders", orderId));
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

    getDiscount() {
        const localDiscount = localStorage.getItem('12degrees_local_discount');
        if (localDiscount !== null) {
            return Number(localDiscount);
        }
        return cachedDiscount;
    },

    async saveDiscount(percent) {
        try {
            await updateDoc(doc(firestoreDb, "analytics", "storefront"), { discount: Number(percent) });
        } catch (err) {
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                console.warn("Storing discount locally (Firestore write denied):", err.message);
                localStorage.setItem('12degrees_local_discount', String(percent));
                window.dispatchEvent(new Event('db_analytics_updated'));
            } else {
                throw err;
            }
        }
    },

    getReviews() {
        const pendingReviews = JSON.parse(localStorage.getItem('12degrees_pending_reviews') || '[]');
        return [...cachedReviews, ...pendingReviews];
    },

    async addReview(review) {
        const reviewId = `REV-${Date.now().toString().slice(-4)}`;
        const newReview = {
            id: reviewId,
            date: new Date().toISOString(),
            ...review
        };

        try {
            await setDoc(doc(firestoreDb, "reviews", reviewId), newReview);
            await this.recalculateProductRating(review.productId);
        } catch (err) {
            if (err.code === 'permission-denied') {
                console.warn("Storing review locally (Firestore write denied):", err.message);
                const localReviews = JSON.parse(localStorage.getItem('12degrees_pending_reviews') || '[]');
                localReviews.push(newReview);
                localStorage.setItem('12degrees_pending_reviews', JSON.stringify(localReviews));
            } else {
                throw err;
            }
        }
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
        // Enforce Firebase Auth when online
        if (!isOffline && auth) {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            localStorage.removeItem("mock_admin_user");
            return credential.user;
        }

        // Offline / file protocol fallback
        if (email === "admin@12degrees.store" && password === "123456") {
            const mockUser = { email: "admin@12degrees.store", uid: "mock-admin-uid" };
            localStorage.setItem("mock_admin_user", JSON.stringify(mockUser));
            window.dispatchEvent(new Event("mock_auth_changed"));
            return mockUser;
        }
        throw new Error("Sign-in failed. Please verify your internet connection or admin credentials.");
    },

    /**
     * Sign out the currently authenticated admin.
     */
    async adminSignOut() {
        localStorage.removeItem("mock_admin_user");
        window.dispatchEvent(new Event("mock_auth_changed"));
        if (auth) await signOut(auth);
    },

    /**
     * Returns the currently signed-in Firebase user, or null.
     */
    getCurrentUser() {
        if (isOffline) {
            const mockUserStr = localStorage.getItem("mock_admin_user");
            if (mockUserStr) {
                try { return JSON.parse(mockUserStr); } catch(e) {}
            }
        }
        return auth ? auth.currentUser : null;
    },

    /**
     * Subscribe to auth state changes. Callback receives (user | null).
     */
    onAuthChange(callback) {
        const checkAuth = () => {
            if (isOffline) {
                const mockUserStr = localStorage.getItem("mock_admin_user");
                if (mockUserStr) {
                    try {
                        callback(JSON.parse(mockUserStr));
                        return true;
                    } catch(e) {}
                }
            }
            return false;
        };

        const handleMockAuth = () => {
            checkAuth();
        };

        window.addEventListener("mock_auth_changed", handleMockAuth);
        
        let unsubscribe = () => {};
        if (auth) {
            unsubscribe = onAuthStateChanged(auth, (user) => {
                if (!checkAuth()) {
                    callback(user);
                }
            });
        } else {
            checkAuth();
        }

        // Initial check
        checkAuth();

        return () => {
            window.removeEventListener("mock_auth_changed", handleMockAuth);
            unsubscribe();
        };
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

        // Clear categories
        const categoriesSnapshot = await getDocs(collection(firestoreDb, "categories"));
        const catBatch = writeBatch(firestoreDb);
        categoriesSnapshot.forEach(d => catBatch.delete(d.ref));
        await catBatch.commit();

        // Reset views
        await setDoc(doc(firestoreDb, "analytics", "storefront"), { views: 432 });
    }
};

// Export to window so other scripts can access it directly
window.storeDb = db;
export default db;
