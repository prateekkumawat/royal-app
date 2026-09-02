-- Create Databases if not exists
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS catalog_db;
CREATE DATABASE IF NOT EXISTS order_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- =========================================
-- AUTH DATABASE
-- =========================================
USE auth_db;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hashed passwords using bcrypt ($2a$10$...)
-- admin123 -> $2a$10$w8u7rK70zJ1Vw/Ea9G9h1.OQ8aK9b1s8f5z6x7c8v9b0n1m2k3l4
-- user123  -> $2a$10$gM0.yK4jVqS0lX8W9A0B1e7h2.OQ8aK9b1s8f5z6x7c8v9b0n1m2k3l4
-- We will insert compatible test users
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@ecommerce.com', '$2b$10$Y14X883mY/iG3K/Ww/4MeeKqTqfU2YF3G/Vn9Z6E3QxJ1Z2.3K4La', 'admin'),
('Alex Johnson', 'alex@example.com', '$2b$10$Y14X883mY/iG3K/Ww/4MeeKqTqfU2YF3G/Vn9Z6E3QxJ1Z2.3K4La', 'customer');

-- =========================================
-- CATALOG DATABASE
-- =========================================
USE catalog_db;

DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 10,
    rating DECIMAL(3, 2) DEFAULT 4.50,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Electronics', 'electronics', 'Latest gadgets, laptops, audio, and personal technology.'),
(2, 'Wearables', 'wearables', 'Smartwatches, fitness trackers, and modern apparel accessories.'),
(3, 'Home & Office', 'home-office', 'Smart home devices, ergonomic furniture, and desk setups.'),
(4, 'Audio Gear', 'audio-gear', 'High fidelity headphones, wireless earbuds, and spatial soundbars.');

INSERT INTO products (category_id, name, description, price, stock, rating, image_url) VALUES
(1, 'AeroBook Pro 15 Laptop', 'Ultra-thin 15-inch laptop powered by NextGen processor, 32GB RAM, 1TB NVMe SSD and 120Hz Retina Display.', 1299.99, 15, 4.85, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'),
(4, 'Pulse Pro Spatial Headphones', 'Noise-canceling over-ear wireless headphones with 40-hour battery life and customizable equalizer soundstages.', 299.99, 45, 4.90, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'),
(2, 'ChronoSync Smartwatch Ultra', 'Titanium frame smartwatch with continuous heart rate monitoring, dual-frequency GPS, and AMOLED display.', 349.50, 28, 4.75, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'),
(1, 'VisionPad OLED Tablet', '11-inch liquid retina tablet with stylus support, high color accuracy, and all-day battery performance.', 649.00, 20, 4.65, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'),
(4, 'SoundWave Studio Earbuds', 'True wireless spatial earbuds with active ANC, sweat resistance, and compact fast-charging case.', 149.99, 60, 4.70, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'),
(3, 'Lumina Smart Desk Lamp', 'Adjustable color spectrum desk lamp with wireless smartphone charging pad and integrated timer.', 89.95, 35, 4.55, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'),
(3, 'ErgoFlex Motion Chair', 'Ergonomic mesh office chair with lumbar dynamic support, 3D armrests, and recline lock.', 389.00, 12, 4.80, 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80'),
(2, 'Nexus VR Vision Headset', 'Immersive standalone virtual reality headset with 4K resolution per eye and ergonomic head strap.', 499.99, 18, 4.60, 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=800&q=80');

-- =========================================
-- ORDER DATABASE
-- =========================================
USE order_db;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Seed an initial sample order for demonstration
INSERT INTO orders (id, user_id, user_email, total_amount, shipping_address, status) VALUES
(1001, 2, 'alex@example.com', 449.98, '742 Evergreen Terrace, Springfield, OR', 'DELIVERED');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES
(1001, 5, 'SoundWave Studio Earbuds', 149.99, 1),
(1001, 2, 'Pulse Pro Spatial Headphones', 299.99, 1);
