// Global state management for POS page
let isInitialLoad = true;
let renderAbortController = null;
let searchTimeout = null;

const state = {
    products: [],
    cart: [],
    searchTerm: '',
    selectedCategory: 'all',
    isLoading: false
};

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const customerNameInput = document.getElementById('customerName');
const orderMethodSelect = document.getElementById('orderMethod');
const paymentMethodSelect = document.getElementById('paymentMethod');
const submitBtn = document.getElementById('submitOrderBtn');
const clearBtn = document.getElementById('clearCartBtn');
const searchInput = document.getElementById('searchProduct');
const categoryFilter = document.getElementById('categoryFilter');

// Current time display
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN');
    const clockElement = document.getElementById('currentTime');
    if (clockElement) clockElement.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// Show/hide loading state
function showLoadingState(isLoading, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isLoading) {
        container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted small mt-2">Đang tải sản phẩm...</p>
      </div>
    `;
    }
}

// Fetch products from API (matching product.js pattern)
async function fetchProducts(retryCount = 0) {
    const MAX_RETRIES = 2;

    // Cancel previous render
    if (renderAbortController) {
        renderAbortController.abort();
        renderAbortController = null;
    }
    renderAbortController = new AbortController();

    showLoadingState(true, 'productGrid');

    try {
        const response = await fetch('/api/v1/products', {
            signal: renderAbortController.signal
        });
        const result = await response.json();

        // Handle both response formats (success wrapper or direct array)
        let products = Array.isArray(result) ? result : (result.success ? result.data : []);

        if (!products.length && result.success === false) {
            throw new Error(result.message || "Không thể tải dữ liệu");
        }

        state.products = products;
        await renderProductGrid();
        await loadCategories();

    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Previous render aborted");
            return;
        }

        // Retry logic
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchProducts(retryCount + 1);
        }

        console.error("Failed to fetch products:", error);
        showToast("⚠️ Không thể tải sản phẩm! Vui lòng thử lại.");

        // Show empty state
        if (productGrid) {
            productGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-wifi-off fs-2 d-block mb-2 text-muted"></i>
          <span class="text-muted small">Không thể kết nối. Vui lòng tải lại trang.</span>
        </div>
      `;
        }
    }
}

async function loadCategories(retryCount = 0) {
    const MAX_RETRIES = 2;

    try {
        const response = await fetch('/api/v1/products/category');
        const result = await response.json();

        let categories = [];
        if (result.success) {
            categories = result.data;
        } else if (Array.isArray(result)) {
            categories = result;
        } else {
            throw new Error(result.message || "Failed to fetch categories");
        }

        categoryFilter.innerHTML = '<option value="all">📂 Tất cả danh mục</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.emoji || '📁'} ${escapeHtml(cat.name)}</option>`).join('');

    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return loadCategories(retryCount + 1);
        }
        console.error("Failed to load categories:", error);
        // Keep default option only
        categoryFilter.innerHTML = '<option value="all">📂 Tất cả danh mục</option>';
    }
}

// Filter products based on search and category
function getFilteredProducts() {
    let filtered = [...state.products];

    if (state.searchTerm) {
        const query = state.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.Category?.name && p.Category.name.toLowerCase().includes(query))
        );
    }

    if (state.selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id == state.selectedCategory || p.Category?.id == state.selectedCategory);
    }

    return filtered;
}

// Debounced search handler (matching product.js pattern)
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        state.searchTerm = searchInput.value;
        renderProductGrid();
    }, 250);
}

// Render product grid (optimized, matching product.js patterns)
function renderProductGrid() {
    const products = getFilteredProducts();

    if (products.length === 0) {
        productGrid.innerHTML = `
      <div class="col-12">
        <div class="text-center text-muted py-5">
          <i class="bi bi-box-seam fs-1 d-block mb-2 opacity-50"></i>
          <span class="small">Không tìm thấy sản phẩm nào</span>
        </div>
      </div>
    `;
        return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row g-2';

    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3';
        col.innerHTML = `
      <div class="product-card" data-id="${product.id}">
        <div class="text-center">
          <div class="product-emoji">${escapeHtml(product.image || product.emoji || '☕')}</div>
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-price">${formatPrice(product.price)}</div>
          <button class="btn btn-primary btn-sm mt-2 add-to-cart-btn" data-id="${product.id}">
            <i class="bi bi-cart-plus me-1"></i> Thêm
          </button>
        </div>
      </div>
    `;
        rowDiv.appendChild(col);
    });

    fragment.appendChild(rowDiv);
    productGrid.innerHTML = '';
    productGrid.appendChild(fragment);

    // Attach event listeners (better than onclick attributes)
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.removeEventListener('click', handleAddToCart);
        btn.addEventListener('click', handleAddToCart);
    });
}

function handleAddToCart(e) {
    const btn = e.currentTarget;
    const productId = document.querySelector(`.product-card[data-id="${btn.dataset.id}"]`)?.dataset.id;
    if (productId) {
        addToCart(parseInt(productId));
    } else {
        showToast('Không tìm thấy sản phẩm', 2000);
    }
    addToCart(productId);
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            emoji: product.image || product.emoji || '☕',
            price: product.price,
            quantity: 1
        });
    }

    renderCart();
    showToast(`✓ Đã thêm ${product.name}`);
}

function renderCart() {
    const cartContainer = cartItems;
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('totalAmount');

    if (state.cart.length === 0) {
        cartContainer.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-cart fs-1 d-block mb-2 opacity-50"></i>
        <span class="small">Chưa có sản phẩm nào</span>
      </div>
    `;
        if (subtotalElement) subtotalElement.textContent = '0đ';
        if (totalElement) totalElement.textContent = '0đ';
        submitBtn.disabled = true;
        clearBtn.disabled = true;
        return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    state.cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
      <div class="cart-item-info" data-id="${item.id}">
        <div class="cart-item-name">${escapeHtml(item.emoji || '')} ${escapeHtml(item.name)}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="btn btn-outline-secondary quantity-btn" data-id="${item.id}" data-delta="-1">
          <i class="bi bi-dash"></i>
        </button>
        <span class="cart-item-quantity">${item.quantity}</span>
        <button class="btn btn-outline-secondary quantity-btn" data-id="${item.id}" data-delta="1">
          <i class="bi bi-plus"></i>
        </button>
        <span class="cart-item-total">${formatPrice(item.price * item.quantity)}</span>
        <button class="cart-item-remove" data-id="${item.id}">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
        fragment.appendChild(div);
    });

    cartContainer.innerHTML = '';
    cartContainer.appendChild(fragment);

    // Attach event listeners for quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.removeEventListener('click', handleQuantityChange);
        btn.addEventListener('click', handleQuantityChange);
    });

    // Attach event listeners for remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.removeEventListener('click', handleRemoveItem);
        btn.addEventListener('click', handleRemoveItem);
    });

    const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
    if (totalElement) totalElement.textContent = formatPrice(subtotal);
    submitBtn.disabled = false;
    clearBtn.disabled = false;
}

function handleQuantityChange(e) {
    const btn = e.currentTarget;
    const productId = document.querySelector(`.cart-item-info[data-id="${btn.dataset.id}"]`)?.dataset.id;
    if (!productId) {
        showToast('Không tìm thấy sản phẩm trong giỏ', 2000);
        return;
    }
    const delta = parseInt(btn.dataset.delta);
    updateQuantity(productId, delta);
}

function handleRemoveItem(e) {
    const btn = e.currentTarget;
    const productId = document.querySelector(`.cart-item-info[data-id="${btn.dataset.id}"]`)?.dataset.id;
    if (!productId) {
        showToast('Không tìm thấy sản phẩm trong giỏ', 2000);
        return;
    }
    removeFromCart(productId);
}

function updateQuantity(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            state.cart = state.cart.filter(i => i.id !== productId);
        }
        renderCart();
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    renderCart();
    showToast('Đã xóa sản phẩm');
}

function clearCart() {
    if (state.cart.length === 0) return;
    if (confirm('Bạn có chắc muốn xóa toàn bộ đơn hàng?')) {
        state.cart = [];
        renderCart();
        showToast('Đã xóa đơn hàng');
    }
}

async function submitOrder() {
    if (state.cart.length === 0) {
        showToast('Vui lòng thêm sản phẩm vào đơn hàng', 2000);
        return;
    }

    // Validate customer name (optional but sanitize)
    const customerName = customerNameInput.value.trim();
    const sanitizedName = customerName ? escapeHtml(customerName) : 'Khách lẻ';

    const orderData = {
        customerName: sanitizedName,
        orderMethod: orderMethodSelect.value,
        paymentMethod: paymentMethodSelect.value,
        items: state.cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
        })),
        total: state.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)
    };

    // Disable submit button to prevent double submission
    submitBtn.disabled = true;
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

    try {
        const response = await fetch('/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (!response.ok || (result.success === false)) {
            throw new Error(result.message || 'Failed to create order');
        }

        const orderId = result.orderId || result.data?.id || 'Mới';
        showToast(`✓ Đơn hàng #${orderId} đã được tạo!`, 3000);

        // Reset cart and form
        state.cart = [];
        customerNameInput.value = '';
        renderCart();

    } catch (error) {
        console.error('Order submission failed:', error);
        showToast(`❌ Lỗi: ${error.message || 'Không thể tạo đơn hàng'}`, 3000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
    }
}

// Helper functions
function formatPrice(price) {
    if (!price && price !== 0) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(msg, delay = 2000) {
    const toastEl = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toastEl || !toastMsg) return;

    toastMsg.textContent = msg;
    const toast = new bootstrap.Toast(toastEl, { delay });
    toast.show();
}

// Event listeners with debouncing (matching product.js pattern)
searchInput.addEventListener('input', handleSearch);

categoryFilter.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    renderProductGrid();
});

submitBtn.addEventListener('click', submitOrder);
clearBtn.addEventListener('click', clearCart);

// Keyboard shortcut: Ctrl+Shift+C to clear cart
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearCart();
    }
});

// Save cart to sessionStorage before page unload (recover from accidental refresh)
window.addEventListener('beforeunload', () => {
    if (state.cart.length > 0) {
        sessionStorage.setItem('pos_cart', JSON.stringify({
            cart: state.cart,
            customerName: customerNameInput.value,
            orderMethod: orderMethodSelect.value,
            paymentMethod: paymentMethodSelect.value
        }));
    }
});

// Restore cart from sessionStorage on page load
function restoreCartFromSession() {
    const saved = sessionStorage.getItem('pos_cart');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.cart && data.cart.length > 0) {
                state.cart = data.cart;
                customerNameInput.value = data.customerName || '';
                if (data.orderMethod) orderMethodSelect.value = data.orderMethod;
                if (data.paymentMethod) paymentMethodSelect.value = data.paymentMethod;
                renderCart();
                showToast('🔄 Đã khôi phục đơn hàng từ phiên trước', 3000);
                sessionStorage.removeItem('pos_cart');
            }
        } catch (e) {
            console.error('Failed to restore cart:', e);
        }
    }
}

// Initialize
async function init() {
    await fetchProducts();
    restoreCartFromSession();
}

init();