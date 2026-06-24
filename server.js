const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./backend/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware (move this here)
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [users] = await db.query(
            'SELECT id, name, email, phone, address FROM customers WHERE id = ?',
            [decoded.id]
        );

        if (!users.length) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Test database connection
(async () => {
    try {
        const [result] = await db.query('SELECT 1');
        console.log('Connected to MySQL database');
    } catch (err) {
        console.error('Error connecting to database:', err);
    }
})();

// Add this near the top of your file, after creating the db connection
db.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        console.log('Fetching products...'); // Debug log
        const [rows] = await db.query('SELECT * FROM products');
        console.log('Products fetched:', rows); // Debug log
        
        if (!rows) {
            throw new Error('No data returned from database');
        }
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ 
            error: 'Error fetching products', 
            details: err.message 
        });
    }
});

// Add product
app.post('/api/products', async (req, res) => {
    try {
        console.log('Adding product:', req.body); // Debug log
        const { name, description, price, category, image_url, stock_quantity } = req.body;
        
        if (!name || !description || !price || !category || !stock_quantity) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [result] = await db.query(
            'INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, category, image_url, stock_quantity]
        );

        console.log('Product added:', result); // Debug log
        res.status(201).json({ 
            success: true, 
            message: 'Product added successfully',
            productId: result.insertId 
        });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Error adding product: ' + err.message });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Admin login page route
app.get(['/admin-login', '/admin-login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-login.html'));
});

// Update the authentication middleware
const authenticateAdmin = (req, res, next) => {
    try {
        console.log('Checking authentication...');
        console.log('Headers:', req.headers);
        
        const token = req.headers.authorization;
        console.log('Token:', token);
        
        if (!token) {
            console.log('No token found');
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token provided' 
            });
        }

        // For now, we're just checking if the token exists and starts with admin-token-
        if (!token.startsWith('admin-token-')) {
            console.log('Invalid token format');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid authentication token' 
            });
        }

        console.log('Authentication successful');
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

// Update the admin login API endpoint
app.post('/api/admin/login', (req, res) => {
    console.log('Login attempt received:', {
        body: req.body,
        headers: req.headers
    });
    
    const { email, password } = req.body;
    
    // Hardcoded credentials (for testing)
    const adminEmail = 'admin@example.com';  // Change this
    const adminPassword = 'admin123';       // Change this

    if (email === adminEmail && password === adminPassword) {
        console.log('Login successful');
        const token = 'admin-token-' + Date.now();
        res.json({ 
            success: true, 
            token: token,
            message: 'Login successful' 
        });
    } else {
        console.log('Login failed. Received:', { email, password });
        console.log('Expected:', { adminEmail, adminPassword });
        res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password' 
        });
    }
});

// Admin dashboard route (protected route)
app.get(['/admin', '/admin-dashboard', '/admin.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// Protected admin routes
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// Add new product (protected)
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
    const { name, description, price, category, image_url, stock } = req.body;
    
    try {
        const sql = 'INSERT INTO products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [name, description, price, category, image_url, stock];
        const [result] = await db.query(sql, values);
        
        res.status(201).json({ 
            success: true, 
            message: 'Product added successfully',
            productId: result.insertId 
        });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Error adding product' });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        console.log('Updating product:', req.params.id); // Debug log
        console.log('Update data:', req.body); // Debug log

        const { name, description, price, category, image_url, stock_quantity } = req.body;
        
        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        const [result] = await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock_quantity = ? WHERE id = ?',
            [name, description, price, category, image_url, stock_quantity, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log('Update successful'); // Debug log
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Error updating product', details: err.message });
    }
});

// Delete product (protected)
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
    const productId = req.params.id;
    
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Product deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Error deleting product' });
    }
});

// Add this debug endpoint
app.get('/api/debug/products', async (req, res) => {
    try {
        // Get table structure
        const [tableInfo] = await db.query('DESCRIBE products');
        console.log('Products table structure:', tableInfo);

        // Get all products with detailed logging
        const [products] = await db.query('SELECT * FROM products');
        console.log('Raw products data:', products);

        // Get count with detailed logging
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM products');
        console.log('Count query result:', countResult);

        res.json({
            tableStructure: tableInfo,
            products: products,
            count: countResult[0].total
        });
    } catch (err) {
        console.error('Debug error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update the stats endpoint
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        console.log('Fetching stats from database...');

        // Get total products
        const [productsResult] = await db.query('SELECT COUNT(*) as total FROM products');
        const totalProducts = productsResult[0].total;
        console.log('Total products:', totalProducts);

        // Get total orders
        const [ordersResult] = await db.query('SELECT COUNT(*) as total FROM orders');
        const totalOrders = ordersResult[0].total;
        console.log('Total orders:', totalOrders);

        // Get total customers
        const [customersResult] = await db.query('SELECT COUNT(*) as total FROM customers');
        const totalCustomers = customersResult[0].total;
        console.log('Total customers:', totalCustomers);

        // Get pending orders
        const [pendingResult] = await db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'");
        const pendingOrders = pendingResult[0].total;
        console.log('Pending orders:', pendingOrders);

        const stats = {
            totalProducts,
            totalOrders,
            totalCustomers,
            pendingOrders
        };

        console.log('Sending stats:', stats);
        res.json(stats);

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            error: 'Error fetching stats',
            message: error.message,
            totalProducts: 0,
            totalOrders: 0,
            totalCustomers: 0,
            pendingOrders: 0
        });
    }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

// Get single product details
app.get('/api/products/:id', async (req, res) => {
    try {
        console.log('Fetching product with ID:', req.params.id); // Debug log
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        console.log('Product data:', rows[0]); // Debug log
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Error fetching product details' });
    }
});

// Update the orders endpoint
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                o.*,
                c.name as customer_name,
                c.email as customer_email,
                GROUP_CONCAT(p.name) as product_names,
                GROUP_CONCAT(oi.quantity) as quantities,
                GROUP_CONCAT(oi.price_at_time) as prices
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        
        // Format the orders data
        const formattedOrders = orders.map(order => ({
            ...order,
            total_amount: parseFloat(order.total_amount).toFixed(2),
            product_names: order.product_names ? order.product_names.split(',') : [],
            quantities: order.quantities ? order.quantities.split(',').map(Number) : [],
            prices: order.prices ? order.prices.split(',').map(q => parseFloat(q).toFixed(2)) : []
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

// Get order details
app.get('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        // Get order and customer information
        const [orders] = await db.query(`
            SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.id = ?
        `, [req.params.id]);

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Get order items
        const [items] = await db.query(`
            SELECT oi.*, p.name as product_name 
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [req.params.id]);

        order.items = items;
        res.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Error fetching order details' });
    }
});

// Update order status
app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error updating order status' });
    }
});

// Get all customers
app.get('/api/admin/customers', authenticateAdmin, async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        
        // Format the customer data
        const formattedCustomers = customers.map(customer => ({
            ...customer,
            total_spent: parseFloat(customer.total_spent || 0).toFixed(2)
        }));

        res.json(formattedCustomers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Error fetching customers' });
    }
});

// Get customer orders
app.get('/api/admin/customers/:id/orders', authenticateAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, 
                   COUNT(oi.id) as items_count,
                   GROUP_CONCAT(p.name SEPARATOR ', ') as product_names
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.customer_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.params.id]);

        res.json(orders);
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Error fetching customer orders' });
    }
});

// Add this route to test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1');
        res.json({ message: 'Database connection successful', result });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
});

// Get user orders
app.get('/api/orders', authenticateUser, async (req, res) => {
    try {
        console.log('Authenticated user:', req.user);

        // Update the query to maintain order
        const [orders] = await db.query(`
            SELECT 
                o.id, 
                o.created_at, 
                o.status, 
                o.total_amount,
                o.shipping_address,
                o.payment_method,
                GROUP_CONCAT(p.name ORDER BY oi.id) as product_names,
                GROUP_CONCAT(oi.quantity ORDER BY oi.id) as quantities,
                GROUP_CONCAT(oi.price_at_time ORDER BY oi.id) as prices,
                GROUP_CONCAT(p.image_url ORDER BY oi.id) as image_urls
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.customer_id = ?
            GROUP BY o.id, o.created_at, o.status, o.total_amount, o.shipping_address, o.payment_method
            ORDER BY o.created_at DESC
        `, [req.user.id]);

        console.log('Raw orders data:', orders);

        // Format the orders data
        const formattedOrders = orders.map(order => {
            try {
                const productNames = order.product_names ? order.product_names.split(',') : [];
                const quantities = order.quantities ? order.quantities.split(',').map(Number) : [];
                const prices = order.prices ? order.prices.split(',').map(Number) : [];
                const imageUrls = order.image_urls ? order.image_urls.split(',') : [];

                console.log('Product Names:', productNames);
                console.log('Image URLs:', imageUrls);

                const items = productNames.map((name, index) => ({
                    name,
                    quantity: quantities[index] || 0,
                    price: prices[index] || 0,
                    image_url: imageUrls[index] || ''
                }));

            return {
                    id: order.id,
                    created_at: order.created_at,
                    status: order.status,
                    total_amount: order.total_amount,
                    shipping_address: order.shipping_address,
                    payment_method: order.payment_method,
                    items: items
                };
            } catch (err) {
                console.error('Error formatting order:', order.id, err);
                return null;
            }
        }).filter(Boolean);

        res.json(formattedOrders);

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            error: 'Error fetching orders', 
            details: error.message
        });
    }
});

// Update your setup-orders-tables route
app.get('/api/setup-orders-tables', async (req, res) => {
    try {
        // Create orders table
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                customer_id INT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                shipping_address TEXT NOT NULL,
                payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            ) ENGINE=InnoDB
        `);

        // Create order_items table
        await db.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                price_at_time DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            ) ENGINE=InnoDB
        `);

        res.json({ message: 'Tables created successfully' });
    } catch (err) {
        console.error('Error creating tables:', err);
        res.status(500).json({ 
            error: 'Error creating tables', 
            details: err.message 
        });
    }
});

// Add sample order (for testing)
app.get('/api/add-sample-order', async (req, res) => {
    try {
        // Insert sample order
        const [orderResult] = await db.query(`
            INSERT INTO orders (
                status, 
                total_amount, 
                customer_name, 
                customer_email
            ) VALUES (
                'pending',
                1200.00,
                'Test Customer',
                'test@example.com'
            )
        `);

        const orderId = orderResult.insertId;

        // Get a sample product
        const [products] = await db.query('SELECT id, price FROM products LIMIT 1');
        
        if (products.length > 0) {
            // Insert sample order item
            await db.query(`
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    price,
                    price_at_time
                ) VALUES (
                    ?,
                    ?,
                    1,
                    ?,
                    ?
                )
            `, [orderId, products[0].id, products[0].price, products[0].price]);
        }

        res.json({ 
            message: 'Sample order created successfully', 
            orderId: orderId 
        });
    } catch (err) {
        console.error('Error creating sample order:', err);
        res.status(500).json({ 
            error: 'Error creating sample order', 
            details: err.message,
            sqlMessage: err.sqlMessage
        });
    }
});

// Add this after your database connection
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create users table if it doesn't exist
app.get('/api/setup-users-table', async (req, res) => {
    try {
        console.log('Creating users table...');
        await db.query(`DROP TABLE IF EXISTS users`); // Reset table for testing
        await db.query(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table created successfully');
        res.json({ message: 'Users table created successfully' });
    } catch (err) {
        console.error('Error creating users table:', err);
        res.status(500).json({ error: 'Error creating users table', details: err.message });
    }
});

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO customers (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null, address || null]
        );

        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ 
            token,
            user: {
                id: result.insertId,
                name,
                email,
                phone,
                address
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user from database
        const [users] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // Send response
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Update the profile route
app.get('/api/profile', authenticateUser, async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT id, name, email, phone, address FROM customers WHERE id = ?',
            [req.user.id]
        );
        
        if (!user.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// Update the create order endpoint
app.post('/api/orders', authenticateUser, async (req, res) => {
    let retries = 3; // Number of retries for deadlock
    
    while (retries > 0) {
        try {
            const { items, shippingAddress, paymentMethod } = req.body;
            const customerId = req.user.id;

            // Start transaction
            await db.query('START TRANSACTION');

            try {
                // Calculate total amount
                const totalAmount = items.reduce((sum, item) => 
                    sum + (parseFloat(item.price) * item.quantity), 0);

                // Create order first
                const [orderResult] = await db.query(
                    `INSERT INTO orders 
                    (customer_id, total_amount, shipping_address, payment_method, status) 
                    VALUES (?, ?, ?, ?, 'pending')`,
                    [customerId, totalAmount, shippingAddress, paymentMethod]
                );

                const orderId = orderResult.insertId;

                // Get all product information first
                const productIds = items.map(item => item.id);
                const [products] = await db.query(
                    'SELECT id, price, stock_quantity FROM products WHERE id IN (?)',
                    [productIds]
                );

                const productMap = new Map(
                    products.map(product => [product.id, product])
                );

                // Validate all products before making any changes
                for (const item of items) {
                    const product = productMap.get(parseInt(item.id));
                    if (!product) {
                        throw new Error(`Product ${item.id} not found`);
                    }
                    if (product.stock_quantity < item.quantity) {
                        throw new Error(`Insufficient stock for product ${item.id}`);
                    }
                }

                // Now process all items
                for (const item of items) {
                    const product = productMap.get(parseInt(item.id));
                    
                    // Insert order item
                    await db.query(
                        `INSERT INTO order_items 
                        (order_id, product_id, quantity, price, price_at_time) 
                        VALUES (?, ?, ?, ?, ?)`,
                        [orderId, item.id, item.quantity, product.price, product.price]
                    );

                    // Update stock with explicit locking
                    await db.query(
                        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
                        [item.quantity, item.id, item.quantity]
                    );
                }

                // Commit transaction
                await db.query('COMMIT');

                res.status(201).json({
                    message: 'Order created successfully',
                    orderId: orderId
                });
                
                return; // Exit after successful order
            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            retries--;
            
            // If it's a deadlock error and we have retries left, continue
            if (error.message.includes('Deadlock') && retries > 0) {
                console.log(`Deadlock encountered, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
                continue;
            }

            // If it's not a deadlock or we're out of retries, return error
            console.error('Error creating order:', error);
            res.status(500).json({ 
                error: 'Error creating order',
                details: error.message
            });
            return;
        }
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 