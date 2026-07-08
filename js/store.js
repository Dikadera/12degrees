// 12 Degrees Storefront JS Logic
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 Store.js: DOMContentLoaded fired');

    // Rotate promo notification texts dynamically
    const promoTexts = [
        "10% discount on every purchase to celebrate our new website!",
        "✨ Grand Opening Launch: Discount auto-applied at checkout!",
        "🚚 Free delivery in Awka on orders above ₦30,000!"
    ];
    let currentPromoIdx = 0;
    const promoTextElements = document.querySelectorAll('.promo-text');
    if (promoTextElements.length > 0) {
        setInterval(() => {
            currentPromoIdx = (currentPromoIdx + 1) % promoTexts.length;
            promoTextElements.forEach(el => {
                el.style.opacity = 0;
                setTimeout(() => {
                    el.textContent = promoTexts[currentPromoIdx];
                    el.style.opacity = 1;
                }, 300);
            });
        }, 4000);
    }

    // Select elements
    const productGrid = document.getElementById('product-grid');
    const featuredGrid = document.getElementById('featured-grid');
    const featuredCategories = document.getElementById('featured-categories');
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
    let currentBadgeFilter = 'all';

    // WhatsApp Contact
    const WHATSAPP_PHONE = '2349029819153';

    // EmailJS Credentials loaded dynamically
    let emailjsPublicKey = '';
    let emailjsServiceId = '';
    let emailjsTemplateId = '';

    async function fetchConfig() {
        try {
            const apiBase = (window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:8080' : '';
            const configRes = await fetch(`${apiBase}/api/config`);
            if (configRes.ok) {
                const configData = await configRes.json();
                emailjsPublicKey = configData.emailjsPublicKey;
                emailjsServiceId = configData.emailjsServiceId;
                emailjsTemplateId = configData.emailjsTemplateId;
                console.log('🔑 EmailJS credentials loaded from backend config');

                if (typeof emailjs !== 'undefined' && emailjsPublicKey) {
                    emailjs.init(emailjsPublicKey);
                    console.log('✉️ EmailJS SDK initialized');
                }
            }
        } catch (e) {
            console.error('Failed to load credentials from server:', e);
        }
    }

    // Initialize Store
    async function initStore() {
        console.log('📦 initStore() starting...');

        // Fetch configurations in background (non-blocking)
        fetchConfig();

        try {
            if (window.storeDb) {
                console.log('✅ storeDb found, waiting for ready...');

                // Race the database ready promise against a 3.5-second timeout
                // This prevents the page from remaining blank if Firestore is blocked by adblockers/privacy settings
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database load timed out')), 3500)
                );

                await Promise.race([window.storeDb.ready, timeoutPromise]);
                products = window.storeDb.getProducts();
                console.log(`📊 Got ${products.length} products from DB`);
            } else {
                console.log('❌ storeDb NOT defined!');
                products = [];
            }
        } catch (err) {
            console.warn(`⚠️ DB load failed or timed out: ${err.message}. Loading default fallback products...`);
        }

        console.log(`✅ ${products.length} products ready for render`);

        try {
            if (window.storeDb && typeof window.storeDb.incrementViews === 'function') {
                window.storeDb.incrementViews(); // Log a page view
            }
        } catch (e) {
            console.error("Failed to increment views:", e);
        }

        renderCategoryPills();

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

        updateShopHero(currentCategory);

        console.log('🎨 Calling renderProducts & renderFeatured...');
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

        // Wire up payment method selection click handlers
        const paymentOptions = document.querySelectorAll('.payment-option');
        paymentOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                paymentOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
                // Update submit button text
                const submitBtn = document.getElementById('submit-order-btn');
                if (submitBtn) {
                    const gateway = opt.getAttribute('data-gateway');
                    if (gateway === 'flutterwave') {
                        submitBtn.innerHTML = 'Pay Securely with Flutterwave';
                    } else {
                        submitBtn.innerHTML = 'Pay Securely with Paystack';
                    }
                }
            });
        });

        // Check for redirect references
        const paystackParams = new URLSearchParams(window.location.search);
        const paystackRef = paystackParams.get('reference');
        if (paystackRef) {
            handlePaystackCallback(paystackRef);
        }

        const flwTxId = paystackParams.get('transaction_id');
        const flwStatus = paystackParams.get('status');
        if (flwTxId && (flwStatus === 'successful' || paystackParams.get('gateway') === 'flutterwave')) {
            handleFlutterwaveCallback(flwTxId);
        }

        // Initialize scroll animations
        initScrollReveal();

        // Initialize mouse parallax motion dynamics
        initHeroParallax();
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card reveal-on-scroll';
        card.setAttribute('data-id', product.id);

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
                    <div style="display:flex; flex-direction:column; gap:2px">
                        <span class="product-price" style="color:var(--red)">₦${formatMoney(Math.round(product.price * 0.90))}</span>
                        <span style="text-decoration:line-through; font-size:12.5px; color:var(--ink-4); font-weight:500">₦${formatMoney(product.price)}</span>
                    </div>
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

        return card;
    }

    // --- Render Products ---
    function renderProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        const isDefaultAllView = currentCategory === 'all' && 
                                 searchQuery.trim() === '' && 
                                 currentBadgeFilter === 'all' && 
                                 currentSort === 'default';

        if (isDefaultAllView) {
            const categories = window.storeDb ? window.storeDb.getCategories() : [];
            let renderedAny = false;

            categories.forEach(cat => {
                const catProducts = products.filter(p => p.category === cat.id);
                if (catProducts.length > 0) {
                    renderedAny = true;

                    const sect = document.createElement('div');
                    sect.className = 'category-section reveal-on-scroll';
                    sect.style.marginBottom = '48px';
                    sect.style.width = '100%';
                    sect.style.gridColumn = '1 / -1';

                    sect.innerHTML = `
                        <div class="section-label" style="margin-bottom: 24px;">
                            <span class="label-line"></span>
                            <span class="label-text" style="font-size: 16px; font-weight: 800; color: var(--ink);">${cat.name}</span>
                        </div>
                        <div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 24px; width: 100%;">
                        </div>
                    `;

                    const grid = sect.querySelector('.product-grid');
                    catProducts.forEach(product => {
                        const card = createProductCard(product);
                        grid.appendChild(card);
                    });

                    productGrid.appendChild(sect);
                }
            });

            // Handle uncategorized products
            const catIds = categories.map(c => c.id);
            const uncategorizedProducts = products.filter(p => !catIds.includes(p.category));
            if (uncategorizedProducts.length > 0) {
                renderedAny = true;
                const sect = document.createElement('div');
                sect.className = 'category-section reveal-on-scroll';
                sect.style.marginBottom = '48px';
                sect.style.width = '100%';
                sect.style.gridColumn = '1 / -1';

                sect.innerHTML = `
                    <div class="section-label" style="margin-bottom: 24px;">
                        <span class="label-line"></span>
                        <span class="label-text" style="font-size: 16px; font-weight: 800; color: var(--ink);">Other Products</span>
                    </div>
                    <div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 24px; width: 100%;">
                    </div>
                `;
                const grid = sect.querySelector('.product-grid');
                uncategorizedProducts.forEach(product => {
                    const card = createProductCard(product);
                    grid.appendChild(card);
                });
                productGrid.appendChild(sect);
            }

            if (!renderedAny) {
                productGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.5;"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5-2 4-2 4 2 4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                        <h3>No products found</h3>
                        <p>No products exist in the catalog.</p>
                    </div>
                `;
            } else {
                initScrollReveal();
            }
        } else {
            // Filter products
            let filtered = products.filter(product => {
                const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
                const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.category.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesBadge = currentBadgeFilter === 'all' ||
                    (product.badge && product.badge.toLowerCase() === currentBadgeFilter.toLowerCase());
                return matchesCategory && matchesSearch && matchesBadge;
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
                const card = createProductCard(product);
                productGrid.appendChild(card);
            });
            initScrollReveal();
        }
    }

    // --- Featured Products (Homepage teaser — top-rated, filterable by category pill) ---
    function renderFeaturedProducts() {
        console.log(`🌟 renderFeatured: ${products.length} products, featuredGrid: ${!!featuredGrid}`);
        if (!featuredGrid) {
            console.log('❌ featuredGrid element NOT found!');
            return;
        }

        // Determine which category pill is active
        let activeCat = 'all';
        if (featuredCategories) {
            const activeBtn = featuredCategories.querySelector('.category-btn.active');
            if (activeBtn) activeCat = activeBtn.getAttribute('data-cat') || 'all';
        }

        // Filter by showInFeatured flag (marked by admin) and category, slice max 9
        let featured = products.filter(p => p.showInFeatured === true && (activeCat === 'all' || p.category === activeCat));
        
        // Fallback to top-rated if admin hasn't marked any products yet
        if (featured.length === 0) {
            featured = products
                .filter(p => activeCat === 'all' || p.category === activeCat)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        featured = featured.slice(0, 9);

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
            card.className = 'product-card reveal-on-scroll';
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
                        <div style="display:flex; flex-direction:column; gap:2px">
                            <span class="product-price" style="color:var(--red)">₦${formatMoney(Math.round(product.price * 0.90))}</span>
                            <span style="text-decoration:line-through; font-size:12.5px; color:var(--ink-4); font-weight:500">₦${formatMoney(product.price)}</span>
                        </div>
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
        initScrollReveal();

        console.log(`✅ Rendered ${featured.length} featured products (grid has ${featuredGrid.children.length} children)`);

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

    function renderCategoryPills() {
        const categories = window.storeDb ? window.storeDb.getCategories() : [];

        // Homepage featured filters
        if (featuredCategories) {
            let html = `<button class="category-btn active" data-cat="all">All</button>`;
            categories.forEach(c => {
                html += `<button class="category-btn" data-cat="${c.id}">${c.name}</button>`;
            });
            featuredCategories.innerHTML = html;
        }

        // Shop page main filters
        if (categoriesContainer) {
            let html = `<button class="category-btn active" data-category="all">All</button>`;
            categories.forEach(c => {
                html += `<button class="category-btn" data-category="${c.id}">${c.name}</button>`;
            });
            categoriesContainer.innerHTML = html;
        }
    }

    // React to category updates from DB
    window.addEventListener('db_categories_updated', () => {
        renderCategoryPills();
        const categories = window.storeDb ? window.storeDb.getCategories() : [];
        if (currentCategory !== 'all' && !categories.some(c => c.id === currentCategory)) {
            currentCategory = 'all';
            updateShopHero('all');
        }
        renderProducts();
        renderFeaturedProducts();
    });

    // --- Helpers ---
    function formatCategory(cat) {
        if (cat === 'all') return 'All';
        const categories = window.storeDb ? window.storeDb.getCategories() : [];
        const found = categories.find(c => c.id === cat);
        return found ? found.name : cat;
    }

    function formatMoney(amount) {
        return amount.toLocaleString('en-US');
    }

    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.05,
                rootMargin: '0px 0px -20px 0px'
            });

            revealElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
                    el.classList.add('revealed');
                } else {
                    observer.observe(el);
                }
            });
        } else {
            revealElements.forEach(el => el.classList.add('revealed'));
        }
    }

    function initHeroParallax() {
        // Disabled at user's request to reduce dynamic/moving elements
    }

    function showUIError(msg) {
        const errorHtml = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--red);">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; display:inline-block;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <h3>${msg}</h3>
                <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top:16px; padding: 8px 20px; font-weight:600; cursor:pointer;">Retry Load</button>
            </div>
        `;
        const pg = document.getElementById('product-grid');
        const fg = document.getElementById('featured-grid');
        if (pg) pg.innerHTML = errorHtml;
        if (fg) fg.innerHTML = errorHtml;
    }

    function updateShopHero(category) {
        const shopHero = document.getElementById('shop-hero');
        if (!shopHero) return;

        // Toggle active background image
        const backgrounds = shopHero.querySelectorAll('.shop-hero-bg');
        backgrounds.forEach(bg => {
            if (bg.getAttribute('data-bg') === category) {
                bg.classList.add('active');
            } else {
                bg.classList.remove('active');
            }
        });

        // Update Title & Subtitle based on selected category
        const titleEl = shopHero.querySelector('.shop-hero-title');
        const subtitle = document.getElementById('shop-hero-subtitle');
        if (!titleEl || !subtitle) return;

        const categories = window.storeDb ? window.storeDb.getCategories() : [];
        const found = categories.find(c => c.id === category);

        if (category === 'all') {
            titleEl.innerHTML = 'The <em>Storefront</em>';
            subtitle.textContent = "Awka's #1 source for 100% genuine Bath & Body Works, Victoria's Secret, skincare mists, lotions & scrubs.";
        } else if (found) {
            titleEl.innerHTML = found.title || found.name;
            subtitle.textContent = found.subtitle || '';
        } else {
            // Capitalize fallback
            const prettyName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            titleEl.innerHTML = prettyName;
            subtitle.textContent = `Shop our collection of authentic ${prettyName} sourced directly from US/UK brands.`;
        }
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

        const cartSubtotalPrice = document.getElementById('cart-subtotal-price');
        const cartDiscountRow = document.getElementById('cart-discount-row');
        const cartDiscountVal = document.getElementById('cart-discount-val');

        const discount = totalPrice * 0.10;
        const grandTotal = totalPrice - discount;

        if (cartSubtotalPrice) cartSubtotalPrice.innerText = `₦ ${formatMoney(totalPrice)}`;
        if (cartDiscountRow) {
            if (totalPrice > 0) {
                cartDiscountRow.style.display = 'flex';
                cartDiscountVal.innerText = `-₦ ${formatMoney(discount)}`;
            } else {
                cartDiscountRow.style.display = 'none';
            }
        }
        cartTotalPrice.innerText = `₦ ${formatMoney(grandTotal)}`;

        // Trigger header cart button bounce
        if (totalItems > 0) {
            cartToggleBtn.classList.add('cart-bounce-anim');
            setTimeout(() => cartToggleBtn.classList.remove('cart-bounce-anim'), 650);
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
                    if (!window.storeDb) {
                        throw new Error("Database is not initialized. Please refresh the page.");
                    }
                    if (typeof window.storeDb.addReview !== 'function') {
                        throw new Error("Review function is not available.");
                    }

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
                } catch (err) {
                    console.error("Failed to add review:", err);
                    alert("Failed to submit review: " + err.message);
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

        const discount = totalPrice * 0.10;
        const grandTotal = totalPrice - discount;

        const subtotalValEl = document.getElementById('checkout-subtotal-val');
        const discountValEl = document.getElementById('checkout-discount-val');

        if (checkoutItemsQty) checkoutItemsQty.innerText = totalItems;
        if (subtotalValEl) subtotalValEl.innerText = `₦ ${formatMoney(totalPrice)}`;
        if (discountValEl) discountValEl.innerText = `-₦ ${formatMoney(discount)}`;
        if (checkoutTotalVal) checkoutTotalVal.innerText = `₦ ${formatMoney(grandTotal)}`;
        checkoutModal.classList.add('open');
    }

    const custEmailInput = document.getElementById('cust-email');

    // Checkout Submit (Direct Payment Flow - Paystack or Flutterwave)
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const address = document.getElementById('cust-address').value.trim();
        const email = custEmailInput ? custEmailInput.value.trim() : '';

        // Get selected payment gateway
        const selectedGatewayElement = checkoutForm.querySelector('input[name="payment_gateway"]:checked');
        const selectedGateway = selectedGatewayElement ? selectedGatewayElement.value : 'paystack';

        // Disable submit button during network request
        const submitBtn = document.getElementById('submit-order-btn');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Redirecting to ${selectedGateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'}...</span>`;

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

        const discount = totalPrice * 0.10;
        const grandTotal = totalPrice - discount;

        try {
            // Request transaction initialization from our secure backend API
            const apiBase = (window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:8080' : '';
            const response = await fetch(`${apiBase}/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    amount: grandTotal * 100, // Amount in kobo (divided by 100 on backend for Flutterwave)
                    gateway: selectedGateway,
                    metadata: {
                        customerName: name,
                        customerPhone: phone,
                        address: address,
                        paymentMethod: selectedGateway === 'flutterwave' ? 'Flutterwave Payment' : 'Paystack Payment',
                        items: orderItems,
                        total: grandTotal
                    }
                })
            });

            const result = await response.json();
            if (result.authorization_url) {
                // Save order data to localStorage before redirect so we can
                // retrieve it on return
                localStorage.setItem('pendingOrder', JSON.stringify({
                    customerName: name,
                    customerPhone: phone,
                    customerEmail: email,
                    address: address,
                    paymentMethod: selectedGateway === 'flutterwave' ? 'Flutterwave Card/Transfer' : 'Paystack Card/Transfer',
                    items: orderItems,
                    total: grandTotal
                }));
                // Redirect to gateway secure hosted page
                window.location.href = result.authorization_url;
            } else {
                throw new Error(result.error || 'Failed to initialize payment');
            }
        } catch (err) {
            console.error(`${selectedGateway} initialization failed:`, err);
            alert(`Failed to initialize payment gateway: ` + err.message);
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
            updateShopHero(currentCategory);
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

    // Badge filtering
    const badgeFilterSelect = document.getElementById('badge-filter-select');
    if (badgeFilterSelect) {
        badgeFilterSelect.addEventListener('change', (e) => {
            currentBadgeFilter = e.target.value;
            renderProducts();
        });
    }

    // Handle footer link category clicking
    window.filterByCategory = function (categoryKey) {
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
                            <div style="display:flex; flex-direction:column; gap:2px">
                                <span class="product-price" style="color:var(--red)">₦${formatMoney(Math.round(recommendedProduct.price * 0.90))}</span>
                                <span style="text-decoration:line-through; font-size:12.5px; color:var(--ink-4); font-weight:500">₦${formatMoney(recommendedProduct.price)}</span>
                            </div>
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

            // Fallback: show default reviews if database isn't available or returns empty
            if (!allReviews || allReviews.length === 0) {
                allReviews = [
                    { id: 'REV-1001', productId: 'p1', productName: 'Bath & Body Works "A Thousand Wishes" Mist', userName: 'Chinedu Okafor', rating: 5, comment: 'Amazing scent! Long-lasting and got so many compliments. Authentic product.', date: '2026-06-06T12:00:00.000Z' },
                    { id: 'REV-1002', productId: 'p2', productName: 'Eos 24H Moisture Body Lotion - Coconut Waters', userName: 'Amara Ezeugo', rating: 4, comment: 'Super moisturizing! Love the coconut scent, very fresh and clean.', date: '2026-06-07T14:30:00.000Z' },
                    { id: 'REV-1003', productId: 'p8', productName: 'Victoria\'s Secret "Bare Vanilla" Body Mist', userName: 'Kenechukwu Ndu', rating: 5, comment: 'Cozy, warm vanilla. Truly premium. Delivered extremely fast in Awka.', date: '2026-06-08T09:15:00.000Z' }
                ];
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
        const reviewForm = document.getElementById('homepage-review-form');
        const successMsg = document.getElementById('review-success-msg');

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
                    if (!window.storeDb) {
                        throw new Error("Database is not initialized. Please refresh the page.");
                    }
                    if (typeof window.storeDb.addReview !== 'function') {
                        throw new Error("Review function is not available.");
                    }

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
                } catch (err) {
                    console.error("Failed to submit review:", err);
                    alert("Error submitting review: " + err.message);
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



    function triggerConfetti() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const colors = ['#e60012', '#ffc107', '#28a745', '#007bff', '#e83e8c', '#fd7e14'];
        const particles = [];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: width / 2,
                y: height / 2 - 80,
                angle: Math.random() * Math.PI * 2,
                velocity: 3 + Math.random() * 8,
                friction: 0.95,
                gravity: 0.12,
                size: 5 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: -8 + Math.random() * 16,
                opacity: 1
            });
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            let active = false;

            particles.forEach(p => {
                if (p.opacity <= 0) return;
                active = true;

                p.x += Math.cos(p.angle) * p.velocity;
                p.y += Math.sin(p.angle) * p.velocity + p.gravity;
                p.velocity *= p.friction;
                p.opacity -= 0.007;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            if (active) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        }

        animate();
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
            const apiBase = (window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:8080' : '';
            const res = await fetch(`${apiBase}/api/verify-payment?reference=${encodeURIComponent(reference)}`);

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

                // Send EmailJS Thank You Email via browser REST API (bypasses adblockers/script-prevention)
                if (orderData.customerEmail && emailjsPublicKey) {
                    try {
                        const orderSummaryHtml = orderData.items.map(item => `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px 0; font-size: 14px; color: #334155;">${item.name}</td>
                                <td style="padding: 12px 0; text-align: center; font-size: 14px; color: #475569;">x${item.quantity}</td>
                                <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 600; color: #0f172a;">₦ ${formatMoney(item.price * item.quantity)}</td>
                            </tr>
                        `).join('');

                        fetch('https://api.emailjs.com/api/v1.0/email/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                service_id: emailjsServiceId,
                                template_id: emailjsTemplateId,
                                user_id: emailjsPublicKey,
                                template_params: {
                                    to_email: orderData.customerEmail,
                                    to_name: orderData.customerName,
                                    order_id: orderId,
                                    customer_phone: orderData.customerPhone,
                                    delivery_address: orderData.address,
                                    order_summary_html: orderSummaryHtml,
                                    total_amount: `₦ ${formatMoney(orderData.total || 0)}`
                                }
                            })
                        }).then(r => {
                            if (r.ok) {
                                console.log('✉️ EmailJS thank you email sent successfully via client REST API!');
                            } else {
                                r.text().then(txt => console.error('❌ EmailJS REST failed:', txt));
                            }
                        }).catch(e => console.error('❌ EmailJS REST network error:', e));
                    } catch (emailErr) {
                        console.error('EmailJS payload compile failed:', emailErr);
                    }
                }



                // Remove loading overlay
                loadingDiv.remove();

                // Dynamically update success modal contents into a gorgeous digital receipt card
                const successBody = successModal.querySelector('.success-body');
                if (successBody) {
                    let itemsHtml = '';
                    if (orderData.items && orderData.items.length) {
                        itemsHtml = `
                            <div style="margin: 16px 0 8px 0; border-top: 1px dashed var(--border); padding-top: 12px; text-align: left;">
                                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">Items Summary</div>
                                ${orderData.items.map(item => `
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; line-height: 1.4;">
                                        <span style="color: var(--ink-2); margin-right: 12px;">${item.name} <strong style="color: var(--text-muted); font-weight: normal; font-size: 11px;">x${item.quantity}</strong></span>
                                        <strong style="color: var(--ink); white-space: nowrap;">₦ ${formatMoney(item.price * item.quantity)}</strong>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }

                    successBody.innerHTML = `
                        <div class="success-icon-circle" style="background: rgba(40,167,69,0.1); color: #28a745; margin: 0 auto 20px auto; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <h3 class="success-title" style="font-family: var(--fh); font-size: 24px; font-weight: 800; color: var(--ink); margin-bottom: 8px;">Payment Successful! 🎉</h3>
                        <p class="success-desc" style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">Thank you for shopping with 12 Degrees. Your order has been placed successfully.</p>
                        
                        <div style="background: var(--bg-alt, #f8fafc); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; border: 1px solid var(--border, #e2e8f0); font-family: 'DM Sans', sans-serif;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: var(--text-muted);">
                                <span>Order Number:</span>
                                <strong style="color: var(--ink);">${orderId}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: var(--text-muted);">
                                <span>Transaction Ref:</span>
                                <strong style="color: var(--ink); font-size: 11px;">${reference.substring(0, 16)}...</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: var(--text-muted); border-bottom: 1px dashed var(--border, #e2e8f0); padding-bottom: 12px;">
                                <span>Total Paid:</span>
                                <strong style="color: var(--primary, #e60012); font-size: 15px;">₦ ${formatMoney(orderData.total || 0)}</strong>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; letter-spacing: 0.5px;">Delivery Details</div>
                            <div style="font-size: 13px; color: var(--ink); font-weight: 600; margin-bottom: 2px;">${orderData.customerName || 'N/A'} (${orderData.customerPhone || 'N/A'})</div>
                            <div style="font-size: 13px; color: var(--ink-2); line-height: 1.4;">${orderData.address || 'N/A'}</div>
                            ${itemsHtml}
                        </div>
                        
                        <button class="btn btn-primary" id="close-success-receipt-btn" style="width: 100%; height: 48px; border-radius: var(--r-md); font-weight: 700; margin-top: 10px;">Continue Shopping</button>
                    `;

                    // Wire up the close button
                    const closeBtn = document.getElementById('close-success-receipt-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            successModal.classList.remove('open');
                        });
                    }
                }

                successModal.classList.add('open');
                triggerConfetti();

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

    // ─── Flutterwave Redirect Verification Callback ─────────────────────────────
    async function handleFlutterwaveCallback(transactionId) {
        // Create full-screen loading spinner overlay
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'flutterwave-loading-overlay';
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
            <p style="color: var(--text-muted, #888); font-size: 14px;">Please wait while we confirm your Flutterwave transaction status...</p>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        document.body.appendChild(loadingDiv);

        try {
            // Check status via our secure backend API
            const apiBase = (window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:8080' : '';
            const res = await fetch(`${apiBase}/api/verify-payment?transaction_id=${encodeURIComponent(transactionId)}&gateway=flutterwave`);

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const paymentDetails = await res.json();
            console.log('Flutterwave verify response:', JSON.stringify(paymentDetails));

            if (paymentDetails.status === 'success') {
                // Read original order details from localStorage
                const pendingOrderRaw = localStorage.getItem('pendingOrder');
                const orderData = pendingOrderRaw ? JSON.parse(pendingOrderRaw) : (paymentDetails.metadata || {});

                // Clear cart and pendingOrder
                cart = [];
                saveCart();
                updateCartUI();
                localStorage.removeItem('pendingOrder');

                // Clean URL so refresh doesn't re-trigger verification
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

                // Log order to Firebase
                let orderId = `ORD-${Date.now().toString().slice(-4)}`;
                try {
                    const loggedOrder = await window.storeDb.addOrder({
                        ...orderData,
                        flutterwaveTransactionId: transactionId,
                        paymentMethod: 'Flutterwave Card/Transfer',
                        status: 'paid'
                    });
                    orderId = loggedOrder.id;
                } catch (dbErr) {
                    console.warn('Firebase order write failed (payment still confirmed):', dbErr.message);
                }

                // Send EmailJS Thank You Email
                if (orderData.customerEmail && emailjsPublicKey) {
                    try {
                        const orderSummaryHtml = orderData.items.map(item => `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px 0; font-size: 14px; color: #334155;">${item.name}</td>
                                <td style="padding: 12px 0; text-align: center; font-size: 14px; color: #475569;">x${item.quantity}</td>
                                <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 600; color: #0f172a;">₦ ${formatMoney(item.price * item.quantity)}</td>
                            </tr>
                        `).join('');

                        fetch('https://api.emailjs.com/api/v1.0/email/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                service_id: emailjsServiceId,
                                template_id: emailjsTemplateId,
                                user_id: emailjsPublicKey,
                                template_params: {
                                    to_email: orderData.customerEmail,
                                    to_name: orderData.customerName,
                                    order_id: orderId,
                                    customer_phone: orderData.customerPhone,
                                    delivery_address: orderData.address,
                                    order_summary_html: orderSummaryHtml,
                                    total_amount: `₦ ${formatMoney(orderData.total || 0)}`
                                }
                            })
                        }).then(r => {
                            if (r.ok) {
                                console.log('✉️ EmailJS thank you email sent successfully via client REST API!');
                            } else {
                                r.text().then(txt => console.error('❌ EmailJS REST failed:', txt));
                            }
                        }).catch(e => console.error('❌ EmailJS REST network error:', e));
                    } catch (emailErr) {
                        console.error('EmailJS payload compile failed:', emailErr);
                    }
                }

                // Remove loading overlay
                loadingDiv.remove();

                // Update success modal receipt contents
                const successBody = successModal.querySelector('.success-body');
                if (successBody) {
                    let itemsHtml = '';
                    if (orderData.items && orderData.items.length) {
                        itemsHtml = `
                            <div style="margin: 16px 0 8px 0; border-top: 1px dashed var(--border); padding-top: 12px; text-align: left;">
                                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">Items Summary</div>
                                ${orderData.items.map(item => `
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; line-height: 1.4;">
                                        <span style="color: var(--ink-2); margin-right: 12px;">${item.name} <strong style="color: var(--text-muted); font-weight: normal; font-size: 11px;">x${item.quantity}</strong></span>
                                        <strong style="color: var(--ink); white-space: nowrap;">₦ ${formatMoney(item.price * item.quantity)}</strong>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }

                    successBody.innerHTML = `
                        <div class="success-icon-circle" style="background: rgba(40,167,69,0.1); color: #28a745; margin: 0 auto 20px auto; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <h3 class="success-title" style="font-family: var(--fh); font-size: 24px; font-weight: 800; color: var(--ink); margin-bottom: 8px;">Payment Successful! 🎉</h3>
                        <p class="success-desc" style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">Thank you for shopping with 12 Degrees. Your order has been placed successfully.</p>
                        
                        <div style="background: var(--bg-alt, #f8fafc); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; border: 1px solid var(--border, #e2e8f0); font-family: 'DM Sans', sans-serif;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: var(--text-muted);">
                                <span>Order Number:</span>
                                <strong style="color: var(--ink);">${orderId}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: var(--text-muted);">
                                <span>Transaction Ref:</span>
                                <strong style="color: var(--ink); font-size: 11px;">FLW-${transactionId.toString().substring(0, 12)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: var(--text-muted); border-bottom: 1px dashed var(--border, #e2e8f0); padding-bottom: 12px;">
                                <span>Total Paid:</span>
                                <strong style="color: var(--primary, #e60012); font-size: 15px;">₦ ${formatMoney(orderData.total || 0)}</strong>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; letter-spacing: 0.5px;">Delivery Details</div>
                            <div style="font-size: 13px; color: var(--ink); font-weight: 600; margin-bottom: 2px;">${orderData.customerName || 'N/A'} (${orderData.customerPhone || 'N/A'})</div>
                            <div style="font-size: 13px; color: var(--ink-2); line-height: 1.4;">${orderData.address || 'N/A'}</div>
                            ${itemsHtml}
                        </div>
                        
                        <button class="btn btn-primary" id="close-success-receipt-btn" style="width: 100%; height: 48px; border-radius: var(--r-md); font-weight: 700; margin-top: 10px;">Continue Shopping</button>
                    `;

                    const closeBtn = document.getElementById('close-success-receipt-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            successModal.classList.remove('open');
                        });
                    }
                }

                successModal.classList.add('open');
                triggerConfetti();

            } else {
                throw new Error("Transaction not successful. Status: " + (paymentDetails.status || 'unknown'));
            }

        } catch (error) {
            console.error("Flutterwave payment callback error:", error);
            loadingDiv.remove();
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            alert("Payment verification failed. If your account was charged, please contact us with transaction ID: " + transactionId);
        }
    }

    // Run
    initStore();
});

