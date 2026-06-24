const db = require('../db');

class Product {
    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM products');
            console.log('Database response:', rows);
            return rows;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(product) {
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
            [product.name, product.description, product.price, product.category, product.image_url, product.stock_quantity]
        );
        return { id: result.insertId, ...product };
    }

    static async update(id, product) {
        const [result] = await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock_quantity = ? WHERE id = ?',
            [product.name, product.description, product.price, product.category, product.image_url, product.stock_quantity, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async search(query, category, minPrice, maxPrice) {
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (query) {
            sql += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (minPrice) {
            sql += ' AND price >= ?';
            params.push(minPrice);
        }

        if (maxPrice) {
            sql += ' AND price <= ?';
            params.push(maxPrice);
        }

        const [rows] = await db.query(sql, params);
        return rows;
    }
}

module.exports = Product; 