// State management
const state = {
    orders: [],
}

let isLoading = false;

// ------------------------------------------------
// HELPER FUNCTIONS
function orderTotal(order) {
    if (!order) return 0;
    
    // Use total_price from backend
    if (order.total_price) {
        return parseFloat(order.total_price);
    }
    
    // Fallback to calculate from items
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        return order.items.reduce((sum, item) => {
            const price = item.price || 0;
            const qty = item.qty || 1;
            return sum + (price * qty);
        }, 0);
    }
    
    return 0;
}

function orderProfit(order) {
    if (!order) return 0;
    
    // Check if order has total_profit (from backend)
    if (order.total_profit !== undefined && order.total_profit !== null) {
        return parseFloat(order.total_profit);
    }
    
    // Check if items have profit field (from backend)
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        const hasProfitField = order.items.some(item => item.profit !== undefined);
        if (hasProfitField) {
            return order.items.reduce((sum, item) => {
                return sum + (item.profit || 0);
            }, 0);
        }
    }
    
    // Fallback: calculate profit from total (40% margin)
    const total = orderTotal(order);
    return Math.round(total * 0.4);
}

// Make functions global for other scripts
window.orderTotal = orderTotal;
window.orderProfit = orderProfit;

// ------------------------------------------------
// Fetch data
async function fetchData(period, retryCount = 0) {
    const MAX_RETRIES = 3;
    
    if (isLoading) return;
    
    isLoading = true;
    showLoadingState?.(true, "reportContainer");
    
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const res = await fetch(`/api/v1/report?period=${period}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (res.status === 401) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const result = await res.json();
        state.orders = result.orders || [];
        return state.orders;
        
    } catch (err) {
        console.error('Error fetching report data:', err);
        
        // Retry logic
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchData(period, retryCount + 1);
        }
        
        // Show user-friendly error
        const errorContainer = document.getElementById('reportError');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Không thể tải dữ liệu. Vui lòng thử lại sau.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
        
        return [];
    } finally {
        isLoading = false;
        showLoadingState?.(false, "reportContainer");
    }
}

// ------------------------------------------------
// RENDER FUNCTIONS
async function renderAll(period) {
    try {
        await fetchData(period);
        const orders = state.orders;
        
        // Empty state handling
        if (orders.length === 0) {
            const container = document.getElementById('reportContainer');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-inbox display-1 text-muted"></i>
                        <h5 class="mt-3 text-muted">Chưa có dữ liệu</h5>
                        <p class="text-muted small">Không có đơn hàng nào trong khoảng thời gian này</p>
                    </div>
                `;
            }
            return;
        }

        // Calculate stats
        const revenue = orders.reduce((s, o) => s + orderTotal(o), 0);
        const profit = orders.reduce((s, o) => s + orderProfit(o), 0);
        const avg = orders.length ? Math.round(revenue / orders.length) : 0;
        const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
        
        // Update DOM
        const statRevenue = document.getElementById('statRevenue');
        const statOrders = document.getElementById('statOrders');
        const statAvg = document.getElementById('statAvg');
        const statProfit = document.getElementById('statProfit');
        
        if (statRevenue) statRevenue.textContent = revenue.toLocaleString('vi-VN') + 'đ';
        if (statOrders) statOrders.textContent = orders.length;
        if (statAvg) statAvg.textContent = avg.toLocaleString('vi-VN') + 'đ';
        if (statProfit) statProfit.textContent = profit.toLocaleString('vi-VN') + 'đ';
        
        // Optional: Display profit margin if element exists
        const statMargin = document.getElementById('statProfitMargin');
        if (statMargin) statMargin.textContent = profitMargin + '%';
        
        // Render charts
        renderChart(orders, period);
        renderPaymentSplit(orders);
        renderTopProducts(orders);
        renderRecentOrders(orders);
        
    } catch (err) {
        console.error('Error in renderAll:', err);
    }
}

// Revenue chart
function renderChart(orders, period) {
    const chart = document.getElementById('revenueChart');
    if (!chart) return;

    // Group by hour
    const hours = {};
    for (let h = 0; h <= 23; h++) hours[h] = 0;
    
    orders.forEach(o => {
        let hour = new Date().getHours();
        if (o.createdAt) {
            hour = new Date(o.createdAt).getHours();
        }
        hours[hour] = (hours[hour] || 0) + orderTotal(o);
    });

    const vals = Object.values(hours);
    const max = Math.max(...vals) || 1;
    const colors = ['#198754', '#0d6efd', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1'];

    chart.innerHTML = Object.entries(hours).map(([h, v], i) => {
        const pct = Math.round((v / max) * 100);
        const color = colors[i % colors.length];
        return `
            <div class="chart-bar-col">
                <div class="chart-bar-val">${v > 0 ? (v / 1000).toFixed(0) + 'k' : ''}</div>
                <div class="chart-bar" style="height:${Math.max(pct, 2)}%; background:${color}; opacity:${v > 0 ? 1 : 0.15};"
                    title="${h}:00 — ${v.toLocaleString('vi-VN')}đ"></div>
                <div class="chart-bar-label">${h}h</div>
            </div>`;
    }).join('');
}

// Payment split 
function renderPaymentSplit(orders) {
    const cash = orders.filter(o => o.payment_method === 'Tiền mặt').reduce((s, o) => s + orderTotal(o), 0);
    const transfer = orders.filter(o => o.payment_method === 'Chuyển khoản').reduce((s, o) => s + orderTotal(o), 0);
    const total = cash + transfer || 1;

    const cashAmount = document.getElementById('cashAmount');
    const transferAmount = document.getElementById('transferAmount');
    const cashBar = document.getElementById('cashBar');
    const transferBar = document.getElementById('transferBar');
    
    // Add defensive checks
    if (!cashAmount || !transferAmount || !cashBar || !transferBar) {
        console.warn('Payment split elements not found');
        return;
    }

    if (cashAmount) cashAmount.textContent = cash.toLocaleString('vi-VN') + 'đ';
    if (transferAmount) transferAmount.textContent = transfer.toLocaleString('vi-VN') + 'đ';
    if (cashBar) cashBar.style.width = Math.round((cash / total) * 100) + '%';
    if (transferBar) transferBar.style.width = Math.round((transfer / total) * 100) + '%';

    const dineInCount = orders.filter(o => o.order_method === 'Tại chỗ').length;
    const takeawayCount = orders.filter(o => o.order_method === 'Mang đi').length;
    const deliveryCount = orders.filter(o => o.order_method === 'Giao hàng').length;
    
    const dineInEl = document.getElementById('dineInCount');
    const takeawayEl = document.getElementById('takeawayCount');
    const deliveryEl = document.getElementById('deliveryCount');
    
    if (dineInEl) dineInEl.textContent = dineInCount + ' đơn';
    if (takeawayEl) takeawayEl.textContent = takeawayCount + ' đơn';
    if (deliveryEl) deliveryEl.textContent = deliveryCount + ' đơn';
}

// Top products
function renderTopProducts(orders) {
    const counts = {};
    orders.forEach(o => {
        if (o.items && Array.isArray(o.items)) {
            o.items.forEach(i => {
                const name = i.name;
                const qty = i.qty || 1;
                counts[name] = (counts[name] || 0) + qty;
            });
        }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] || 1;
    const colors = ['#ffc107', '#198754', '#0d6efd', '#dc3545', '#6f42c1'];
    const container = document.getElementById('topProducts');
    
    if (!container) return;
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">Chưa có dữ liệu</div>';
        return;
    }
    
    container.innerHTML = sorted.map(([name, qty], i) => `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">${i + 1}. ${name}</span>
                <span class="small text-muted">${qty} ly</span>
            </div>
            <div class="top-item-bar" style="width:${Math.round((qty / max) * 100)}%; background:${colors[i]}; height: 6px; border-radius: 3px;"></div>
        </div>
    `).join('');
}

// Recent orders with modal details
function renderRecentOrders(orders) {
    const recent = [...orders].reverse().slice(0, 8);
    const tbody = document.getElementById('recentOrders');
    
    if (!tbody) return;
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có đơn hàng</td></tr>';
        return;
    }
    
    tbody.innerHTML = recent.map(o => {
        const total = orderTotal(o);
        const itemSummary = o.items && o.items.length ? 
            o.items.map(i => `${i.name}${i.qty > 1 ? ' x' + i.qty : ''}`).join(', ') : '—';
        const payBadge = o.payment_method === 'Tiền mặt'
            ? 'bg-success bg-opacity-10 text-success'
            : 'bg-primary bg-opacity-10 text-primary';
        const date = o.createdAt ? new Date(o.createdAt) : new Date();
        
        // Escape the JSON for data attribute
        const orderJson = JSON.stringify(o).replace(/'/g, "&#39;").replace(/"/g, '&quot;');
        
        return `
            <tr data-order='${orderJson}' style="cursor: pointer;">
                <td class="text-muted small">${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="small">${o.customer_name || '<span class="text-muted">—</span>'}</td>
                <td class="small text-muted d-none d-md-block" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemSummary}</td>
                <td class="small fw-bold text-warning">${total.toLocaleString('vi-VN')}đ</td>
                <td><span class="badge order-badge ${payBadge}">${o.payment_method === 'Tiền mặt' ? 'TM' : 'CK'}</span></td>
            </tr>
        `;
    }).join('');
    
    // Attach click handlers
    attachOrderRowListeners();
}

function attachOrderRowListeners() {
    const rows = document.querySelectorAll('#recentOrders tr');
    rows.forEach(row => {
        row.removeEventListener('click', handleRecentOrderClick);
        row.addEventListener('click', handleRecentOrderClick);
    });
}

function handleRecentOrderClick(e) {
    // Don't trigger if clicking on the badge
    if (e.target.closest('.badge')) return;
    
    const row = e.currentTarget;
    const orderData = row.getAttribute('data-order');
    
    if (orderData) {
        try {
            // Decode the HTML entities first
            const decoded = orderData.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            const order = JSON.parse(decoded);
            showOrderDetails(order);
            
            const modalEl = document.getElementById('detailOrderModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } catch (err) {
            console.error('Error parsing order:', err);
        }
    }
}

// Create modal instance variable outside the function
function showOrderDetails(order) {
    // Format date
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const formattedDate = orderDate.toLocaleDateString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Set basic info
    document.getElementById('orderDate').textContent = formattedDate;
    document.getElementById('orderCustomer').textContent = order.customer_name || 'Khách vãng lai';
    
    // Payment method with icon
    const paymentHtml = order.payment_method === 'Tiền mặt' 
        ? '<i class="bi bi-cash me-1"></i> Tiền mặt'
        : '<i class="bi bi-bank2 me-1"></i> Chuyển khoản';
    document.getElementById('orderPayment').innerHTML = paymentHtml;
    
    // Order method with icon
    let methodHtml = '';
    if (order.order_method === 'Tại chỗ') {
        methodHtml = '<i class="bi bi-cup-straw me-1"></i> Tại chỗ';
    } else if (order.order_method === 'Mang đi') {
        methodHtml = '<i class="bi bi-bag me-1"></i> Mang đi';
    } else {
        methodHtml = '<i class="bi bi-truck me-1"></i> Giao hàng';
    }
    document.getElementById('orderMethod').innerHTML = methodHtml;
    
    // Check if profit data exists
    const hasProfit = order.items && order.items.some(i => i.profit !== undefined);
    
    // Show/hide profit columns
    const profitHeader = document.getElementById('profitHeader');
    const profitRow = document.getElementById('profitRow');
    if (profitHeader && profitRow) {
        profitHeader.style.display = hasProfit ? 'table-cell' : 'none';
        profitRow.style.display = hasProfit ? 'flex' : 'none';
    }
    
    // Calculate totals
    const total = orderTotal(order);
    const profit = orderProfit(order);
    const subtotal = total;
    
    // Set totals
    document.getElementById('orderSubtotal').textContent = subtotal.toLocaleString('vi-VN') + 'đ';
    document.getElementById('orderProfit').textContent = profit.toLocaleString('vi-VN') + 'đ';
    document.getElementById('orderTotal').textContent = total.toLocaleString('vi-VN') + 'đ';
    
    // Render items
    const tbody = document.getElementById('orderItems');
    if (!order.items || order.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có sản phẩm</td></tr>';
    } else {
        tbody.innerHTML = order.items.map(item => {
            const itemTotal = (item.price || 0) * (item.qty || 1);
            return `
                <tr>
                    <td class="fw-semibold">${item.name}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-end">${(item.price || 0).toLocaleString('vi-VN')}đ</td>
                    ${hasProfit ? `<td class="text-end text-success">${item.profit ? item.profit.toLocaleString('vi-VN') + 'đ' : '—'}</td>` : ''}
                    <td class="text-end fw-semibold">${itemTotal.toLocaleString('vi-VN')}đ</td>
                </tr>
            `;
        }).join('');
    }
    
    const modalEl = document.getElementById('detailOrderModal');
    
    modalEl.addEventListener('hidden.bs.modal', () => {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
    }, { once: true });

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

// Period toggle 
let periodToggleTimeout = null;

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        // Clear previous timeout
        if (periodToggleTimeout) clearTimeout(periodToggleTimeout);
        
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const period = btn.dataset.period;
        const labels = { today: 'Hôm nay', week: '7 ngày qua', month: '30 ngày qua' };
        const subtitle = document.getElementById('chartSubtitle');
        if (subtitle) subtitle.textContent = labels[period];
        
        // Debounce rapid clicks
        periodToggleTimeout = setTimeout(async () => {
            await renderAll(period);
        }, 300);
    });
});

// ------------------------------------------------
// INIT
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderAll('today');
    });
} else {
    renderAll('today');
}