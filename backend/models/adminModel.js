const db = require('../db');
const bcrypt = require('bcrypt');

class Admin {
    static async login(email, password) {
        try {
            console.log('Attempting to find admin with email:', email);
            const [admins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
            const admin = admins[0];
            
            if (!admin) {
                console.log('No admin found with email:', email);
                return null;
            }
            
            console.log('Admin found, verifying password...');
            const validPassword = await bcrypt.compare(password, admin.password);
            
            if (!validPassword) {
                console.log('Invalid password');
                return null;
            }
            
            console.log('Password verified successfully');
            return admin;
        } catch (error) {
            console.error('Error in admin login:', error);
            throw error;
        }
    }
}

module.exports = Admin; 