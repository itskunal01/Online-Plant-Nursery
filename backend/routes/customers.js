const express = require('express');
const router = express.Router();
const Customer = require('../models/customerModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register new customer
/*router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const customer = await Customer.create({
            ...req.body,
            password: hashedPassword
        });
        res.status(201).json({ message: 'Customer registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});*/

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'All fields (email, password, name) are required' });
        }

        // Check if user already exists
        const existingCustomer = await Customer.getByEmail(email);
        if (existingCustomer) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new customer
        const newCustomer = await Customer.create({
            name,
            email,
            password: hashedPassword,
            // Add any other required fields from your customer model
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newCustomer.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return response without password hash
        res.status(201).json({
            message: 'Registration successful',
            token,
            customerId: newCustomer.id,
            customer: {
                id: newCustomer.id,
                name: newCustomer.name,
                email: newCustomer.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.getById(req.params.id);
        if (customer) {
            delete customer.password;
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await Customer.getByEmail(email);
        
        if (!customer) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, customer.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, customerId: customer.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 