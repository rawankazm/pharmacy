import { dbData } from '../db';
import { nhostQuery } from '../nhost';

export const generateBackupData = async () => {
    try {
        const { data, error } = await nhostQuery(`
            query GetBackupData {
                products { id name category price image_url description name_ckb barcode is_available created_at }
                tables { id name captain_id status code_pin created_at }
                captains { id name code created_at }
                cashiers { id name code created_at }
                orders { id table_id status total payment_method cashier_id created_at paid_at void_reason }
                order_items { id order_id product_id quantity price note created_at }
            }
        `);

        if (error) throw new Error(error);

        return {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: {
                appName: localStorage.getItem('appName'),
                adminPin: localStorage.getItem('adminPin'),
                supabaseData: {
                    products: data.products || [],
                    tables: data.tables || [],
                    captains: data.captains || [],
                    cashiers: data.cashiers || [],
                    orders: data.orders || [],
                    order_items: data.order_items || []
                }
            }
        };
    } catch (e) {
        console.error("Backup generation failed", e);
        return null; // Ensure fallback
    }
};

export const downloadBackup = async () => {
    try {
        const backupData = await generateBackupData();
        if (!backupData) throw new Error("Could not generate backup data");

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `MarketPOS_Backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

        // Record backup time
        localStorage.setItem('last_auto_backup', new Date().toISOString());
        return true;
    } catch (e) {
        console.error("Backup failed", e);
        return false;
    }
};

export const restoreBackup = async (backupData) => {
    try {
        const { data } = backupData;
        if (!data) throw new Error("Invalid backup format");

        // Restore LocalStorage configurations
        if (data.appName) localStorage.setItem('appName', data.appName);
        if (data.adminPin) localStorage.setItem('adminPin', data.adminPin);

        // Restore Nhost/Hasura data
        if (data.supabaseData) {
            const sd = data.supabaseData;

            // Clear existing data. Clear child tables first to bypass foreign key constraints
            await nhostQuery(`
                mutation ClearAllForRestore {
                    delete_order_items(where: {}) { affected_rows }
                    delete_orders(where: {}) { affected_rows }
                    delete_tables(where: {}) { affected_rows }
                    delete_captains(where: {}) { affected_rows }
                    delete_cashiers(where: {}) { affected_rows }
                    delete_products(where: {}) { affected_rows }
                }
            `);

            // Re-insert backed up data (Independent tables first, then dependent tables)
            if (sd.products?.length) {
                await nhostQuery(`
                    mutation InsertProducts($objects: [products_insert_input!]!) {
                        insert_products(objects: $objects) { affected_rows }
                    }
                `, { objects: sd.products.map(({ created_at, ...p }) => p) });
            }
            if (sd.captains?.length) {
                await nhostQuery(`
                    mutation InsertCaptains($objects: [captains_insert_input!]!) {
                        insert_captains(objects: $objects) { affected_rows }
                    }
                `, { objects: sd.captains.map(({ created_at, ...c }) => c) });
            }
            if (sd.cashiers?.length) {
                await nhostQuery(`
                    mutation InsertCashiers($objects: [cashiers_insert_input!]!) {
                        insert_cashiers(objects: $objects) { affected_rows }
                    }
                `, { objects: sd.cashiers.map(({ created_at, ...c }) => c) });
            }
            if (sd.tables?.length) {
                await nhostQuery(`
                    mutation InsertTables($objects: [tables_insert_input!]!) {
                        insert_tables(objects: $objects) { affected_rows }
                    }
                `, { objects: sd.tables.map(({ created_at, ...t }) => t) });
            }
            if (sd.orders?.length) {
                await nhostQuery(`
                    mutation InsertOrders($objects: [orders_insert_input!]!) {
                        insert_orders(objects: $objects) { affected_rows }
                    }
                `, { objects: sd.orders.map(({ created_at, paid_at, ...o }) => o) });
            }
            if (sd.order_items?.length) {
                await nhostQuery(`
                    mutation InsertOrderItems($objects: [order_items_insert_input!]!) {
                        insert_order_items(objects: $objects) { affected_rows }
                    }
                `, { objects: sd.order_items.map(({ created_at, ...oi }) => oi) });
            }
        } else {
            // Legacy fallback restore if old backup uploaded
            if (data.mockProducts) localStorage.setItem('mockProducts', JSON.stringify(data.mockProducts));
            if (data.mockTables) localStorage.setItem('mockTables', JSON.stringify(data.mockTables));
            if (data.mockCaptains) localStorage.setItem('mockCaptains', JSON.stringify(data.mockCaptains));
            if (data.mockCashiers) localStorage.setItem('mockCashiers', JSON.stringify(data.mockCashiers));
            if (data.mockOrders) localStorage.setItem('mockOrders', JSON.stringify(data.mockOrders));
            if (data.mockSales) localStorage.setItem('mockSales', JSON.stringify(data.mockSales));
            if (data.shishaCategories) localStorage.setItem('shisha_categories', JSON.stringify(data.shishaCategories));

            if (data.dbProducts && Array.isArray(data.dbProducts)) {
                await dbData.saveAll(data.dbProducts);
            }
        }

        return true;
    } catch (e) {
        console.error("Restore failed:", e);
        return false;
    }
};

export const clearDatabase = async () => {
    try {
        const { error } = await nhostQuery(`
            mutation ClearDatabase {
                delete_order_items(where: {}) { affected_rows }
                delete_orders(where: {}) { affected_rows }
                delete_tables(where: {}) { affected_rows }
                delete_captains(where: {}) { affected_rows }
                delete_cashiers(where: {}) { affected_rows }
                delete_products(where: {}) { affected_rows }
            }
        `);

        if (error) throw new Error(error);

        // Attempt IndexedDB clear silently
        try {
            await dbData.clear();
        } catch (dbErr) {
            console.warn("Could not clear IndexedDB:", dbErr);
        }

        localStorage.removeItem('mockOrders');
        localStorage.removeItem('mockSales');
        localStorage.removeItem('mockVoids');
        localStorage.removeItem('shisha_categories');
        localStorage.removeItem('mockProducts');
        localStorage.removeItem('mockTables');
        localStorage.removeItem('mockCaptains');
        localStorage.removeItem('mockCashiers');

        return true;
    } catch (e) {
        console.error("Failed to clear database:", e);
        return false;
    }
};
