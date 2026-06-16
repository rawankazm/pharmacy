import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash, FloppyDisk, Receipt, ClockCounterClockwise } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { fetchProducts, saveLocalProducts } from '../api';
import AdminGuard from '../components/AdminGuard';

const RECEIPTS_KEY = 'incomingReceipts';

const getReceipts = () => {
    try { return JSON.parse(localStorage.getItem(RECEIPTS_KEY) || '[]'); }
    catch { return []; }
};

const IncomingMedicinesPage = () => {
    const [receipts, setReceipts] = useState([]);
    const [products, setProducts] = useState([]);
    
    // Form State (Master)
    const [supplierName, setSupplierName] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalAmount, setTotalAmount] = useState('');
    const [currency, setCurrency] = useState('IQD');
    const [paymentType, setPaymentType] = useState('cash'); // cash or debt

    // Form State (Details)
    const [items, setItems] = useState([]);
    
    // New Item Inputs
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [newItemPiecePrice, setNewItemPiecePrice] = useState('');
    const [newItemPackPrice, setNewItemPackPrice] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setReceipts(getReceipts());
        loadProducts();
    }, []);

    const loadProducts = async () => {
        const { data } = await fetchProducts();
        if (data) setProducts(data);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemName || !newItemQty || !newItemPiecePrice) {
            toast.error('تکایە هەموو زانیارییەکانی دەرمان پڕبکەوە');
            return;
        }

        const item = {
            id: Date.now(),
            name: newItemName,
            qty: parseInt(newItemQty),
            piecePrice: parseFloat(newItemPiecePrice),
            packPrice: parseFloat(newItemPackPrice || 0)
        };

        setItems([...items, item]);
        
        // Reset item inputs
        setNewItemName('');
        setNewItemQty('');
        setNewItemPiecePrice('');
        setNewItemPackPrice('');
        setShowSuggestions(false);
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSaveReceipt = async (e) => {
        e.preventDefault();
        if (!receiptNumber || !supplierName || !totalAmount) {
            toast.error('تکایە زانیارییەکانی وەسڵەکە پڕبکەوە (ناوی مەندوب، ژمارە، بڕی پارە)');
            return;
        }
        if (items.length === 0) {
            toast.error('تکایە لایەنی کەم یەک دەرمان زیاد بکە بۆ وەسڵەکە');
            return;
        }

        // Create Receipt
        const receipt = {
            id: Date.now().toString(),
            supplierName,
            receiptNumber,
            receiptDate,
            totalAmount: parseFloat(totalAmount),
            currency,
            paymentType,
            items,
            createdAt: new Date().toISOString()
        };

        const newReceipts = [receipt, ...receipts];
        localStorage.setItem(RECEIPTS_KEY, JSON.stringify(newReceipts));
        setReceipts(newReceipts);

        // Update Stock
        let updatedProducts = [...products];

        items.forEach(item => {
            // Find existing product by name (case insensitive)
            const existingIndex = updatedProducts.findIndex(p => 
                (p.name_ckb && p.name_ckb.toLowerCase() === item.name.toLowerCase()) || 
                (p.name && p.name.toLowerCase() === item.name.toLowerCase())
            );

            if (existingIndex >= 0) {
                // Update stock quantity
                updatedProducts[existingIndex].stock_quantity = (updatedProducts[existingIndex].stock_quantity || 0) + item.qty;
            } else {
                // Create new product
                const newProduct = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    name: item.name,
                    name_ckb: item.name,
                    category: 'دەرمانی گشتی', // Default
                    price: item.piecePrice, 
                    stock_quantity: item.qty,
                    track_stock: true,
                    is_available: true,
                    created_at: new Date().toISOString()
                };
                updatedProducts.push(newProduct);
            }
        });

        // Save to API/LocalStorage
        saveLocalProducts(updatedProducts);
        setProducts(updatedProducts);

        toast.success('وەسڵەکە تۆمارکرا و مەوجودی کۆگا زیاد کرا! ✅');

        // Reset form
        setSupplierName('');
        setReceiptNumber('');
        setTotalAmount('');
        setItems([]);
        setPaymentType('cash');
    };

    // Filter products for autocomplete
    const filteredProducts = products.filter(p => {
        const query = newItemName.toLowerCase();
        return (p.name_ckb && p.name_ckb.toLowerCase().includes(query)) || (p.name && p.name.toLowerCase().includes(query));
    }).slice(0, 5);

    return (
        <AdminGuard>
            <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <Truck className="text-emerald-500" weight="duotone" size={32} />
                            دەرمانی هاتوو (وەسڵی کڕین)
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">تۆمارکردنی ئەو دەرمانانەی کە لەلایەن مەندوبەکانەوە دەهێنرێن.</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 flex-1">
                    
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* 1. Master Info Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <Receipt size={20} className="text-emerald-500" /> زانیاری وەسڵ
                            </h2>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ناوی مەندوب / کۆمپانیا</label>
                                    <input 
                                        type="text" 
                                        value={supplierName}
                                        onChange={e => setSupplierName(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="نموونە: کۆمپانیای ئاوامەد"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ژمارەی وەسڵ</label>
                                    <input 
                                        type="text" 
                                        value={receiptNumber}
                                        onChange={e => setReceiptNumber(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="0001234"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">بەرواری وەرگرتن</label>
                                    <input 
                                        type="date" 
                                        value={receiptDate}
                                        onChange={e => setReceiptDate(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm text-slate-800 dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">بڕی کۆی پارەی وەسڵ</label>
                                    <input 
                                        type="number" 
                                        value={totalAmount}
                                        onChange={e => setTotalAmount(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="500,000"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">جۆری دراو</label>
                                    <select 
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm text-slate-800 dark:text-slate-100"
                                    >
                                        <option value="IQD">دینار (IQD)</option>
                                        <option value="USD">دۆلار (USD)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">شێوازی مامەڵە</label>
                                    <select 
                                        value={paymentType}
                                        onChange={e => setPaymentType(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm text-slate-800 dark:text-slate-100"
                                    >
                                        <option value="cash">نەختینە (کاش)</option>
                                        <option value="debt">قەرز (ماوە)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Items List */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex-1 flex flex-col min-h-[300px]">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <Plus size={20} className="text-blue-500" /> دەرمانەکانی وەسڵەکە
                            </h2>

                            {/* Add Item Form */}
                            <form onSubmit={handleAddItem} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-4 flex flex-wrap gap-3 items-end relative">
                                <div className="flex-1 min-w-[200px] relative">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">ناوی دەرمان</label>
                                    <input 
                                        type="text" 
                                        value={newItemName}
                                        onChange={e => {
                                            setNewItemName(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="ناوی دەرمان بنووسە..."
                                    />
                                    {showSuggestions && newItemName && filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden text-slate-800 dark:text-slate-100">
                                            {filteredProducts.map(p => (
                                                <div 
                                                    key={p.id}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent blur
                                                        setNewItemName(p.name_ckb || p.name);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-800 dark:text-slate-200"
                                                >
                                                    {p.name_ckb || p.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">ژمارە (دانە)</label>
                                    <input 
                                        type="number" 
                                        value={newItemQty}
                                        onChange={e => setNewItemQty(e.target.value)}
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="10"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">نرخی کڕینی تاک</label>
                                    <input 
                                        type="number" 
                                        value={newItemPiecePrice}
                                        onChange={e => setNewItemPiecePrice(e.target.value)}
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="500"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">نرخی پاکەت</label>
                                    <input 
                                        type="number" 
                                        value={newItemPackPrice}
                                        onChange={e => setNewItemPackPrice(e.target.value)}
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="ئارەزوومەندانە"
                                    />
                                </div>
                                <button type="submit" className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm">
                                    <Plus size={20} weight="bold" />
                                </button>
                            </form>

                            {/* Table */}
                            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold sticky top-0">
                                        <tr>
                                            <th className="p-3">#</th>
                                            <th className="p-3">ناو</th>
                                            <th className="p-3">بڕ</th>
                                            <th className="p-3">نرخی تاک</th>
                                            <th className="p-3">نرخی پاکەت</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-400">هیچ دەرمانێک بۆ ئەم وەسڵە زیاد نەکراوە.</td>
                                            </tr>
                                        ) : (
                                            items.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    <td className="p-3 font-medium">{idx + 1}</td>
                                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                                                    <td className="p-3"><span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-bold">{item.qty}</span></td>
                                                    <td className="p-3 text-slate-600 dark:text-slate-400">{item.piecePrice.toLocaleString()}</td>
                                                    <td className="p-3 text-slate-600 dark:text-slate-400">{item.packPrice ? item.packPrice.toLocaleString() : '-'}</td>
                                                    <td className="p-3">
                                                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                            <Trash size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button 
                                    onClick={handleSaveReceipt}
                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    <FloppyDisk size={20} />
                                    پاشەکەوتکردن و زیادکردن بۆ کۆگا
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-y-auto max-h-[85vh]">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <ClockCounterClockwise size={20} className="text-slate-500 dark:text-slate-400" /> مێژووی وەسڵەکان
                        </h2>
                        
                        <div className="space-y-3">
                            {receipts.length === 0 ? (
                                <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                                    هیچ وەسڵێک تۆمار نەکراوە.
                                </div>
                            ) : (
                                receipts.map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-1.5 h-full ${r.paymentType === 'debt' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                                    #{r.receiptNumber} 
                                                    {r.paymentType === 'debt' 
                                                        ? <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded ml-2">قەرز</span>
                                                        : <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded ml-2">نەختینە</span>
                                                    }
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{r.supplierName}</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                                    {r.totalAmount.toLocaleString()} {r.currency}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{r.receiptDate}</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-1">
                                            {r.items.map((item, idx) => (
                                                <span key={idx} className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    {item.qty}x {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
};

export default IncomingMedicinesPage;
