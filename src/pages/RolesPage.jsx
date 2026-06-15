import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    User, ShieldCheck, Key, Check, Plus, Trash, PencilSimple, X,
    ShieldWarning, ArrowRight, Gear, IdentificationCard
} from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';
import { getCashiers, createCashier, updateCashier, deleteCashier } from '../api';

const AVAILABLE_PERMISSIONS = [
    { key: 'cashier_page', label: 'کاشێر / فرۆشتن', desc: 'ڕێگەپێدان بە بەشی عەرەبانە و فرۆشتنی سەرەکی' },
    { key: 'dashboard_page', label: 'داشبۆرد و ئامارەکان', desc: 'بینینی داهات، قازانج، چارتی فرۆشتن و خەرجییەکان' },
    { key: 'products_page', label: 'بەڕێوەبردنی بەرهەمەکان', desc: 'زیادکردن، سڕینەوە و گۆڕینی نرخی بەرهەمەکان' },
    { key: 'warehouse_page', label: 'کۆگا', desc: 'بینینی مەوجوود، هێنان و ناردنی کاڵا، و تۆماری جموجۆڵ' },
    { key: 'expenses_page', label: 'خەرجییەکان', desc: 'تۆمارکردن و بینینی خەرجییەکانی مارکێت' },
    { key: 'debts_page', label: 'دەفتەری قەرز', desc: 'تۆمارکردن، بینینی پارەدان و دەفتەری قەرزی کڕیاران' },
    { key: 'suppliers_page', label: 'دابینکەران', desc: 'تۆمارکردنی دابینکەران و تۆماری کڕینی لێیان' },
    { key: 'discounts_page', label: 'داشکاندنەکان', desc: 'دروستکردن و بەڕێوەبردنی کۆدەکانی داشکاندن' },
    { key: 'returns_page', label: 'گەڕانەوەی کاڵا', desc: 'تۆمارکردن و بینینی کاڵا گەڕاوەکان و بڕی گەڕاوە' },
    { key: 'expired_page', label: 'کاڵا بەسەرچووەکان', desc: 'تۆمار و بەدواداچوونی ڕێکەوتی بەسەرچوون و خەسارکردن' },
    { key: 'shift_reports_page', label: 'ڕاپۆرتی کۆتایی ڕۆژ', desc: 'بینین و چاپکردنەوە و بەڕێوەبردنی ڕاپۆرتەکانی داخستنی شیفت و سندوق' },
    { key: 'settings_page', label: 'ڕێکخستنەکان', desc: 'بینین و گۆڕینی ڕێکخستنی سەرەکی مارکێت و گۆڕینی PIN' }
];

const DEFAULT_PERMISSIONS = {
    cashier_page: true,
    dashboard_page: false,
    products_page: false,
    warehouse_page: false,
    expenses_page: false,
    debts_page: false,
    suppliers_page: false,
    discounts_page: false,
    returns_page: false,
    expired_page: false,
    shift_reports_page: false,
    settings_page: false
};

const DEFAULT_ADMIN_PERMISSIONS = {
    cashier_page: true,
    dashboard_page: true,
    products_page: true,
    warehouse_page: true,
    expenses_page: true,
    debts_page: true,
    suppliers_page: true,
    discounts_page: true,
    returns_page: true,
    expired_page: true,
    shift_reports_page: true,
    settings_page: true
};

const RolesPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [cashiers, setCashiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Add/Edit User Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState({
        name: '',
        code: '',
        role: 'cashier',
        permissions: { ...DEFAULT_PERMISSIONS }
    });
    const [editingUserId, setEditingUserId] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await getCashiers();
            setCashiers(data || []);
        } catch (error) {
            console.error(error);
            toast.error('کێشەیەک لە بارکردنی کاشێرەکان ڕوویدا');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const openAddUser = () => {
        setUserForm({
            name: '',
            code: '',
            role: 'cashier',
            permissions: { ...DEFAULT_PERMISSIONS }
        });
        setEditingUserId(null);
        setShowUserModal(true);
    };

    const openEditUser = (user) => {
        setUserForm({
            name: user.name,
            code: user.code,
            role: user.role || 'cashier',
            permissions: user.permissions || (user.role === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_PERMISSIONS })
        });
        setEditingUserId(user.id);
        setShowUserModal(true);
    };

    const handleRoleChange = (role) => {
        const perms = role === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_PERMISSIONS };
        setUserForm(prev => ({
            ...prev,
            role,
            permissions: perms
        }));
    };

    const handlePermissionToggle = (key) => {
        if (userForm.role === 'admin') return; // Admin always has all permissions
        setUserForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!userForm.name || !userForm.code) {
            toast.error('تکایە ناو و کۆدی PIN دیاری بکە');
            return;
        }

        const dataToSave = {
            name: userForm.name,
            code: userForm.code,
            role: userForm.role,
            permissions: userForm.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : userForm.permissions
        };

        try {
            if (editingUserId) {
                const { error } = await updateCashier(editingUserId, dataToSave);
                if (error) throw new Error(error);
                toast.success('دەسەڵاتەکان بە سەرکەوتوویی تازەکرانەوە');
            } else {
                const { error } = await createCashier(dataToSave);
                if (error) throw new Error(error);
                toast.success('کاشێری نوێ بە سەرکەوتوویی زیادکرا');
            }
            setShowUserModal(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردنی داتا');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('ئایا دڵنیای لە سڕینەوەی ئەم بەکارهێنەرە؟')) {
            try {
                const { error } = await deleteCashier(id);
                if (error) throw new Error(error);
                toast.success('بەکارهێنەرەکە بە سەرکەوتوویی سڕایەوە');
                loadData();
            } catch (error) {
                toast.error('کێشەیەک لە سڕینەوەی بەکارهێنەردا ڕوویدا');
            }
        }
    };

    return (
        <AdminGuard>
            <div className="space-y-5 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Header */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <ShieldCheck size={22} weight="duotone" className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">دەسەڵاتی بەکارهێنەران</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">بەڕێوەبردنی ڕۆڵەکان و دیاریکردنی دەسەڵاتی چوونە ژوورەوە بۆ پەیجەکان</p>
                        </div>
                    </div>
                    <button
                        onClick={openAddUser}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 transition-all"
                    >
                        <Plus size={16} weight="bold" />
                        بەکارهێنەری نوێ
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    
                    {/* Cashiers List Column */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 px-1">بەکارهێنەران و کاشێرەکان</h2>
                        
                        {loading ? (
                            <div className="text-center p-8 text-slate-400">کەمێک چاوەڕوان بە...</div>
                        ) : cashiers.length === 0 ? (
                            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">ھیچ بەکارهێنەرێک نییە</div>
                        ) : (
                            <div className="space-y-3">
                                {cashiers.map(user => {
                                    const isAdmin = user.role === 'admin';
                                    const isSelected = selectedUser?.id === user.id;

                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer hover:border-emerald-500/30 ${
                                                isSelected 
                                                    ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/5 ring-1 ring-emerald-500/20' 
                                                    : 'border-slate-200/60 dark:border-slate-800/60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                                                        isAdmin 
                                                            ? 'bg-rose-100 dark:bg-rose-950/20 text-rose-500' 
                                                            : 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500'
                                                    }`}>
                                                        {isAdmin ? 'A' : 'C'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-slate-200">{user.name}</h3>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                                                            {isAdmin ? 'بەرێوەبەر (Admin)' : 'کاشێر (Cashier)'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1">
                                                    <Key size={14} /> PIN: {user.code}
                                                </span>
                                            </div>

                                            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/50 pt-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditUser(user);
                                                    }}
                                                    className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                >
                                                    دەستکاری
                                                </button>
                                                {cashiers.length > 1 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteUser(user.id);
                                                        }}
                                                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-lg transition-all"
                                                    >
                                                        سڕینەوە
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Permissions Detail Column */}
                    <div className="lg:col-span-2 space-y-3">
                        <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 px-1">بینینی دەسەڵاتەکان</h2>

                        {selectedUser ? (
                            <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">{selectedUser.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {selectedUser.role === 'admin' ? 'هەموو کارەکان ڕێگەپێدراوە بۆ بەرێوەبەر' : 'لیستی لاپەڕە و کردارە ڕێگەپێدراوەکانی کاشێر'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                        selectedUser.role === 'admin' 
                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                    }`}>
                                        {selectedUser.role === 'admin' ? 'تەواوی دەسەڵاتەکان' : 'دەسەڵاتی سنووردار'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {AVAILABLE_PERMISSIONS.map(perm => {
                                        const hasAccess = selectedUser.role === 'admin' || 
                                                          (selectedUser.permissions && selectedUser.permissions[perm.key] === true);
                                        return (
                                            <div 
                                                key={perm.key}
                                                className={`flex items-start gap-3 p-3 rounded-2xl border ${
                                                    hasAccess 
                                                        ? 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5' 
                                                        : 'border-slate-100 dark:border-slate-800/40 opacity-60'
                                                }`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                                                    hasAccess 
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                                                        : 'border-slate-300 dark:border-slate-700 text-slate-350'
                                                }`}>
                                                    {hasAccess && <Check size={12} weight="bold" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{perm.label}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{perm.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-12 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center text-slate-400">
                                <IdentificationCard size={48} weight="duotone" className="mx-auto mb-2 text-slate-300 dark:text-slate-750" />
                                <p className="text-sm font-bold">بەکارهێنەرێک هەڵبژێرە بۆ بینینی دەسەڵاتەکانی</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit User Modal */}
                {showUserModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative" dir="rtl">
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="absolute top-4 left-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                            >
                                <X size={16} />
                            </button>

                            <h3 className="text-base font-black text-slate-850 dark:text-white mb-4">
                                {editingUserId ? 'دەستکاریکردنی بەکارهێنەر' : 'زیادکردنی بەکارهێنەری نوێ'}
                            </h3>

                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500">ناوی بەکارهێنەر</label>
                                        <input
                                            type="text"
                                            value={userForm.name}
                                            onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="بۆ نموونە: ئاراس کامیل"
                                            className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-emerald-500 dark:text-white font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 font-kurdish">کۆدی تێپەڕبوون (PIN Code)</label>
                                        <input
                                            type="password"
                                            value={userForm.code}
                                            onChange={e => setUserForm(prev => ({ ...prev, code: e.target.value }))}
                                            placeholder="کۆدی ٤ ژمارەیی"
                                            maxLength={4}
                                            className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-emerald-500 dark:text-white tracking-widest font-mono text-center"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500">ڕۆڵی بەکارهێنەر</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { role: 'cashier', label: 'کاشێر (Cashier)', desc: 'کۆنترۆڵی دەسەڵاتەکان دەکەیت' },
                                            { role: 'admin', label: 'بەرێوەبەر (Admin)', desc: 'دەسەڵاتی تەواوی سیستمەکەی هەیە' }
                                        ].map(item => (
                                            <button
                                                key={item.role}
                                                type="button"
                                                onClick={() => handleRoleChange(item.role)}
                                                className={`p-3 rounded-2xl border text-right transition-all ${
                                                    userForm.role === item.role 
                                                        ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5 ring-1 ring-emerald-500/10' 
                                                        : 'border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{item.label}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {userForm.role !== 'admin' ? (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 mb-1">دیاریکردنی دەسەڵاتەکان</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                            {AVAILABLE_PERMISSIONS.map(perm => {
                                                const isActive = userForm.permissions[perm.key];
                                                return (
                                                    <button
                                                        key={perm.key}
                                                        type="button"
                                                        onClick={() => handlePermissionToggle(perm.key)}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                                            isActive 
                                                                ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10' 
                                                                : 'border-slate-200/50 dark:border-slate-800/60'
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                                            isActive 
                                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                                : 'border-slate-300 dark:border-slate-700'
                                                        }`}>
                                                            {isActive && <Check size={11} weight="bold" />}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{perm.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-250 dark:border-amber-900/30 rounded-2xl flex items-start gap-2 text-amber-700 dark:text-amber-400">
                                        <ShieldWarning size={20} className="flex-shrink-0 mt-0.5" />
                                        <div className="text-xs leading-relaxed">
                                            <p className="font-bold">سەرنج:</p>
                                            <p className="mt-0.5">ڕۆڵی بەرێوەبەر (Admin) بە شێوەیەکی ئۆتۆماتیکی دەسەڵاتی بەسەر تەواوی لاپەڕەکان و کردارەکاندا هەیە و ناتوانیت دەسەڵاتەکانی کەم بکەیتەوە.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/10 transition-all"
                                    >
                                        پاشەکەوتکردنی بەکارهێنەر
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowUserModal(false)}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
                                    >
                                        پاشگەزبوونەوە
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AdminGuard>
    );
};

export default RolesPage;
