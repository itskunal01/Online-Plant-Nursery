const db = require('../db');

class Order {
    static async create(order) {
        try {
            await db.query('START TRANSACTION');

            const [orderResult] = await db.query(
                'INSERT INTO orders (customer_id, total_amount, shipping_address) VALUES (?, ?, ?)',
                [order.customer_id, order.total_amount, order.shipping_address]
            );

            const orderId = orderResult.insertId;

            for (const item of order.items) {
                await db.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.price]
                );

                await db.query(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            await db.query('COMMIT');
            return orderId;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }

    static async getAll() {
        const [rows] = await db.query(`
            SELECT o.*, c.name as customer_name 
            FROM orders o 
            JOIN customers c ON o.customer_id = c.id
        `);
        return rows;
    }

    static async getById(id) {
        const [orders] = await db.query(`
            SELECT o.*, oi.*, p.name as product_name 
            FROM orders o 
            JOIN order_items oi ON o.id = oi.order_id 
            JOIN products p ON oi.product_id = p.id 
            WHERE o.id = ?
        `, [id]);
        return orders;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Order; 