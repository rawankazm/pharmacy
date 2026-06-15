import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LockKey, ShieldCheck } from '@phosphor-icons/react';
import Button from './Button';

const AdminGuard = ({ children }) => {
    const { t } = useTranslation();
    const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminUnlocked') === 'true');
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        const handleAuthChange = () => {
            setIsAuthenticated(sessionStorage.getItem('adminUnlocked') === 'true');
        };
        window.addEventListener('admin-auth-changed', handleAuthChange);
        return () => window.removeEventListener('admin-auth-changed', handleAuthChange);
    }, []);

    const handleUnlock = (e) => {
        e.preventDefault();
        // Get PIN from storage or default to 1234
        const savedPin = localStorage.getItem('adminPin') || '1234';

        if (pin === savedPin) {
            sessionStorage.setItem('adminUnlocked', 'true');
            window.dispatchEvent(new Event('admin-auth-changed'));
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setPin('');
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-coffee-100 dark:border-gray-700 max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-4">
                    <LockKey size={32} weight="fill" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('admin.security_check')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{t('admin.enter_pin')}</p>

                <form onSubmit={handleUnlock} className="flex flex-col gap-4">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            setError(false);
                        }}
                        className={`text-center text-2xl tracking-widest p-3 border rounded-xl outline-none transition-all dark:text-white
                            ${error
                                ? 'border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-100 dark:focus:ring-coffee-900'}`}
                        placeholder="••••"
                        maxLength={4}
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-medium animate-pulse">{t('admin.invalid_pin')}</p>}

                    <Button type="submit" className="w-full flex items-center justify-center gap-2 py-3">
                        <ShieldCheck size={20} />
                        {t('admin.unlock')}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AdminGuard;
