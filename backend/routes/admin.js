const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const auth = require('../middleware/auth');
const db = require('../db');

// Admin login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt with:', req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const admin = await Admin.login(email, password);
        
        if (!admin) {
            console.log('Invalid credentials for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Admin logged in successfully:', email);
        const token = jwt.sign(
            { id: admin.id, isAdmin: true }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
    try {
        const [orderStats] = await db.query(`
            SELECT 
                COUNT(*) as totalOrders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as deliveredOrders
            FROM orders
        `);
        
        const [productStats] = await db.query(`
            SELECT 
                COUNT(*) as totalProducts,
                SUM(stock_quantity) as totalStock
            FROM products
        `);
        
        const [customerStats] = await db.query(`
            SELECT COUNT(*) as totalCustomers
            FROM customers
        `);
        
        res.json({
            orders: orderStats[0],
            products: productStats[0],
            customers: customerStats[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status
router.put('/orders/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        if (result.affectedRows > 0) {
            res.json({ message: 'Order status updated' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get detailed order information
router.get('/orders/:id', auth, async (req, res) => {
    try {
        // Get order details with customer info
        const [orders] = await db.query(`
            SELECT 
                o.*,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `, [req.params.id]);

        if (!orders[0]) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get order items with product details
        const [orderItems] = await db.query(`
            SELECT 
                oi.*,
                p.name as product_name,
                p.image_url as product_image
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [req.params.id]);

        // Combine order details with items
        const orderDetails = {
            ...orders[0],
            items: orderItems
        };

        res.json(orderDetails);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all customers
router.get('/customers', auth, async (req, res) => {
    try {
        // Get customers with their order counts
        const [customers] = await db.query(`
            SELECT 
                c.*,
                COUNT(o.id) as total_orders,
                SUM(o.total_amount) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            GROUP BY c.id
        `);
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get customer orders
router.get('/customers/:id/orders', auth, async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE customer_id = ?',
            [req.params.id]
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product
router.delete('/products/:id', auth, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows > 0) {
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new product
router.post('/products', auth, async (req, res) => {
    try {
        const { name, description, price, category, image_url, stock_quantity } = req.body;
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, category, image_url, stock_quantity]
        );
        
        res.status(201).json({
            id: result.insertId,
            message: 'Product added successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get product by ID
router.get('/products/:id', auth, async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        
        if (products[0]) {
            res.json(products[0]);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product
router.put('/products/:id', auth, async (req, res) => {
    try {
        const { name, description, price, category, image_url, stock_quantity } = req.body;
        const [result] = await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock_quantity = ? WHERE id = ?',
            [name, description, price, category, image_url, stock_quantity, req.params.id]
        );
        
        if (result.affectedRows > 0) {
            res.json({ message: 'Product updated successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 