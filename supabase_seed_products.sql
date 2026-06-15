-- Seed Products with Stock (100 units each)
-- Modified for MarketPOS (groceries) - with track_stock & stock_quantity

INSERT INTO products (name, name_ckb, price, category, barcode, image_url, is_available, track_stock, stock_quantity) VALUES
-- Snacks & Sweets
('Lays Potato Chips',   'چپسی لایس',            1000, 'Snacks & Sweets',       '8690624101234', '/chips_lays.png',        true, true, 100),
('Snickers Chocolate',  'شۆکۆلاتەی سنیکەرز',   1000, 'Snacks & Sweets',       '5000159461122', '/snickers_chocolate.png', true, true, 100),
('Oreo Biscuits',       'بسکویتی ئۆریۆ',        750,  'Snacks & Sweets',       '7622300336738', '/oreo_biscuit.png',       true, true, 100),

-- Beverages
('Pepsi Cola 250ml',    'پیپسی ٢٥٠ مل',         500,  'Beverages',             '012000000133',  '/pepsi_drink.png',        true, true, 100),
('Coca-Cola 250ml',     'کۆکاکۆلا ٢٥٠ مل',      500,  'Beverages',             '5449000000996', '/coca_cola.png',          true, true, 100),
('Tiger Energy Drink',  'وزەبەخشی تایگەر',      1000, 'Beverages',             '5900543015483', '/tiger.png',              true, true, 100),
('Water Bottle 500ml',  'ئاو ٥٠٠ مل',           250,  'Beverages',             '8692943016572', '/water_bottle_new.png',   true, true, 100),

-- Dairy & Cheese
('Almarai Fresh Milk 1L', 'شیری تازەی مەراعی ١ لتر', 2000, 'Dairy & Cheese',  '6281007000109', '/milk_carton.png',        true, true, 100),
('Puck Cheddar Cheese', 'پەنیر بووک',           3000, 'Dairy & Cheese',        '5707311029272', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=200', true, true, 100),

-- Pantry & Grains
('Basmati Rice 1kg',    'برنجی باسمەتی ١ کگم', 2500, 'Pantry & Grains',       '8906010061234', '/rice_bag.png',           true, true, 100),
('Sunflower Oil 1L',    'ڕۆنی گوڵەبەڕۆژە ١ لتر', 3500, 'Pantry & Grains',    '8690500123456', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=200', true, true, 100),

-- Bakery
('Toast Bread White',   'تۆستی سپی',            1500, 'Bakery',                '6223000412345', '/bread_loaf.png',         true, true, 100),
('Samoon 8pcs',         'سەموونی عێراقی ٨ دانە',1000, 'Bakery',               '0000000000888', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=200', true, true, 100),

-- Household & Cleaning
('Fairy Dish Soap 1L',  'زاهی فێری ١ لتر',     2250, 'Household & Cleaning',  '5410076964264', 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=200', true, true, 100),
('Dettol Handwash 200ml','دەستشۆری دیتۆڵ ٢٠٠ مل',2500,'Household & Cleaning','5011417572624', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=200', true, true, 100);
