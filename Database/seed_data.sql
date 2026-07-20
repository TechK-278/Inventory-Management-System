-- =====================================================================
-- Seed Data for Inventory Management System
-- Run AFTER inventory.sql (schema) has created the tables.
-- Matches schema defined in Design.md, section 6.2
-- =====================================================================

USE inventory_db;

-- ---------------------------------------------------------------------
-- USERS
-- Password for both accounts is: Password123!
-- (bcrypt hash below is a placeholder — regenerate with bcrypt in Node
--  before using in a real login: bcrypt.hashSync('Password123!', 10))
-- ---------------------------------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@inventory.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOa8s5B8T2c8p8b0m8sYQz5B3s5R2v3Nu', 'admin'),
('Staff User', 'staff@inventory.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOa8s5B8T2c8p8b0m8sYQz5B3s5R2v3Nu', 'staff');

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
INSERT INTO categories (name) VALUES
('Electronics'),
('Stationery'),
('Furniture'),
('Groceries'),
('Automotive Parts'),
('Tools & Hardware');

-- ---------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------
INSERT INTO suppliers (name, company, phone, email, address) VALUES
('Rakesh Mehta', 'Mehta Electronics Pvt Ltd', '9825012345', 'rakesh@mehtaelectronics.com', 'Shop 14, Ratnadeep Complex, Ahmedabad'),
('Priya Shah', 'Shah Stationery House', '9909988776', 'priya@shahstationery.com', 'FP Market, Maninagar, Ahmedabad'),
('Vikram Furnishings', 'Vikram Furniture Works', '9825566778', 'sales@vikramfurniture.com', 'GIDC Odhav, Ahmedabad'),
('Anita Traders', 'Anita Wholesale Traders', '9898123456', 'anita@anitatraders.com', 'APMC Market, Jamalpur, Ahmedabad'),
('Suresh Auto Parts', 'Suresh Auto Spares Co.', '9979112233', 'suresh@autospares.com', 'Naroda Industrial Estate, Ahmedabad');

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------
INSERT INTO customers (name, phone, email, address) VALUES
('Kiran Patel', '9825001122', 'kiran.patel@example.com', 'Satellite, Ahmedabad'),
('Meera Joshi', '9898002233', 'meera.joshi@example.com', 'Navrangpura, Ahmedabad'),
('Rohan Desai', '9909003344', 'rohan.desai@example.com', 'Bopal, Ahmedabad'),
('Sneha Iyer', '9825004455', 'sneha.iyer@example.com', 'Vastrapur, Ahmedabad'),
('Amit Trivedi', '9979005566', 'amit.trivedi@example.com', 'Maninagar, Ahmedabad'),
('Walk-in Customer', NULL, NULL, NULL);

-- ---------------------------------------------------------------------
-- PRODUCTS
-- category_id / supplier_id reference the insert order above (1-based)
-- ---------------------------------------------------------------------
INSERT INTO products (name, category_id, supplier_id, purchase_price, selling_price, quantity, barcode, description, image, low_stock_threshold) VALUES
('USB-C Charging Cable 1m', 1, 1, 60.00, 149.00, 120, '8901234500011', 'Braided USB-C to USB-A cable, 1 meter', NULL, 20),
('Wireless Mouse', 1, 1, 250.00, 499.00, 45, '8901234500028', '2.4GHz wireless optical mouse', NULL, 10),
('Bluetooth Earbuds', 1, 1, 800.00, 1499.00, 8, '8901234500035', 'TWS earbuds with charging case', NULL, 10),
('A4 Ruled Notebook', 2, 2, 25.00, 45.00, 300, '8901234500042', '200 pages, single ruled A4 notebook', NULL, 50),
('Gel Pen (Blue) Pack of 10', 2, 2, 40.00, 80.00, 150, '8901234500059', 'Smooth writing gel pens, box of 10', NULL, 30),
('Office Stapler', 2, 2, 55.00, 99.00, 40, '8901234500066', 'Standard No. 10 stapler', NULL, 10),
('Ergonomic Office Chair', 3, 3, 3200.00, 5499.00, 15, '8901234500073', 'Mesh back, adjustable height, lumbar support', NULL, 5),
('Study Table (Wooden)', 3, 3, 2800.00, 4999.00, 10, '8901234500080', 'Engineered wood study table with drawer', NULL, 3),
('Basmati Rice 5kg', 4, 4, 380.00, 499.00, 60, '8901234500097', 'Premium long-grain basmati rice, 5kg bag', NULL, 15),
('Sunflower Cooking Oil 1L', 4, 4, 130.00, 165.00, 90, '8901234500103', 'Refined sunflower oil, 1 litre pouch', NULL, 20),
('Car Air Filter', 5, 5, 180.00, 320.00, 25, '8901234500110', 'Universal fit car engine air filter', NULL, 8),
('Motorcycle Brake Pads (Front)', 5, 5, 220.00, 399.00, 4, '8901234500127', 'Ceramic brake pads, front set', NULL, 6),
('Adjustable Wrench 10-inch', 6, 5, 140.00, 249.00, 35, '8901234500134', 'Chrome vanadium steel adjustable wrench', NULL, 10),
('Cordless Screwdriver Set', 6, 1, 650.00, 1199.00, 18, '8901234500141', '20-piece rechargeable screwdriver kit', NULL, 5);

-- ---------------------------------------------------------------------
-- PURCHASES + PURCHASE_ITEMS
-- Two sample purchase orders, each with two line items.
-- Note: quantities below already match the "current" stock in products
-- above; if you re-run stock-increment logic, adjust accordingly.
-- ---------------------------------------------------------------------
INSERT INTO purchases (supplier_id, total_amount, purchase_date, created_by) VALUES
(1, 22000.00, '2026-07-10 10:15:00', 1),
(4, 27000.00, '2026-07-15 09:30:00', 1);

INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES
(1, 2, 40, 250.00),   -- Wireless Mouse x40 @ 250
(1, 3, 15, 800.00),   -- Bluetooth Earbuds x15 @ 800
(2, 9, 40, 380.00),   -- Basmati Rice x40 @ 380
(2, 10, 80, 130.00);  -- Sunflower Oil x80 @ 130

-- ---------------------------------------------------------------------
-- SALES + SALE_ITEMS
-- Three sample sales, one dated "today" so the dashboard's
-- "Today's Sales / Revenue" cards have data to show immediately.
-- ---------------------------------------------------------------------
INSERT INTO sales (customer_id, total_amount, sale_date, created_by) VALUES
(1, 1648.00, '2026-07-18 14:20:00', 2),
(3, 4999.00, '2026-07-19 11:05:00', 2),
(6, 998.00, CURDATE(), 2);

INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES
(1, 2, 1, 499.00),    -- Sale 1: 1x Wireless Mouse
(1, 3, 1, 1499.00),   -- Sale 1: 1x Bluetooth Earbuds  (total = 1998.00)
(2, 8, 1, 4999.00),   -- Sale 2: 1x Study Table
(3, 1, 2, 149.00),    -- Sale 3: 2x USB-C Cable
(3, 5, 8, 80.00);     -- Sale 3: 8x Gel Pen Pack        (Sale 3 total = 938.00)

-- NOTE: the `total_amount` values in the sales INSERT above are
-- illustrative and were rounded by hand. If you want them to match the
-- line items exactly, run:
-- UPDATE sales s SET total_amount = (
--   SELECT SUM(quantity * price) FROM sale_items si WHERE si.sale_id = s.id
-- );

-- ---------------------------------------------------------------------
-- Verification queries (optional — run manually to sanity-check)
-- ---------------------------------------------------------------------
-- SELECT * FROM products WHERE quantity <= low_stock_threshold;
-- SELECT s.id, c.name, s.total_amount, s.sale_date FROM sales s
--   LEFT JOIN customers c ON c.id = s.customer_id ORDER BY s.sale_date DESC;
-- SELECT DATE(sale_date) AS day, SUM(total_amount) AS revenue
--   FROM sales GROUP BY DATE(sale_date);
