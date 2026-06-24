// Initialize cart array in localStorage if it doesn't exist
if (!localStorage.getItem('cart')) {
    localStorage.setItem('cart', JSON.stringify([]));
}

// Add this function to check authentication
function isAuthenticated() {
    return !!sessionStorage.getItem('token');
}

// Function to add product to cart
async function addToCart(productId) {
    if (!isAuthenticated()) {
        showNotification('Please login to add items to cart', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    try {
        // Convert productId to string for consistency
        productId = String(productId);
        
        // Fetch product details
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check if product already exists in cart
        const existingItem = cart.find(item => String(item.id) === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount();
        showNotification('Item added to cart successfully!');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding item to cart');
    }
}

// Function to update cart display
function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const checkoutTotalElement = document.getElementById('checkout-total');
    
    if (cartContainer) {
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart" style="font-size: 5rem; color: #ddd; margin-bottom: 20px;"></i>
                    <p>Your cart is empty</p>
                    <a href="/product" class="continue-shopping">
                        <i class="fas fa-arrow-left"></i> Continue Shopping
                    </a>
                </div>
            `;
            if (totalElement) totalElement.textContent = 'Total: ₹0';
            if (checkoutTotalElement) checkoutTotalElement.textContent = '₹0';
            return;
        }

        cartContainer.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            cartContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image_url}" alt="${item.name}">
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <p class="price">₹${item.price}</p>
                    </div>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <div class="item-total">₹${itemTotal}</div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        // Update both total displays
        if (totalElement) {
            totalElement.textContent = `Total: ₹${total}`;
        }
        if (checkoutTotalElement) {
            checkoutTotalElement.textContent = `₹${total}`;
        }
    }
}

// Function to update quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => String(item.id) === String(productId));
    
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount();
        showNotification('Cart updated successfully!');
    }
}

// Function to remove item from cart
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Convert productId to string for comparison
    cart = cart.filter(item => String(item.id) !== String(productId));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartCount();
    showNotification('Item removed from cart');
}

// Add this function to update cart count in the header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBtn = document.querySelector('.fa-shopping-cart');
    
    if (cartCount > 0) {
        cartBtn.setAttribute('data-count', cartCount);
    } else {
        cartBtn.removeAttribute('data-count');
    }
}

// Call updateCartCount when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

// Update the showNotification function in cart.js
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification-popup');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    
    // Set icon based on type
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    // Add notification to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add wishlist functionality
function addToWishlist(productId) {
    const wishlistBtn = event.currentTarget;
    wishlistBtn.classList.toggle('active');
    
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.indexOf(productId);
    
    if (index === -1) {
        wishlist.push(productId);
        showNotification('Added to wishlist');
    } else {
        wishlist.splice(index, 1);
        showNotification('Removed from wishlist');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Update displayProducts to show active wishlist items
document.addEventListener('DOMContentLoaded', () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist.forEach(productId => {
        const wishlistBtn = document.querySelector(`[onclick="addToWishlist(${productId})"]`);
        if (wishlistBtn) {
            wishlistBtn.classList.add('active');
        }
    });
});

// Update the showCheckoutForm function
function showCheckoutForm() {
    document.getElementById('checkout-form').style.display = 'block';
    
    // Pre-fill user data if available
    const user = JSON.parse(sessionStorage.getItem('user'));
    console.log('User data:', user); // Debug log
    
    if (user) {
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');
        const addressInput = document.getElementById('shipping-address');

        if (nameInput && user.name) nameInput.value = user.name;
        if (phoneInput && user.phone) phoneInput.value = user.phone;
        if (addressInput && user.address) addressInput.value = user.address;
    }

    // Update total amount
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const checkoutTotalElement = document.getElementById('checkout-total');
    if (checkoutTotalElement) {
        checkoutTotalElement.textContent = `₹${total}`;
    }

    // Scroll to checkout form
    document.getElementById('checkout-form').scrollIntoView({ behavior: 'smooth' });
}

async function placeOrder(event) {
    event.preventDefault();
    
    const button = event.target;
    if (button.disabled) return;
    
    try {
        button.disabled = true;
        
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }

        // Get form values
        const name = document.getElementById('customer-name').value;
        const phone = document.getElementById('customer-phone').value;
        const shippingAddress = document.getElementById('shipping-address').value;
        const paymentMethod = document.getElementById('payment-method').value;

        // Validate all required fields
        if (!name || !phone || !shippingAddress || !paymentMethod) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate phone number format
        if (!/^\d{10}$/.test(phone)) {
            showNotification('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                items: cart,
                name,
                phone,
                shippingAddress,
                paymentMethod
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.details || 'Failed to create order');
        }

        // Clear cart after successful order
        localStorage.removeItem('cart');
        localStorage.removeItem('cartCount');
        
        showNotification('Order placed successfully! Redirecting to orders page...', 'success');
        
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 2000);

    } catch (error) {
        console.error('Error details:', error);
        showNotification(error.message || 'Error placing order', 'error');
    } finally {
        button.disabled = false;
    }
}

// Update the checkout function
function checkout() {
    if (!isAuthenticated()) {
        showNotification('Please login to checkout', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    showCheckoutForm();
} 