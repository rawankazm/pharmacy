import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    useEffect(() => {
        document.body.dir = i18n.language === 'ckb' ? 'rtl' : 'ltr';
        if (i18n.language === 'ckb') {
            document.body.classList.add('font-kurdish');
        } else {
            document.body.classList.remove('font-kurdish');
        }
    }, [i18n.language]);

    return (
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${i18n.language === 'en'
                    ? 'bg-white dark:bg-gray-600 text-coffee-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-coffee-600 dark:hover:text-coffee-300'
                    }`}
            >
                English
            </button>
            <button
                onClick={() => changeLanguage('ckb')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all font-kurdish ${i18n.language === 'ckb'
                    ? 'bg-white dark:bg-gray-600 text-coffee-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-coffee-600 dark:hover:text-coffee-300'
                    }`}
            >
                کوردی
            </button>
        </div>
    );
};

export default LanguageSwitcher;
