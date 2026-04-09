// Global state management for product page
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


// Active/Inactive Tab Switching
document.getElementById("statusFilter").addEventListener("click", function (e) {
    const clickedBtn = e.target.closest(
        ".product-status-btn, .product-status-btn-disabled",
    );
    if (!clickedBtn || clickedBtn.classList.contains("product-status-btn"))
        return;

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
function setupCategoryAndNameAutocomplete(products) {
    const categorySelect = document.getElementById("categorySelect");
    const nameList = document.getElementById("nameList");

    const uniqueCategories = [...new Set(products.map((p) => p.Category?.name))]
        .filter((name) => name)
        .sort();

    categorySelect.innerHTML =
        `<option value="" disabled selected>-- Chọn danh mục --</option>` +
        uniqueCategories
            .map((name) => `<option value="${name}"> ${name}</option>`)
            .join("");

    const uniqueNames = [...new Set(products.map((p) => p.name))]
        .filter((name) => name)
        .sort();

    nameList.innerHTML = uniqueNames
        .map((name) => `<option value="${name}">`)
        .join("");
}


document.getElementById("inputName").addEventListener("input", async function () {
    const name = this.value.trim();
    const saveBtn = document.getElementById("saveBtn");
    const feedback = document.getElementById("nameFeedback");

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

            if (result.exists && result.is_active === false) {
                feedback.textContent =
                    "⚠️ Mặt hàng này đã bị xóa — bạn có muốn khôi phục không?";
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


// Table rendering & Sorting
async function asyncRenderTable(is_active = true) {
    try {
        const res = await fetch(`/api/v1/products/${is_active ? "" : "inactive"}`);
        const result = await res.json();
        if (!result.success) return;

        state.products = result.data;
        state.isActive = is_active;
        renderTable();
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}


function renderTable(filteredProducts = null) {
    const products = filteredProducts || [...state.products];

    // ┌─ Sorting
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
        const actionClass = state.isActive ? 'btn-outline-secondary' : 'btn-outline-secondary';
        const actionMethod = state.isActive ? `prepareArchiveModal('${p.id}')` : `prepareArchiveModal('${p.id}')`;

        return `
            <tr data-id="${p.id}">
                <td class="ps-3"><input type="checkbox" class="form-check-input row-check fs-5" data-id="${p.id}" /></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span style="font-size:1.3rem;">${p.image || "🍵"}</span>
                        <span class="fw-semibold">${p.name}</span>
                    </div>
                </td>
                <td><span class="badge bg-secondary bg-opacity-10 text-secondary fw-normal">${p.Category?.name || "—"}</span></td>
                <td class="fw-bold text-warning">${price.toLocaleString("vi-VN")}đ</td>
                <td class="text-muted">${cost ? cost.toLocaleString("vi-VN") + "đ" : "—"}</td>
                <td>
                    ${profit !== null
                ? `<span class="badge ${profit >= 40 ? "bg-success text-success" : profit >= 20 ? "bg-warning text-warning" : "bg-danger text-danger"} bg-opacity-10 fw-normal">${profit}%</span>`
                : "—"}
                </td>
                <td>
                    <div class="d-flex gap-1 justify-content-end pe-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${p.id}')" title="Chỉnh sửa" data-bs-toggle="modal" data-bs-target="#productModal">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm ${actionClass}" onclick="${actionMethod}" title="${actionTooltip}">
                            <i class="bi ${actionIcon}"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join("");

    updateStats(products);
    setupCategoryAndNameAutocomplete(products);
    document.querySelectorAll(".row-check").forEach(cb => cb.addEventListener("change", updateBulkBar));
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

    renderTable();
}

document.getElementById("nameSortBtn").addEventListener("click", () => handleSort("name"));
document.getElementById("categorySortBtn").addEventListener("click", () => handleSort("category"));
document.getElementById("priceSortBtn").addEventListener("click", () => handleSort("price"));
document.getElementById("costSortBtn").addEventListener("click", () => handleSort("cost"));
document.getElementById("profitSortBtn").addEventListener("click", () => handleSort("profit"));


// Stats calculation & display
function updateStats(products = []) {
    const categories = [...new Set(products.map((p) => p.Category?.name))].filter((c) => c);
    const prices = products.map((p) => p.price);

    document.getElementById("statTotal").textContent = products.length;
    document.getElementById("statCategories").textContent = categories.length;

    if (prices.length > 0) {
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        document.getElementById("statMaxPrice").textContent = `${max.toLocaleString("vi-VN")}đ`;
        document.getElementById("statMinPrice").textContent = `${min.toLocaleString("vi-VN")}đ`;
    } else {
        document.getElementById("statMaxPrice").textContent = "0đ";
        document.getElementById("statMinPrice").textContent = "0đ";
    }
}


// Add & Edit Modal Preparation
function prepareAddProductModal() {
    document.getElementById("modalTitle").textContent = "Thêm mặt hàng";
    document.getElementById("inputName").value = "";
    document.getElementById("categorySelect").value = "";
    document.getElementById("inputPrice").value = "";
    document.getElementById("inputCost").value = "";
    document.getElementById("inputImage").value = "";
}


function prepareAddCategoryModal() {
    document.getElementById("modalTitle").textContent = "Thêm danh mục";
    document.getElementById("inputName").value = "";
}


async function editProduct(id) {
    state.chosenProduct = state.products.find((p) => p.id === id);
    if (!state.chosenProduct) {
        showToast("⚠️ Không tìm thấy mặt hàng");
        return;
    }

    try {
        document.getElementById("modalTitle").textContent = "Chỉnh sửa mặt hàng";
        document.getElementById("productId").value = id;
        document.getElementById("inputName").value = state.chosenProduct.name;
        document.getElementById("categorySelect").value = state.chosenProduct.Category?.name || "";
        document.getElementById("inputPrice").value = state.chosenProduct.price || "";
        document.getElementById("inputCost").value = state.chosenProduct.cost || "";
        document.getElementById("inputImage").value = state.chosenProduct.image || "";
    } catch (error) {
        console.error("Error preparing edit form:", error);
        showToast("⚠️ Không thể chỉnh sửa mặt hàng này");
        return;
    }
}


async function submitProduct() {
    const id = document.getElementById("productId").value;
    const productName = document.getElementById("inputName").value.trim();
    const price = parseInt(document.getElementById("inputPrice").value);

    if (!productName) {
        showToast("⚠️ Vui lòng nhập tên mặt hàng");
        return;
    }
    if (!price || price <= 0) {
        showToast("⚠️ Vui lòng nhập giá hợp lệ");
        return;
    }

    const data = {
        name: productName,
        category: document.getElementById("categorySelect").value.trim(),
        price,
        cost: parseInt(document.getElementById("inputCost").value) || 0,
        emoji: document.getElementById("inputImage").value.trim() || "🍵",
    };

    try {
        const response = await fetch(`/api/v1/products/edit/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast("✓ Đã cập nhật mặt hàng");
            bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
            asyncRenderTable(state.isActive);
        } else {
            showToast("⚠️ Cập nhật thất bại. Lý do: " + (result.message || "Đã có lỗi xảy ra"));
        }
    } catch (error) {
        console.error("Error saving product:", error);
        showToast("⚠️ Lưu thất bại");
    }
}


// ARCHIVE/UNARCHIVE OPERATIONS
function prepareArchiveModal(id) {
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


// DELETE OPERATIONS
function promptDelete(id) {
    state.deleteTargetId = id;
    const p = state.products.find((p) => p.id === id);
    document.getElementById("deleteProductName").textContent = p ? p.name : "";
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
}


// BULK OPERATIONS (Check All, Delete)
document.getElementById('checkAll').addEventListener('change', function () {
    const isChecked = this.checked;
    document.querySelectorAll('.row-check').forEach(cb => {
        cb.checked = isChecked;
    });
    updateBulkBar();
});


function updateBulkBar() {
    const checked = document.querySelectorAll(".row-check:checked");
    document.getElementById("selectedCount").textContent = checked.length;
    document.getElementById("bulkBar").classList.toggle("d-none", checked.length === 0);
}


document.getElementById("bulkDeleteBtn").addEventListener("click", () => {
    const ids = [...document.querySelectorAll(".row-check:checked")].map((cb) => Number(cb.dataset.id));
    state.products = state.products.filter((p) => !ids.includes(p.id));
    document.getElementById("checkAll").checked = false;
    document.getElementById("bulkBar").classList.add("d-none");
    renderTable();
    showToast(`✓ Đã xóa ${ids.length} mặt hàng`);
});


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

        renderTable(filtered);
    }, 250);
}

document.getElementById("searchInput").addEventListener("input", filterTable);


// UI UTILITIES
function showToast(msg, time = 2000) {
    document.getElementById("toastMsg").textContent = msg;
    new bootstrap.Toast(document.getElementById("toast"), { delay: time }).show();
}


// INIT
asyncRenderTable();
