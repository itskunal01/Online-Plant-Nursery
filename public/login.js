// Auth service functions
const AuthService = {
    async login(email, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }

            // Store token in sessionStorage
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async register(userData) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getProfile() {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    logout() {
        // Clear auth data
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Clear cart data
        localStorage.removeItem('cart');
        localStorage.removeItem('cartCount');
        
        // Clear wishlist data
        localStorage.removeItem('wishlist');
        localStorage.removeItem('wishlistCount');
        
        window.location.href = 'login.html';
    }
};

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await AuthService.login(email, password);
        window.location.href = 'profile.html';
    } catch (error) {
        alert(error.message);
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const phone = document.getElementById('signup-phone').value;
    const address = document.getElementById('signup-address').value;

    try {
        await AuthService.register({
            name,
            email,
            password,
            phone,
            address
        });
        window.location.href = 'profile.html';
    } catch (error) {
        alert(error.message);
    }
} 