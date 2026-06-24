// Remove this line since it's already defined in admin.js
// const API_URL = 'http://localhost:5001/api';

// Assign the function to the global loadProducts variable
loadProducts = async function() {
    try {
        console.log('Loading products...'); // Debug log
        const response = await fetch(`${API_URL}/products`);
        console.log('Response:', response.status); // Debug log

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products loaded:', products); // Debug log

        if (!Array.isArray(products)) {
            throw new Error('Invalid data format received');
        }

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error loading products: ${error.message}
                    </div>
                </div>`;
        }
    }
};

function showAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
    modal.show();
}

async function addProduct(event) {
    event.preventDefault();
    try {
        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            image_url: document.getElementById('productImage').value,
            stock_quantity: parseInt(document.getElementById('productStock').value)
        };

        console.log('Adding product:', formData); // Debug log

        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Server response:', data); // Debug log

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add product');
        }

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        modal.hide();
        document.getElementById('addProductForm').reset();
        
        // Reload products
        await loadProducts();
        alert('Product added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
        alert(error.message || 'Error adding product');
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }

        const product = await response.json();
        
        // Fill the edit form with product details
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.category;
        document.getElementById('editProductImage').value = product.image_url;
        document.getElementById('editProductStock').value = product.stock_quantity;

        // Show the edit modal
        new bootstrap.Modal(document.getElementById('editProductModal')).show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading product details');
    }
}

async function updateProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('editProductId').value;
    const formData = {
        name: document.getElementById('editProductName').value,
        description: document.getElementById('editProductDescription').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        category: document.getElementById('editProductCategory').value,
        image_url: document.getElementById('editProductImage').value,
        stock_quantity: parseInt(document.getElementById('editProductStock').value)
    };

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update product');
        }

        // Close the modal
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        
        // Refresh the products display
        loadProducts();
        
        alert('Product updated successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error updating product');
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': localStorage.getItem('adminToken') // Remove 'Bearer'
                }
            });
            
            if (response.ok) {
                loadProducts();
                alert('Product deleted successfully!');
            } else {
                const data = await response.json();
                alert(data.message || 'Error deleting product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    }
}


// Add product filtering functionality
function filterProducts() {
    const category = document.getElementById('category-filter').value;
    const products = document.querySelectorAll('#products-grid > div[data-category]');
    
    products.forEach(product => {
        if (!category || product.dataset.category === category) {
            product.style.display = '';
        } else {
            product.style.display = 'none';
        }
    });
}

function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) {
        console.error('Products grid element not found');
        return;
    }

    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">No products found</div>
            </div>`;
        return;
    }

    console.log('Displaying products:', products); // Debug log

    productsGrid.innerHTML = products.map(product => `
        <div class="col-md-4 col-lg-3 mb-4" data-category="${product.category}">
            <div class="card h-100">
                <div class="product-image-container">
                    <img src="${product.image_url || '/images/placeholder.jpg'}" 
                         class="card-img-top" 
                         alt="${product.name}"
                         onerror="this.onerror=null; this.src='/images/placeholder.jpg';">
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary">${product.category}</span>
                        <span class="text-success fw-bold">₹${Number(product.price).toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Stock: ${product.stock_quantity}</span>
                        <div>
                            <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Remove the DOMContentLoaded event listener since we're handling it in admin.js
// document.addEventListener('DOMContentLoaded', () => { ... }); 