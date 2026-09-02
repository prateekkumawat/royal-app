const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'order_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function getPool() {
    if (!pool) {
        let connected = false;
        let retries = 15;
        while (retries > 0 && !connected) {
            try {
                pool = mysql.createPool(dbConfig);
                const connection = await pool.getConnection();
                connection.release();
                connected = true;
                console.log(`[Order Service] Successfully connected to MySQL database '${dbConfig.database}'`);
            } catch (err) {
                console.log(`[Order Service] Waiting for MySQL... (${retries} attempts left). Error: ${err.message}`);
                retries--;
                await new Promise(res => setTimeout(res, 3000));
            }
        }
        if (!connected) {
            throw new Error(`[Order Service] Could not connect to database after retries.`);
        }
    }
    return pool;
}

module.exports = { getPool };
