import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Coffee, ShoppingCart, List, Table, Storefront, Gear, Moon, Sun, CornersOut, CornersIn, Lock, LockOpen, ArrowsClockwise, Package, Basket, ClipboardText, BookOpen, MagnifyingGlass, CaretDown, SignOut, User, Warehouse, ChartBar, Tag, ArrowUUpLeft, Truck, Hourglass, ShieldCheck, Speedometer, Pill, Users, Sliders, LinkSimple } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AdminPinModal from '../components/AdminPinModal';
import { useTheme } from '../context/ThemeContext';
import { useKeyboard } from '../context/KeyboardContext';

const MainLayout = () => {
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { isVisible: isKeyboardVisible } = useKeyboard();
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const toggleFullScreen = async () => {
        try {
            const doc = document;
            const docEl = document.documentElement;

            const isCurrentlyFullscreen = doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement;

            if (!isCurrentlyFullscreen) {
                if (docEl.requestFullscreen) {
                    await docEl.requestFullscreen();
                } else if (docEl.webkitRequestFullscreen) {
                    await docEl.webkitRequestFullscreen();
                } else if (docEl.mozRequestFullScreen) {
                    await docEl.mozRequestFullScreen();
                } else if (docEl.msRequestFullscreen) {
                    await docEl.msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                if (doc.exitFullscreen) {
                    await doc.exitFullscreen();
                } else if (doc.webkitExitFullscreen) {
                    await doc.webkitExitFullscreen();
                } else if (doc.mozCancelFullScreen) {
                    await doc.mozCancelFullScreen();
                } else if (doc.msExitFullscreen) {
                    await doc.msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error(`Fullscreen error: ${err.message}`);
        }
    };

    React.useEffect(() => {
        const handleChange = () => {
            const isFS = !!(document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement);
            setIsFullscreen(isFS);
        };

        document.addEventListener('fullscreenchange', handleChange);
        document.addEventListener('webkitfullscreenchange', handleChange);
        document.addEventListener('mozfullscreenchange', handleChange);
        document.addEventListener('MSFullscreenChange', handleChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleChange);
            document.removeEventListener('webkitfullscreenchange', handleChange);
            document.removeEventListener('mozfullscreenchange', handleChange);
            document.removeEventListener('MSFullscreenChange', handleChange);
        };
    }, []);

    const [appName, setAppName] = React.useState(localStorage.getItem('appName') || 'PharmacyPOS');

    React.useEffect(() => {
        const handleSettingsChange = () => {
            setAppName(localStorage.getItem('appName') || 'PharmacyPOS');
        };
        window.addEventListener('app-settings-changed', handleSettingsChange);
        return () => window.removeEventListener('app-settings-changed', handleSettingsChange);
    }, []);

    const [isGlobalAdminUnlocked, setIsGlobalAdminUnlocked] = React.useState(() => sessionStorage.getItem('adminUnlocked') === 'true');
    const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => {
            const next = !prev;
            localStorage.setItem('sidebarOpen', JSON.stringify(next));
            return next;
        });
    };

    React.useEffect(() => {
        const handleAuthChange = () => {
            setIsGlobalAdminUnlocked(sessionStorage.getItem('adminUnlocked') === 'true');
        };
        window.addEventListener('admin-auth-changed', handleAuthChange);
        return () => window.removeEventListener('admin-auth-changed', handleAuthChange);
    }, []);

    const toggleAdminLock = () => {
        if (isGlobalAdminUnlocked) {
            sessionStorage.removeItem('adminUnlocked');
            window.dispatchEvent(new Event('admin-auth-changed'));
            toast.success(t('admin.session_locked') || "Admin Session Locked");
        } else {
            setIsPinModalOpen(true);
        }
    };

    const handlePinConfirm = (pin, setError, setPin) => {
        const savedPin = localStorage.getItem('adminPin') || '1234';
        if (pin === savedPin) {
            sessionStorage.setItem('adminUnlocked', 'true');
            window.dispatchEvent(new Event('admin-auth-changed'));
            toast.success(t('admin.session_unlocked') || "Admin Session Unlocked");
            setIsPinModalOpen(false);
        } else {
            setError(true);
            setPin('');
        }
    };

    const [currentUser, setCurrentUser] = React.useState(() => {
        const stored = sessionStorage.getItem('activePharmacist');
        return stored ? JSON.parse(stored) : { name: 'Admin Pharmacist' };
    });

    React.useEffect(() => {
        const handleAuthChange = () => {
            const stored = sessionStorage.getItem('activePharmacist');
            setCurrentUser(stored ? JSON.parse(stored) : { name: 'Admin Pharmacist' });
        };
        window.addEventListener('admin-auth-changed', handleAuthChange);
        window.addEventListener('storage', handleAuthChange);
        const interval = setInterval(handleAuthChange, 1000);
        return () => {
            window.removeEventListener('admin-auth-changed', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
            clearInterval(interval);
        };
    }, []);

    const hasPermission = (path) => {
        if (sessionStorage.getItem('adminUnlocked') === 'true') return true;
        if (currentUser?.role === 'admin') return true;

        if (currentUser?.permissions) {
            if (path.startsWith('/dashboard')) return currentUser.permissions.dashboard_page === true;
            if (path.startsWith('/cashier')) return currentUser.permissions.cashier_page === true;
            if (path.startsWith('/warehouse') || path.startsWith('/incoming-medicines')) return currentUser.permissions.warehouse_page === true;
            if (path.startsWith('/admin/expenses')) return currentUser.permissions.expenses_page === true;
            if (path.startsWith('/admin/products')) return currentUser.permissions.products_page === true;
            if (path.startsWith('/suppliers')) return currentUser.permissions.suppliers_page === true;
            if (path.startsWith('/expired-products')) return currentUser.permissions.expired_page === true;
            if (path.startsWith('/shift-reports')) return currentUser.permissions.shift_reports_page === true;
            if (path.startsWith('/settings')) return currentUser.permissions.settings_page === true;
            if (path.startsWith('/roles')) return false;
        }

        if (path === '/cashier') return true;
        return false;
    };

    const isAllowed = hasPermission(location.pathname);

    const sidebarItems = [
        { path: '/dashboard', label: 'Dashboard', ckbLabel: 'داشبۆرد', icon: Speedometer },
        { path: '/cashier', label: 'POS and Invoices', ckbLabel: 'کاشێر و وەسڵەکان', icon: Storefront },
        { path: '/warehouse', label: 'Medicines', ckbLabel: 'دەرمانەکان', icon: Pill },
        { path: '/suppliers', label: 'Suppliers', ckbLabel: 'دابینکەران', icon: Truck },
        { path: '/incoming-medicines', label: 'Purchase', ckbLabel: 'کڕینی دەرمان', icon: ShoppingCart },
        { path: '/shift-reports', label: 'Reports', ckbLabel: 'ڕاپۆرتەکان', icon: ChartBar },
        { path: '/settings', label: 'Settings', ckbLabel: 'ڕێکخستنەکان', icon: Sliders },
    ];

    const getCurrentPageTitle = () => {
        if (location.pathname.startsWith('/dashboard')) return i18n.language === 'ckb' ? 'داشبۆرد' : 'Dashboard Panel';
        if (location.pathname.startsWith('/cashier')) return i18n.language === 'ckb' ? 'کاشێر و فرۆشتن' : 'POS & Invoices';
        if (location.pathname.startsWith('/warehouse')) return i18n.language === 'ckb' ? 'تۆماری دەرمان' : 'Medicines Registry';
        if (location.pathname.startsWith('/suppliers')) return i18n.language === 'ckb' ? 'دابینکەران' : 'Suppliers';
        if (location.pathname.startsWith('/incoming-medicines')) return i18n.language === 'ckb' ? 'دەرمانی هاتوو' : 'Purchase / Incoming';
        if (location.pathname.startsWith('/shift-reports')) return i18n.language === 'ckb' ? 'ڕاپۆرتەکان' : 'Reports Panel';
        if (location.pathname.startsWith('/settings')) return i18n.language === 'ckb' ? 'ڕێکخستنەکان' : 'Settings Panel';
        return i18n.language === 'ckb' ? 'بەشەکانی تر' : 'Other Section';
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#f4f6f9] text-slate-800 transition-colors duration-300">
            {/* Top Windows-style crimson titlebar with gradient & glass reflection */}
            <div className="w-full bg-gradient-to-r from-[#c0392b] via-[#e74c3c] to-[#b83227] text-white h-9 flex items-center justify-between px-4 text-xs select-none border-b border-red-800/80 z-50 flex-shrink-0 relative overflow-hidden shadow-md">
                {/* Sheen Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 relative z-10">
                    <Pill size={14} className="text-emerald-400 font-bold rotate-45" weight="fill" />
                    <span className="font-semibold uppercase tracking-wider text-[11px]">PHARMACY POS SYSTEM v1.0.0.1</span>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2 pr-1">
                        <span onClick={() => toast.success('Minimize')} className="w-4 h-4 hover:bg-white/20 flex items-center justify-center rounded cursor-pointer text-[10px]">─</span>
                        <span onClick={toggleFullScreen} className="w-4 h-4 hover:bg-white/20 flex items-center justify-center rounded cursor-pointer text-[9px]">▢</span>
                        <span onClick={() => {
                            if (window.confirm('Do you want to close the application?')) {
                                window.close();
                            }
                        }} className="w-4 h-4 hover:bg-red-655 flex items-center justify-center rounded cursor-pointer font-bold text-[9px]">✕</span>
                    </div>
                </div>
            </div>

            {/* Layout container */}
            <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* Dark left sidebar with Glassmorphic effects */}
                <aside className={`bg-[#1a1d24]/95 backdrop-blur-md flex flex-col h-full z-40 flex-shrink-0 select-none text-slate-350 border-r border-white/5 relative transition-all duration-300 ${
                    isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
                }`}>
                    {/* App Logo / Brand */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-[#14161c]/40">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-transform duration-300 hover:scale-105">
                            <Pill size={22} weight="fill" className="rotate-45" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-black tracking-wide leading-none">دەرمانخانە پۆس</span>
                            <span className="text-emerald-400 text-[10px] font-bold mt-1.5 tracking-wider uppercase">Simply Meds</span>
                        </div>
                    </div>

                    {/* Pharmacist profile box */}
                    <div className="flex flex-col items-center py-6 border-b border-white/5">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-[#5d60a6] flex items-center justify-center border-2 border-slate-500/80 overflow-hidden relative shadow-[0_0_15px_rgba(93,96,166,0.3)] mb-3 transition-transform duration-300 hover:scale-105">
                            <svg viewBox="0 0 32 32" className="w-12 h-12 text-slate-100 mt-2">
                                <circle cx="16" cy="11" r="6" fill="#fcd34d" />
                                <path d="M16 19c-5.523 0-10 4.477-10 10h20c0-5.523-4.477-10-10-10z" fill="#3b82f6" />
                            </svg>
                        </div>
                        <span className="text-white text-sm font-semibold tracking-wide capitalize">{currentUser?.name || 'admin'}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                            <span className="text-emerald-400 text-[10px] font-bold">• Online</span>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 py-4 space-y-1 overflow-y-auto no-scrollbar">
                        {sidebarItems.filter(item => hasPermission(item.path)).map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 py-3.5 px-5 text-[13px] font-semibold transition-all duration-300 relative ${
                                        isActive
                                            ? 'text-white bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent font-bold border-l-[6px] border-emerald-500 shadow-[inset_1px_0_0_0_rgba(16,185,129,0.1)]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                                    <span>{i18n.language === 'ckb' ? item.ckbLabel : item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Log out option */}
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('activePharmacist');
                                window.location.reload();
                            }}
                            className="w-full flex items-center gap-3 py-3.5 px-5 text-[13px] font-semibold text-[#e74c3c] hover:bg-[#e74c3c]/10 hover:text-red-400 transition-all text-left rtl:text-right border-l-[6px] border-transparent"
                        >
                            <SignOut size={18} className="text-[#e74c3c]" />
                            <span>{i18n.language === 'ckb' ? 'چوونەدەرەوە' : 'Log out'}</span>
                        </button>
                    </nav>

                    {/* Footer / Settings */}
                    <div className="p-3 border-t border-white/5 bg-[#171a20]/90 backdrop-blur-md flex items-center justify-between gap-2">
                        <LanguageSwitcher />
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </aside>

                {/* Right content panel */}
                <div className="flex-1 flex flex-col h-full bg-[#f4f6f9] dark:bg-[#030712] overflow-hidden">
                    {/* Header bar with glassmorphic filter */}
                    <header className="h-14 bg-white/80 dark:bg-[#080d1a]/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-900/40 flex items-center justify-between px-6 select-none shadow-sm flex-shrink-0 z-30">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={toggleSidebar}
                                className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/85 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800/80"
                                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                            >
                                <List size={22} />
                            </button>
                            <h2 className="text-[#27ae60] font-black text-lg select-none">
                                {getCurrentPageTitle()}
                            </h2>
                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs ml-4 font-bold">
                                <span>Updating</span>
                                <ArrowsClockwise size={14} className="animate-spin text-slate-400" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleAdminLock}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                title={isGlobalAdminUnlocked ? "Lock Admin Session" : "Unlock Admin Session"}
                            >
                                {isGlobalAdminUnlocked ? <LockOpen size={18} /> : <Lock size={18} />}
                            </button>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">admin</span>
                            <div className="w-8 h-8 rounded border border-orange-500/80 bg-white dark:bg-slate-800 flex items-center justify-center text-orange-500 font-bold select-none cursor-pointer">
                                <User size={16} />
                            </div>
                        </div>
                    </header>

                    <main className={`flex-1 transition-all duration-300 ${
                        location.pathname === '/cashier'
                            ? 'overflow-hidden'
                            : ['/admin/products', '/admin/expenses', '/incoming-medicines', '/warehouse'].includes(location.pathname)
                                ? 'overflow-hidden p-4 md:p-6'
                                : 'overflow-y-auto p-4 md:p-6 pb-20'
                    }`}>
                        {isAllowed ? (
                            <Outlet />
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                                <div className="bg-white dark:bg-[#080d1a]/60 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-8 max-w-sm w-full shadow-xl glass-panel animate-fade-in">
                                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-500/20">
                                        <Lock size={32} weight="duotone" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-850 dark:text-slate-100 mb-2">دەسەڵاتی ڕێگەپێدراو نییە</h2>
                                    <p className="text-xs text-slate-550 dark:text-slate-400 mb-6 leading-relaxed" dir="rtl">
                                        تۆ دەسەڵاتی بینینی لاپەڕەی <span className="font-bold text-rose-500">{location.pathname}</span>ت نییە. پێویستت بە مۆڵەتی بەرێوەبەر هەیە.
                                    </p>
                                    <button
                                        onClick={() => setIsPinModalOpen(true)}
                                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/15 transition-all"
                                    >
                                        داخڵکردنی PINی بەرێوەبەر
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <AdminPinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onConfirm={handlePinConfirm}
            />
        </div>
    );
};

export default MainLayout;
