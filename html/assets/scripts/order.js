// State
const state = {
  products: [],
  cart: [],
  searchTerm: '',
  selectedCategory: 'all',
  customers: [],
  selectedCustomerId: null
};

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const customerNameInput = document.getElementById('customerName');
const customerList = document.getElementById('customerList');
const customerFeedback = document.getElementById('customerFeedback');
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

// --- CUSTOMER FUNCTIONS (Matching product page pattern) ---

// Setup customer datalist (like setupCategoryAndNameAutocomplete)
async function setupCustomerAutocomplete() {
  try {
    const response = await fetch('/api/v1/customer');
    const result = await response.json();
    
    let customers = [];
    if (result.success) {
      customers = result.data;
    } else if (Array.isArray(result)) {
      customers = result;
    }
    
    state.customers = customers;
    
    // Populate datalist with customer names + phone numbers
    const customerOptions = customers.map(customer => 
      `<option value="${escapeHtml(customer.name)}${customer.phone ? ` (${customer.phone})` : ''}" data-id="${customer.id}" data-phone="${customer.phone || ''}">`
    ).join('');
    
    customerList.innerHTML = customerOptions;
    
    return customers;
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    customerFeedback.textContent = "⚠️ Không thể tải danh sách khách hàng";
    customerFeedback.className = "form-text text-danger";
    return [];
  }
}

// Handle customer selection (like product page name validation)
customerNameInput.addEventListener('input', async function() {
  const name = this.value.trim();
  const selectedOption = Array.from(customerList.options).find(opt => 
    opt.value === name || opt.value.startsWith(name + ' (')
  );
  
  if (selectedOption && selectedOption.dataset.id) {
    // Customer selected from datalist
    state.selectedCustomerId = parseInt(selectedOption.dataset.id);
    customerFeedback.textContent = "✓ Khách hàng đã chọn";
    customerFeedback.className = "form-text text-success";
  } else if (name) {
    // New customer - not in list
    state.selectedCustomerId = null;
    customerFeedback.innerHTML = '<i class="bi bi-person-plus me-1"></i>Khách hàng mới sẽ được tạo khi đặt hàng';
    customerFeedback.className = "form-text text-info";
  } else {
    state.selectedCustomerId = null;
    customerFeedback.textContent = "";
    customerFeedback.className = "form-text";
  }
});

// Create new customer (like submitProduct)
async function createNewCustomer() {
  const name = customerNameInput.value.trim();
  
  if (!name) {
    customerFeedback.textContent = "⚠️ Vui lòng nhập tên khách hàng";
    customerFeedback.className = "form-text text-danger";
    return null;
  }
  
  // Check if customer already exists
  const existing = state.customers.find(c => 
    c.name.toLowerCase() === name.toLowerCase()
  );
  
  if (existing) {
    state.selectedCustomerId = existing.id;
    customerFeedback.textContent = "✓ Khách hàng đã tồn tại";
    customerFeedback.className = "form-text text-success";
    return existing;
  }
  
  // Create new customer
  try {
    const phone = prompt('Nhập số điện thoại (không bắt buộc):');
    
    const response = await fetch('/api/v1/customer/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone: phone || '' })
    });
    
    const result = await response.json();
    
    if (response.ok && (result.success || result.customer)) {
      const newCustomer = result.customer || result.data;
      state.customers.push(newCustomer);
      state.selectedCustomerId = newCustomer.id;
      
      // Update datalist
      customerList.innerHTML += `<option value="${escapeHtml(newCustomer.name)}${newCustomer.phone ? ` (${newCustomer.phone})` : ''}" data-id="${newCustomer.id}" data-phone="${newCustomer.phone || ''}">`;
      
      customerFeedback.textContent = "✓ Đã tạo khách hàng mới";
      customerFeedback.className = "form-text text-success";
      
      showToast(`✓ Đã tạo khách hàng: ${name}`);
      return newCustomer;
    } else {
      throw new Error(result.error || 'Failed to create customer');
    }
  } catch (error) {
    console.error('Failed to create customer:', error);
    customerFeedback.textContent = `⚠️ ${error.message}`;
    customerFeedback.className = "form-text text-danger";
    return null;
  }
}

// --- PRODUCT FUNCTIONS ---

// Fetch products from API
async function fetchProducts(retryCount = 0) {
  const MAX_RETRIES = 2;
  
  showLoadingState(true, 'productGrid');

  try {
    const response = await fetch('/api/v1/products');
    const result = await response.json();
    
    let products = Array.isArray(result) ? result : (result.success ? result.data : []);
    
    if (!products.length && result.success === false) {
      throw new Error(result.message || "Không thể tải dữ liệu");
    }

    state.products = products;
    await renderProductGrid();
    await loadCategories();
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchProducts(retryCount + 1);
    }
    
    console.error("Failed to fetch products:", error);
    showToast("⚠️ Không thể tải sản phẩm! Vui lòng thử lại.");
    
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-wifi-off fs-2 d-block mb-2 text-muted"></i>
          <span class="text-muted small">Không thể kết nối. Vui lòng tải lại trang.</span>
        </div>
      `;
    }
  } finally {
    showLoadingState(false, 'productGrid');
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/v1/products/category');
    const result = await response.json();
    
    let categories = [];
    if (result.success) {
      categories = result.data;
    } else if (Array.isArray(result)) {
      categories = result;
    }
    
    categoryFilter.innerHTML = '<option value="all">📂 Tất cả danh mục</option>' +
      categories.map(cat => `<option value="${cat.id}">${cat.emoji || '📁'} ${escapeHtml(cat.name)}</option>`).join('');
      
  } catch (error) {
    console.error("Failed to load categories:", error);
    categoryFilter.innerHTML = '<option value="all">📂 Tất cả danh mục</option>';
  }
}

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
  
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.removeEventListener('click', handleAddToCart);
    btn.addEventListener('click', handleAddToCart);
  });
}

function handleAddToCart(e) {
  const btn = e.currentTarget;
  const productId = document.querySelector(`.product-card[data-id="${btn.dataset.id}"]`)?.dataset.id;
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
  
  const fragment = document.createDocumentFragment();
  
  state.cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
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
  
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.removeEventListener('click', handleQuantityChange);
    btn.addEventListener('click', handleQuantityChange);
  });
  
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
  const productId = document.querySelector(`.cart-item-remove[data-id="${btn.dataset.id}"]`)?.dataset.id;
  const delta = parseInt(btn.dataset.delta);
  updateQuantity(productId, delta);
}

function handleRemoveItem(e) {
  const btn = e.currentTarget;
  const productId = document.querySelector(`.cart-item-remove[data-id="${btn.dataset.id}"]`)?.dataset.id;
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

// --- SUBMIT ORDER ---
async function submitOrder() {
  if (state.cart.length === 0) {
    showToast('Vui lòng thêm sản phẩm vào đơn hàng', 2000);
    return;
  }
  
  const customerName = customerNameInput.value.trim();
  const sanitizedName = customerName ? escapeHtml(customerName) : 'Khách lẻ';
  
  // Get or create customer
  let customerId = state.selectedCustomerId;
  
  if (customerName && !customerId) {
    // Customer not selected from list - create new
    const newCustomer = await createNewCustomer();
    if (newCustomer) {
      customerId = newCustomer.id;
    }
  }
  
  const orderData = {
    customerId: customerId || null,
    customerName: sanitizedName,
    orderMethod: orderMethodSelect.value,
    paymentMethod: paymentMethodSelect.value,
    items: state.cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price
    })),
    total: state.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    userId: window.currentUser?.id || null
  };
  
  // Disable submit button
  submitBtn.disabled = true;
  const originalBtnHTML = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
  
  try {
    const response = await fetch('/api/v1/order/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (!response.ok || (result.success === false)) {
      throw new Error(result.message || result.error || 'Failed to create order');
    }
    
    const orderId = result.orderId || result.data?.id || 'Mới';
    const customerInfo = customerId ? ` cho khách hàng #${customerId}` : '';
    showToast(`✓ Đơn hàng #${orderId}${customerInfo} đã được tạo!`, 3000);
    
    // Reset cart and form
    state.cart = [];
    customerNameInput.value = '';
    state.selectedCustomerId = null;
    customerFeedback.textContent = '';
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
  return str.replace(/[&<>]/g, function(m) {
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

// Event listeners
let searchTimeout = null;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchTerm = e.target.value;
    renderProductGrid();
  }, 250);
});

categoryFilter.addEventListener('change', (e) => {
  state.selectedCategory = e.target.value;
  renderProductGrid();
});

submitBtn.addEventListener('click', submitOrder);
clearBtn.addEventListener('click', clearCart);

// Initialize
async function init() {
  await fetchProducts();
  await setupCustomerAutocomplete();
}

init();