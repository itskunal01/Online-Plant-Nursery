async function showQuickview(productId) {
    try {
        console.log('Opening quick view for product ID:', productId); // Debug log
        
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        
        const product = await response.json();
        console.log('Product details received:', product); // Debug log
        
        if (!product) {
            throw new Error('No product data received');
        }

        // Update modal content
        const modalImage = document.getElementById('modalProductImage');
        const modalName = document.getElementById('modalProductName');
        const modalDescription = document.getElementById('modalProductDescription');
        const modalPrice = document.getElementById('modalProductPrice');
        const modalStock = document.getElementById('modalProductStock');
        const modalCategory = document.getElementById('modalProductCategory');

        if (modalImage) modalImage.src = product.image_url || '/images/placeholder.jpg';
        if (modalName) modalName.textContent = product.name || 'Product Name Not Available';
        if (modalDescription) {
            const formattedDescription = product.description
                ? product.description.split('\n').map(line => `<p>${line}</p>`).join('')
                : 'No description available';
            modalDescription.innerHTML = formattedDescription;
        }
        if (modalPrice) modalPrice.textContent = Number(product.price).toFixed(2);
        if (modalStock) modalStock.textContent = product.stock_quantity || '0';
        if (modalCategory) modalCategory.textContent = product.category || 'Uncategorized';

        // Show modal
        const modal = document.getElementById('quickViewModal');
        if (modal) {
            modal.style.display = 'block';
            
            // Close modal when clicking the close button
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.onclick = function() {
                    modal.style.display = 'none';
                }
            }

            // Close modal when clicking outside
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            }
        } else {
            console.error('Quick view modal element not found');
        }
    } catch (error) {
        console.error('Error in showQuickview:', error);
        alert('Error loading product details: ' + error.message);
    }
} 