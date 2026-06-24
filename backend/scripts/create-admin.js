require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db');

async function createAdmin() {
    try {
        // Drop existing admin table
        await db.query('DROP TABLE IF EXISTS admins');

        // Create admins table
        await db.query(`
            CREATE TABLE admins (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create default admin
        const email = 'admin@example.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO admins (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        console.log('Admin user created successfully');
        console.log('Email:', email);
        console.log('Password:', password);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin(); 