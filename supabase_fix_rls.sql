-- 1. FIX CASHIERS TABLE (Already done, but running again is safe)
ALTER TABLE cashiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public cashiers select" ON cashiers FOR SELECT USING (true);
CREATE POLICY "Public cashiers insert" ON cashiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public cashiers update" ON cashiers FOR UPDATE USING (true);
CREATE POLICY "Public cashiers delete" ON cashiers FOR DELETE USING (true);

-- 2. FIX TABLES TABLE (This is why tables are missing)
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public tables select" ON tables FOR SELECT USING (true);
CREATE POLICY "Public tables insert" ON tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Public tables update" ON tables FOR UPDATE USING (true);
CREATE POLICY "Public tables delete" ON tables FOR DELETE USING (true);

-- 3. FIX CAPTAINS TABLE (Needed for table assignments)
ALTER TABLE captains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public captains select" ON captains FOR SELECT USING (true);
CREATE POLICY "Public captains insert" ON captains FOR INSERT WITH CHECK (true);
CREATE POLICY "Public captains update" ON captains FOR UPDATE USING (true);
CREATE POLICY "Public captains delete" ON captains FOR DELETE USING (true);

-- 4. FIX PRODUCTS TABLE
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products select" ON products FOR SELECT USING (true);
CREATE POLICY "Public products insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public products update" ON products FOR UPDATE USING (true);
CREATE POLICY "Public products delete" ON products FOR DELETE USING (true);

-- 5. FIX ORDERS & ORDER_ITEMS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public orders select" ON orders FOR SELECT USING (true);
CREATE POLICY "Public orders insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders update" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public orders delete" ON orders FOR DELETE USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public order_items select" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public order_items insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public order_items update" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Public order_items delete" ON order_items FOR DELETE USING (true);
