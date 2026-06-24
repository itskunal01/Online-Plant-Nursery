async function fetchProducts() {
    try {
        console.log('Fetching products...'); // Debug log
        const response = await fetch('/api/products');
        console.log('Response status:', response.status); // Debug log
        
        const products = await response.json();
        console.log('Products received:', products); // Debug log
        
        if (products.length === 0) {
            console.log('No products found in the response');
            return;
        }
        
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function displayProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) {
        console.error('Product grid element not found');
        return;
    }

    // Get current wishlist to check product states
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    productGrid.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}" data-product-id="${product.id}">
            <div class="product-icons">
                <button class="wishlist-btn ${wishlist.some(item => item.id === product.id) ? 'active' : ''}" 
                        onclick="toggleWishlist(${product.id}, '${product.name}', ${product.price}, '${product.image_url}', this)">
                    <i class="fas fa-heart" style="color: ${wishlist.some(item => item.id === product.id) ? '#ff4444' : '#666'}"></i>
                </button>
            </div>
            <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <span class="price">₹${Number(product.price).toFixed(2)}</span>
            <div class="product-actions">
                <button class="quick-view-btn" onclick="showQuickview(${product.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="add-to-cart" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image_url}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Filter products by category
document.getElementById('category-filter').addEventListener('change', function(e) {
    const category = e.target.value;
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        if (category === 'all' || product.dataset.category === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
});

// Add to cart functionality
function addToCart(productId, name, price, imageUrl) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            image_url: imageUrl,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    const cartBtn = document.getElementById('cart-btn');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartBtn.setAttribute('data-count', cartCount);
    
    alert('Product added to cart!');
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', fetchProducts); 