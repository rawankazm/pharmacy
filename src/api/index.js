import { supabase } from '../supabase';

// --- Products ---
const PRODUCTS_KEY = 'mockProducts';
const IMAGES_KEY = 'mockProductImages';

const getLocalProducts = () => {
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const images = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    return products.map(p => ({
        ...p,
        image_url: images[String(p.id)] || p.image_url || ''
    }));
};

const saveLocalProducts = (list) => {
    try {
        const images = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
        const stripped = list.map(p => {
            if (p.image_url && p.image_url.startsWith('data:')) {
                images[String(p.id)] = p.image_url;
                return { ...p, image_url: '__local_image__' };
            }
            return p;
        });
        localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(stripped));
    } catch (e) {
        try {
            const stripped = list.map(p => ({ ...p, image_url: p.image_url?.startsWith('data:') ? '__local_image__' : (p.image_url || '') }));
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(stripped));
        } catch (e2) {
            console.error('localStorage quota exceeded', e2);
        }
    }
};

export const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    
    if (!error && data) {
        saveLocalProducts(data);
        return { data, error: null };
    }

    console.warn('Supabase unavailable, using localStorage products.', error);
    return { data: getLocalProducts(), error: null };
};

export const createProduct = async (productData) => {
    const { data, error } = await supabase.from('products').insert([productData]).select().single();

    if (!error && data) {
        const local = getLocalProducts();
        local.push(data);
        saveLocalProducts(local);
        return { data, error: null };
    }

    console.warn('Supabase unavailable, saving product to localStorage.', error);
    const local = getLocalProducts();
    const newId = local.length > 0 ? Math.max(...local.map(p => Number(p.id))) + 1 : Date.now();
    const newProduct = { ...productData, id: newId, created_at: new Date().toISOString() };
    local.push(newProduct);
    saveLocalProducts(local);
    return { data: newProduct, error: null };
};

export const updateProduct = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await supabase.from('products').update(changes).eq('id', id).select().single();

    if (!error && data) {
        const local = getLocalProducts();
        const idx = local.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) { local[idx] = { ...local[idx], ...changes }; saveLocalProducts(local); }
        return { data, error: null };
    }

    console.warn('Supabase unavailable, updating product in localStorage.', error);
    const local = getLocalProducts();
    const idx = local.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
        local[idx] = { ...local[idx], ...changes };
        saveLocalProducts(local);
        return { data: local[idx], error: null };
    }
    return { data: null, error: 'Product not found' };
};

export const deleteProduct = async (id) => {
    const { data, error } = await supabase.from('products').delete().eq('id', id).select().single();

    if (!error && data) {
        const local = getLocalProducts();
        saveLocalProducts(local.filter(p => String(p.id) !== String(id)));
        return { data, error: null };
    }

    console.warn('Supabase unavailable, deleting product from localStorage.', error);
    const local = getLocalProducts();
    saveLocalProducts(local.filter(p => String(p.id) !== String(id)));
    return { data: { id }, error: null };
};

// --- Tables ---
const TABLES_KEY = 'mockTables';
const getLocalTables = () => JSON.parse(localStorage.getItem(TABLES_KEY) || '[]');
const saveLocalTables = (list) => localStorage.setItem(TABLES_KEY, JSON.stringify(list));

export const getTables = async () => {
    const { data, error } = await supabase.from('tables').select('*').order('id', { ascending: true });
    if (!error && data) {
        saveLocalTables(data);
        return { data, error: null };
    }
    return { data: getLocalTables(), error: null };
};

export const createTable = async (tableData) => {
    const { data, error } = await supabase.from('tables').insert([{ ...tableData, status: 'available' }]).select().single();
    if (!error && data) {
        const local = getLocalTables();
        local.push(data);
        saveLocalTables(local);
        return { data, error: null };
    }
    const local = getLocalTables();
    const newTable = { ...tableData, id: Date.now(), status: 'available', created_at: new Date().toISOString() };
    local.push(newTable);
    saveLocalTables(local);
    return { data: newTable, error: null };
};

export const deleteTable = async (id) => {
    const { data, error } = await supabase.from('tables').delete().eq('id', id).select().single();
    if (!error && data) {
        const local = getLocalTables();
        saveLocalTables(local.filter(t => String(t.id) !== String(id)));
        return { data, error: null };
    }
    const local = getLocalTables();
    saveLocalTables(local.filter(t => String(t.id) !== String(id)));
    return { data: { id }, error: null };
};

export const assignCaptain = async (tableId, captainId) => {
    const { data, error } = await supabase.from('tables').update({ captain_id: captainId }).eq('id', tableId).select().single();
    if (!error && data) {
        const local = getLocalTables();
        const idx = local.findIndex(t => String(t.id) === String(tableId));
        if (idx !== -1) { local[idx].captain_id = captainId; saveLocalTables(local); }
        return { data, error: null };
    }
    return { data: null, error: 'Table not found' };
};

// --- Captains ---
const CAPTAINS_KEY = 'mockCaptains';
const getLocalCaptains = () => JSON.parse(localStorage.getItem(CAPTAINS_KEY) || '[]');
const saveLocalCaptains = (list) => localStorage.setItem(CAPTAINS_KEY, JSON.stringify(list));

export const getCaptains = async () => {
    const { data, error } = await supabase.from('captains').select('*').order('id', { ascending: true });
    if (!error && data) {
        saveLocalCaptains(data);
        return { data, error: null };
    }
    return { data: getLocalCaptains(), error: null };
};

export const createCaptain = async (captainData) => {
    const { data, error } = await supabase.from('captains').insert([captainData]).select().single();
    if (!error && data) {
        const local = getLocalCaptains();
        local.push(data);
        saveLocalCaptains(local);
        return { data, error: null };
    }
    const local = getLocalCaptains();
    const newCaptain = { id: Date.now(), ...captainData, created_at: new Date().toISOString() };
    local.push(newCaptain);
    saveLocalCaptains(local);
    return { data: newCaptain, error: null };
};

export const updateCaptain = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await supabase.from('captains').update(changes).eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: null, error: 'Captain not found' };
};

export const deleteCaptain = async (id) => {
    const { data, error } = await supabase.from('captains').delete().eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: { id }, error: null };
};

// --- Cashiers ---
const CASHIERS_KEY = 'mockCashiers';
const getLocalCashiers = () => JSON.parse(localStorage.getItem(CASHIERS_KEY) || '[]');
const saveLocalCashiers = (list) => localStorage.setItem(CASHIERS_KEY, JSON.stringify(list));

export const getCashiers = async () => {
    const { data, error } = await supabase.from('cashiers').select('*').order('id', { ascending: true });
    if (!error && data) return { data, error: null };
    const local = getLocalCashiers();
    if (local.length === 0) {
        const seed = [{ id: 1, name: 'Cashier 1', code: '1234', created_at: new Date().toISOString() }];
        saveLocalCashiers(seed);
        return { data: seed, error: null };
    }
    return { data: local, error: null };
};

export const createCashier = async (cashierData) => {
    const { data, error } = await supabase.from('cashiers').insert([cashierData]).select().single();
    if (!error && data) return { data, error: null };
    const local = getLocalCashiers();
    const newCashier = { ...cashierData, id: Date.now(), created_at: new Date().toISOString() };
    local.push(newCashier);
    saveLocalCashiers(local);
    return { data: newCashier, error: null };
};

export const updateCashier = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await supabase.from('cashiers').update(changes).eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: null, error: 'Cashier not found' };
};

export const deleteCashier = async (id) => {
    const { data, error } = await supabase.from('cashiers').delete().eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: { id }, error: null };
};

// --- Debts ---
const DEBTS_KEY = 'mockDebts';
const getLocalDebts = () => JSON.parse(localStorage.getItem(DEBTS_KEY) || '[]');
const saveLocalDebts = (list) => localStorage.setItem(DEBTS_KEY, JSON.stringify(list));

export const fetchDebts = async () => {
    const { data, error } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        saveLocalDebts(data);
        return { data, error: null };
    }
    return { data: getLocalDebts(), error: null };
};

export const createDebt = async (debtData) => {
    const { data, error } = await supabase.from('debts').insert([debtData]).select().single();
    if (!error && data) {
        const local = getLocalDebts();
        local.unshift(data);
        saveLocalDebts(local);
        return { data, error: null };
    }
    const local = getLocalDebts();
    const newDebt = { ...debtData, id: Date.now(), created_at: new Date().toISOString() };
    local.unshift(newDebt);
    saveLocalDebts(local);
    return { data: newDebt, error: null };
};

export const updateDebt = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await supabase.from('debts').update(changes).eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: null, error: 'Error' };
};

export const deleteDebt = async (id) => {
    const { data, error } = await supabase.from('debts').delete().eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: { id }, error: null };
};

// --- Orders / Sales ---
const ORDERS_KEY = 'mockOrders';
const SALES_KEY = 'mockSales';

const getLocalOrders = () => JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
const saveLocalOrders = (list) => localStorage.setItem(ORDERS_KEY, JSON.stringify(list));

export const getOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        saveLocalOrders(data);
        return { data, error: null };
    }
    return { data: getLocalOrders(), error: null };
};

export const createOrder = async (orderData) => {
    const payload = {
        total: orderData.total || 0,
        status: orderData.status || 'pending',
        items: orderData.items || [],
        table_id: orderData.table_id || null,
        captain_id: orderData.captain_id || null,
        created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase.from('orders').insert([payload]).select().single();
    if (!error && data) {
        const local = getLocalOrders();
        local.unshift(data);
        saveLocalOrders(local);
        return { data, error: null };
    }
    const local = getLocalOrders();
    const newOrder = { ...payload, id: Date.now() };
    local.unshift(newOrder);
    saveLocalOrders(local);
    return { data: newOrder, error: null };
};

export const updateOrder = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await supabase.from('orders').update(changes).eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: null, error: 'Order not found' };
};

export const payOrder = async (id, cashierInfo) => {
    // 1. Update order status
    const { data: orderData, error: fetchErr } = await supabase.from('orders').select('*').eq('id', id).single();
    if (fetchErr || !orderData) return { data: null, error: 'Order not found' };

    await updateOrder(id, { status: 'completed' });

    // 2. Create Sale
    const salePayload = {
        order_id: id,
        total_amount: orderData.total,
        cashier_id: cashierInfo?.id || null,
        cashier_name: cashierInfo?.name || 'Unknown',
        items: orderData.items,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('sales').insert([salePayload]).select().single();
    if (!error && data) return { data, error: null };
    
    return { data: salePayload, error: null };
};

export const getSales = async () => {
    const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (!error && data) return { data, error: null };
    return { data: [], error: null };
};

// --- Expenses ---
const EXPENSES_KEY = 'mockExpenses';
const getLocalExpenses = () => JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
const saveLocalExpenses = (list) => localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));

export const fetchExpenses = async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        saveLocalExpenses(data);
        return { data, error: null };
    }
    return { data: getLocalExpenses(), error: null };
};

export const createExpense = async (expenseData) => {
    const { data, error } = await supabase.from('expenses').insert([expenseData]).select().single();
    if (!error && data) {
        const local = getLocalExpenses();
        local.unshift(data);
        saveLocalExpenses(local);
        return { data, error: null };
    }
    const local = getLocalExpenses();
    const newExpense = { ...expenseData, id: Date.now(), created_at: new Date().toISOString() };
    local.unshift(newExpense);
    saveLocalExpenses(local);
    return { data: newExpense, error: null };
};

export const deleteExpense = async (id) => {
    const { data, error } = await supabase.from('expenses').delete().eq('id', id).select().single();
    if (!error && data) return { data, error: null };
    return { data: { id }, error: null };
};

export const api = {
    getProducts: fetchProducts,
    getOrders,
    getTables,
    getCaptains,
    getCashiers
};
