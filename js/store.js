// 12 Degrees Storefront JS Logic
document.addEventListener('DOMContentLoaded', () => {
    // Debug panel to show what's happening
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #1a1a1a;
        color: #0f0;
        padding: 12px;
        border-radius: 4px;
        font-size: 11px;
        font-family: monospace;
        z-index: 99999;
        max-width: 300px;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #0f0;
    `;
    document.body.appendChild(debugPanel);

    const addDebug = (msg) => {
        debugPanel.innerHTML += msg + '<br>';
        debugPanel.scrollTop = debugPanel.scrollHeight;
    };

    addDebug('🔄 Store.js loaded');

    // Select elements
    const productGrid = document.getElementById('product-grid');
    const featuredGrid = document.getElementById('featured-grid');
    const categoriesContainer = document.getElementById('categories-container');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    // Cart elements
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartQtyCount = document.getElementById('cart-qty-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Modals
    const quickviewModal = document.getElementById('quickview-modal');
    const closeQuickviewBtn = document.getElementById('close-quickview-btn');
    const quickviewContent = document.getElementById('quickview-body-content');
    
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutItemsQty = document.getElementById('checkout-items-qty');
    const checkoutTotalVal = document.getElementById('checkout-total-val');
    
    const successModal = document.getElementById('success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');
    const successWaRedirectBtn = document.getElementById('success-wa-redirect-btn');

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');

    // State
    let products = [];
    let cart = JSON.parse(localStorage.getItem('12degrees_cart')) || [];
    let currentCategory = 'all';
    let searchQuery = '';
    let currentSort = 'default';

    // WhatsApp Contact
    const WHATSAPP_PHONE = '2349029819153';

    // Initialize Store
    async function initStore() {
        addDebug('📦 initStore() starting...');
        try {
            if (window.storeDb) {
                addDebug('✅ storeDb found, waiting for ready...');
                await window.storeDb.ready;
                products = window.storeDb.getProducts();
                addDebug(`📊 Got ${products.length} products from DB`);
            } else {
                addDebug('❌ storeDb NOT defined!');
                products = [];
            }
        } catch (err) {
            addDebug(`❌ DB Error: ${err.message}`);
            products = [];
        }

        // If products are empty, populate with local default products so storefront is never blank
        if (!products || products.length === 0) {
            addDebug('⚠️ Loading default products...');
            products = [
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
        }

        addDebug(`✅ ${products.length} products ready for render`);

        try {
            if (window.storeDb && typeof window.storeDb.incrementViews === 'function') {
                window.storeDb.incrementViews(); // Log a page view
            }
        } catch (e) {
            console.error("Failed to increment views:", e);
        }

        // Retrieve category from localStorage OR ?cat= URL param (shop.html footer links)
        const urlParams = new URLSearchParams(window.location.search);
        const urlCat = urlParams.get('cat');
        const storedCategory = urlCat || localStorage.getItem('filterCategory');
        if (storedCategory && categoriesContainer) {
            if (!urlCat) localStorage.removeItem('filterCategory');
            currentCategory = storedCategory;
            categoriesContainer.querySelectorAll('.category-btn').forEach(b => {
                const key = b.getAttribute('data-category') || b.getAttribute('data-cat');
                if (key === storedCategory) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            // Smooth scroll to shop section if on shop.html
            if (urlCat) {
                setTimeout(() => {
                    const shopSection = document.getElementById('shop');
                    if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
                }, 600);
            }
        }

        addDebug('🎨 Calling renderProducts & renderFeatured...');
        renderProducts();
        renderFeaturedProducts();
        updateCartUI();
        initTheme();
        initQuiz();
        initReviewsSection();

        // Header scroll behavior
        const siteHeader = document.getElementById('site-header');
        if (siteHeader) {
            const handleScroll = () => {
                if (window.scrollY > 20) {
                    siteHeader.classList.add('scrolled');
                } else {
                    siteHeader.classList.remove('scrolled');
                }
            };
            window.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll(); // Initial check
        }
        // Listen for database changes from admin panel in other tabs
        window.addEventListener('db_products_updated', () => {
            products = window.storeDb.getProducts();
            renderProducts();
            renderFeaturedProducts();
        });

        window.addEventListener('db_reviews_updated', () => {
            if (activeQuickviewProductId) {
                renderQuickviewReviews(activeQuickviewProductId);
            }
        });

        // Check for Paystack redirect reference
        const paystackParams = new URLSearchParams(window.location.search);
        const paystackRef = paystackParams.get('reference');
        if (paystackRef) {
            handlePaystackCallback(paystackRef);
        }
    }

    // --- Render Products ---
    function renderProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        // Filter products
        let filtered = products.filter(product => {
            const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  product.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        // Sort products
        if (currentSort === 'price-low') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-high') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        if (filtered.length === 0) {
            productGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.5;"><circle cx="12" cy="12" r="10"/><path d="m21 21-4.3-4.3"/><path d="M8 14s1.5-2 4-2 4 2 4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                    <h3>No products found</h3>
                    <p>Try refining your search terms or category selection.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-id', product.id);

            // Badges
            let badgeHTML = '';
            if (product.badge) {
                const badgeClass = product.badge.toLowerCase().replace(' ', '-');
                badgeHTML = `<span class="product-badge ${badgeClass}">${product.badge}</span>`;
            }

            const isOutOfStock = product.stock <= 0;

            card.innerHTML = `
                ${badgeHTML}
                <div class="product-img-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                    <div class="product-actions-overlay">
                        <button class="overlay-btn view-details" title="Quick View">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 12c.18.32 2 4 9 4s8.82-3.68 9-4c-.18-.32-2-4-9-4s-8.82 3.68-9 4Z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-cat">${formatCategory(product.category)}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-meta">
                        <span class="product-price">₦ ${formatMoney(product.price)}</span>
                        <span class="product-rating">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ${(product.rating || 0).toFixed(1)}
                        </span>
                    </div>
                    <button class="product-footer-btn add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                        <span>${isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                    </button>
                </div>
            `;

            // Event Listeners on Card Elements
            card.querySelector('.product-img-wrapper').addEventListener('click', () => openQuickView(product.id));
            card.querySelector('.product-name').addEventListener('click', () => openQuickView(product.id));
            card.querySelector('.view-details').addEventListener('click', (e) => {
                e.stopPropagation();
                openQuickView(product.id);
            });

            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            addToCartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerFlyAnimation(card.querySelector('.product-img'), addToCartBtn);
                addToCart(product.id);
            });

            productGrid.appendChild(card);
        });
    }

    // --- Featured Products (Homepage teaser — top-rated, filterable by category pill) ---
    function renderFeaturedProducts() {
        addDebug(`🌟 renderFeatured: ${products.length} products, featuredGrid: ${!!featuredGrid}`);
        if (!featuredGrid) {
            addDebug('❌ featuredGrid element NOT found!');
            return;
        }

        // Determine which category pill is active
        let activeCat = 'all';
        if (featuredCategories) {
            const activeBtn = featuredCategories.querySelector('.category-btn.active');
            if (activeBtn) activeCat = activeBtn.getAttribute('data-cat') || 'all';
        }

        // Filter by category and show top 8 by rating
        let featured = products
            .filter(p => activeCat === 'all' || p.category === activeCat)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 8);

        featuredGrid.innerHTML = '';

        if (featured.length === 0) {
            featuredGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.4;margin-bottom:12px"><circle cx="12" cy="12" r="10"/><path d="m21 21-4.3-4.3"/></svg>
                <h3 style="margin-bottom:8px">No products yet</h3><p>Check back soon!</p>
            </div>`;
            return;
        }

        featured.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-id', product.id);

            let badgeHTML = '';
            if (product.badge) {
                badgeHTML = `<span class="product-badge ${product.badge.toLowerCase().replace(' ', '-')}">${product.badge}</span>`;
            }
            const isOOS = product.stock <= 0;

            card.innerHTML = `
                ${badgeHTML}
                <div class="product-img-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                    <div class="product-actions-overlay">
                        <button class="overlay-btn view-details" title="Quick View">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 12c.18.32 2 4 9 4s8.82-3.68 9-4c-.18-.32-2-4-9-4s-8.82 3.68-9 4Z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-cat">${formatCategory(product.category)}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-meta">
                        <span class="product-price">₦ ${formatMoney(product.price)}</span>
                        <span class="product-rating">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ${(product.rating || 0).toFixed(1)}
                        </span>
                    </div>
                    <button class="product-footer-btn feat-add-btn" ${isOOS ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                        <span>${isOOS ? 'Sold Out' : 'Add to Cart'}</span>
                    </button>
                </div>
            `;

            // Quick view — only if the modal exists on this page
            const openQV = () => { if (quickviewModal) openQuickView(product.id); };
            card.querySelector('.product-img-wrapper').addEventListener('click', openQV);
            card.querySelector('.product-name').addEventListener('click', openQV);
            card.querySelector('.view-details').addEventListener('click', e => { e.stopPropagation(); openQV(); });

            // Add to cart
            const addBtn = card.querySelector('.feat-add-btn');
            addBtn.addEventListener('click', e => {
                e.stopPropagation();
                if (cartItemsContainer) {
                    triggerFlyAnimation(card.querySelector('.product-img'), addBtn);
                    addToCart(product.id);
                } else {
                    window.location.href = 'shop.html';
                }
            });

            featuredGrid.appendChild(card);
        });

        addDebug(`✅ Rendered ${featured.length} featured products`);

        // Wire up featured category pills (once only)
        if (featuredCategories && !featuredCategories._wired) {
            featuredCategories._wired = true;
            featuredCategories.addEventListener('click', e => {
                const btn = e.target.closest('.category-btn');
                if (!btn) return;
                featuredCategories.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderFeaturedProducts();
            });
        }
    }

    // --- Helpers ---
    function formatCategory(cat) {
        const cats = {
            'perfumes': 'Perfumes & Mists',
            'body-lotions': 'Body Lotions',
            'body-scrubs-oils': 'Scrubs & Oils',
            'hair-products': 'Hair Products',
            'intimate-care': 'Intimate Care'
        };
        return cats[cat] || cat;
    }

    function formatMoney(amount) {
        return amount.toLocaleString('en-US');
    }

    // --- Cart Functions ---
    function addToCart(productId, qty = 1) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const cartItemIndex = cart.findIndex(item => item.productId === productId);

        if (cartItemIndex > -1) {
            // Check stock limits
            if (cart[cartItemIndex].quantity + qty > product.stock) {
                alert(`Sorry, only ${product.stock} units of this item are in stock.`);
                cart[cartItemIndex].quantity = product.stock;
            } else {
                cart[cartItemIndex].quantity += qty;
            }
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: qty
            });
        }

        saveCart();
        updateCartUI();
    }

    function changeQty(productId, delta) {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;

        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }

        if (newQty > product.stock) {
            alert(`Sorry, only ${product.stock} units are currently in stock.`);
            return;
        }

        item.quantity = newQty;
        saveCart();
        updateCartUI();
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.productId !== productId);
        saveCart();
        updateCartUI();
    }

    function saveCart() {
        localStorage.setItem('12degrees_cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        
        let totalItems = 0;
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px; opacity:0.3;"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    <h4>Your cart is empty</h4>
                    <p>Add products to start shopping.</p>
                </div>
            `;
            checkoutBtn.disabled = true;
        } else {
            cart.forEach(item => {
                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;

                const itemRow = document.createElement('div');
                itemRow.className = 'cart-item';
                itemRow.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <div class="cart-item-price">₦ ${formatMoney(item.price)}</div>
                        <div class="cart-item-qty">
                            <button class="qty-btn dec-qty">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn inc-qty">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" aria-label="Remove Item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                    </button>
                `;

                // Qty Listeners
                itemRow.querySelector('.dec-qty').addEventListener('click', () => changeQty(item.productId, -1));
                itemRow.querySelector('.inc-qty').addEventListener('click', () => changeQty(item.productId, 1));
                itemRow.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(item.productId));

                cartItemsContainer.appendChild(itemRow);
            });
            checkoutBtn.disabled = false;
        }

        // Update counts
        cartCountBadge.innerText = totalItems;
        cartQtyCount.innerText = totalItems;
        cartTotalPrice.innerText = `₦ ${formatMoney(totalPrice)}`;

        // Trigger header badge bounce
        if (totalItems > 0) {
            cartCountBadge.classList.add('bounce');
            setTimeout(() => cartCountBadge.classList.remove('bounce'), 300);
        }
    }

    // --- micro-animations: Fly to Cart ---
    function triggerFlyAnimation(imgElement, btnElement) {
        if (!imgElement || !btnElement) return;

        const imgClone = imgElement.cloneNode(true);
        imgClone.classList.add('flying-item');
        
        // Starting position
        const rect = imgElement.getBoundingClientRect();
        imgClone.style.top = `${rect.top}px`;
        imgClone.style.left = `${rect.left}px`;
        imgClone.style.width = `${rect.width}px`;
        imgClone.style.height = `${rect.height}px`;

        document.body.appendChild(imgClone);

        // Ending position (Cart button in header)
        const cartRect = cartToggleBtn.getBoundingClientRect();
        
        // Force reflow
        imgClone.offsetWidth;

        // Apply styles for animation
        imgClone.style.top = `${cartRect.top + 5}px`;
        imgClone.style.left = `${cartRect.left + 5}px`;
        imgClone.style.width = `20px`;
        imgClone.style.height = `20px`;
        imgClone.style.opacity = `0.2`;

        setTimeout(() => {
            imgClone.remove();
        }, 850);
    }

    // --- Modals Logic ---
    let activeQuickviewProductId = null;

    function renderQuickviewReviews(productId) {
        const reviewsContainer = document.getElementById('quickview-reviews-section');
        if (!reviewsContainer) return;

        const product = products.find(p => p.id === productId);
        if (!product) return;

        let productReviews = [];
        if (window.storeDb && typeof window.storeDb.getReviews === 'function') {
            productReviews = window.storeDb.getReviews().filter(r => r.productId === productId);
        }

        let reviewsHTML = '';
        if (productReviews.length === 0) {
            reviewsHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:14px;">No reviews yet. Be the first to review this product!</div>`;
        } else {
            reviewsHTML = productReviews.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-user">${r.userName}</span>
                        <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <div class="review-date">${new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    <p class="review-comment">${r.comment}</p>
                </div>
            `).join('');
        }

        reviewsContainer.innerHTML = `
            <h4 style="font-family: var(--fh); font-size: 18px; margin-bottom: 16px; color: var(--ink);">Customer Reviews (${productReviews.length})</h4>
            <div class="reviews-list">
                ${reviewsHTML}
            </div>
            
            <form class="add-review-form" id="add-review-form">
                <h5 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--ink)">Share your thoughts</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 12px; margin-bottom: 4px; display: block; font-weight: 500; color: var(--ink-2)">Your Name *</label>
                        <input type="text" id="review-name" class="form-input" style="height: 38px; padding: 8px 12px; font-size: 13px;" required placeholder="e.g. Joy">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 12px; margin-bottom: 4px; display: block; font-weight: 500; color: var(--ink-2)">Rating *</label>
                        <select id="review-rating" class="form-input" style="height: 38px; padding: 8px 12px; font-size: 13px;" required>
                            <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                            <option value="4">⭐⭐⭐⭐ (4/5)</option>
                            <option value="3">⭐⭐⭐ (3/5)</option>
                            <option value="2">⭐⭐ (2/5)</option>
                            <option value="1">⭐ (1/5)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 12px; margin-bottom: 4px; display: block; font-weight: 500; color: var(--ink-2)">Review Comment *</label>
                    <textarea id="review-comment" class="form-input" style="height: 60px; padding: 8px 12px; font-size: 13px; resize: none;" required placeholder="What did you like or dislike about this product?"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="height: 38px; font-size: 13px; margin-top: 4px; align-self: flex-start; padding: 0 24px; display: inline-flex; align-items: center; justify-content: center;">Submit Review</button>
            </form>
        `;

        const form = document.getElementById('add-review-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                const userName = document.getElementById('review-name').value.trim();
                const rating = parseInt(document.getElementById('review-rating').value, 10);
                const comment = document.getElementById('review-comment').value.trim();

                try {
                    if (window.storeDb && typeof window.storeDb.addReview === 'function') {
                        await window.storeDb.addReview({
                            productId: product.id,
                            productName: product.name,
                            userName,
                            rating,
                            comment
                        });
                        
                        products = window.storeDb.getProducts();
                        renderProducts();
                        renderFeaturedProducts();
                        openQuickView(product.id);
                    }
                } catch (err) {
                    console.error("Failed to add review:", err);
                    alert("Failed to submit review. Please try again.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }
    }

    function openQuickView(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        let badgeHTML = '';
        if (product.badge) {
            const badgeClass = product.badge.toLowerCase().replace(' ', '-');
            badgeHTML = `<span class="product-badge ${badgeClass} quickview-badge">${product.badge}</span>`;
        }

        const isOutOfStock = product.stock <= 0;
        activeQuickviewProductId = productId;

        quickviewContent.innerHTML = `
            <div class="quickview-main-info">
                <div class="quickview-img-side">
                    ${badgeHTML}
                    <img src="${product.image}" alt="${product.name}" class="quickview-img">
                </div>
                <div class="quickview-info-side">
                    <span class="product-cat">${formatCategory(product.category)}</span>
                    <h3 class="quickview-name">${product.name}</h3>
                    <div class="quickview-rating">
                        <span style="color:var(--gold); margin-right:4px;">★</span>
                        <strong>${(product.rating || 0).toFixed(1)}</strong> <span style="color:var(--text-muted); font-size:13px;">(Reviewer Favorite)</span>
                    </div>
                    <div class="quickview-price">₦ ${formatMoney(product.price)}</div>
                    <p class="quickview-desc">${product.description}</p>
                    <div style="font-size:13px; margin-bottom: 20px;">
                        <strong>Stock Availability:</strong> 
                        <span style="color:${isOutOfStock ? 'var(--primary)' : 'var(--success)'}; font-weight:600;">
                            ${isOutOfStock ? 'Out of Stock' : `${product.stock} items left in stock`}
                        </span>
                    </div>
                    <div class="quickview-qty-buy">
                        <button class="btn btn-primary quick-add-btn" style="flex-grow:1;" ${isOutOfStock ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                            <span>${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="reviews-section" id="quickview-reviews-section"></div>
        `;

        quickviewContent.querySelector('.quick-add-btn').addEventListener('click', () => {
            addToCart(product.id);
            closeQuickview();
        });

        renderQuickviewReviews(productId);
        quickviewModal.classList.add('open');
    }

    function closeQuickview() {
        activeQuickviewProductId = null;
        quickviewModal.classList.remove('open');
    }

    // --- Checkout Form ---
    function openCheckout() {
        cartDrawer.classList.remove('open');
        cartDrawerOverlay.classList.remove('open');

        let totalItems = 0;
        let totalPrice = 0;
        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;
        });

        checkoutItemsQty.innerText = totalItems;
        checkoutTotalVal.innerText = `₦ ${formatMoney(totalPrice)}`;
        checkoutModal.classList.add('open');
    }

    const custEmailInput = document.getElementById('cust-email');

    // Checkout Submit (Direct Paystack Payment Flow)
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const address = document.getElementById('cust-address').value.trim();
        const email = custEmailInput ? custEmailInput.value.trim() : '';

        // Disable submit button during network request
        const submitBtn = document.getElementById('submit-order-btn');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Redirecting to Paystack...</span>';

        let totalPrice = 0;
        const orderItems = [];

        cart.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            
            orderItems.push({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            });
        });

        try {
            // Request transaction initialization from our secure backend API
            const response = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    amount: totalPrice * 100, // Paystack amount is in kobo
                    metadata: {
                        customerName: name,
                        customerPhone: phone,
                        address: address,
                        paymentMethod: 'Card Payment',
                        items: orderItems,
                        total: totalPrice
                    }
                })
            });

            const result = await response.json();
            if (result.authorization_url) {
                // Save order data to localStorage before redirect so we can
                // retrieve it on return (Paystack metadata format is unreliable)
                localStorage.setItem('pendingOrder', JSON.stringify({
                    customerName: name,
                    customerPhone: phone,
                    customerEmail: email,
                    address: address,
                    paymentMethod: 'Card Payment',
                    items: orderItems,
                    total: totalPrice
                }));
                // Redirect to Paystack secure hosted page
                window.location.href = result.authorization_url;
            } else {
                throw new Error(result.error || 'Failed to initialize payment');
            }
        } catch (err) {
            console.error("Paystack initialization failed:", err);
            alert("Failed to initialize payment gateway: " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });

    // --- Theme Control ---
    function initTheme() {
        const activeTheme = localStorage.getItem('12degrees_theme') || 'light';
        if (activeTheme === 'dark') {
            document.body.classList.add('dark-mode');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            document.body.classList.remove('dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        if (isDark) {
            localStorage.setItem('12degrees_theme', 'dark');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            localStorage.setItem('12degrees_theme', 'light');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    });

    // --- UI Listeners ---
    cartToggleBtn.addEventListener('click', () => {
        cartDrawer.classList.add('open');
        cartDrawerOverlay.classList.add('open');
    });

    closeCartBtn.addEventListener('click', () => {
        cartDrawer.classList.remove('open');
        cartDrawerOverlay.classList.remove('open');
    });

    cartDrawerOverlay.addEventListener('click', () => {
        cartDrawer.classList.remove('open');
        cartDrawerOverlay.classList.remove('open');
    });

    closeQuickviewBtn.addEventListener('click', closeQuickview);
    quickviewModal.addEventListener('click', (e) => {
        if (e.target === quickviewModal) closeQuickview();
    });

    checkoutBtn.addEventListener('click', openCheckout);
    closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) checkoutModal.classList.remove('open');
    });

    closeSuccessBtn.addEventListener('click', () => successModal.classList.remove('open'));
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) successModal.classList.remove('open');
    });

    // Category click filters
    if (categoriesContainer) {
        categoriesContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.category-btn');
            if (!btn) return;

            categoriesContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentCategory = btn.getAttribute('data-category');
            renderProducts();
        });
    }

    // Search query input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    // Sorting selection
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // Handle footer link category clicking
    window.filterByCategory = function(categoryKey) {
        if (categoriesContainer) {
            const targetBtn = categoriesContainer.querySelector(`.category-btn[data-category="${categoryKey}"]`);
            if (targetBtn) {
                targetBtn.click();
            }
        } else {
            localStorage.setItem('filterCategory', categoryKey);
            window.location.href = 'shop.html';
        }
    };


    // --- Interactive Scent Quiz ---
    const quizQuestions = [
        {
            question: "What is your ideal fragrance vibe?",
            options: [
                { text: "🌸 Warm, sweet, and romantic", value: "sweet" },
                { text: "🌿 Fresh, clean, and energizing", value: "fresh" },
                { text: "✨ Cozy vanilla and soft warmth", value: "cozy" }
            ]
        },
        {
            question: "Where do you plan to wear it most?",
            options: [
                { text: "🛁 Everyday post-shower self-care", value: "casual" },
                { text: "💃 Date nights and special outings", value: "special" },
                { text: "💼 Workspace and daily freshness", value: "work" }
            ]
        },
        {
            question: "Choose your favorite fragrance note:",
            options: [
                { text: "🍒 Pink prosecco & red berries", value: "berries" },
                { text: "🥥 Creamy coconut & solar musk", value: "coconut" },
                { text: "🍦 Cozy vanilla & soft cashmere", value: "vanilla" }
            ]
        }
    ];

    let quizStep = 0;
    let quizAnswers = [];

    function initQuiz() {
        const startBtn = document.getElementById('start-quiz-btn');
        const restartBtn = document.getElementById('restart-quiz-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', startQuiz);
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', restartQuiz);
        }
    }

    function startQuiz() {
        quizStep = 0;
        quizAnswers = [];
        const intro = document.getElementById('quiz-intro');
        const results = document.getElementById('quiz-results');
        const container = document.getElementById('quiz-question-container');
        
        if (intro) intro.style.display = 'none';
        if (results) results.style.display = 'none';
        if (container) container.style.display = 'block';
        
        showQuizQuestion();
    }

    function restartQuiz() {
        startQuiz();
    }

    function showQuizQuestion() {
        const currentQ = quizQuestions[quizStep];
        const progressFill = document.getElementById('quiz-progress-fill');
        const stepCount = document.getElementById('quiz-step-count');
        const qText = document.getElementById('quiz-question-text');
        const optionsGrid = document.getElementById('quiz-options-grid');
        
        if (!currentQ || !progressFill || !stepCount || !qText || !optionsGrid) return;

        // Progress
        const progressPct = (quizStep / quizQuestions.length) * 100;
        progressFill.style.width = `${progressPct}%`;
        
        // Step count
        stepCount.innerText = `Question ${quizStep + 1} of ${quizQuestions.length}`;
        
        // Question Text
        qText.innerText = currentQ.question;
        
        // Options
        optionsGrid.innerHTML = '';
        
        currentQ.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option-btn';
            btn.innerHTML = `
                <span>${opt.text}</span>
                <span class="quiz-option-arrow">→</span>
            `;
            btn.addEventListener('click', () => handleQuizSelect(opt.value));
            optionsGrid.appendChild(btn);
        });
    }

    function handleQuizSelect(val) {
        quizAnswers.push(val);
        quizStep++;
        
        if (quizStep < quizQuestions.length) {
            showQuizQuestion();
        } else {
            showQuizResults();
        }
    }

    function showQuizResults() {
        const container = document.getElementById('quiz-question-container');
        const progressFill = document.getElementById('quiz-progress-fill');
        const matchCardContainer = document.getElementById('quiz-recommendation-card');
        const resultsDiv = document.getElementById('quiz-results');
        
        if (container) container.style.display = 'none';
        if (progressFill) progressFill.style.width = '100%';
        if (!matchCardContainer || !resultsDiv) return;
        
        // Match recommendation
        const val1 = quizAnswers[0];
        const val3 = quizAnswers[2];
        
        let matchedId = 'p1'; // Default: A Thousand Wishes
        
        if (val3 === 'berries' || val1 === 'sweet') {
            matchedId = products.some(p => p.id === 'p1' && p.stock > 0) ? 'p1' : 'p4';
        } else if (val3 === 'coconut' || val1 === 'fresh') {
            matchedId = products.some(p => p.id === 'p2' && p.stock > 0) ? 'p2' : 'p3';
        } else if (val3 === 'vanilla' || val1 === 'cozy') {
            matchedId = products.some(p => p.id === 'p8' && p.stock > 0) ? 'p8' : 'p2';
        }
        
        const recommendedProduct = products.find(p => p.id === matchedId) || products[0];
        
        if (recommendedProduct) {
            const isOutOfStock = recommendedProduct.stock <= 0;
            matchCardContainer.innerHTML = `
                <div class="product-card" data-id="${recommendedProduct.id}" style="width: 100%;">
                    <div class="product-img-wrapper" style="cursor: default;">
                        <img src="${recommendedProduct.image}" alt="${recommendedProduct.name}" class="product-img">
                    </div>
                    <div class="product-info">
                        <span class="product-cat">${formatCategory(recommendedProduct.category)}</span>
                        <h3 class="product-name" style="cursor: default;">${recommendedProduct.name}</h3>
                        <div class="product-meta">
                            <span class="product-price">₦ ${formatMoney(recommendedProduct.price)}</span>
                            <span class="product-rating">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                ${(recommendedProduct.rating || 0).toFixed(1)}
                            </span>
                        </div>
                        <button class="product-footer-btn quiz-add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                            <span>${isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                        </button>
                    </div>
                </div>
            `;
            
            const quizAddBtn = matchCardContainer.querySelector('.quiz-add-to-cart-btn');
            quizAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerFlyAnimation(matchCardContainer.querySelector('.product-img'), quizAddBtn);
                addToCart(recommendedProduct.id);
            });
        }
        
        resultsDiv.style.display = 'flex';
    }

    // ─── Customer Reviews Section ────────────────────────────────────────────
    function initReviewsSection() {
        const reviewsGrid = document.getElementById('homepage-reviews-grid');
        const avgNumberEl = document.getElementById('reviews-avg-number');
        const avgStarsEl = document.getElementById('reviews-avg-stars');
        const countLabelEl = document.getElementById('reviews-count-label');
        
        if (!reviewsGrid) return; // Only run on pages with the reviews grid

        function renderReviews() {
            let allReviews = [];
            if (window.storeDb && typeof window.storeDb.getReviews === 'function') {
                allReviews = window.storeDb.getReviews() || [];
            }
            
            // Sort reviews by date descending (newest first)
            allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Render overall summary stats
            if (allReviews.length > 0) {
                const totalRating = allReviews.reduce((sum, r) => sum + Number(r.rating), 0);
                const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;
                
                if (avgNumberEl) avgNumberEl.textContent = avgRating.toFixed(1);
                if (avgStarsEl) {
                    const fullStars = Math.round(avgRating);
                    avgStarsEl.textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
                }
                if (countLabelEl) countLabelEl.textContent = `from ${allReviews.length} customer review${allReviews.length > 1 ? 's' : ''}`;
            } else {
                if (avgNumberEl) avgNumberEl.textContent = '5.0';
                if (avgStarsEl) avgStarsEl.textContent = '★★★★★';
                if (countLabelEl) countLabelEl.textContent = 'no reviews yet';
            }

            // Render cards
            if (allReviews.length === 0) {
                reviewsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 48px 24px; color: var(--text-muted); font-size: 15px; background: var(--paper); border: 1px dashed var(--border); border-radius: var(--r-lg);">
                        No reviews yet. Be the first to share your experience!
                    </div>
                `;
                return;
            }

            reviewsGrid.innerHTML = allReviews.map(r => {
                const nameInit = r.userName ? r.userName.charAt(0).toUpperCase() : '?';
                const formattedDate = new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                const starsText = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                
                return `
                    <div class="review-card">
                        <div class="review-card-header">
                            <div class="reviewer-avatar">${nameInit}</div>
                            <div class="reviewer-info">
                                <div class="reviewer-name">${r.userName}</div>
                                <div class="reviewer-product" title="${r.productName || 'Verified Buyer'}">Verified Buyer &middot; ${r.productName || 'General'}</div>
                            </div>
                        </div>
                        <div class="review-stars">${starsText}</div>
                        <p class="review-comment">"${r.comment}"</p>
                        <div class="review-date">${formattedDate}</div>
                    </div>
                `;
            }).join('');
        }

        // Star picker click handling
        const starPicker = document.getElementById('star-picker');
        const revRatingInput = document.getElementById('rev-rating');
        if (starPicker && revRatingInput) {
            const starButtons = starPicker.querySelectorAll('button');
            starButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const val = parseInt(btn.getAttribute('data-val'), 10);
                    revRatingInput.value = val;
                    starButtons.forEach(b => {
                        const bVal = parseInt(b.getAttribute('data-val'), 10);
                        if (bVal <= val) {
                            b.classList.add('lit');
                        } else {
                            b.classList.remove('lit');
                        }
                    });
                });
            });
        }

        // Review form submit handling
        const reviewForm = document.getElementById('homepage-review-form');
        const successMsg = document.getElementById('review-success-msg');
        
        if (reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('rev-name');
                const productInput = document.getElementById('rev-product');
                const commentInput = document.getElementById('rev-comment');
                const submitBtn = document.getElementById('submit-review-btn');
                
                const userName = nameInput.value.trim();
                const productName = productInput.value.trim();
                const rating = parseInt(revRatingInput.value, 10);
                const comment = commentInput.value.trim();

                if (!rating || rating < 1 || rating > 5) {
                    alert("Please select a star rating by clicking the stars.");
                    return;
                }

                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Submitting...';

                try {
                    if (window.storeDb && typeof window.storeDb.addReview === 'function') {
                        // Look up if product name matches an existing product ID
                        let productId = '';
                        const matchedProduct = products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
                        if (matchedProduct) {
                            productId = matchedProduct.id;
                        }

                        await window.storeDb.addReview({
                            productId: productId,
                            productName: productName,
                            userName: userName,
                            rating: rating,
                            comment: comment
                        });

                        // Clear form
                        reviewForm.reset();
                        if (revRatingInput) revRatingInput.value = '0';
                        if (starPicker) {
                            starPicker.querySelectorAll('button').forEach(b => b.classList.remove('lit'));
                        }

                        // Show success message
                        if (successMsg) {
                            successMsg.style.display = 'block';
                            setTimeout(() => {
                                successMsg.style.display = 'none';
                            }, 5000);
                        }

                        // Re-render
                        renderReviews();
                    }
                } catch (err) {
                    console.error("Failed to submit review:", err);
                    alert("Error submitting review. Please try again.");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            });
        }

        // Initial render
        renderReviews();

        // Listen for database changes to update review grid
        window.addEventListener('db_reviews_updated', () => {
            renderReviews();
        });
    }

    // ─── Paystack Redirect Verification Callback ─────────────────────────────
    async function handlePaystackCallback(reference) {
        // Create full-screen loading spinner overlay
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'paystack-loading-overlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15,15,17,0.9);
            color: white; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            z-index: 100000; font-family: 'Outfit', sans-serif;
            backdrop-filter: blur(10px);
        `;
        loadingDiv.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid var(--primary, #e60012); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Verifying Payment</h3>
            <p style="color: var(--text-muted, #888); font-size: 14px;">Please wait while we confirm your card transaction status...</p>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        document.body.appendChild(loadingDiv);

        try {
            // Check status via our secure backend API
            const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
            
            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const paymentDetails = await res.json();
            console.log('Paystack verify response:', JSON.stringify(paymentDetails));

            if (paymentDetails.status === 'success') {
                // Read original order details from localStorage (saved before redirect)
                const pendingOrderRaw = localStorage.getItem('pendingOrder');
                const orderData = pendingOrderRaw ? JSON.parse(pendingOrderRaw) : (paymentDetails.metadata || {});

                // Clear cart and pendingOrder immediately - payment is confirmed
                cart = [];
                saveCart();
                updateCartUI();
                localStorage.removeItem('pendingOrder');

                // Clean URL so refresh doesn't re-trigger verification
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

                // Try to log order to Firebase (non-critical — don't block success on failure)
                let orderId = `ORD-${Date.now().toString().slice(-4)}`;
                try {
                    const loggedOrder = await window.storeDb.addOrder({
                        ...orderData,
                        paystackReference: reference,
                        status: 'paid'
                    });
                    orderId = loggedOrder.id;
                } catch (dbErr) {
                    console.warn('Firebase order write failed (payment still confirmed):', dbErr.message);
                }

                // Build WhatsApp message
                let itemsText = '';
                if (orderData.items && orderData.items.length) {
                    orderData.items.forEach((item, index) => {
                        const itemTotal = item.price * item.quantity;
                        itemsText += `${index + 1}. *${item.name}* x${item.quantity} (₦${formatMoney(itemTotal)})\n`;
                    });
                }

                const text = `🛍️ *PAID ORDER - 12 DEGREES* (Ref: ${orderId})\n` +
                             `-----------------------------------\n` +
                             `👤 *Customer:* ${orderData.customerName || 'N/A'}\n` +
                             `📞 *WhatsApp:* ${orderData.customerPhone || 'N/A'}\n` +
                             `📍 *Address:* ${orderData.address || 'N/A'}\n` +
                             `💳 *Payment:* Card Payment (Paystack Verified ✅)\n` +
                             `🔑 *Paystack Ref:* ${reference}\n\n` +
                             `*Items Ordered:*\n${itemsText}\n` +
                             `🔥 *Order Total:* ₦ ${formatMoney(orderData.total || 0)}\n` +
                             `-----------------------------------\n` +
                             `Payment successfully processed! Please confirm receipt.`;

                const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;

                // Remove loading overlay and show success modal
                loadingDiv.remove();
                const successTitle = document.querySelector('.success-title');
                const successDesc = document.querySelector('.success-desc');
                if (successTitle) successTitle.textContent = "Payment Successful! 🎉";
                if (successDesc) successDesc.textContent = "Your card payment was verified by Paystack. Your order is confirmed! A WhatsApp tab should have opened to send your order details.";
                successModal.classList.add('open');
                window.open(waUrl, '_blank');

            } else {
                throw new Error("Transaction not successful. Status: " + (paymentDetails.status || 'unknown'));
            }

        } catch (error) {
            console.error("Payment callback error:", error);
            loadingDiv.remove();
            // Clean URL
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            alert("Payment verification failed. If your account was charged, please contact us with Paystack reference: " + reference);
        }
    }

    // Run
    initStore();
});

