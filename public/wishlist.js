// Initialize wishlist from localStorage
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Function to add/remove item from wishlist
function toggleWishlist(productId, name, price, imageUrl, button) {
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index === -1) {
        // Add to wishlist
        wishlist.push({
            id: productId,
            name: name,
            price: price,
            image_url: imageUrl
        });
        button.classList.add('active');
        const heartIcon = button.querySelector('i.fa-heart');
        if (heartIcon) {
            heartIcon.style.color = '#ff4444';
        }
        showNotification('Product added to wishlist!');
    } else {
        // Remove from wishlist
        wishlist.splice(index, 1);
        button.classList.remove('active');
        const heartIcon = button.querySelector('i.fa-heart');
        if (heartIcon) {
            heartIcon.style.color = '#666';
        }
        showNotification('Product removed from wishlist!');
    }
    
    // Save to localStorage
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

// Function to update wishlist count
function updateWishlistCount() {
    const wishlistBtn = document.getElementById('search-btn');
    if (wishlistBtn) {
        const count = wishlist.length;
        console.log('Current wishlist count:', count); // Debug log
        console.log('Current wishlist items:', wishlist); // Debug log
        
        if (count > 0) {
            wishlistBtn.setAttribute('data-count', count);
            wishlistBtn.style.color = '#ff4444';
        } else {
            wishlistBtn.removeAttribute('data-count');
            wishlistBtn.style.color = '#666';
        }
    }
}

// Function to show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.innerHTML = `
        <i class="fas fa-heart"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Initialize wishlist icons on page load
document.addEventListener('DOMContentLoaded', () => {
    updateWishlistCount();
    
    // Set initial state of wishlist buttons
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
        const productId = parseInt(button.closest('.product-card').dataset.productId);
        if (wishlist.some(item => item.id === productId)) {
            button.classList.add('active');
            const heartIcon = button.querySelector('i.fa-heart');
            if (heartIcon) {
                heartIcon.style.color = '#ff4444';
            }
        } else {
            button.classList.remove('active');
            const heartIcon = button.querySelector('i.fa-heart');
            if (heartIcon) {
                heartIcon.style.color = '#666';
            }
        }
    });
});

// Add this function to check authentication
function isAuthenticated() {
    return !!sessionStorage.getItem('token');
}

// Update addToWishlist function
function addToWishlist(productId) {
    if (!isAuthenticated()) {
        alert('Please login to add items to wishlist');
        window.location.href = 'login.html';
        return;
    }
    // ... rest of your addToWishlist logic
} 