import { dbData } from '../db';
import { supabase } from '../supabase';

export const generateBackupData = async () => {
    try {
        const [products, tables, captains, cashiers, orders, sales, debts, expenses] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('tables').select('*'),
            supabase.from('captains').select('*'),
            supabase.from('cashiers').select('*'),
            supabase.from('orders').select('*'),
            supabase.from('sales').select('*'),
            supabase.from('debts').select('*'),
            supabase.from('expenses').select('*')
        ]);

        return {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: {
                appName: localStorage.getItem('appName'),
                adminPin: localStorage.getItem('adminPin'),
                supabaseData: {
                    products: products.data || [],
                    tables: tables.data || [],
                    captains: captains.data || [],
                    cashiers: cashiers.data || [],
                    orders: orders.data || [],
                    sales: sales.data || [],
                    debts: debts.data || [],
                    expenses: expenses.data || []
                }
            }
        };
    } catch (e) {
        console.error("Backup generation failed", e);
        return null;
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
        a.download = `Pharmacy_Backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

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

        if (data.appName) localStorage.setItem('appName', data.appName);
        if (data.adminPin) localStorage.setItem('adminPin', data.adminPin);

        if (data.supabaseData) {
            const sd = data.supabaseData;

            // Clear tables
            await Promise.all([
                supabase.from('sales').delete().neq('id', 0),
                supabase.from('orders').delete().neq('id', 0),
                supabase.from('debts').delete().neq('id', 0),
                supabase.from('expenses').delete().neq('id', 0),
                supabase.from('tables').delete().neq('id', 0),
                supabase.from('captains').delete().neq('id', 0),
                supabase.from('cashiers').delete().neq('id', 0),
                supabase.from('products').delete().neq('id', 0)
            ]);

            // Restore
            if (sd.products?.length) await supabase.from('products').insert(sd.products.map(({ created_at, ...p }) => p));
            if (sd.captains?.length) await supabase.from('captains').insert(sd.captains.map(({ created_at, ...c }) => c));
            if (sd.cashiers?.length) await supabase.from('cashiers').insert(sd.cashiers.map(({ created_at, ...c }) => c));
            if (sd.tables?.length) await supabase.from('tables').insert(sd.tables.map(({ created_at, ...t }) => t));
            if (sd.orders?.length) await supabase.from('orders').insert(sd.orders.map(({ created_at, ...o }) => o));
            if (sd.sales?.length) await supabase.from('sales').insert(sd.sales.map(({ created_at, ...s }) => s));
            if (sd.debts?.length) await supabase.from('debts').insert(sd.debts.map(({ created_at, ...d }) => d));
            if (sd.expenses?.length) await supabase.from('expenses').insert(sd.expenses.map(({ created_at, ...e }) => e));
        }

        return true;
    } catch (e) {
        console.error("Restore failed:", e);
        return false;
    }
};

export const clearDatabase = async () => {
    try {
        await Promise.all([
            supabase.from('sales').delete().neq('id', 0),
            supabase.from('orders').delete().neq('id', 0),
            supabase.from('debts').delete().neq('id', 0),
            supabase.from('expenses').delete().neq('id', 0),
            supabase.from('tables').delete().neq('id', 0),
            supabase.from('captains').delete().neq('id', 0),
            supabase.from('cashiers').delete().neq('id', 0),
            supabase.from('products').delete().neq('id', 0)
        ]);

        try {
            await dbData.clear();
        } catch (dbErr) {
            console.warn("Could not clear IndexedDB:", dbErr);
        }

        localStorage.clear();

        return true;
    } catch (e) {
        console.error("Failed to clear database:", e);
        return false;
    }
};
