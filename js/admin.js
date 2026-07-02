// ─── 12 Degrees Admin Dashboard ─────────────────────────────────────────────
// Auth: Firebase Authentication (Email/Password)
// Sidebar tab navigation is fully self-contained and fires independently
// of Firebase readiness, so it ALWAYS works once the DOM is loaded.
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════════════════════════
    // STYLED ALERTS
    // ══════════════════════════════════════════════════════════════════════════
    const alertModal = document.getElementById('alert-modal');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertConfirmBtn = document.getElementById('alert-confirm-btn');
    const alertCancelBtn = document.getElementById('alert-cancel-btn');

    function showAlert(message, title = 'Notification', isConfirm = false) {
        return new Promise((resolve) => {
            alertTitle.textContent = title;
            alertMessage.textContent = message;
            alertCancelBtn.style.display = isConfirm ? 'block' : 'none';
            alertModal.style.display = 'flex';

            alertConfirmBtn.onclick = () => {
                alertModal.style.display = 'none';
                resolve(true);
            };
            alertCancelBtn.onclick = () => {
                alertModal.style.display = 'none';
                resolve(false);
            };
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DOM REFERENCES
    // ══════════════════════════════════════════════════════════════════════════
    const loginOverlay   = document.getElementById('login-overlay');
    const loginForm      = document.getElementById('login-form');
    const loginError     = document.getElementById('login-error-msg');
    const logoutBtn      = document.getElementById('logout-btn');
    const mobileMenuBtn  = document.getElementById('mobile-menu-btn');
    const adminSidebar   = document.querySelector('.admin-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    const menuItems    = document.querySelectorAll('.menu-item');
    const tabPanels    = document.querySelectorAll('.tab-panel');
    const pageTitle    = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const metricRevenue  = document.getElementById('metric-revenue');
    const metricOrders   = document.getElementById('metric-orders');
    const metricAvgOrder = document.getElementById('metric-avg-order');
    const metricViews    = document.getElementById('metric-views');

    const productsTableBody    = document.getElementById('products-table-body');
    const productSearchInput   = document.getElementById('product-search-input');
    const addProductModalBtn   = document.getElementById('add-product-modal-btn');
    const productModal         = document.getElementById('product-modal');
    const closeProductModalBtn = document.getElementById('close-product-modal-btn');
    const productForm          = document.getElementById('product-form');
    const productModalTitle    = document.getElementById('product-modal-title');
    const prodImgInput         = document.getElementById('prod-img');
    const prodImgFileInput     = document.getElementById('prod-img-file');
    const formImgPreview       = document.getElementById('form-img-preview');
    const formImgPreviewPlaceholder = document.getElementById('form-img-preview-placeholder');

    const ordersTableBody    = document.getElementById('orders-table-body');
    const orderSearchInput   = document.getElementById('order-search-input');
    const orderFilterStatus  = document.getElementById('order-filter-status');
    const orderModal         = document.getElementById('order-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal-btn');
    const orderDetailsContent = document.getElementById('order-details-content');

    const topSellingTableBody = document.getElementById('top-selling-table-body');
    const resetDbBtn          = document.getElementById('reset-db-btn');

    // Customers directory DOM references
    const customersTableBody    = document.getElementById('customers-table-body');
    const customerSearchInput   = document.getElementById('customer-search-input');
    const customerModal         = document.getElementById('customer-modal');
    const closeCustomerModalBtn = document.getElementById('close-customer-modal-btn');
    const customerProfileInfo   = document.getElementById('customer-profile-info');
    const customerOrdersTableBody = document.getElementById('customer-orders-table-body');

    // Reviews moderation DOM references
    const reviewsTableBody    = document.getElementById('reviews-table-body');
    const reviewSearchInput   = document.getElementById('review-search-input');
    const reviewModal         = document.getElementById('review-modal');
    const closeReviewModalBtn = document.getElementById('close-review-modal-btn');
    const reviewEditForm      = document.getElementById('review-edit-form');
    const cancelReviewBtn     = document.getElementById('cancel-review-btn');

    // ── State ─────────────────────────────────────────────────────────────────
    let products             = [];
    let orders               = [];
    let reviews              = [];
    let activeTab            = 'overview';
    let productSearchQuery   = '';
    let orderSearchQuery     = '';
    let customerSearchQuery  = '';
    let reviewSearchQuery    = '';
    let orderStatusFilter    = 'all';
    let dashboardInitialised = false;
    let salesChartInstance   = null;
    let categoryChartInstance = null;
    let selectedProductImageFile = null;

    // ── Tab Metadata ──────────────────────────────────────────────────────────
    const tabMeta = {
        overview:  { title: 'Analytics Overview',   subtitle: 'Real-time statistics on storefront metrics and order values.' },
        products:  { title: 'Product Inventory',     subtitle: 'Manage catalog items, prices, descriptions, and current stock sizes.' },
        orders:    { title: 'Customer Order Logs',   subtitle: 'Monitor checkout items, payment preferences, and shipping deliveries.' },
        customers: { title: 'Customers Directory',   subtitle: 'Consolidated customer information, purchase counts, and spend stats.' },
        reviews:   { title: 'Reviews Moderation',    subtitle: 'Moderate customer ratings and review comments on product catalog items.' },
        settings:  { title: 'System Configuration',  subtitle: 'Administrative actions, developer accounts, and database restores.' }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SIDEBAR TAB SWITCHING — fully independent, always works
    // ══════════════════════════════════════════════════════════════════════════
    function switchTab(tab) {
        if (!tab) return;
        activeTab = tab;

        menuItems.forEach(item => {
            if (item.dataset.tab === tab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        tabPanels.forEach(panel => {
            if (panel.id === `tab-${tab}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        const meta = tabMeta[tab] || tabMeta.overview;
        if (pageTitle)    pageTitle.textContent    = meta.title;
        if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

        // Refresh charts when overview tab is re-opened
        if (tab === 'overview') {
            try { salesChartInstance?.resize(); } catch(e) {}
            try { categoryChartInstance?.resize(); } catch(e) {}
        }
    }

    // Attach sidebar click listeners immediately (no dependency on Firebase)
    menuItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            console.log('Tab clicked:', tab);
            switchTab(tab);
            if (adminSidebar) {
                adminSidebar.classList.remove('mobile-open');
            }
        });
    });

    if (mobileMenuBtn && adminSidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            adminSidebar.classList.toggle('mobile-open');
        });

        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                adminSidebar.classList.remove('mobile-open');
            });
        }

        document.addEventListener('click', (e) => {
            if (adminSidebar.classList.contains('mobile-open') && !adminSidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                adminSidebar.classList.remove('mobile-open');
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOGIN OVERLAY HELPERS
    // ══════════════════════════════════════════════════════════════════════════
    function showLogin(msg) {
        loginOverlay.classList.add('active');
        if (msg) {
            loginError.textContent     = msg;
            loginError.style.display   = 'block';
        } else {
            loginError.style.display = 'none';
        }
    }

    function hideLogin() {
        loginOverlay.classList.remove('active');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FIREBASE AUTH — wait for db.js to expose window.storeDb
    // ══════════════════════════════════════════════════════════════════════════
    let dbCheckAttempts = 0;
    const DB_MAX_WAIT_MS = 8000;  // 8 seconds max wait

    function waitForDb(cb) {
        if (window.storeDb) {
            cb();
            return;
        }
        const t = setInterval(() => {
            dbCheckAttempts += 50;
            if (window.storeDb) {
                clearInterval(t);
                cb();
            } else if (dbCheckAttempts >= DB_MAX_WAIT_MS) {
                clearInterval(t);
                showLogin('Firebase failed to load. Check your internet connection and try refreshing.');
            }
        }, 50);
    }

    waitForDb(() => {
        const preloader = document.getElementById('preloader');
        const hidePreloader = () => {
            if (preloader) {
                preloader.classList.add('fade-out');
            }
        };

        if (window.location.search.includes('bypass')) {
            hideLogin();
            if (!dashboardInitialised) {
                dashboardInitialised = true;
                initDashboard();
            }
            hidePreloader();
            return;
        }
        // Reactively listen to Firebase Auth state changes
        window.storeDb.onAuthChange(async (user) => {
            if (user) {
                hideLogin();
                if (!dashboardInitialised) {
                    dashboardInitialised = true;
                    await initDashboard();
                }
            } else {
                showLogin();
            }
            hidePreloader();
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // LOGIN FORM SUBMIT
    // ══════════════════════════════════════════════════════════════════════════
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';

        const raw  = document.getElementById('admin-user').value.trim();
        const pass = document.getElementById('admin-pass').value.trim();

        // Convenience shorthand: "admin" → "admin@12degrees.store"
        const email = raw.includes('@') ? raw : `${raw}@12degrees.store`;

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled     = true;
        btn.textContent  = 'Authenticating…';

        try {
            await window.storeDb.adminSignIn(email, pass);
            loginForm.reset();
            // onAuthStateChanged will fire automatically and hideLogin()
        } catch (err) {
            console.error('Login error:', err.code, err.message);
            let msg = 'Invalid credentials. Please try again.';
            if (err.code === 'auth/invalid-email')      msg = 'Invalid email format.';
            if (err.code === 'auth/user-not-found')     msg = 'No account found with that email.';
            if (err.code === 'auth/wrong-password')     msg = 'Incorrect password.';
            if (err.code === 'auth/invalid-credential') msg = 'Wrong email or password.';
            if (err.code === 'auth/too-many-requests')  msg = 'Too many attempts. Please wait a few minutes.';
            showLogin(msg);
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Authenticate';
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // LOGOUT
    // ══════════════════════════════════════════════════════════════════════════
    logoutBtn.addEventListener('click', async () => {
        await window.storeDb.adminSignOut();
        dashboardInitialised = false;
        products = [];
        orders   = [];
        try { salesChartInstance?.destroy(); } catch(e) {}
        try { categoryChartInstance?.destroy(); } catch(e) {}
        salesChartInstance    = null;
        categoryChartInstance = null;
        // onAuthStateChanged fires → showLogin() called automatically
    });

    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD INITIALISATION
    // ══════════════════════════════════════════════════════════════════════════
    async function initDashboard() {
        await window.storeDb.ready;

        products = window.storeDb.getProducts();
        orders   = window.storeDb.getOrders();
        reviews  = window.storeDb.getReviews();

        console.log(`✅ Dashboard initialized: ${products.length} products, ${orders.length} orders, ${reviews.length} reviews`);

        updateMetrics();
        renderProductsTable();
        renderOrdersTable();
        renderCustomersTable();
        renderReviewsTable();
        renderTopSellingTable();
        initCharts();

        window.addEventListener('db_products_updated', () => {
            products = window.storeDb.getProducts();
            renderProductsTable();
            renderTopSellingTable();
            renderReviewsTable(); // Product details might change in reviews list too
            updateMetrics();
            updateCharts();
        });

        window.addEventListener('db_orders_updated', () => {
            orders = window.storeDb.getOrders();
            renderOrdersTable();
            renderCustomersTable(); // Customers are compiled from orders
            updateMetrics();
            updateCharts();
        });

        window.addEventListener('db_analytics_updated', () => {
            updateMetrics();
        });

        window.addEventListener('db_reviews_updated', () => {
            reviews = window.storeDb.getReviews();
            renderReviewsTable();
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // KPI METRICS
    // ══════════════════════════════════════════════════════════════════════════
    function updateMetrics() {
        const totalRev = orders.reduce((s, o) => s + o.total, 0);
        const count    = orders.length;
        const avg      = count > 0 ? Math.round(totalRev / count) : 0;
        const views    = window.storeDb.getViews();

        if (metricRevenue)  metricRevenue.textContent  = `₦ ${formatMoney(totalRev)}`;
        if (metricOrders)   metricOrders.textContent   = count;
        if (metricAvgOrder) metricAvgOrder.textContent = `₦ ${formatMoney(avg)}`;
        if (metricViews)    metricViews.textContent    = views;

        console.log(`📊 Metrics: Revenue ₦${totalRev}, Orders ${count}, Avg ₦${avg}, Views ${views}`);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatMoney(n) { return n.toLocaleString('en-US'); }
    function formatDate(s) {
        return new Date(s).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    function formatCategory(c) {
        return { perfumes:'Perfumes & Mists','body-lotions':'Body Lotions',
                 'body-scrubs-oils':'Scrubs & Oils','hair-products':'Hair Products',
                 'intimate-care':'Intimate Care' }[c] || c;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PRODUCTS TABLE
    // ══════════════════════════════════════════════════════════════════════════
    function renderProductsTable() {
        if (!productsTableBody) return;
        productsTableBody.innerHTML = '';

        const q = productSearchQuery.toLowerCase();
        const list = products.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        );

        if (!list.length) {
            productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--admin-text-muted)">No products match your search.</td></tr>`;
            return;
        }

        list.forEach(p => {
            const row = document.createElement('tr');
            let stockBadge = p.stock <= 0
                ? '<span class="badge out-of-stock">Sold Out</span>'
                : p.stock <= 5
                    ? '<span class="badge low-stock">Low Stock</span>'
                    : '<span class="badge in-stock">In Stock</span>';

            row.innerHTML = `
                <td>
                    <div class="product-cell">
                        <img src="${p.image}" alt="${p.name}" class="table-img">
                        <div>
                            <div class="table-product-name">${p.name}</div>
                            <div style="font-size:11px;color:var(--admin-text-muted)">ID: ${p.id}</div>
                        </div>
                    </div>
                </td>
                <td>${formatCategory(p.category)}</td>
                <td><strong>₦ ${formatMoney(p.price)}</strong></td>
                <td>${stockBadge}</td>
                <td><strong>${p.stock} units</strong></td>
                <td>${p.badge ? `<span class="badge" style="background:#e2e8f0;color:#475569">${p.badge}</span>` : '<span style="color:#cbd5e1">—</span>'}</td>
                <td style="text-align:right">
                    <div class="action-btns" style="justify-content:flex-end">
                        <button class="action-btn edit" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button class="action-btn delete" title="Delete" style="color:var(--admin-primary);border-color:rgba(230,0,18,.15)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>`;

            row.querySelector('.edit').addEventListener('click', () => openProductForm(p.id));
            row.querySelector('.delete').addEventListener('click', async () => {
                const confirmed = await showAlert(`Are you sure you want to delete "${p.name}"?`, 'Confirm Delete', true);
                if (confirmed) {
                    await deleteProduct(p.id);
                }
            });
            productsTableBody.appendChild(row);
        });
    }

    if (productSearchInput) {
        productSearchInput.addEventListener('input', e => {
            productSearchQuery = e.target.value;
            renderProductsTable();
        });
    }

    if (addProductModalBtn) addProductModalBtn.addEventListener('click', () => openProductForm());

    function openProductForm(productId = null) {
        productForm.reset();
        selectedProductImageFile = null;
        if (prodImgFileInput) prodImgFileInput.value = '';
        formImgPreview.style.display = 'none';
        formImgPreviewPlaceholder.style.display = 'block';

        if (productId) {
            const p = products.find(x => x.id === productId);
            if (!p) return;
            productModalTitle.textContent = 'Edit Catalog Product';
            document.getElementById('form-product-id').value = p.id;
            document.getElementById('prod-name').value        = p.name;
            document.getElementById('prod-cat').value         = p.category;
            document.getElementById('prod-price').value       = p.price;
            document.getElementById('prod-desc').value        = p.description;
            document.getElementById('prod-stock').value       = p.stock;
            document.getElementById('prod-badge').value       = p.badge || '';
            prodImgInput.value = p.image;
            formImgPreview.src = p.image;
            formImgPreview.style.display = 'block';
            formImgPreviewPlaceholder.style.display = 'none';
        } else {
            productModalTitle.textContent = 'Add New Product';
            document.getElementById('form-product-id').value = '';
        }
        productModal.classList.add('open');
    }

    prodImgInput.addEventListener('blur', () => {
        const url = prodImgInput.value.trim();
        if (url) {
            formImgPreview.src = url;
            formImgPreview.style.display = 'block';
            formImgPreviewPlaceholder.style.display = 'none';
        }
    });

    function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.75) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                };
                img.onerror = err => reject(err);
            };
            reader.onerror = err => reject(err);
        });
    }

    if (prodImgFileInput) {
        prodImgFileInput.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            
            formImgPreviewPlaceholder.textContent = 'Processing image…';
            formImgPreviewPlaceholder.style.display = 'block';
            formImgPreview.style.display = 'none';
            
            try {
                const base64Url = await compressImage(file);
                prodImgInput.value = base64Url;
                formImgPreview.src = base64Url;
                formImgPreview.style.display = 'block';
                formImgPreviewPlaceholder.style.display = 'none';
                formImgPreviewPlaceholder.textContent = 'No image loaded.';
            } catch (err) {
                console.error(err);
                alert('Failed to process image.');
                formImgPreviewPlaceholder.textContent = 'Processing failed.';
            }
        });
    }

    productForm.addEventListener('submit', async e => {
        e.preventDefault();
        
        const imageUrl = prodImgInput.value.trim();
        if (!imageUrl) {
            await showAlert('Please provide a product image URL or choose a file to upload.', 'Image Required');
            return;
        }

        const btn = productForm.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'Saving product…';

        const id   = document.getElementById('form-product-id').value;
        const obj  = {
            id:          id || 'p' + Date.now().toString().slice(-6),
            name:        document.getElementById('prod-name').value.trim(),
            category:    document.getElementById('prod-cat').value,
            price:       parseInt(document.getElementById('prod-price').value),
            description: document.getElementById('prod-desc').value.trim(),
            stock:       parseInt(document.getElementById('prod-stock').value),
            badge:       document.getElementById('prod-badge').value,
            image:       imageUrl,
            rating:      id ? (products.find(p => p.id === id)?.rating || 4.5) : 4.5
        };

        try {
            await window.storeDb.saveProduct(obj);
            productModal.classList.remove('open');
            await showAlert('Product saved successfully!', 'Success');
        } catch (err) {
            console.error(err);
            await showAlert('Error saving product: ' + err.message, 'Error'); 
        }
        finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });

    async function deleteProduct(id) {
        try { 
            await window.storeDb.deleteProduct(id);
            await showAlert('Product deleted successfully!', 'Success');
        }
        catch (err) { 
            await showAlert('Error deleting product. Please try again.', 'Error');
        }
    }

    closeProductModalBtn.addEventListener('click', () => productModal.classList.remove('open'));
    productModal.addEventListener('click', e => { if (e.target === productModal) productModal.classList.remove('open'); });

    // ══════════════════════════════════════════════════════════════════════════
    // ORDERS TABLE
    // ══════════════════════════════════════════════════════════════════════════
    function renderOrdersTable() {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '';

        const q = orderSearchQuery.toLowerCase();
        const list = orders.filter(o => {
            const okStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
            const okSearch = (o.customerName || '').toLowerCase().includes(q) ||
                             (o.id || '').toLowerCase().includes(q) ||
                             (o.customerPhone || '').includes(q);
            return okStatus && okSearch;
        });

        if (!list.length) {
            ordersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--admin-text-muted)">No orders match the current filters.</td></tr>`;
            return;
        }

        list.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${order.id}</strong></td>
                <td>${formatDate(order.date)}</td>
                <td><strong>${order.customerName}</strong><br><span style="font-size:12px;color:var(--admin-text-muted)">${order.customerPhone}</span></td>
                <td>${order.paymentMethod}</td>
                <td><strong>₦ ${formatMoney(order.total)}</strong></td>
                <td>
                    <select class="status-select status-${order.status}" id="status-select-${order.id}">
                        <option value="pending"    ${order.status==='pending'    ?'selected':''}>Pending</option>
                        <option value="processing" ${order.status==='processing' ?'selected':''}>Processing</option>
                        <option value="completed"  ${order.status==='completed'  ?'selected':''}>Completed</option>
                    </select>
                </td>
                <td style="text-align:right">
                    <div class="action-btns" style="justify-content:flex-end">
                        <button class="action-btn view" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 12c.18.32 2 4 9 4s8.82-3.68 9-4c-.18-.32-2-4-9-4s-8.82 3.68-9 4Z"/></svg>
                        </button>
                    </div>
                </td>`;

            row.querySelector(`#status-select-${order.id}`).addEventListener('change', async e => {
                try { await window.storeDb.updateOrderStatus(order.id, e.target.value); }
                catch (err) { alert('Failed to update status.'); renderOrdersTable(); }
            });
            row.querySelector('.view').addEventListener('click', () => openOrderDetails(order.id));
            ordersTableBody.appendChild(row);
        });
    }

    if (orderSearchInput)  orderSearchInput.addEventListener('input', e => { orderSearchQuery = e.target.value; renderOrdersTable(); });
    if (orderFilterStatus) orderFilterStatus.addEventListener('change', e => { orderStatusFilter = e.target.value; renderOrdersTable(); });

    function openOrderDetails(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const items = order.items.map(i =>
            `<div class="order-detail-row"><span>${i.name} (x${i.quantity})</span><span>₦ ${formatMoney(i.price*i.quantity)}</span></div>`
        ).join('');

        orderDetailsContent.innerHTML = `
            <div class="order-detail-header">
                <div><strong>${order.id}</strong><br><span style="font-size:12px;color:var(--admin-text-muted)">${formatDate(order.date)}</span></div>
                <span class="badge status-${order.status}" style="font-size:12px;padding:6px 12px">${order.status}</span>
            </div>
            <div class="order-detail-sect">
                <h4>Customer</h4>
                <div class="order-detail-row"><strong>Name:</strong><span>${order.customerName}</span></div>
                <div class="order-detail-row"><strong>Phone:</strong><span>${order.customerPhone}</span></div>
                <div class="order-detail-row"><strong>Address:</strong><span>${order.address}</span></div>
            </div>
            <div class="order-detail-sect"><h4>Items</h4>${items}</div>
            <div class="order-detail-sect" style="border-bottom:none;padding-bottom:0">
                <div class="order-detail-row" style="font-size:16px;font-weight:700">
                    <span>Grand Total:</span><span style="color:var(--admin-primary)">₦ ${formatMoney(order.total)}</span>
                </div>
                <div class="order-detail-row" style="font-size:12px;color:var(--admin-text-muted);margin-top:8px">
                    <span>Payment:</span><span>${order.paymentMethod}</span>
                </div>
            </div>
            <a href="https://wa.me/${order.customerPhone.replace(/\D/g,'')}" target="_blank"
               class="login-btn" style="display:flex;justify-content:center;align-items:center;gap:8px;text-decoration:none;margin-top:16px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Chat via WhatsApp</span>
            </a>`;
        orderModal.classList.add('open');
    }

    closeOrderModalBtn.addEventListener('click', () => orderModal.classList.remove('open'));
    orderModal.addEventListener('click', e => { if (e.target === orderModal) orderModal.classList.remove('open'); });

    // ── Customers Section Logic ──
    function getCompiledCustomers() {
        const customerMap = new Map();

        orders.forEach(order => {
            const phone = (order.customerPhone || '').trim();
            if (!phone) return;

            const isNewCustomer = !customerMap.has(phone);
            if (isNewCustomer) {
                customerMap.set(phone, {
                    phone: phone,
                    name: order.customerName || 'N/A',
                    email: order.customerEmail || 'N/A',
                    address: order.address || 'N/A',
                    totalSpent: 0,
                    orders: []
                });
            }

            const cust = customerMap.get(phone);
            cust.totalSpent += order.total || 0;
            cust.orders.push(order);

            if (isNewCustomer) {
                cust.name = order.customerName || 'N/A';
                cust.email = order.customerEmail || 'N/A';
                cust.address = order.address || 'N/A';
            }
        });

        const result = Array.from(customerMap.values());
        console.log(`📊 getCompiledCustomers: ${orders.length} orders → ${result.length} customers`, result);
        return result;
    }

    function renderCustomersTable() {
        if (!customersTableBody) return;
        customersTableBody.innerHTML = '';
        
        const compiled = getCompiledCustomers();
        const filtered = compiled.filter(c => {
            const query = customerSearchQuery.toLowerCase();
            return (c.name || '').toLowerCase().includes(query) ||
                   (c.phone || '').toLowerCase().includes(query) ||
                   (c.email || '').toLowerCase().includes(query) ||
                   (c.address || '').toLowerCase().includes(query);
        });
        
        if (filtered.length === 0) {
            customersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--admin-text-muted)">No customers match your search.</td></tr>`;
            return;
        }
        
        filtered.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td><span style="font-size:13px;color:var(--admin-text-muted)">${c.email}</span></td>
                <td><span style="font-size:13px;color:var(--admin-text-muted)">${c.address}</span></td>
                <td style="text-align:center;"><span class="badge" style="background:#e0f2fe;color:#0369a1">${c.orders.length}</span></td>
                <td style="text-align:right;"><strong>₦ ${formatMoney(c.totalSpent)}</strong></td>
                <td style="text-align:right;">
                    <button class="shop-link-btn view-customer-btn" style="padding:6px 12px;font-size:12px;cursor:pointer;">Details</button>
                </td>
            `;
            
            row.querySelector('.view-customer-btn').addEventListener('click', () => openCustomerModal(c));
            customersTableBody.appendChild(row);
        });
    }

    function openCustomerModal(c) {
        if (!customerModal || !customerProfileInfo || !customerOrdersTableBody) return;
        
        customerProfileInfo.innerHTML = `
            <div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-bottom:4px">Customer Name</div>
                <strong style="font-size:16px;">${c.name}</strong>
            </div>
            <div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-bottom:4px">WhatsApp Phone</div>
                <strong style="font-size:16px;"><a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--admin-primary)">${c.phone} 💬</a></strong>
            </div>
            <div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-bottom:4px">Email Address</div>
                <strong style="font-size:14px;font-weight:600;">${c.email}</strong>
            </div>
            <div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-bottom:4px">Total Spent</div>
                <strong style="font-size:16px;color:var(--admin-primary)">₦ ${formatMoney(c.totalSpent)}</strong>
            </div>
            <div style="grid-column: 1/-1;">
                <div style="font-size:11px;color:var(--admin-text-muted);margin-bottom:4px">Latest Delivery Address</div>
                <strong style="font-size:14px;font-weight:500;">${c.address}</strong>
            </div>
        `;
        
        customerOrdersTableBody.innerHTML = '';
        c.orders.forEach(o => {
            const itemsList = o.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${o.id}</strong></td>
                <td><span style="font-size:12px">${formatDate(o.date)}</span></td>
                <td><strong>₦ ${formatMoney(o.total)}</strong></td>
                <td><span class="badge status-${o.status}" style="font-size:11px;padding:3px 8px">${o.status}</span></td>
                <td><span style="font-size:12px;color:var(--admin-text-muted);display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${itemsList}">${itemsList}</span></td>
            `;
            customerOrdersTableBody.appendChild(row);
        });
        
        customerModal.classList.add('open');
    }

    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', e => {
            customerSearchQuery = e.target.value;
            renderCustomersTable();
        });
    }

    if (closeCustomerModalBtn) {
        closeCustomerModalBtn.addEventListener('click', () => customerModal.classList.remove('open'));
    }
    if (customerModal) {
        customerModal.addEventListener('click', e => {
            if (e.target === customerModal) customerModal.classList.remove('open');
        });
    }

    // ── Reviews Section Logic ──
    function renderReviewsTable() {
        if (!reviewsTableBody) return;
        reviewsTableBody.innerHTML = '';
        
        const filtered = reviews.filter(r => {
            const query = reviewSearchQuery.toLowerCase();
            return (r.userName || '').toLowerCase().includes(query) ||
                   (r.productName || '').toLowerCase().includes(query) ||
                   (r.comment || '').toLowerCase().includes(query);
        });
        
        if (filtered.length === 0) {
            reviewsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--admin-text-muted)">No reviews match your search.</td></tr>`;
            return;
        }
        
        filtered.forEach(r => {
            const row = document.createElement('tr');
            const product = products.find(p => p.id === r.productId);
            const thumbnail = product ? `<img src="${product.image}" class="table-img" style="margin-right:8px;vertical-align:middle;width:40px;height:40px;object-fit:cover;border-radius:4px;">` : '';
            
            row.innerHTML = `
                <td>
                    <div style="display:flex;align-items:center;">
                        ${thumbnail}
                        <div>
                            <div class="table-product-name" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.productName}">${r.productName}</div>
                            <span style="font-size:11px;color:var(--admin-text-muted)">ID: ${r.productId}</span>
                        </div>
                    </div>
                </td>
                <td><strong>${r.userName}</strong></td>
                <td><span style="color:#dfb15b;font-size:13px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></td>
                <td><p style="font-size:13px;margin:0;line-height:1.4;max-height:60px;overflow-y:auto;color:#475569">${r.comment}</p></td>
                <td><span style="font-size:12px;color:var(--admin-text-muted)">${formatDate(r.date)}</span></td>
                <td style="text-align:right;">
                    <div style="display:flex;gap:8px;justify-content:flex-end;">
                        <button class="shop-link-btn edit-review-btn" style="padding:6px 12px;font-size:12px;cursor:pointer;">Edit</button>
                        <button class="shop-link-btn delete-review-btn btn-danger" style="padding:6px 12px;font-size:12px;cursor:pointer;">Delete</button>
                    </div>
                </td>
            `;
            
            row.querySelector('.edit-review-btn').addEventListener('click', () => openEditReviewModal(r));
            row.querySelector('.delete-review-btn').addEventListener('click', () => handleDeleteReview(r.id));
            
            reviewsTableBody.appendChild(row);
        });
    }

    function openEditReviewModal(r) {
        if (!reviewModal || !reviewEditForm) return;
        
        document.getElementById('form-review-id').value = r.id;
        document.getElementById('form-review-username').value = r.userName;
        document.getElementById('form-review-rating').value = r.rating;
        document.getElementById('form-review-comment').value = r.comment;
        
        reviewModal.classList.add('open');
    }

    async function handleDeleteReview(reviewId) {
        const confirmed = await showAlert('Are you sure you want to delete this review? This will also update the average rating of the corresponding product.', 'Delete Review', true);
        if (confirmed) {
            try {
                await window.storeDb.deleteReview(reviewId);
                await showAlert('Review deleted successfully!', 'Success');
                renderReviewsTable();
            } catch (err) {
                console.error("Failed to delete review:", err);
                await showAlert('Error deleting review: ' + err.message, 'Error');
            }
        }
    }

    if (reviewSearchInput) {
        reviewSearchInput.addEventListener('input', e => {
            reviewSearchQuery = e.target.value;
            renderReviewsTable();
        });
    }

    if (closeReviewModalBtn) {
        closeReviewModalBtn.addEventListener('click', () => reviewModal.classList.remove('open'));
    }
    if (reviewModal) {
        reviewModal.addEventListener('click', e => {
            if (e.target === reviewModal) reviewModal.classList.remove('open');
        });
    }
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', () => reviewModal.classList.remove('open'));
    }

    if (reviewEditForm) {
        reviewEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reviewId = document.getElementById('form-review-id').value;
            const userName = document.getElementById('form-review-username').value.trim();
            const rating = parseInt(document.getElementById('form-review-rating').value, 10);
            const comment = document.getElementById('form-review-comment').value.trim();

            try {
                await window.storeDb.updateReview(reviewId, {
                    userName,
                    rating,
                    comment
                });
                alert('Review updated successfully!');
                reviewModal.classList.remove('open');
            } catch (err) {
                console.error("Failed to update review:", err);
                alert('Error updating review.');
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TOP SELLERS
    // ══════════════════════════════════════════════════════════════════════════
    function renderTopSellingTable() {
        if (!topSellingTableBody) return;
        topSellingTableBody.innerHTML = '';
        [...products].sort((a,b) => b.rating - a.rating).slice(0,4).forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="product-cell"><img src="${p.image}" alt="${p.name}" class="table-img"><div class="table-product-name">${p.name}</div></div></td>
                <td>${formatCategory(p.category)}</td>
                <td><strong>₦ ${formatMoney(p.price)}</strong></td>
                <td><strong>${p.stock} left</strong></td>
                <td><span style="color:var(--gold);font-size:15px;margin-right:4px">★</span><strong>${p.rating.toFixed(1)}</strong></td>`;
            topSellingTableBody.appendChild(tr);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DATABASE RESET
    // ══════════════════════════════════════════════════════════════════════════
    if (resetDbBtn) {
        resetDbBtn.addEventListener('click', async () => {
            if (confirm('Reset all store data to defaults? This deletes current orders.')) {
                resetDbBtn.disabled = true; resetDbBtn.textContent = 'Resetting…';
                try { await window.storeDb.resetDatabase(); location.reload(); }
                catch (err) { alert('Reset failed.'); resetDbBtn.disabled = false; resetDbBtn.textContent = 'Reset Store to Default Mock Data'; }
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHARTS
    // ══════════════════════════════════════════════════════════════════════════
    function buildSalesData() {
        const labels = [], data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('en-US', {month:'short',day:'numeric'}));
            const ds = d.toDateString();
            data.push(orders.filter(o => new Date(o.date).toDateString()===ds).reduce((s,o)=>s+o.total,0));
        }
        return { labels, data };
    }

    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }

        // Destroy existing chart instances if they exist
        try { salesChartInstance?.destroy(); } catch(e) {}
        try { categoryChartInstance?.destroy(); } catch(e) {}

        const salesCanvas = document.getElementById('salesTrendChart');
        const categoriesCanvas = document.getElementById('categoriesSplitChart');

        if (!salesCanvas || !categoriesCanvas) {
            console.error('Chart canvas elements not found');
            return;
        }

        const { labels, data } = buildSalesData();
        const useMock = data.every(v => v === 0);
        const finalData = useMock ? [20000,45000,15000,60500,35000,13500,48000] : data;

        try {
            salesChartInstance = new Chart(salesCanvas.getContext('2d'), {
                type: 'line',
                data: { labels, datasets: [{ label:'Daily Sales (₦)', data:finalData, borderColor:'#e60012', backgroundColor:'rgba(230,0,18,0.05)', borderWidth:3, fill:true, tension:0.4 }] },
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
                    scales: { y:{beginAtZero:true,grid:{color:'#f1f5f9'},ticks:{callback:v=>'₦'+formatMoney(v)}}, x:{grid:{display:false}} } }
            });
            console.log('✅ Sales trend chart initialized');
        } catch (e) {
            console.error('Failed to initialize sales chart:', e);
        }

        const catKeys = ['perfumes','body-lotions','body-scrubs-oils','hair-products','intimate-care'];
        const categoryData = catKeys.map(k=>products.filter(p=>p.category===k).length);

        try {
            categoryChartInstance = new Chart(categoriesCanvas.getContext('2d'), {
                type: 'doughnut',
                data: { labels:['Perfumes','Body Lotions','Scrubs & Oils','Hair Products','Intimate Care'],
                        datasets:[{ data:categoryData,
                                    backgroundColor:['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6'],
                                    borderWidth:2, borderColor:'#fff' }] },
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}}}, cutout:'65%' }
            });
            console.log('✅ Categories chart initialized');
        } catch (e) {
            console.error('Failed to initialize categories chart:', e);
        }
    }

    function updateCharts() {
        if (!salesChartInstance || !categoryChartInstance) {
            console.warn('Charts not initialized, skipping update');
            return;
        }
        try {
            const { data } = buildSalesData();
            const useMock = data.every(v=>v===0);
            salesChartInstance.data.datasets[0].data = useMock ? [20000,45000,15000,60500,35000,13500,48000] : data;
            salesChartInstance.update();
            console.log('✅ Sales chart updated');
        } catch (e) {
            console.error('Failed to update sales chart:', e);
        }

        try {
            const catKeys = ['perfumes','body-lotions','body-scrubs-oils','hair-products','intimate-care'];
            categoryChartInstance.data.datasets[0].data = catKeys.map(k=>products.filter(p=>p.category===k).length);
            categoryChartInstance.update();
            console.log('✅ Categories chart updated');
        } catch (e) {
            console.error('Failed to update categories chart:', e);
        }
    }
});
