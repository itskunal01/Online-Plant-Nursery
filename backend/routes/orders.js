const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');

// Create new order
router.post('/', async (req, res) => {
    try {
        const orderId = await Order.create(req.body);
        res.status(201).json({ 
            message: 'Order created successfully',
            orderId: orderId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.getAll();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.getById(req.params.id);
        if (order.length > 0) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const success = await Order.updateStatus(req.params.id, req.body.status);
        if (success) {
            res.json({ message: 'Order status updated successfully' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 