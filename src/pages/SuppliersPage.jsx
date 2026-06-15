import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    Truck, Plus, Trash, Pencil, Phone, MapPin, X,
    MagnifyingGlass, CurrencyDollar, ClockCounterClockwise,
    Buildings, User, Receipt, ArrowRight, List
} from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';

const SUPPLIERS_KEY = 'market_suppliers';
const PURCHASES_KEY = 'market_supplier_purchases';

const getSuppliers = () => { try { return JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || '[]'); } catch { return []; } };
const saveSuppliers = (list) => localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(list));
const getPurchases = () => { try { return JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]'); } catch { return []; } };
const savePurchases = (list) => localStorage.setItem(PURCHASES_KEY, JSON.stringify(list));

const emptySupplier = { name: '', phone: '', address: '', notes: '' };
const emptyPurchase = { supplierId: '', supplierName: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) };

const AVATAR_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];

const SuppliersPage = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [suppliers, setSuppliers] = useState(getSuppliers());
    const [purchases, setPurchases] = useState(getPurchases());
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' | 'purchases'

    // Supplier modal
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [supplierForm, setSupplierForm] = useState(emptySupplier);
    const [editingSupplierId, setEditingSupplierId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Purchase modal
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseForm, setPurchaseForm] = useState(emptyPurchase);
    const [purchaseFilter, setPurchaseFilter] = useState('all');

    const filteredSuppliers = useMemo(() => {
        if (!search.trim()) return suppliers;
        const q = search.toLowerCase();
        return suppliers.filter(s => s.name?.toLowerCase().includes(q) || s.phone?.includes(q));
    }, [suppliers, search]);

    const filteredPurchases = useMemo(() => {
        let list = [...purchases].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (purchaseFilter !== 'all') list = list.filter(p => p.supplierId === purchaseFilter);
        return list;
    }, [purchases, purchaseFilter]);

    const stats = useMemo(() => {
        const totalSpend = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return { totalSuppliers: suppliers.length, totalSpend };
    }, [suppliers, purchases]);

    // Supplier totals helper
    const supplierTotal = (id) => purchases.filter(p => p.supplierId === id).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const supplierLastPurchase = (id) => {
        const list = purchases.filter(p => p.supplierId === id).sort((a, b) => new Date(b.date) - new Date(a.date));
        return list[0]?.date || null;
    };

    // SUPPLIER CRUD
    const openAddSupplier = () => { setSupplierForm(emptySupplier); setEditingSupplierId(null); setShowSupplierModal(true); };
    const openEditSupplier = (s) => { setSupplierForm({ name: s.name, phone: s.phone || '', address: s.address || '', notes: s.notes || '' }); setEditingSupplierId(s.id); setShowSupplierModal(true); };
    const closeSupplierModal = () => { setShowSupplierModal(false); setSupplierForm(emptySupplier); setEditingSupplierId(null); };

    const handleSaveSupplier = () => {
        if (!supplierForm.name.trim()) { toast.error('ناوی دابینکەر پێویستە'); return; }
        let updated;
        if (editingSupplierId) {
            updated = suppliers.map(s => s.id === editingSupplierId ? { ...s, ...supplierForm } : s);
            toast.success('دابینکەر نوێکرایەوە');
        } else {
            const entry = { ...supplierForm, id: String(Date.now()), createdAt: new Date().toISOString() };
            updated = [entry, ...suppliers];
            toast.success('دابینکەری نوێ زیادکرا ✅');
        }
        setSuppliers(updated);
        saveSuppliers(updated);
        closeSupplierModal();
    };

    const handleDeleteSupplier = (id) => {
        const updatedS = suppliers.filter(s => s.id !== id);
        const updatedP = purchases.filter(p => p.supplierId !== id);
        setSuppliers(updatedS);
        setPurchases(updatedP);
        saveSuppliers(updatedS);
        savePurchases(updatedP);
        setDeleteId(null);
        toast.success('دابینکەر و تۆمارەکانی سڕایەوە');
    };

    // PURCHASE CRUD
    const openAddPurchase = (supplier = null) => {
        setPurchaseForm({
            ...emptyPurchase,
            supplierId: supplier?.id || '',
            supplierName: supplier?.name || '',
            date: new Date().toISOString().slice(0, 10),
        });
        setShowPurchaseModal(true);
    };
    const closePurchaseModal = () => { setShowPurchaseModal(false); setPurchaseForm(emptyPurchase); };

    const handleSavePurchase = () => {
        if (!purchaseForm.supplierId) { toast.error('دابینکەرێک هەڵبژێرە'); return; }
        if (!purchaseForm.amount || Number(purchaseForm.amount) <= 0) { toast.error('بڕی دروست بنووسە'); return; }
        const supplier = suppliers.find(s => s.id === purchaseForm.supplierId);
        const entry = {
            ...purchaseForm,
            id: Date.now(),
            supplierName: supplier?.name || purchaseForm.supplierName,
            amount: Number(purchaseForm.amount),
        };
        const updated = [entry, ...purchases];
        setPurchases(updated);
        savePurchases(updated);
        toast.success('تۆماری کڕین زیادکرا ✅');
        closePurchaseModal();
    };

    const handleDeletePurchase = (id) => {
        const updated = purchases.filter(p => p.id !== id);
        setPurchases(updated);
        savePurchases(updated);
        toast.success('تۆمار سڕایەوە');
    };

    return (
        <AdminGuard>
            <div className="space-y-5 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Truck size={22} weight="duotone" className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">دابینکەران</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">بەڕێوەبردنی دابینکەران و تۆماری کڕین</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => openAddPurchase()}
                            className="flex items-center gap-2 px-3 py-2 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <Receipt size={16} /> تۆماری کڕین
                        </button>
                        <button onClick={openAddSupplier}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-sm transition-colors shadow-sm">
                            <Plus size={18} weight="bold" /> دابینکەری نوێ
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 hover-lift">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Buildings size={22} weight="duotone" className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalSuppliers}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">کۆی دابینکەران</p>
                        </div>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 hover-lift">
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <CurrencyDollar size={22} weight="duotone" className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalSpend.toLocaleString()} د.ع</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">کۆی کڕینەکان</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
                    {[['suppliers', 'دابینکەران', Truck], ['purchases', 'تۆماری کڕین', ClockCounterClockwise]].map(([val, lbl, Icon]) => (
                        <button key={val} onClick={() => setActiveTab(val)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === val ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Icon size={16} />{lbl}
                        </button>
                    ))}
                </div>

                {/* ── Suppliers Tab ── */}
                {activeTab === 'suppliers' && (
                    <>
                        <div className="relative">
                            <MagnifyingGlass size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="گەڕان بە ناو یان تەلەفۆن..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors" />
                        </div>

                        {filteredSuppliers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                                <Truck size={56} weight="duotone" className="text-slate-300 dark:text-slate-700" />
                                <p className="font-black text-lg">هیچ دابینکەرێک نییە</p>
                                <button onClick={openAddSupplier} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                                    + زیادکردنی یەکەم دابینکەر
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredSuppliers.map((s, idx) => {
                                    const total = supplierTotal(s.id);
                                    const lastDate = supplierLastPurchase(s.id);
                                    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                    return (
                                        <div key={s.id} className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 hover-lift flex flex-col gap-4">
                                            {/* Top */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ background: avatarColor }}>
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-slate-100 leading-tight">{s.name}</p>
                                                        {s.phone && (
                                                            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                <Phone size={11} /> {s.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => openEditSupplier(s)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-400 transition-colors"><Pencil size={14} /></button>
                                                    {deleteId === s.id ? (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleDeleteSupplier(s.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">بەڵێ</button>
                                                            <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">نەخێر</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"><Trash size={14} /></button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {s.address && (
                                                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    <MapPin size={12} className="flex-shrink-0" /> {s.address}
                                                </p>
                                            )}
                                            {s.notes && <p className="text-xs text-slate-400 italic truncate">{s.notes}</p>}

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 text-center">
                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">{total.toLocaleString()} د.ع</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">کۆی کڕینەکان</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 text-center">
                                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{lastDate ? new Date(lastDate).toLocaleDateString('ckb') : '—'}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">دوایین کڕین</p>
                                                </div>
                                            </div>

                                            {/* Add purchase btn */}
                                            <button onClick={() => openAddPurchase(s)}
                                                className="w-full py-2 rounded-xl border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1.5">
                                                <Plus size={13} weight="bold" /> تۆماری کڕین
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ── Purchases Tab ── */}
                {activeTab === 'purchases' && (
                    <>
                        <div className="flex flex-wrap gap-3 items-center">
                            <select value={purchaseFilter} onChange={e => setPurchaseFilter(e.target.value)}
                                className="px-3 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors">
                                <option value="all">هەموو دابینکەران</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <span className="text-xs text-slate-400 font-bold">{filteredPurchases.length} تۆمار</span>
                        </div>

                        <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                            {filteredPurchases.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                    <Receipt size={48} weight="duotone" className="text-slate-300 dark:text-slate-700" />
                                    <p className="font-black">هیچ تۆمارێک نییە</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                                                {['کات', 'دابینکەر', 'بڕ', 'وەسف', ''].map(h => (
                                                    <th key={h} className="px-4 py-3 text-start text-xs font-black text-slate-500 dark:text-slate-400 uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {filteredPurchases.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(p.date).toLocaleDateString('ckb')}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-xs">
                                                                {p.supplierName?.charAt(0) || 'د'}
                                                            </div>
                                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{p.supplierName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400 text-sm">{Number(p.amount).toLocaleString()} د.ع</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{p.description || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => handleDeletePurchase(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Trash size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Supplier Modal */}
                {showSupplierModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeSupplierModal}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-800/60" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">{editingSupplierId ? 'دەستکاری دابینکەر' : 'دابینکەری نوێ'}</h2>
                                <button onClick={closeSupplierModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={18} /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                {[
                                    { key: 'name', label: 'ناوی دابینکەر *', placeholder: 'ناوی کۆمپانیا...', type: 'text' },
                                    { key: 'phone', label: 'ژمارەی تەلەفۆن', placeholder: '07..........', type: 'tel' },
                                    { key: 'address', label: 'ئادرەس', placeholder: 'شار، شوێن...', type: 'text' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                                        <input type={f.type} value={supplierForm[f.key]} onChange={e => setSupplierForm(p => ({ ...p, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder} autoFocus={f.key === 'name'}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">تێبینی</label>
                                    <textarea value={supplierForm.notes} onChange={e => setSupplierForm(p => ({ ...p, notes: e.target.value }))}
                                        rows={2} placeholder="تێبینی..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors resize-none" />
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex gap-3">
                                <button onClick={closeSupplierModal} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">پاشگەزبوون</button>
                                <button onClick={handleSaveSupplier} className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black transition-colors">پشتگیری</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Purchase Modal */}
                {showPurchaseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closePurchaseModal}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-800/60" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">تۆماری کڕینی نوێ</h2>
                                <button onClick={closePurchaseModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={18} /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">دابینکەر *</label>
                                    <select value={purchaseForm.supplierId} onChange={e => {
                                        const s = suppliers.find(s => s.id === e.target.value);
                                        setPurchaseForm(p => ({ ...p, supplierId: e.target.value, supplierName: s?.name || '' }));
                                    }} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors">
                                        <option value="">— دابینکەرێک هەڵبژێرە —</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">بڕی کڕین (د.ع) *</label>
                                    <input type="number" value={purchaseForm.amount} onChange={e => setPurchaseForm(p => ({ ...p, amount: e.target.value }))}
                                        placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">وەسف</label>
                                    <input type="text" value={purchaseForm.description} onChange={e => setPurchaseForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="وەک: بارکردنی بەرهەمەکان..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">کات</label>
                                    <input type="date" value={purchaseForm.date} onChange={e => setPurchaseForm(p => ({ ...p, date: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex gap-3">
                                <button onClick={closePurchaseModal} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">پاشگەزبوون</button>
                                <button onClick={handleSavePurchase} className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black transition-colors">تۆمارکردن</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminGuard>
    );
};

export default SuppliersPage;
