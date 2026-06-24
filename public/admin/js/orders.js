async function loadOrders() {
    try {
        const token = localStorage.getItem('adminToken');
        console.log('Using token:', token); // Debug log

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/admin/orders', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.error || 'Failed to fetch orders');
        }

        const orders = await response.json();
        console.log('Orders data:', orders);
        
        const tbody = document.getElementById('orders-table');
        if (!orders || orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No orders found</td>
                </tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer_name || 'Unknown'}</td>
                <td>₹${Number(order.total_amount).toFixed(2)}</td>
                <td>
                    <select class="form-select form-select-sm status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewOrderDetails(${order.id})">View Details</button>
                </td>
            </tr>
        `).join('');

        // Add status color styling
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                updateSelectStyle(this);
            });
            updateSelectStyle(select);
        });
    } catch (error) {
        console.error('Error in loadOrders:', error);
        document.getElementById('orders-table').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
    }
}

function updateSelectStyle(select) {
    select.classList.remove('bg-warning', 'bg-info', 'bg-primary', 'bg-success', 'bg-danger', 'text-white');
    select.classList.add(getStatusClass(select.value), 'text-white');
}

async function updateOrderStatus(orderId, status) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadOrders();
            loadDashboard(); // Refresh dashboard stats
        } else {
            const data = await response.json();
            alert(data.message || 'Error updating order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status');
    }
}

function getStatusClass(status) {
    const classes = {
        'pending': 'bg-warning',
        'processing': 'bg-info',
        'shipped': 'bg-primary',
        'delivered': 'bg-success',
        'cancelled': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}

async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        
        const modalContent = document.getElementById('orderDetailsContent');
        modalContent.innerHTML = `
            <div class="order-details">
                <div class="mb-4">
                    <h5 class="border-bottom pb-2">Order #${order.id}</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                            <p><strong>Status:</strong> <span class="badge ${getStatusClass(order.status)}">${order.status}</span></p>
                            <p><strong>Total Amount:</strong> ₹${Number(order.total_amount).toFixed(2)}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Customer Details</h6>
                            <p><strong>Name:</strong> ${order.customer_name || 'N/A'}</p>
                            <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
                            <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
                            <p><strong>Address:</strong> ${order.shipping_address || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <h6>Order Items</h6>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(order.items || []).map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>₹${Number(item.price).toFixed(2)}</td>
                                <td>${item.quantity}</td>
                                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Show the modal
        new bootstrap.Modal(document.getElementById('orderDetailsModal')).show();
    } catch (error) {
        console.error('Error fetching order details:', error);
        alert('Failed to load order details');
    }
}

// Load orders when the orders section is shown
document.addEventListener('DOMContentLoaded', () => {
    const ordersLink = document.querySelector('a[onclick*="showOrders"]');
    if (ordersLink) {
        ordersLink.addEventListener('click', loadOrders);
    }
}); 