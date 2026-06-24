async function loadDashboard() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        console.log('Dashboard stats:', data);

        // Update the dashboard cards with the fetched data
        document.getElementById('total-orders').textContent = data.totalOrders || 0;
        document.getElementById('total-products').textContent = data.totalProducts || 0;
        document.getElementById('total-customers').textContent = data.totalCustomers || 0;
        document.getElementById('pending-orders').textContent = data.pendingOrders || 0;

    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Show error message to user
        alert('Error loading dashboard data');
    }
}

// Refresh dashboard data every 30 seconds
setInterval(loadDashboard, 30000);

// Load dashboard data immediately when the script loads
document.addEventListener('DOMContentLoaded', loadDashboard);

// Additional dashboard-specific functions can be added here 