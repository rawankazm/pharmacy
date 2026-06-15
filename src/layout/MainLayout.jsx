import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Coffee, ShoppingCart, List, Table, Storefront, Gear, Moon, Sun, CornersOut, CornersIn, Lock, LockOpen, ArrowsClockwise, Package, Basket, ClipboardText, BookOpen, MagnifyingGlass, CaretDown, SignOut, User, Warehouse, ChartBar, Tag, ArrowUUpLeft, Truck, Hourglass, ShieldCheck } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AdminPinModal from '../components/AdminPinModal';
import { useTheme } from '../context/ThemeContext';
import { useKeyboard } from '../context/KeyboardContext';

const MainLayout = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { isVisible: isKeyboardVisible } = useKeyboard();
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const toggleFullScreen = async () => {
        try {
            const doc = document;
            const docEl = document.documentElement;

            // Check if currently in fullscreen
            const isCurrentlyFullscreen = doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement;

            if (!isCurrentlyFullscreen) {
                // Enter fullscreen
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
                // Exit fullscreen
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

    // Listen for fullscreen change events (including browser-specific prefixes)
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

    const menuItems = [
        { path: '/cashier', icon: ShoppingCart, label: t('menu.cashier') },
        { path: '/admin/products', icon: Package, label: t('menu.products') },
        { path: '/admin/debts', icon: BookOpen, label: t('menu.debts') || "Debt Notebook" },
        { path: '/admin/expenses', icon: ClipboardText, label: t('menu.expenses') || "Expenses" },
        { path: '/settings', icon: Gear, label: t('menu.settings') },
    ];

    const [appName, setAppName] = React.useState(localStorage.getItem('appName') || 'PharmacyPOS');

    React.useEffect(() => {
        const handleSettingsChange = () => {
            setAppName(localStorage.getItem('appName') || 'PharmacyPOS');
        };
        window.addEventListener('app-settings-changed', handleSettingsChange);
        return () => window.removeEventListener('app-settings-changed', handleSettingsChange);
    }, []);

    // Global Admin Lock State
    const [isGlobalAdminUnlocked, setIsGlobalAdminUnlocked] = React.useState(() => sessionStorage.getItem('adminUnlocked') === 'true');
    const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);

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

    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
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
            if (path.startsWith('/admin/debts')) return currentUser.permissions.debts_page === true;
            if (path.startsWith('/cashier')) return currentUser.permissions.cashier_page === true;
            if (path.startsWith('/warehouse') || path.startsWith('/incoming-medicines')) return currentUser.permissions.warehouse_page === true;
            if (path.startsWith('/admin/expenses')) return currentUser.permissions.expenses_page === true;
            if (path.startsWith('/admin/products')) return currentUser.permissions.products_page === true;
            if (path.startsWith('/discounts')) return currentUser.permissions.discounts_page === true;
            if (path.startsWith('/returns')) return currentUser.permissions.returns_page === true;
            if (path.startsWith('/suppliers')) return currentUser.permissions.suppliers_page === true;
            if (path.startsWith('/expired-products')) return currentUser.permissions.expired_page === true;
            if (path.startsWith('/shift-reports')) return currentUser.permissions.shift_reports_page === true;
            if (path.startsWith('/settings')) return currentUser.permissions.settings_page === true;
            if (path.startsWith('/roles')) return false; // Only admin role has access
        }

        if (path === '/cashier') return true;
        return false;
    };

    const isAllowed = hasPermission(location.pathname);

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#030712] overflow-hidden transition-colors duration-300">
            {/* Top Navbar */}
            <header className="w-full bg-white dark:bg-[#080d1a]/90 border-b border-slate-200/50 dark:border-slate-900/60 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
                    {/* Left: Brand & Search */}
                    <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                        <Link to="/cashier" className="flex items-center gap-2">
                            <Storefront size={28} weight="duotone" className="text-emerald-500" />
                            <span className="text-xl font-extrabold tracking-tight flex items-center">
                                <span className="text-slate-800 dark:text-white">
                                    {appName.endsWith('POS') ? appName.slice(0, -3) : appName}
                                </span>
                                <span className="text-emerald-500 ml-1">
                                    {appName.endsWith('POS') ? 'POS' : 'Sans'}
                                </span>
                            </span>
                        </Link>
                        
                        {location.pathname === '/cashier' && (
                            <div className="relative hidden md:block">
                                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                    <MagnifyingGlass size={18} />
                                </span>
                                <input
                                    type="text"
                                    placeholder={t('common.search') || "Search Menu..."}
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-800/50 rounded-full text-sm outline-none focus:bg-white focus:border-emerald-500 dark:focus:bg-slate-900 transition-all w-48 lg:w-64 text-slate-700 dark:text-slate-200"
                                    onChange={(e) => {
                                        window.dispatchEvent(new CustomEvent('product-search', { detail: e.target.value }));
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Middle: Navigation Tabs */}
                    <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-grow justify-center py-1">
                        {[
                            { path: '/dashboard', label: 'Dashboard', labelText: 'داشبۆرد' },
                            { path: '/admin/debts', label: 'Reservation', labelText: t('menu.debts') || "Reservation" },
                            { path: '/cashier', label: 'Menu', labelText: t('menu.cashier') || "Menu" },
                            { path: '/incoming-medicines', label: 'Incoming', labelText: 'دەرمانی هاتوو' },
                            { path: '/warehouse', label: 'Warehouse', labelText: 'تۆماری دەرمان' },
                            { path: '/admin/expenses', label: 'Accounting', labelText: t('menu.expenses') || "Accounting" }
                        ].filter(tab => hasPermission(tab.path)).map((tab) => {
                            const isActive = location.pathname.startsWith(tab.path);
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 relative whitespace-nowrap ${
                                        isActive
                                            ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {tab.labelText}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-500 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: Cashier Info & Controls */}
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 relative">
                        {/* Profile Dropdown Trigger */}
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-200 text-slate-700 dark:text-slate-350"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{t('menu.cashier') || "Cashier"}</p>
                            </div>
                            <CaretDown size={14} className="hidden lg:block text-slate-400" />
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl py-2 z-50 animate-fade-in">
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-850 mb-2">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('login.welcome')}</p>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{currentUser.name}</p>
                                    </div>
                                    
                                    {hasPermission('/admin/products') && (
                                        <Link
                                            to="/admin/products"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Package size={18} />
                                            <span>{t('menu.products')}</span>
                                        </Link>
                                    )}
                                    
                                    {hasPermission('/incoming-medicines') && (
                                        <Link
                                            to="/incoming-medicines"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Truck size={18} />
                                            <span>دەرمانی هاتوو</span>
                                        </Link>
                                    )}

                                    {hasPermission('/warehouse') && (
                                        <Link
                                            to="/warehouse"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Warehouse size={18} />
                                            <span>تۆماری دەرمان</span>
                                        </Link>
                                    )}

                                    {hasPermission('/dashboard') && (
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <ChartBar size={18} />
                                            <span>داشبۆرد</span>
                                        </Link>
                                    )}

                                    {hasPermission('/discounts') && (
                                        <Link
                                            to="/discounts"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Tag size={18} />
                                            <span>داشکاندن</span>
                                        </Link>
                                    )}

                                    {hasPermission('/returns') && (
                                        <Link
                                            to="/returns"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <ArrowUUpLeft size={18} />
                                            <span>گەڕانەوەی کاڵا</span>
                                        </Link>
                                    )}

                                    {hasPermission('/suppliers') && (
                                        <Link
                                            to="/suppliers"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Truck size={18} />
                                            <span>دابینکەران</span>
                                        </Link>
                                    )}

                                    {hasPermission('/expired-products') && (
                                        <Link
                                            to="/expired-products"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Hourglass size={18} />
                                            <span>کاڵا بەسەرچووەکان</span>
                                        </Link>
                                    )}

                                    {hasPermission('/shift-reports') && (
                                        <Link
                                            to="/shift-reports"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <ClipboardText size={18} />
                                            <span>ڕاپۆرتی کۆتایی ڕۆژ</span>
                                        </Link>
                                    )}

                                    {(currentUser?.role === 'admin' || sessionStorage.getItem('adminUnlocked') === 'true') && (
                                        <Link
                                            to="/roles"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-2"
                                        >
                                            <ShieldCheck size={18} />
                                            <span>دەسەڵاتی بەکارهێنەران</span>
                                        </Link>
                                    )}
                                    
                                    {hasPermission('/settings') && (
                                        <Link
                                            to="/settings"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Gear size={18} />
                                            <span>{t('menu.settings')}</span>
                                        </Link>
                                    )}
                                    
                                    <button
                                        onClick={() => {
                                            setIsProfileDropdownOpen(false);
                                            toggleAdminLock();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left rtl:text-right"
                                    >
                                        {isGlobalAdminUnlocked ? <LockOpen size={18} /> : <Lock size={18} />}
                                        <span>{isGlobalAdminUnlocked ? (t('admin.lock_session') || "Lock Session") : (t('admin.unlock_session') || "Unlock Session")}</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            setIsProfileDropdownOpen(false);
                                            toggleFullScreen();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left rtl:text-right"
                                    >
                                        {isFullscreen ? <CornersIn size={18} /> : <CornersOut size={18} />}
                                        <span>{t('common.fullscreen')}</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsProfileDropdownOpen(false);
                                            toggleDarkMode();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left rtl:text-right"
                                    >
                                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                        <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                                    </button>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-2" />
                                    
                                    <button
                                        onClick={() => {
                                            setIsProfileDropdownOpen(false);
                                            sessionStorage.removeItem('activePharmacist');
                                            window.location.reload();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20 text-left rtl:text-right font-bold"
                                    >
                                        <SignOut size={18} />
                                        <span>{t('login.switch_user')}</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Quick controls panel next to dropdown for accessibility */}
                        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                title={t('common.refresh')}
                            >
                                <ArrowsClockwise size={20} />
                            </button>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
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
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed" dir="rtl">
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

            {/* The PIN Custom Modal */}
            <AdminPinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onConfirm={handlePinConfirm}
            />
        </div>
    );
};

export default MainLayout;
