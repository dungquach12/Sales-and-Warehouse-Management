// Global state management for product page
let isInitialLoad = true;

const state = {
  isActive: true,
  products: [],
  sortBy: null,
  sortArc: true,
  deleteTargetId: null,
  chosenProduct: null,
};

let nameCheckTimeout = null;
let searchTimeout = null;
let renderAbortController = null;

// Active/Inactive Tab Switching
document.getElementById("statusFilter").addEventListener("click", function (e) {
    const clickedBtn = e.target.closest(
        ".product-status-btn, .product-status-btn-disabled",
    );
    if (!clickedBtn || clickedBtn.classList.contains("product-status-btn")) return;

    state.isActive = clickedBtn.id === "activedProduct";

    document
        .getElementById("statusFilter")
        .querySelectorAll("button")
        .forEach((btn) => {
            btn.classList.toggle("product-status-btn");
            btn.classList.toggle("product-status-btn-disabled");
        });

    asyncRenderTable(state.isActive);
    
    document.getElementById("checkAll").checked = false;
    document.getElementById("bulkBar").classList.add("d-none");
});


// Autocomplete & Name validation
async function setupCategoryAndNameAutocomplete(products) {
    try {   
        const categorySelect = document.getElementById("categorySelect");
        const nameList = document.getElementById("nameList");

        // 1. Wait for the API response
        const res = await fetch(`/api/v1/products/category`);
        const result = await res.json();
        
        let cats = [];
        if (result.success) {
            cats = result.data;
        } else {
            console.error("Failed to fetch categories:", result.message);
        }

        // 2. Create the Map
        const categoryMap = new Map(cats.map(c => [c.id, c.name]));

        // 3. Render Category Options
        let categoryHtml = `<option value="" disabled selected>-- Chọn danh mục --</option>`;
        
        const sortedCategories = [...categoryMap.entries()].sort((a, b) => 
            a[1].localeCompare(b[1])
        );

        categoryHtml += sortedCategories
            .map(([id, name]) => `<option value="${id}">${name}</option>`)
            .join("");

        categorySelect.innerHTML = categoryHtml;

        // 4. Handle Name Autocomplete (Datalist)
        const uniqueNames = [...new Set(products.map((p) => p.name))].filter(n => n).sort();
        nameList.innerHTML = uniqueNames.map((name) => `<option value="${name}">`).join("");

    } catch (error) {
        console.error("Unexpected error in setup:", error);
    }
}

// Check name for add/edit product
document.getElementById("inputName").addEventListener("input", async function () {
    const name = this.value.trim();
    const saveBtn = document.getElementById("saveBtn");
    const feedback = document.getElementById("nameFeedback");

    const currentId = document.getElementById("productId").value;

    clearTimeout(nameCheckTimeout);

    if (!name) {
        feedback.textContent = "";
        feedback.className = "form-text";
        saveBtn.disabled = false;
        return;
    }

    nameCheckTimeout = setTimeout(async () => {
        try {
            const res = await fetch(
                `/api/v1/products/check-name?name=${encodeURIComponent(name)}`,
            );
            const result = await res.json();
            const isSelf = currentId && state.chosenProduct?.name?.toLowerCase() === name.toLowerCase();

            if (result.exists && isSelf) {
                feedback.textContent = "✓ Tên hợp lệ";
                feedback.className = "form-text text-success";
                saveBtn.disabled = false;
            } else if (result.exists && result.is_active === false) {
                feedback.textContent = "⚠️ Mặt hàng này đã bị lưu trữ — bạn có muốn khôi phục không?";
                feedback.className = "form-text text-warning";
                saveBtn.disabled = true;
            } else if (result.exists) {
                feedback.textContent = "✗ Mặt hàng này đã tồn tại";
                feedback.className = "form-text text-danger";
                saveBtn.disabled = true;
            } else {
                feedback.textContent = "✓ Tên hợp lệ";
                feedback.className = "form-text text-success";
                saveBtn.disabled = false;
            }
        } catch (error) {
            console.error("Name check failed:", error);
        }
    }, 500);
});


// ----------------------------------------------
// Auto change product display from table to card when screen get smaller
const mobileQuery = window.matchMedia("(max-width: 768px)");

async function getPreferredView(e, filteredProducts = null) {
    if (isInitialLoad && state.products.length === 0) {
        await asyncRenderTable();
        isInitialLoad = false;
        return;
    }

    if (e.matches) {
        renderCards(filteredProducts);
    } else {
        renderTable(filteredProducts);
    }
}

mobileQuery.addEventListener("change", getPreferredView);
getPreferredView(mobileQuery);

// -----------------------------------------------
// Table rendering & Sorting
async function asyncRenderTable(is_active = true) {
    if (renderAbortController) {
        renderAbortController.abort();
        renderAbortController = null;
    }
    renderAbortController = new AbortController();

    try {
        const res = await fetch(`/api/v1/products/${is_active ? "" : "inactive"}`, { signal: renderAbortController.signal });
        const result = await res.json();
        if (!result.success) {
            showToast(result.message || "Không thể tải dữ liệu");
            return;
        }

        state.products = result.data;
        state.isActive = is_active;
        getPreferredView(mobileQuery);
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Previous render aborted");
        } else {
            console.error("Failed to fetch products:", error);
            showToast("⚠️ Không thể tải mặt hàng! Vui lòng thử lại.");
        }
    }
}


function renderTable(filteredProducts = null) {
    const products = filteredProducts || [...state.products];

    // Sorting
    if (state.sortBy) {
        products.sort((a, b) => {
            let valueA, valueB;
            if (state.sortBy === "Category.name") {
                valueA = a.Category?.name || "";
                valueB = b.Category?.name || "";
            } else {
                valueA = ["price", "cost", "profit"].includes(state.sortBy) ? Number(a[state.sortBy]) || 0 : (a[state.sortBy] || "");
                valueB = ["price", "cost", "profit"].includes(state.sortBy) ? Number(b[state.sortBy]) || 0 : (b[state.sortBy] || "");
            }
            return state.sortArc ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
    }

    const tbody = document.getElementById("productTable");

    // Handle empty state
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
            <i class="bi bi-box-seam fs-2 d-block mb-2"></i> Không tìm thấy mặt hàng nào
        </td></tr>`;
        updateStats([]);
        return;
    }

    // Render Rows
    tbody.innerHTML = products.map((p) => {
        const price = Number(p.price);
        const cost = Number(p.cost) || 0;
        const profit = cost ? Math.round(((price - cost) / price) * 100) : null;

        const actionIcon = state.isActive ? 'bi-archive' : 'bi-arrow-counterclockwise';
        const actionTooltip = state.isActive ? 'Lưu vào kho' : 'Khôi phục mặt hàng';

        return `
            <tr data-id="${p.id}">
                <td class="ps-3"><input type="checkbox" class="form-check-input row-check fs-5" data-id="${p.id}" /></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span style="font-size:1.3rem;">${p.image || "🍵"}</span>
                        <span class="fw-semibold">${p.name}</span>
                    </div>
                </td>
                <td category-id="${p.Category?.id || "—"}"><span class="badge bg-secondary bg-opacity-10 text-secondary fw-normal">${p.Category?.name || "—"}</span></td>
                <td class="fw-bold text-warning">${price.toLocaleString("vi-VN")}đ</td>
                <td class="text-muted">${cost ? cost.toLocaleString("vi-VN") + "đ" : "—"}</td>
                <td>
                    ${profit !== null
                ? `<span class="badge ${profit >= 40 ? "bg-success text-success" : profit >= 20 ? "bg-warning text-warning" : "bg-danger text-danger"} bg-opacity-10 fw-normal">${profit}%</span>`
                : "—"}
                </td>
                <td>
                    <div class="d-flex gap-1 justify-content-end pe-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditProductModal('${p.id}')" title="Chỉnh sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="openArchiveModal('${p.id}')" title="${actionTooltip}">
                            <i class="bi ${actionIcon}"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join("");

    updateStats(products);
}

// For smaller screens, render cards instead of table rows (optional enhancement)
function renderCards(filteredProducts = null) {
    const products = filteredProducts || [...state.products];

    const container = document.getElementById("productContainer");

    // Handle empty state
    if (products.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-5">
            <i class="bi bi-box-seam fs-2 d-block mb-2"></i> Không tìm thấy mặt hàng nào
        </div>`;
        return;
    }

    container.innerHTML = products.map((p) => {
        const price = Number(p.price);
        const cost = Number(p.cost) || 0;
        const profit = cost ? Math.round(((price - cost) / price) * 100) : null;

        return `
            <div class="card mb-3" data-id="${p.id}">
                <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-2">
                        <span style="font-size:1.5rem;">${p.image || "🍵"}</span>
                        <div>
                            <h5 class="card-title mb-1">${p.name}</h5>
                            <p class="card-text mb-0"><span class="badge bg-secondary bg-opacity-10 text-secondary fw-normal">${p.Category?.name || "—"}</span></p>
                        </div>
                    </div>
                    <p class="card-text mb-1 fw-bold text-warning">Giá: ${price.toLocaleString("vi-VN")}đ</p>
                    <p class="card-text mb-1 text-muted">Chi phí: ${cost ? cost.toLocaleString("vi-VN") + "đ" : "—"}</p>
                    <p class="card-text mb-2">
                        ${profit !== null
                ? `<span class="badge ${profit >= 40 ? "bg-success text-success" : profit >= 20 ? "bg-warning text-warning" : "bg-danger text-danger"} bg-opacity-10 fw-normal">${profit}%</span>`
                : "—"}
                    </p>
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditProductModal('${p.id}')" title="Chỉnh sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="openArchiveModal('${p.id}')" title="${state.isActive ? 'Lưu vào kho' : 'Khôi phục mặt hàng'}">
                            <i class="bi ${state.isActive ? 'bi-archive' : 'bi-arrow-counterclockwise'}"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join("");
}   


function handleSort(classSortBy) {
    let sortBy = classSortBy === "category" ? "Category.name" : classSortBy;

    document.querySelectorAll('[id$="SortBtn"] i').forEach((i) => {
        i.className = "bi bi-filter";
    });

    if (state.sortBy === sortBy) {
        state.sortArc = !state.sortArc;
    } else {
        state.sortBy = sortBy;
        state.sortArc = true;
    }

    const btnId = `${classSortBy.replace(".", "")}SortBtn`;
    const icon = document.getElementById(btnId).querySelector("i");
    icon.className = state.sortArc ? "bi bi-sort-up" : "bi bi-sort-down";

    getPreferredView(mobileQuery);
}


document.getElementById("nameSortBtn").addEventListener("click", () => handleSort("name"));
document.getElementById("categorySortBtn").addEventListener("click", () => handleSort("category"));
document.getElementById("priceSortBtn").addEventListener("click", () => handleSort("price"));
document.getElementById("costSortBtn").addEventListener("click", () => handleSort("cost"));
document.getElementById("profitSortBtn").addEventListener("click", () => handleSort("profit"));


// Stats calculation & display
function updateStats(products = []) {
    const categories = [...new Set(products.map((p) => p.Category?.name))].filter((c) => c);
    const prices = products.map((p) => Number(p.price) || 0).filter((price) => price > 0);

    document.getElementById("statTotal").textContent = products.length;
    document.getElementById("statCategories").textContent = categories.length;

    if (prices.length > 0) {
        const max = prices.reduce((a, b) => a > b ? a : b, 0);
        const min = prices.reduce((a, b) => a < b ? a : b, Infinity);
        document.getElementById("statMaxPrice").textContent = `${max.toLocaleString("vi-VN")}đ`;
        document.getElementById("statMinPrice").textContent = `${min.toLocaleString("vi-VN")}đ`;
    } else {
        document.getElementById("statMaxPrice").textContent = "0đ";
        document.getElementById("statMinPrice").textContent = "0đ";
    }
}


// Add & Edit Modal Preparation
async function openAddProductModal() {
    await setupCategoryAndNameAutocomplete(state.products);

    document.getElementById("productId").value = "";
    document.getElementById("modalTitle").textContent = "Thêm mặt hàng";
    document.getElementById("inputName").value = "";
    document.getElementById("categorySelect").value = "";
    document.getElementById("inputPrice").value = "";
    document.getElementById("inputCost").value = "";
    document.getElementById("inputImage").value = "";

    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();
}


function openAddCategoryModal() {
    document.getElementById("modalTitle").textContent = "Thêm danh mục";
    document.getElementById("inputName").value = "";

    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    modal.show();
}


async function openEditProductModal(id) {
    state.chosenProduct = state.products.find((p) => p.id === id);
    if (!state.chosenProduct) return;

    await setupCategoryAndNameAutocomplete(state.products);

    document.getElementById("modalTitle").textContent = "Chỉnh sửa mặt hàng";
    document.getElementById("productId").value = id;
    document.getElementById("inputName").value = state.chosenProduct.name;
    
    document.getElementById("categorySelect").value = state.chosenProduct.Category?.id || "";
    
    document.getElementById("inputPrice").value = state.chosenProduct.price || "";
    document.getElementById("inputCost").value = state.chosenProduct.cost || "";
    document.getElementById("inputImage").value = state.chosenProduct.image || "";

    bootstrap.Modal.getOrCreateInstance(document.getElementById("productModal")).show();
}


async function submitProduct() {
    const id = document.getElementById("productId").value;
    const productName = document.getElementById("inputName").value.trim();
    const price = Number(document.getElementById("inputPrice").value);
    const cost = Number(document.getElementById("inputCost").value) || 0;

    if (!productName) {
        showToast("⚠️ Vui lòng nhập tên mặt hàng");
        return;
    }
    if (isNaN(price) || price <= 0) {
        showToast("⚠️ Vui lòng nhập giá hợp lệ");
        return;
    }

    if (isNaN(cost) || cost < 0) {
        showToast("⚠️ Vui lòng nhập giá vốn hợp lệ");
        return;
    }

    const data = {
        name: productName,
        category_id: document.getElementById("categorySelect").value || null,
        price,
        cost,
        image: document.getElementById("inputImage").value.trim() || "🍵",
    };

    try {
        const url = id ? `/api/v1/products/edit/${id}` : `/api/v1/products/create`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(id ? "✓ Đã cập nhật mặt hàng" : "✓ Đã tạo mặt hàng");
            const modalElem = document.getElementById("productModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElem);
            if (modalInstance) modalInstance.hide();
            
            asyncRenderTable(state.isActive);
        } else {
            throw new Error(result.message || "Lỗi từ server");
        }
    } catch (error) {
        console.error("Error saving product:", error);
        showToast("⚠️ " + error.message);
    }
}


// ARCHIVE/UNARCHIVE OPERATIONS
function openArchiveModal(id) {
    const modalTitle = document.getElementById('archiveModalTitle');
    const modalIcon = document.getElementById('archiveModalIcon');
    const confirmBtn = document.getElementById('confirmArchiveBtn');
    
    document.getElementById('archiveProductId').value = id;
    const product = state.products.find((p) => p.id === id);
    document.getElementById('archiveProductNameDisplay').innerText = product?.name || "";

    if (state.isActive) {
        modalTitle.innerText = "Lưu vào kho mặt hàng?";
        modalIcon.className = "bi bi-archive text-warning fs-1 d-block mb-3";
        confirmBtn.className = "btn btn-warning fw-bold";
        confirmBtn.innerHTML = '<i class="bi bi-archive me-1"></i> Lưu vào kho';
    } else {
        modalTitle.innerText = "Khôi phục mặt hàng này?";
        modalIcon.className = "bi bi-arrow-counterclockwise text-primary fs-1 d-block mb-3";
        confirmBtn.className = "btn btn-primary fw-bold";
        confirmBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-1"></i> Khôi phục';
    }
    
    const modalElem = document.getElementById('archiveModal');
    bootstrap.Modal.getOrCreateInstance(modalElem).show();
}


async function handleArchiveToggle() {
    const id = document.getElementById("archiveProductId").value;
    const action = state.isActive ? 'archive' : 'unarchive';
    const successMsg = state.isActive ? "✓ Đã lưu vào kho" : "✓ Đã khôi phục mặt hàng";

    try {
        const res = await fetch(`/api/v1/products/${action}/${id}`, { method: "POST" });
        const result = await res.json();
        
        if (result.success) {
            showToast(successMsg);
            const modalElem = document.getElementById("archiveModal");
            bootstrap.Modal.getInstance(modalElem).hide();
            asyncRenderTable(state.isActive);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error(`Error during ${action}:`, error);
        showToast(`⚠️ Thao tác thất bại! Lý do: ${error.message || "Lỗi kết nối"}`);
    }
}

// BULK OPERATIONS (Check All, Delete)
document.getElementById('checkAll').addEventListener('change', function () {
    const isChecked = this.checked;
    document.querySelectorAll('.row-check').forEach(cb => {
        cb.checked = isChecked;
    });
    updateBulkBar();
});

// Update bulk delete bar visibility and count number of selected items
function updateBulkBar() {
    const checked = document.querySelectorAll(".row-check:checked");
    document.getElementById("selectedCount").textContent = checked.length;
    document.getElementById("bulkBar").classList.toggle("d-none", checked.length === 0);
}

function openBulkDeleteModal() {
    const modal = new bootstrap.Modal(document.getElementById("bulkDeleteModal"));
    modal.show();
}

async function handleDeleteProduct() {
    const ids = [...document.querySelectorAll(".row-check:checked")].map(cb => cb.dataset.id);
    if (!ids.length) return;
    try {
        const res = await fetch("/api/v1/products/delete/bulk", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        showToast(`✓ Đã xóa ${ids.length} mặt hàng`);
        await asyncRenderTable(state.isActive);
    } catch (error) {
        showToast(`⚠️ Xóa thất bại! Lý do: ${error.message || "Lỗi kết nối"}`);
    } finally {
        document.getElementById("checkAll").checked = false;
        document.getElementById("bulkBar").classList.add("d-none");
        bootstrap.Modal.getInstance(document.getElementById("bulkDeleteModal")).hide();
    }
}


// -----------------------------------------------------
// SEARCH FUNCTIONALITY
function filterTable() {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        const query = document.getElementById("searchInput").value.toLowerCase().trim();
        
        const filtered = !query 
            ? [...state.products] 
            : state.products.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(query);
                const categoryMatch = p.Category?.name?.toLowerCase().includes(query);
                return nameMatch || categoryMatch;
            });

        getPreferredView(mobileQuery, filtered);
    }, 250);
}

document.getElementById("searchInput").addEventListener("input", filterTable);


// -----------------------------------------------------
// UI UTILITIES
function showToast(msg, time = 2000) {
    document.getElementById("toastMsg").textContent = msg;
    new bootstrap.Toast(document.getElementById("toast"), { delay: time }).show();
}


// -----------------------------------------------------
// INIT
asyncRenderTable();
document.getElementById("productTable").addEventListener("change", (e) => {
    if (e.target.classList.contains("row-check")) updateBulkBar();
});
