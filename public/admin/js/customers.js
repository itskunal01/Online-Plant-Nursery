async function loadCustomers() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/customers', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch customers');
        }

        const customers = await response.json();
        console.log('Customers data:', customers);

        const tbody = document.getElementById('customers-table');
        if (!customers || customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No customers found</td>
                </tr>`;
            return;
        }

        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>#${customer.id}</td>
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.address || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewCustomerOrders(${customer.id}, '${customer.name}')">
                        Orders (${customer.total_orders || 0})
                    </button>
                    <span class="ms-2 text-success">
                        ₹${Number(customer.total_spent || 0).toFixed(2)}
                    </span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customers-table').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
    }
}

async function viewCustomerOrders(customerId, customerName) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/customers/${customerId}/orders`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customer orders');
        }

        const orders = await response.json();
        
        const modalContent = document.getElementById('customerOrdersContent');
        modalContent.innerHTML = `
            <h6>Orders for ${customerName}</h6>
            ${orders.length === 0 ? '<p>No orders found</p>' : `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>#${order.id}</td>
                                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                                <td>
                                    <small>${order.product_names || 'N/A'}</small>
                                    <br>
                                    <span class="badge bg-secondary">${order.items_count} items</span>
                                </td>
                                <td>₹${Number(order.total_amount).toFixed(2)}</td>
                                <td>
                                    <span class="badge ${getStatusClass(order.status)}">
                                        ${order.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        `;

        // Show the modal
        new bootstrap.Modal(document.getElementById('customerOrdersModal')).show();
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        alert('Failed to load customer orders');
    }
}

// Load customers when the customers section is shown
document.addEventListener('DOMContentLoaded', () => {
    const customersLink = document.querySelector('a[onclick*="showCustomers"]');
    if (customersLink) {
        customersLink.addEventListener('click', loadCustomers);
    }
}); 