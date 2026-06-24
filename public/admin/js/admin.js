const API_URL = '/api';

let loadProducts; // Declare the variable to store the function

// Auth functions
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) window.location.href = '/admin-login.html';
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}

// Navigation functions
function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard-section').style.display = 'block';
    updateActiveNav('dashboard');
    loadDashboard();
}

function showProducts() {
    console.log('Showing products section...'); // Debug log
    hideAllSections();
    const productsSection = document.getElementById('products-section');
    productsSection.style.display = 'block';
    updateActiveNav('products');
    if (typeof loadProducts === 'function') {
        loadProducts();
    } else {
        console.error('loadProducts function not found');
    }
}

function showOrders() {
    hideAllSections();
    document.getElementById('orders-section').style.display = 'block';
    updateActiveNav('orders');
    loadOrders();
}

function showCustomers() {
    hideAllSections();
    document.getElementById('customers-section').style.display = 'block';
    updateActiveNav('customers');
    loadCustomers();
}

function hideAllSections() {
    const sections = ['dashboard', 'products', 'orders', 'customers'];
    sections.forEach(section => {
        document.getElementById(`${section}-section`).style.display = 'none';
    });
}

function updateActiveNav(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(section)) {
            link.classList.add('active');
        }
    });
}

// Sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggle = document.getElementById('sidebarToggle');

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });

    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        sidebar.classList.toggle('collapsed', isMobile);
        mainContent.classList.toggle('expanded', isMobile);
    }

    window.addEventListener('resize', handleResize);
    handleResize();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initSidebar();
    showDashboard();
});

async function updateProduct(event) {
    event.preventDefault();
    
    try {
        const productId = document.getElementById('editProductId').value;
        const formData = {
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDescription').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            category: document.getElementById('editProductCategory').value,
            image_url: document.getElementById('editProductImage').value,
            stock_quantity: parseInt(document.getElementById('editProductStock').value)
        };

        console.log('Updating product with data:', formData); // Debug log

        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update product');
        }

        const result = await response.json();
        console.log('Update response:', result); // Debug log

        // Close modal and refresh product list
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        loadProducts();

        // Show success message
        alert('Product updated successfully!');
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product: ' + error.message);
    }
}

// Function to format currency
function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

// Function to create order row
function createOrderRow(order) {
    return `
        <tr>
            <td>#${order.id}</td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                ${order.product_names ? order.product_names.join(', ') : ''}
                <span class="badge">${order.items_count || 0} items</span>
            </td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>
                <span class="status-badge status-${order.status.toLowerCase()}">
                    ${order.status}
                </span>
            </td>
            <td>
                <button onclick="viewOrderDetails(${order.id})" class="btn-view">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
}

// Function to create customer row
function createCustomerRow(customer) {
    return `
        <tr>
            <td>#${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.total_orders || 0}</td>
            <td>${formatCurrency(customer.total_spent)}</td>
            <td>${new Date(customer.created_at).toLocaleDateString()}</td>
            <td>
                <button onclick="viewCustomerDetails(${customer.id})" class="btn-view">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
}

// Function to show order details
function showOrderDetails(order) {
    return `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Order Details #${order.id}</h2>
            <div class="order-info">
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Email:</strong> ${order.customer_email}</p>
                <p><strong>Amount:</strong> ${formatCurrency(order.total_amount)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Shipping Address:</strong> ${order.shipping_address}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method}</p>
            </div>
        </div>
    `;
}

// Function to show customer details
function showCustomerDetails(customer) {
    return `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Customer Details #${customer.id}</h2>
            <div class="customer-info">
                <p><strong>Name:</strong> ${customer.name}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Total Orders:</strong> ${customer.total_orders || 0}</p>
                <p><strong>Total Spent:</strong> ${formatCurrency(customer.total_spent)}</p>
                <p><strong>Joined:</strong> ${new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `;
} 