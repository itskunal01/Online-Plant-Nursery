const db = require('../db');

class Customer {
    static async create(customer) {
        const [result] = await db.query(
            'INSERT INTO customers (name, email, password, address, phone) VALUES (?, ?, ?, ?, ?)',
            [customer.name, customer.email, customer.password, customer.address, customer.phone]
        );
        return { id: result.insertId, ...customer };
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
        return rows[0];
    }

    static async getByEmail(email) {
        const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
        return rows[0];
    }
}

module.exports = Customer; 