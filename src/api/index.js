import { nhostQuery } from '../nhost';

// Helper to standardise response format
const wrapRequest = async (requestFn) => {
    try {
        const { data, error } = await requestFn();
        if (error) throw error;
        return { data };
    } catch (error) {
        console.error("API Request Failed:", error);
        return {
            data: null,
            error: error.message || error
        };
    }
};

// --- Products ---
const PRODUCTS_KEY = 'mockProducts';
const IMAGES_KEY = 'mockProductImages';

// Default seed products with 100 units each - shown when no Nhost connection
const DEFAULT_PRODUCTS = [
    { id: 1001, name: 'Paracetamol 500mg', name_ckb: 'پاراسیتامۆڵ ٥٠٠ ملگم', category: 'Dairy & Cheese', price: 1000, barcode: '8690624101234', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Paracetamol_acetaminophen_500_mg_pills.jpg', is_available: true, track_stock: true, stock_quantity: 100, description: 'box', created_at: new Date().toISOString() },
    { id: 1002, name: 'Panadol Extra', name_ckb: 'پانادۆڵ ئیكسترا', category: 'Dairy & Cheese', price: 2000, barcode: '5000159461122', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Panadol_500_mg.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1003, name: 'Amoxicillin 500mg', name_ckb: 'ئەمۆکسیسیلین ٥٠٠ ملگم', category: 'Dairy & Cheese', price: 3500, barcode: '7622300336738', image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Amoxicillin_500mg_capsules_on_a_plate_%28Sandoz%29.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1004, name: 'Cough Syrup 100ml', name_ckb: 'شرووبی کۆکە ١٠٠ مل', category: 'Beverages', price: 4000, barcode: '012000000133', image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Melrosum_forte.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1005, name: 'Vitamin C Effervescent', name_ckb: 'ڤیتامین سی حەپی تواوە', category: 'Snacks & Sweets', price: 3000, barcode: '5449000000996', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Brausetablette.JPG', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1006, name: 'Diclofenac Injection', name_ckb: 'دەرزی دیکلۆفیناک', category: 'Pantry & Grains', price: 1500, barcode: '5900543015483', image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Diclofenac_sodium_IV_75mg.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1007, name: 'Insulin Syringe', name_ckb: 'سرنجی ئەنسۆلین', category: 'Pantry & Grains', price: 500, barcode: '8692943016572', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Insulin_syringe_foto.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1008, name: 'Medical Mask 50pcs', name_ckb: 'دەمامکی پزیشکی ٥٠ دانە', category: 'Bakery', price: 5000, barcode: '6281007000109', image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Blue_Medical_Mask.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1009, name: 'Bandages Assorted', name_ckb: 'لەزگەی برینپێچ جۆراوجۆر', category: 'Bakery', price: 1500, barcode: '5707311029272', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bandage.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1010, name: 'Voltaren Emulgel', name_ckb: 'مەرهەمی ڤۆڵتارین', category: 'Household & Cleaning', price: 6500, barcode: '8906010061234', image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Diclofenac_Topical_Gel.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
    { id: 1011, name: 'Burn Ointment', name_ckb: 'مەرهەمی سووتاوی', category: 'Household & Cleaning', price: 4000, barcode: '8690500123456', image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Tube_of_hydrocortisone_cream.jpg', is_available: true, track_stock: true, stock_quantity: 100, created_at: new Date().toISOString() },
];

// Cleanup old market products that might be cached in localStorage
const cleanupOldProducts = () => {
    try {
        const oldProductNames = ["Lays Potato Chips", "Snickers Chocolate", "Oreo Biscuits", "Pepsi Cola 250ml", "Coca-Cola 250ml", "Tiger Energy Drink", "Water Bottle 500ml", "Almarai Fresh Milk 1L", "Puck Cheddar Cheese", "Basmati Rice 1kg", "Sunflower Oil 1L", "Toast Bread White", "Samoon 8pcs", "Fairy Dish Soap 1L", "Dettol Handwash 200ml"];
        
        const existing = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const filtered = existing.filter(p => !oldProductNames.includes(p.name));
        
        if (existing.length !== filtered.length) {
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
            console.info(`🧹 Cleaned up ${existing.length - filtered.length} old market products.`);
        }
    } catch (e) {
        console.warn('Could not cleanup old products:', e);
    }
};
// Run cleanup first
cleanupOldProducts();

// Merge default products into localStorage and migrate/update broken image URLs
const initDefaultProducts = () => {
    try {
        const existing = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        
        let modified = false;
        const updated = existing.map(p => {
            const defaultProd = DEFAULT_PRODUCTS.find(dp => dp.id === p.id || dp.barcode === p.barcode);
            if (defaultProd) {
                // If it has a broken/null image, or uses unsplash photo, update it to the new working one
                if (!p.image_url || p.image_url.includes('unsplash.com') || p.image_url.includes('photo-')) {
                    p.image_url = defaultProd.image_url;
                    modified = true;
                }
            }
            return p;
        });

        const existingBarcodes = new Set(updated.map(p => p.barcode).filter(Boolean));
        const toAdd = DEFAULT_PRODUCTS.filter(p => !existingBarcodes.has(p.barcode));
        
        if (toAdd.length > 0 || modified) {
            const merged = [...updated, ...toAdd];
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(merged));
            console.info(`✅ Initialized/Updated default products in localStorage.`);
        }
    } catch (e) {
        console.warn('Could not initialize default products:', e);
    }
};
// Run on import
initDefaultProducts();

const getLocalProducts = () => {
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const images = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    // Re-attach stored images to products
    return products.map(p => ({
        ...p,
        image_url: images[String(p.id)] || p.image_url || ''
    }));
};

export const saveLocalProducts = (list) => {
    try {
        // Separate base64 images from product list to avoid quota errors
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
        // If quota exceeded, try saving without images
        try {
            const stripped = list.map(p => ({ ...p, image_url: p.image_url?.startsWith('data:') ? '__local_image__' : (p.image_url || '') }));
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(stripped));
        } catch (e2) {
            console.error('localStorage quota exceeded even without images', e2);
        }
    }
};

// Insert missing default products into Nhost (fire & forget)
const seedMissingToNhost = async (nhostProducts) => {
    const existingBarcodes = new Set(nhostProducts.map(p => p.barcode).filter(Boolean));
    const missing = DEFAULT_PRODUCTS.filter(p => !existingBarcodes.has(p.barcode));
    if (missing.length === 0) return [];

    console.info(`🌱 Seeding ${missing.length} missing products into Nhost...`);
    const inserted = [];
    for (const p of missing) {
        const { id, ...data } = p;
        const res = await nhostQuery(`
            mutation SeedProduct($name: String!, $name_ckb: String, $category: String!, $price: numeric!, $barcode: String, $image_url: String, $is_available: Boolean, $track_stock: Boolean, $stock_quantity: Int) {
                insert_products_one(object: {
                    name: $name, name_ckb: $name_ckb, category: $category,
                    price: $price, barcode: $barcode, image_url: $image_url,
                    is_available: $is_available, track_stock: $track_stock, stock_quantity: $stock_quantity
                }) { id name name_ckb category price barcode image_url is_available track_stock stock_quantity created_at }
            }
        `, data);
        if (!res.error && res.data?.insert_products_one) {
            inserted.push(res.data.insert_products_one);
        } else {
            // If track_stock not supported, try basic
            const { track_stock, stock_quantity, ...basic } = data;
            const res2 = await nhostQuery(`
                mutation SeedProductBasic($name: String!, $name_ckb: String, $category: String!, $price: numeric!, $barcode: String, $image_url: String, $is_available: Boolean) {
                    insert_products_one(object: {
                        name: $name, name_ckb: $name_ckb, category: $category,
                        price: $price, barcode: $barcode, image_url: $image_url, is_available: $is_available
                    }) { id name name_ckb category price barcode image_url is_available created_at }
                }
            `, basic);
            if (!res2.error && res2.data?.insert_products_one) inserted.push(res2.data.insert_products_one);
        }
    }
    console.info(`✅ Seeded ${inserted.length} products into Nhost.`);
    return inserted;
};

export const fetchProducts = async () => {
    let res = await nhostQuery(`
        query GetProducts {
            products(order_by: {id: asc}) {
                id
                name
                category
                price
                image_url
                description
                name_ckb
                barcode
                is_available
                track_stock
                stock_quantity
                created_at
            }
        }
    `);
    
    if (!res.error && res.data?.products) {
        const nhostProducts = res.data.products;
        // Seed any missing default products into Nhost, then merge
        const seeded = await seedMissingToNhost(nhostProducts);
        const merged = [...nhostProducts, ...seeded];
        saveLocalProducts(merged);
        return { data: merged, error: null };
    }

    if (res.error && (res.error.includes("track_stock") || res.error.includes("stock_quantity") || res.error.includes("field"))) {
        console.warn("Nhost products table is missing stock columns. Falling back to basic product fields.");
        res = await nhostQuery(`
            query GetProductsBasic {
                products(order_by: {id: asc}) {
                    id
                    name
                    category
                    price
                    image_url
                    description
                    name_ckb
                    barcode
                    is_available
                    created_at
                }
            }
        `);
        if (!res.error && res.data?.products) {
            const nhostProducts = res.data.products;
            const seeded = await seedMissingToNhost(nhostProducts);
            const merged = [...nhostProducts, ...seeded];
            saveLocalProducts(merged);
            return { data: merged, error: null };
        }
    }

    // Fallback to localStorage
    console.warn('Nhost unavailable, using localStorage products.');
    return { data: getLocalProducts(), error: null };
};


export const createProduct = async (productData) => {
    const { track_stock, stock_quantity, ...basicData } = productData;
    let res = await nhostQuery(`
        mutation CreateProduct($name: String!, $category: String!, $price: numeric!, $image_url: String, $description: String, $name_ckb: String, $barcode: String, $is_available: Boolean, $track_stock: Boolean, $stock_quantity: Int) {
            insert_products_one(object: {
                name: $name,
                category: $category,
                price: $price,
                image_url: $image_url,
                description: $description,
                name_ckb: $name_ckb,
                barcode: $barcode,
                is_available: $is_available,
                track_stock: $track_stock,
                stock_quantity: $stock_quantity
            }) {
                id
                name
                category
                price
                image_url
                description
                name_ckb
                barcode
                is_available
                track_stock
                stock_quantity
                created_at
            }
        }
    `, productData);

    if (res.error && (res.error.includes("track_stock") || res.error.includes("stock_quantity") || res.error.includes("variable"))) {
        console.warn("Nhost create product failed due to stock fields, retrying basic create.");
        res = await nhostQuery(`
            mutation CreateProductBasic($name: String!, $category: String!, $price: numeric!, $image_url: String, $description: String, $name_ckb: String, $barcode: String, $is_available: Boolean) {
                insert_products_one(object: {
                    name: $name,
                    category: $category,
                    price: $price,
                    image_url: $image_url,
                    description: $description,
                    name_ckb: $name_ckb,
                    barcode: $barcode,
                    is_available: $is_available
                }) {
                    id
                    name
                    category
                    price
                    image_url
                    description
                    name_ckb
                    barcode
                    is_available
                    created_at
                }
            }
        `, basicData);
    }

    if (!res.error && res.data?.insert_products_one) {
        // Also update localStorage cache
        const local = getLocalProducts();
        local.push(res.data.insert_products_one);
        saveLocalProducts(local);
        return { data: res.data.insert_products_one, error: null };
    }

    // Fallback to localStorage
    console.warn('Nhost unavailable, saving product to localStorage.');
    const local = getLocalProducts();
    const newId = local.length > 0 ? Math.max(...local.map(p => Number(p.id))) + 1 : Date.now();
    const newProduct = {
        ...productData,
        id: newId,
        is_available: productData.is_available !== false,
        created_at: new Date().toISOString()
    };
    local.push(newProduct);
    saveLocalProducts(local);
    return { data: newProduct, error: null };
};

export const updateProduct = async (id, updates) => {
    const { id: _, ...changes } = updates;
    let res = await nhostQuery(`
        mutation UpdateProduct($id: bigint!, $changes: products_set_input!) {
            update_products_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                name
                category
                price
                image_url
                description
                name_ckb
                barcode
                is_available
                track_stock
                stock_quantity
                created_at
            }
        }
    `, { id, changes });

    if (res.error && (res.error.includes("track_stock") || res.error.includes("stock_quantity") || res.error.includes("field"))) {
        console.warn("Nhost update product failed due to stock fields, retrying basic update.");
        const { track_stock, stock_quantity, ...basicChanges } = changes;
        res = await nhostQuery(`
            mutation UpdateProductBasic($id: bigint!, $changes: products_set_input!) {
                update_products_by_pk(pk_columns: {id: $id}, _set: $changes) {
                    id
                    name
                    category
                    price
                    image_url
                    description
                    name_ckb
                    barcode
                    is_available
                    created_at
                }
            }
        `, { id, changes: basicChanges });
    }

    if (!res.error && res.data?.update_products_by_pk) {
        // Sync to localStorage cache
        const local = getLocalProducts();
        const idx = local.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) { local[idx] = { ...local[idx], ...changes }; saveLocalProducts(local); }
        return { data: res.data.update_products_by_pk, error: null };
    }

    // Fallback to localStorage
    console.warn('Nhost unavailable, updating product in localStorage.');
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
    const { data, error } = await nhostQuery(`
        mutation DeleteProduct($id: bigint!) {
            delete_products_by_pk(id: $id) {
                id
            }
        }
    `, { id });

    if (!error && data?.delete_products_by_pk) {
        const local = getLocalProducts();
        saveLocalProducts(local.filter(p => String(p.id) !== String(id)));
        return { data: data.delete_products_by_pk, error: null };
    }

    // Fallback to localStorage
    console.warn('Nhost unavailable, deleting product from localStorage.');
    const local = getLocalProducts();
    saveLocalProducts(local.filter(p => String(p.id) !== String(id)));
    return { data: { id }, error: null };
};

// --- Tables ---
const TABLES_KEY = 'mockTables';
const getLocalTables = () => JSON.parse(localStorage.getItem(TABLES_KEY) || '[]');
const saveLocalTables = (list) => localStorage.setItem(TABLES_KEY, JSON.stringify(list));

export const getTables = async () => {
    const { data, error } = await nhostQuery(`
        query GetTables {
            tables(order_by: {id: asc}) {
                id
                name
                captain_id
                status
                code_pin
                created_at
            }
        }
    `);
    if (!error && data?.tables) {
        saveLocalTables(data.tables);
        return { data: data.tables, error: null };
    }
    console.warn('Nhost unavailable, getting tables from localStorage.');
    return { data: getLocalTables(), error: null };
};

export const createTable = async (tableData) => {
    const { data, error } = await nhostQuery(`
        mutation CreateTable($name: String!, $code_pin: String) {
            insert_tables_one(object: {
                name: $name,
                status: "available",
                code_pin: $code_pin
            }) {
                id
                name
                captain_id
                status
                code_pin
                created_at
            }
        }
    `, tableData);

    if (!error && data?.insert_tables_one) {
        const local = getLocalTables();
        local.push(data.insert_tables_one);
        saveLocalTables(local);
        return { data: data.insert_tables_one, error: null };
    }

    console.warn('Nhost unavailable, creating table in localStorage.');
    const local = getLocalTables();
    const newTable = {
        id: Date.now(),
        name: tableData.name,
        code_pin: tableData.code_pin,
        status: 'available',
        captain_id: null,
        created_at: new Date().toISOString()
    };
    local.push(newTable);
    saveLocalTables(local);
    return { data: newTable, error: null };
};

export const deleteTable = async (id) => {
    const { data, error } = await nhostQuery(`
        mutation DeleteTable($id: bigint!) {
            delete_tables_by_pk(id: $id) {
                id
            }
        }
    `, { id });

    if (!error && data?.delete_tables_by_pk) {
        const local = getLocalTables();
        saveLocalTables(local.filter(t => String(t.id) !== String(id)));
        return { data: data.delete_tables_by_pk, error: null };
    }

    console.warn('Nhost unavailable, deleting table from localStorage.');
    const local = getLocalTables();
    saveLocalTables(local.filter(t => String(t.id) !== String(id)));
    return { data: { id }, error: null };
};

export const assignCaptain = async (tableId, captainId) => {
    const { data, error } = await nhostQuery(`
        mutation AssignCaptain($id: bigint!, $captain_id: bigint) {
            update_tables_by_pk(pk_columns: {id: $id}, _set: {captain_id: $captain_id}) {
                id
                captain_id
            }
        }
    `, { id: tableId, captain_id: captainId });

    if (!error && data?.update_tables_by_pk) {
        const local = getLocalTables();
        const idx = local.findIndex(t => String(t.id) === String(tableId));
        if (idx !== -1) {
            local[idx].captain_id = captainId;
            saveLocalTables(local);
        }
        return { data: data.update_tables_by_pk, error: null };
    }

    console.warn('Nhost unavailable, assigning captain in localStorage.');
    const local = getLocalTables();
    const idx = local.findIndex(t => String(t.id) === String(tableId));
    if (idx !== -1) {
        local[idx].captain_id = captainId;
        saveLocalTables(local);
        return { data: local[idx], error: null };
    }
    return { data: null, error: 'Table not found' };
};

// --- Captains ---
const CAPTAINS_KEY = 'mockCaptains';
const getLocalCaptains = () => JSON.parse(localStorage.getItem(CAPTAINS_KEY) || '[]');
const saveLocalCaptains = (list) => localStorage.setItem(CAPTAINS_KEY, JSON.stringify(list));

export const getCaptains = async () => {
    const { data, error } = await nhostQuery(`
        query GetCaptains {
            captains(order_by: {id: asc}) {
                id
                name
                code
                created_at
            }
        }
    `);
    if (!error && data?.captains) {
        saveLocalCaptains(data.captains);
        return { data: data.captains, error: null };
    }
    console.warn('Nhost unavailable, getting captains from localStorage.');
    return { data: getLocalCaptains(), error: null };
};

export const createCaptain = async (captainData) => {
    const { data, error } = await nhostQuery(`
        mutation CreateCaptain($name: String!, $code: String!) {
            insert_captains_one(object: {
                name: $name,
                code: $code
            }) {
                id
                name
                code
                created_at
            }
        }
    `, captainData);

    if (!error && data?.insert_captains_one) {
        const local = getLocalCaptains();
        local.push(data.insert_captains_one);
        saveLocalCaptains(local);
        return { data: data.insert_captains_one, error: null };
    }

    console.warn('Nhost unavailable, creating captain in localStorage.');
    const local = getLocalCaptains();
    const newCaptain = {
        id: Date.now(),
        name: captainData.name,
        code: captainData.code,
        created_at: new Date().toISOString()
    };
    local.push(newCaptain);
    saveLocalCaptains(local);
    return { data: newCaptain, error: null };
};

export const updateCaptain = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await nhostQuery(`
        mutation UpdateCaptain($id: bigint!, $changes: captains_set_input!) {
            update_captains_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                name
                code
                created_at
            }
        }
    `, { id, changes });

    if (!error && data?.update_captains_by_pk) {
        const local = getLocalCaptains();
        const idx = local.findIndex(c => String(c.id) === String(id));
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...changes };
            saveLocalCaptains(local);
        }
        return { data: data.update_captains_by_pk, error: null };
    }

    console.warn('Nhost unavailable, updating captain in localStorage.');
    const local = getLocalCaptains();
    const idx = local.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
        local[idx] = { ...local[idx], ...changes };
        saveLocalCaptains(local);
        return { data: local[idx], error: null };
    }
    return { data: null, error: 'Captain not found' };
};

export const deleteCaptain = async (id) => {
    const { data, error } = await nhostQuery(`
        mutation DeleteCaptain($id: bigint!) {
            delete_captains_by_pk(id: $id) {
                id
            }
        }
    `, { id });

    if (!error && data?.delete_captains_by_pk) {
        const local = getLocalCaptains();
        saveLocalCaptains(local.filter(c => String(c.id) !== String(id)));
        return { data: data.delete_captains_by_pk, error: null };
    }

    console.warn('Nhost unavailable, deleting captain from localStorage.');
    const local = getLocalCaptains();
    saveLocalCaptains(local.filter(c => String(c.id) !== String(id)));
    return { data: { id }, error: null };
};

// --- Cashiers ---
const CASHIERS_KEY = 'mockCashiers';

const getLocalCashiers = () => JSON.parse(localStorage.getItem(CASHIERS_KEY) || '[]');
const saveLocalCashiers = (list) => localStorage.setItem(CASHIERS_KEY, JSON.stringify(list));

export const getCashiers = async () => {
    const { data, error } = await nhostQuery(`
        query GetCashiers {
            cashiers(order_by: {id: asc}) {
                id
                name
                code
                created_at
            }
        }
    `);
    if (!error && data?.cashiers) {
        return { data: data.cashiers, error: null };
    }
    // Fallback to localStorage
    const local = getLocalCashiers();
    if (local.length === 0) {
        // Seed a default cashier so the login screen is never empty
        const seed = [{ id: 1, name: 'Cashier 1', code: '1234', created_at: new Date().toISOString() }];
        saveLocalCashiers(seed);
        return { data: seed, error: null };
    }
    return { data: local, error: null };
};

export const createCashier = async (cashierData) => {
    const { data, error } = await nhostQuery(`
        mutation CreateCashier($name: String!, $code: String!) {
            insert_cashiers_one(object: {
                name: $name,
                code: $code
            }) {
                id
                name
                code
                created_at
            }
        }
    `, cashierData);
    if (!error && data?.insert_cashiers_one) {
        return { data: data.insert_cashiers_one, error: null };
    }
    // Fallback to localStorage
    const local = getLocalCashiers();
    const newId = local.length > 0 ? Math.max(...local.map(c => Number(c.id))) + 1 : 1;
    const newCashier = { ...cashierData, id: newId, created_at: new Date().toISOString() };
    local.push(newCashier);
    saveLocalCashiers(local);
    return { data: newCashier, error: null };
};

export const updateCashier = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await nhostQuery(`
        mutation UpdateCashier($id: bigint!, $changes: cashiers_set_input!) {
            update_cashiers_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                name
                code
                created_at
            }
        }
    `, { id, changes });
    if (!error && data?.update_cashiers_by_pk) {
        return { data: data.update_cashiers_by_pk, error: null };
    }
    // Fallback to localStorage
    const local = getLocalCashiers();
    const idx = local.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
        local[idx] = { ...local[idx], ...changes };
        saveLocalCashiers(local);
        return { data: local[idx], error: null };
    }
    return { data: null, error: 'Cashier not found' };
};

export const deleteCashier = async (id) => {
    const { data, error } = await nhostQuery(`
        mutation DeleteCashier($id: bigint!) {
            delete_cashiers_by_pk(id: $id) {
                id
            }
        }
    `, { id });
    if (!error && data?.delete_cashiers_by_pk) {
        return { data: data.delete_cashiers_by_pk, error: null };
    }
    // Fallback to localStorage
    const local = getLocalCashiers();
    const filtered = local.filter(c => String(c.id) !== String(id));
    saveLocalCashiers(filtered);
    return { data: { id }, error: null };
};

// --- Debts ---
const DEBTS_KEY = 'mockDebts';
const getLocalDebts = () => JSON.parse(localStorage.getItem(DEBTS_KEY) || '[]');
const saveLocalDebts = (list) => localStorage.setItem(DEBTS_KEY, JSON.stringify(list));

export const fetchDebts = async () => {
    const { data, error } = await nhostQuery(`
        query GetDebts {
            debts(order_by: {created_at: desc}) {
                id
                customer_name
                customer_phone
                amount
                order_id
                status
                created_at
            }
        }
    `);
    if (!error && data?.debts) {
        // Sync to localStorage cache
        saveLocalDebts(data.debts);
        return { data: data.debts, error: null };
    }
    // Fallback to localStorage
    return { data: getLocalDebts(), error: null };
};

export const createDebt = async (debtData) => {
    const { data, error } = await nhostQuery(`
        mutation CreateDebt($customer_name: String!, $customer_phone: String!, $amount: numeric!, $order_id: bigint, $status: String) {
            insert_debts_one(object: {
                customer_name: $customer_name,
                customer_phone: $customer_phone,
                amount: $amount,
                order_id: $order_id,
                status: $status
            }) {
                id
                customer_name
                customer_phone
                amount
                order_id
                status
                created_at
            }
        }
    `, debtData);
    if (!error && data?.insert_debts_one) {
        const local = getLocalDebts();
        local.unshift(data.insert_debts_one);
        saveLocalDebts(local);
        return { data: data.insert_debts_one, error: null };
    }
    // Fallback to localStorage
    const local = getLocalDebts();
    const newDebt = {
        ...debtData,
        id: Date.now(),
        created_at: new Date().toISOString()
    };
    local.unshift(newDebt);
    saveLocalDebts(local);
    return { data: newDebt, error: null };
};

export const updateDebt = async (id, updates) => {
    const { id: _, ...changes } = updates;
    const { data, error } = await nhostQuery(`
        mutation UpdateDebt($id: bigint!, $changes: debts_set_input!) {
            update_debts_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                customer_name
                customer_phone
                amount
                order_id
                status
                created_at
            }
        }
    `, { id, changes });
    if (!error && data?.update_debts_by_pk) {
        const local = getLocalDebts();
        const idx = local.findIndex(d => String(d.id) === String(id));
        if (idx !== -1) { local[idx] = { ...local[idx], ...changes }; saveLocalDebts(local); }
        return { data: data.update_debts_by_pk, error: null };
    }
    // Fallback to localStorage
    const local = getLocalDebts();
    const idx = local.findIndex(d => String(d.id) === String(id));
    if (idx !== -1) {
        local[idx] = { ...local[idx], ...changes };
        saveLocalDebts(local);
        return { data: local[idx], error: null };
    }
    return { data: null, error: null };
};

export const deleteDebt = async (id) => {
    const { data, error } = await nhostQuery(`
        mutation DeleteDebt($id: bigint!) {
            delete_debts_by_pk(id: $id) {
                id
            }
        }
    `, { id });
    if (!error && data?.delete_debts_by_pk) {
        const local = getLocalDebts();
        saveLocalDebts(local.filter(d => String(d.id) !== String(id)));
        return { data: data.delete_debts_by_pk, error: null };
    }
    // Fallback to localStorage
    const local = getLocalDebts();
    saveLocalDebts(local.filter(d => String(d.id) !== String(id)));
    return { data: { id }, error: null };
};

// --- Orders ---
export const getOrders = async () => {
    const { data, error } = await nhostQuery(`
        query GetPendingOrders {
            orders(where: {status: {_eq: "pending"}}, order_by: {created_at: desc}) {
                id
                table_id
                status
                total
                payment_method
                cashier_id
                created_at
                paid_at
                void_reason
                order_items {
                    quantity
                    price
                    product {
                        name
                        image_url
                    }
                    products {
                        name
                        image_url
                    }
                }
            }
        }
    `);

    if (error) {
        console.error("Get Orders Failed:", error);
        const mockOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        return { data: mockOrders, error: null };
    }

    // Transform to match frontend expectation
    const formatted = (data?.orders || []).map(o => ({
        ...o,
        items: (o.order_items || []).map(oi => {
            const prod = oi.products || oi.product;
            return {
                quantity: oi.quantity,
                price: oi.price,
                name: prod?.name,
                image_url: prod?.image_url
            };
        })
    }));

    // Cache to local storage
    localStorage.setItem('mockOrders', JSON.stringify(formatted));

    return { data: formatted, error: null };
};

export const createOrder = async (orderData) => {
    const { table_id, items, total } = orderData;
    const formattedItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
    }));

    const { data, error } = await nhostQuery(`
        mutation CreateOrder($table_id: bigint, $total: numeric, $items: [order_items_insert_input!]!, $updateTable: Boolean!) {
            insert_orders_one(object: {
                table_id: $table_id,
                total: $total,
                status: "pending",
                order_items: {
                    data: $items
                }
            }) {
                id
                table_id
                total
                status
                created_at
            }
            update_tables(where: {id: {_eq: $table_id}}, _set: {status: "occupied"}) @include(if: $updateTable) {
                affected_rows
            }
        }
    `, {
        table_id: table_id || null,
        total,
        items: formattedItems,
        updateTable: !!table_id
    });

    if (error) {
        console.warn("Nhost createOrder failed, falling back to local order.");
        const fallbackOrder = {
            id: Date.now(),
            table_id: table_id || null,
            total,
            status: "pending",
            created_at: new Date().toISOString(),
            items: items || []
        };
        const local = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        local.push(fallbackOrder);
        localStorage.setItem('mockOrders', JSON.stringify(local));
        return { data: fallbackOrder, error: null };
    }

    return { data: data?.insert_orders_one, error: null };
};

export const updateOrder = async (id, updates) => {
    const { items, total_amount } = updates;
    const formattedItems = items.map(item => ({
        order_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
    }));

    const { data, error } = await nhostQuery(`
        mutation UpdateOrder($id: bigint!, $total: numeric, $items: [order_items_insert_input!]!) {
            update_orders_by_pk(pk_columns: {id: $id}, _set: {total: $total}) {
                id
            }
            delete_order_items(where: {order_id: {_eq: $id}}) {
                affected_rows
            }
            insert_order_items(objects: $items) {
                affected_rows
            }
        }
    `, {
        id,
        total: total_amount,
        items: formattedItems
    });

    if (error) {
        console.warn("Nhost updateOrder failed, updating locally.");
        const local = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        const idx = local.findIndex(o => String(o.id) === String(id));
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates, total: total_amount };
            localStorage.setItem('mockOrders', JSON.stringify(local));
        }
        return { data: { id, ...updates }, error: null };
    }

    return { data: { id, ...updates }, error: null };
};

export const payOrder = async (id, cashierInfo) => {
    const { data: orderData, error: fetchErr } = await nhostQuery(`
        query GetOrderTable($id: bigint!) {
            orders_by_pk(id: $id) {
                table_id
            }
        }
    `, { id });

    if (fetchErr) return { data: null, error: fetchErr };

    const table_id = orderData?.orders_by_pk?.table_id;

    const { data, error } = await nhostQuery(`
        mutation PayOrder($id: bigint!, $payment_method: String!, $table_id: bigint, $updateTable: Boolean!) {
            update_orders_by_pk(pk_columns: {id: $id}, _set: {status: "paid", payment_method: $payment_method, paid_at: "now()"}) {
                id
                table_id
                status
                payment_method
            }
            update_tables(where: {id: {_eq: $table_id}}, _set: {status: "available"}) @include(if: $updateTable) {
                affected_rows
            }
        }
    `, {
        id,
        payment_method: cashierInfo?.payment_method || 'cash',
        table_id: table_id || null,
        updateTable: !!table_id
    });

    return { data: data?.update_orders_by_pk, error };
};

// --- Sales ---
export const getSales = async () => {
    const { data, error } = await nhostQuery(`
        query GetPaidOrders {
            orders(where: {status: {_eq: "paid"}}, order_by: {created_at: desc}) {
                id
                table_id
                status
                total
                payment_method
                cashier_id
                created_at
                paid_at
                order_items {
                    product_id
                    quantity
                    price
                    product {
                        name
                    }
                    products {
                        name
                    }
                }
            }
        }
    `);

    const localSales = JSON.parse(localStorage.getItem('mockSales') || '[]');

    if (!error && data?.orders) {
        const formatted = data.orders.map(s => {
            let cName = s.cashier_name;
            if (!cName) {
                const localMatch = localSales.find(ms => ms.id === s.id);
                cName = localMatch?.cashier_name || '-';
            }
            return {
                ...s,
                cashier_name: cName,
                total_amount: Number(s.total) || 0,
                items: (s.order_items || []).map(oi => {
                    const prod = oi.products || oi.product;
                    return {
                        product_id: oi.product_id,
                        quantity: oi.quantity,
                        price: oi.price,
                        name: prod?.name
                    };
                })
            };
        });
        // Merge with any local-only sales not in nhost
        const nhostIds = new Set(formatted.map(s => String(s.id)));
        const localOnly = localSales.filter(s => !nhostIds.has(String(s.id)));
        const merged = [...formatted, ...localOnly].sort((a, b) =>
            new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at)
        );
        return { data: merged, error: null };
    }

    // Fallback: use localStorage sales only
    console.warn('Nhost unavailable, using localStorage sales.');
    return { data: localSales, error: null };
};

// --- Expenses ---
export const fetchExpenses = async () => {
    // Attempt local API get if running in local backend dev environment
    try {
        const response = await fetch('/api/expenses');
        if (response.ok) {
            const data = await response.json();
            return { data };
        }
    } catch (e) {
        // Fall back to Nhost or localStorage
    }

    const { data, error } = await nhostQuery(`
        query GetExpenses {
            expenses(order_by: {created_at: desc}) {
                id
                description
                amount
                category
                created_at
            }
        }
    `);
    
    if (error) {
        console.warn("Nhost expenses failed, using local storage fallback:", error);
        const mockExpenses = JSON.parse(localStorage.getItem('mockExpenses') || '[]');
        return { data: mockExpenses, error: null };
    }
    return { data: data?.expenses || [], error };
};

export const createExpense = async (expenseData) => {
    // Attempt local API post
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        if (response.ok) {
            const data = await response.json();
            return { data };
        }
    } catch (e) {
        // Fall back to Nhost or localStorage
    }

    const { data, error } = await nhostQuery(`
        mutation CreateExpense($description: String!, $amount: numeric!, $category: String!) {
            insert_expenses_one(object: {
                description: $description,
                amount: $amount,
                category: $category
            }) {
                id
                description
                amount
                category
                created_at
            }
        }
    `, expenseData);

    if (error) {
        console.warn("Nhost createExpense failed, using local storage fallback:", error);
        const mockExpenses = JSON.parse(localStorage.getItem('mockExpenses') || '[]');
        const newExpense = {
            id: Date.now(),
            description: expenseData.description,
            amount: Number(expenseData.amount),
            category: expenseData.category,
            created_at: new Date().toISOString()
        };
        mockExpenses.unshift(newExpense);
        localStorage.setItem('mockExpenses', JSON.stringify(mockExpenses));
        return { data: newExpense, error: null };
    }
    return { data: data?.insert_expenses_one, error };
};

export const deleteExpense = async (id) => {
    // Attempt local API delete
    try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) {
            const data = await response.json();
            return { data };
        }
    } catch (e) {
        // Fall back to Nhost or localStorage
    }

    const { data, error } = await nhostQuery(`
        mutation DeleteExpense($id: bigint!) {
            delete_expenses_by_pk(id: $id) {
                id
            }
        }
    `, { id });

    if (error) {
        console.warn("Nhost deleteExpense failed, using local storage fallback:", error);
        const mockExpenses = JSON.parse(localStorage.getItem('mockExpenses') || '[]');
        const filtered = mockExpenses.filter(e => String(e.id) !== String(id));
        localStorage.setItem('mockExpenses', JSON.stringify(filtered));
        return { data: { id }, error: null };
    }
    return { data: data?.delete_expenses_by_pk, error };
};

// Legacy API Object compatibility
export const api = {
    get: async (url) => {
        if (url === '/products') return fetchProducts();
        if (url === '/tables') return getTables();
        if (url === '/captains') return getCaptains();
        if (url === '/cashiers') return getCashiers();
        if (url === '/orders') return getOrders();
        if (url === '/debts') return fetchDebts();
        if (url === '/expenses') return fetchExpenses();
        console.error(`API GET ${url} not implemented`);
        return { data: [] };
    },
    delete: async (url) => {
        const tableMatch = url.match(/\/tables\/(\d+)/);
        if (tableMatch) return deleteTable(tableMatch[1]);

        const productMatch = url.match(/\/products\/(\d+)/);
        if (productMatch) return deleteProduct(productMatch[1]);

        const cashierMatch = url.match(/\/cashiers\/(\d+)/);
        if (cashierMatch) return deleteCashier(cashierMatch[1]);

        const captainMatch = url.match(/\/captains\/(\d+)/);
        if (captainMatch) return deleteCaptain(captainMatch[1]);

        const debtMatch = url.match(/\/debts\/(\d+)/);
        if (debtMatch) return deleteDebt(debtMatch[1]);

        const expenseMatch = url.match(/\/expenses\/(\d+)/);
        if (expenseMatch) return deleteExpense(expenseMatch[1]);

        return { data: {} };
    },
    put: async (url, data) => {
        const productMatch = url.match(/\/products\/(\d+)/);
        if (productMatch) return updateProduct(productMatch[1], data);

        const cashierMatch = url.match(/\/cashiers\/(\d+)/);
        if (cashierMatch) return updateCashier(cashierMatch[1], data);

        const captainMatch = url.match(/\/captains\/(\d+)/);
        if (captainMatch) return updateCaptain(captainMatch[1], data);

        const debtMatch = url.match(/\/debts\/(\d+)/);
        if (debtMatch) return updateDebt(debtMatch[1], data);

        return { data: {} };
    },
    post: async (url, data) => {
        if (url === '/orders') return createOrder(data);
        if (url === '/captains') return createCaptain(data);
        if (url === '/cashiers') return createCashier(data);
        if (url === '/tables') return createTable(data);
        if (url === '/products') return createProduct(data);
        if (url === '/debts') return createDebt(data);
        if (url === '/expenses') return createExpense(data);

        const payMatch = url.match(/\/orders\/(\d+)\/pay/);
        if (payMatch) return payOrder(payMatch[1], data);

        const assignMatch = url.match(/\/tables\/(\d+)\/assign/);
        if (assignMatch) return assignCaptain(assignMatch[1], data.captain_id);

        console.error(`API POST ${url} not implemented`);
        return { data: {} };
    }
};

export default api;
