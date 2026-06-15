import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Input from '../components/Input';
import AdminGuard from '../components/AdminGuard';
import ConfirmModal from '../components/ConfirmModal';
import { createCaptain, getCaptains, getCashiers, createCashier, updateCashier, deleteCashier, updateCaptain, deleteCaptain, api } from '../api';
import { downloadBackup, restoreBackup, clearDatabase } from '../utils/backupService';
import { FloppyDisk, UserPlus, Shield, Storefront, Database, DownloadSimple, UploadSimple, Palette, Moon, Sun, Keyboard, WarningCircle } from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';
import { useKeyboard } from '../context/KeyboardContext';

const SettingsPage = () => {
    const { t } = useTranslation();
    const { currentTheme, changeTheme, isDarkMode, toggleDarkMode, themes } = useTheme();
    // Force redeploy specific to online fix
    const { isEnabled: isKeyboardEnabled, toggleKeyboardEnabled } = useKeyboard();

    // App Settings
    const [appName, setAppName] = useState(localStorage.getItem('appName') || 'MarketPOS');
    const [storeAddress, setStoreAddress] = useState(localStorage.getItem('storeAddress') || '');
    const [storePhone, setStorePhone] = useState(localStorage.getItem('storePhone') || '');
    const [adminPin, setAdminPin] = useState(localStorage.getItem('adminPin') || '1234');

    // Captain Management
    const [captains, setCaptains] = useState([]);
    const [newCaptainName, setNewCaptainName] = useState('');
    const [newCaptainCode, setNewCaptainCode] = useState('');

    const [editingId, setEditingId] = useState(null);

    // Cashier Management
    const [cashiers, setCashiers] = useState([]);
    const [newCashierName, setNewCashierName] = useState('');
    const [newCashierCode, setNewCashierCode] = useState('');
    const [editingCashierId, setEditingCashierId] = useState(null);



    // Backup Settings
    const [autoBackup, setAutoBackup] = useState(localStorage.getItem('settings_auto_backup') === 'true');

    // Confirm Modal State
    const [confirmState, setConfirmState] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        loadCaptains();
        loadCashiers();
    }, []);

    const loadCashiers = async () => {
        const { data, error } = await getCashiers();
        if (data) {
            setCashiers(data);
        } else if (error) {
            console.error("Failed to load cashiers:", error);
            // alert("Failed to load cashiers: " + (error.message || error));
        }
    };

    const loadCaptains = async () => {
        const { data, error } = await getCaptains();
        if (data) {
            setCaptains(data);
        } else if (error) {
            console.error("Failed to load captains:", error);
            // alert("Failed to load captains: " + (error.message || error));
        }
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        try {
            localStorage.setItem('appName', appName);
            localStorage.setItem('storeAddress', storeAddress);
            localStorage.setItem('storePhone', storePhone);
            localStorage.setItem('adminPin', adminPin);

            // Update App State immediately
            window.dispatchEvent(new Event('app-settings-changed'));

            // Still dispatch storage event for other tabs
            window.dispatchEvent(new Event('storage'));

            toast.success(t('settings.saved_success'));
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings.");
        }
    };

    const handleAddOrUpdateCaptain = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCaptain(editingId, { name: newCaptainName, code: newCaptainCode });
                setEditingId(null);
                toast.success(t('common.save'));
            } else {
                await createCaptain({ name: newCaptainName, code: newCaptainCode });
                toast.success(t('settings.captain_added'));
            }
            loadCaptains();
            setNewCaptainName('');
            setNewCaptainCode('');
        } catch (error) {
            console.error(error);
            toast.error("Error saving captain");
        }
    };

    const handleEditCaptain = (cap) => {
        setNewCaptainName(cap.name);
        setNewCaptainCode(cap.code);
        setEditingId(cap.id);
    };

    const handleDeleteCaptain = async (id) => {
        setConfirmState({
            isOpen: true,
            title: t('common.delete_confirm'),
            message: t('common.are_you_sure') || "Are you sure you want to perform this action?",
            onConfirm: async () => {
                try {
                    await deleteCaptain(id);
                    loadCaptains();
                } catch (error) {
                    console.error(error);
                    toast.error("Error deleting captain");
                }
            }
        });
    };

    // Cashier Logic
    // Cashier Logic
    const handleAddOrUpdateCashier = async (e) => {
        e.preventDefault();
        try {
            if (editingCashierId) {
                const { error } = await updateCashier(editingCashierId, { name: newCashierName, code: newCashierCode });
                if (error) throw error;
                setEditingCashierId(null);
                toast.success(t('common.save'));
            } else {
                const { error } = await createCashier({ name: newCashierName, code: newCashierCode });
                if (error) throw error;
                toast.success(t('settings.cashier_added'));
            }
            loadCashiers();
            setNewCashierName('');
            setNewCashierCode('');
        } catch (error) {
            console.error("Error saving cashier:", error);
            toast.error(`Error saving cashier: ${error.message || JSON.stringify(error)}`);
        }
    };

    const handleEditCashier = (cash) => {
        setNewCashierName(cash.name);
        setNewCashierCode(cash.code);
        setEditingCashierId(cash.id);
    };

    const handleDeleteCashier = async (id) => {
        setConfirmState({
            isOpen: true,
            title: t('common.delete_confirm'),
            message: t('common.are_you_sure') || "Are you sure you want to perform this action?",
            onConfirm: async () => {
                try {
                    await deleteCashier(id);
                    loadCashiers();
                } catch (error) {
                    console.error(error);
                    toast.error("Error deleting cashier");
                }
            }
        });
    };

    const fileInputRef = React.useRef(null);

    // Database Backup
    const handleBackup = async () => {
        toast.loading(t('settings.backup_started') || 'Preparing Backup...', { duration: 1500 });
        const success = await downloadBackup();
        if (success) {
            toast.success(t('settings.backup_success') || 'Backup downloaded successfully!');
        } else {
            toast.error('Backup failed! Check console.');
        }
    };

    // Database Restore
    const handleRestoreClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backup = JSON.parse(event.target.result);

                if (backup && backup.version) {
                    setConfirmState({
                        isOpen: true,
                        title: t('common.confirm_action') || "Confirm Restore",
                        message: t('settings.confirm_restore') || "Are you sure? This will overwrite all current data.",
                        onConfirm: async () => {
                            try {
                                await restoreBackup(backup);
                                toast.success(t('settings.restore_success') || "Data restored successfully!");
                                window.location.reload();
                            } catch (e) {
                                console.error("Restore failed:", e);
                                toast.error(t('settings.restore_error') || "Failed to restore data.");
                            }
                        }
                    });
                } else {
                    toast.error("Invalid backup format.");
                }
            } catch (error) {
                console.error("Restore parsing failed:", error);
                toast.error(t('settings.restore_error') || "Failed to parse data.");
            }
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const handleResetDatabase = () => {
        setConfirmState({
            isOpen: true,
            title: t('settings.reset_database') || "Reset Database",
            message: t('settings.confirm_reset') || "Are you absolutely sure you want to WIPE the entire database including orders, sales, and products? This action CANNOT be undone.",
            onConfirm: async () => {
                const toastId = toast.loading("Resetting database...");
                const success = await clearDatabase();
                if (success) {
                    toast.success(t('settings.reset_success') || "Database has been reset completely!", { id: toastId });
                    window.location.reload();
                } else {
                    toast.error(t('settings.reset_error') || "Failed to reset database.", { id: toastId });
                }
            }
        });
    };


    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-2xl font-bold text-coffee-900 flex items-center gap-2">
                    <Shield size={32} />
                    {t('settings.title')}
                </h1>

                {/* Visual Appearance */}
                {/* Visual Appearance */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <Palette size={24} className="text-coffee-600" />
                        {t('settings.appearance') || "Visual Appearance"}
                    </h2>

                    <div className="space-y-8">
                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? <Moon size={24} className="text-blue-400" /> : <Sun size={24} className="text-orange-400" />}
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {t('settings.dark_mode') || "Dark Mode"}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                dir="ltr"
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center shadow-inner ${isDarkMode ? 'bg-coffee-500 justify-end' : 'bg-gray-300 justify-start'}`}
                            >
                                <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform">
                                    {isDarkMode ? <Moon size={14} className="text-coffee-600" /> : <Sun size={14} className="text-orange-400" />}
                                </div>
                            </button>
                        </div>

                        {/* Virtual Keyboard Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <Keyboard size={24} className="text-gray-500 dark:text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {t('settings.virtual_keyboard') || "Virtual Keyboard"}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('settings.enable_keyboard') || "Enable On-Screen Keyboard"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={toggleKeyboardEnabled}
                                dir="ltr"
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center shadow-inner ${isKeyboardEnabled ? 'bg-coffee-500 justify-end' : 'bg-gray-300 justify-start'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isKeyboardEnabled ? 'transform translate-x-0' : ''}`} />
                            </button>
                        </div>

                        {/* Theme Palette */}
                        <div>
                            <p className="mb-4 font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <span className="w-1 h-6 bg-coffee-500 rounded-full"></span>
                                {t('settings.theme_color') || "Theme Color"}
                            </p>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {Object.entries(themes).map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => changeTheme(key)}
                                        className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 
                                            ${currentTheme === key
                                                ? 'border-coffee-500 bg-coffee-50 dark:bg-coffee-900/20'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        <div
                                            className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${currentTheme === key ? 'ring-2 ring-offset-2 ring-coffee-300' : ''}`}
                                            style={{ backgroundColor: theme.colors[500] }}
                                        >
                                            {currentTheme === key && <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>}
                                        </div>
                                        <span className={`text-sm font-medium ${currentTheme === key ? 'text-coffee-700 dark:text-coffee-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {theme.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* General & Security Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <Storefront size={24} className="text-coffee-600" />
                        {t('settings.general_security')}
                    </h2>
                    <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
                        <Input
                            label={t('settings.app_name')}
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="MarketPOS"
                        />
                        <Input
                            label={t('settings.store_address')}
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            placeholder="e.g. Slemani, Salim Street"
                        />
                        <Input
                            label={t('settings.store_phone')}
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                            placeholder="e.g. 07701234567"
                        />
                        <Input
                            label={t('settings.admin_pin')}
                            value={adminPin}
                            onChange={(e) => setAdminPin(e.target.value)}
                            type="text"
                            placeholder="1234"
                            maxLength={8}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('settings.pin_hint')}</p>

                        <Button type="submit" className="flex items-center gap-2">
                            <FloppyDisk size={20} />
                            {t('common.save')}
                        </Button>
                    </form>
                </div>

                {/* Captain Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <UserPlus size={24} className="text-coffee-600" />
                        {t('settings.manage_captains')}
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Add/Edit Form */}
                        <form onSubmit={handleAddOrUpdateCaptain} className="flex-1 space-y-4">
                            <Input
                                label={t('products.name')}
                                value={newCaptainName}
                                onChange={(e) => setNewCaptainName(e.target.value)}
                                required
                            />
                            <Input
                                label={t('tables.code_pin')}
                                value={newCaptainCode}
                                onChange={(e) => setNewCaptainCode(e.target.value)}
                                required
                            />
                            <div className="flex gap-2">
                                <Button type="submit" variant="secondary" className="flex-1">
                                    {editingId ? t('common.save') : t('tables.add_captain')}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={() => {
                                        setEditingId(null);
                                        setNewCaptainName('');
                                        setNewCaptainCode('');
                                    }}>
                                        {t('common.cancel')}
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* List */}
                        <div className="flex-1 border-l pl-8 border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{t('tables.captains')}</h3>
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                                {(captains || []).map(cap => (
                                    <li key={cap.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-100 dark:border-gray-600 group">
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-100">{cap.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-300">{cap.code}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditCaptain(cap)}
                                                className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCaptain(cap.id)}
                                                className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Cashier Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <UserPlus size={24} className="text-coffee-600" />
                        {t('settings.manage_cashiers')}
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Add/Edit Form */}
                        <form onSubmit={handleAddOrUpdateCashier} className="flex-1 space-y-4">
                            <Input
                                label={t('products.name')}
                                value={newCashierName}
                                onChange={(e) => setNewCashierName(e.target.value)}
                                required
                            />
                            <Input
                                label={t('tables.code_pin')}
                                value={newCashierCode}
                                onChange={(e) => setNewCashierCode(e.target.value)}
                                required
                            />
                            <div className="flex gap-2">
                                <Button type="submit" variant="secondary" className="flex-1">
                                    {editingCashierId ? t('common.save') : t('settings.add_cashier')}
                                </Button>
                                {editingCashierId && (
                                    <Button type="button" variant="outline" onClick={() => {
                                        setEditingCashierId(null);
                                        setNewCashierName('');
                                        setNewCashierCode('');
                                    }}>
                                        {t('common.cancel')}
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* List */}
                        <div className="flex-1 border-l pl-8 border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{t('settings.manage_cashiers')}</h3>
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                                {(cashiers || []).map(cash => (
                                    <li key={cash.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-100 dark:border-gray-600 group">
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-100">{cash.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-300">{cash.code}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditCashier(cash)}
                                                className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCashier(cash.id)}
                                                className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>



                {/* Database Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <Database size={24} className="text-coffee-600" />
                        {t('settings.database')}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        {t('settings.backup_desc') || "Download a full backup of your system data including sales, products, and users."}
                    </p>

                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                            {t('settings.enable_auto_backup') || "Enable Daily Auto Backup"}
                        </span>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors flex-shrink-0 ${autoBackup ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            onClick={() => {
                                const newVal = !autoBackup;
                                setAutoBackup(newVal);
                                localStorage.setItem('settings_auto_backup', newVal);
                            }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoBackup ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <Button onClick={handleBackup} className="flex items-center gap-2 justify-center">
                            <DownloadSimple size={20} />
                            {t('settings.backup_download') || "Download Backup"}
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                            <Button onClick={handleRestoreClick} variant="outline" className="flex items-center gap-2 justify-center border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                                <UploadSimple size={20} />
                                {t('settings.restore_backup') || "Restore Backup"}
                            </Button>
                        </div>

                        <Button onClick={handleResetDatabase} variant="outline" className="flex items-center gap-2 justify-center border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/30">
                            <WarningCircle size={20} />
                            {t('settings.reset_database') || "Reset Database"}
                        </Button>

                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
            />
        </AdminGuard>
    );
};

export default SettingsPage;
