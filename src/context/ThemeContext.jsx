import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const themes = {
    coffee: {
        name: 'Kafe Sans Green', // Emerald green theme
        colors: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#34d399',
            500: '#10b981', // Emerald Green
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
        }
    },
    ocean: {
        name: 'Indigo Midnight',
        colors: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#1e1b4b',
        }
    },
    forest: {
        name: 'Teal Fresh',
        colors: {
            50: '#f0fdf5',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
        }
    },
    berry: {
        name: 'Rose Premium',
        colors: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
        }
    },
    red: {
        name: 'Crimson Energy',
        colors: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
        }
    }
};

export const ThemeProvider = ({ children }) => {
    // Load from local storage or default
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('appTheme') || 'coffee');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('appDarkMode') === 'true');

    // Auto-Theme Logic: Check time on mount
    useEffect(() => {
        const hour = new Date().getHours();
        const isEvening = hour >= 18 || hour < 6; // 6 PM to 6 AM

        if (localStorage.getItem('appDarkMode') === null) {
            setIsDarkMode(isEvening);
        }
    }, []);

    // Apply Theme Colors
    useEffect(() => {
        const theme = themes[currentTheme] || themes.coffee;
        const root = document.documentElement;

        Object.entries(theme.colors).forEach(([shade, value]) => {
            root.style.setProperty(`--color-primary-${shade}`, value);
        });

        localStorage.setItem('appTheme', currentTheme);
    }, [currentTheme]);

    // Apply Dark Mode
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            root.style.setProperty('--bg-main', '#030712'); // Obsidian black background
            root.style.setProperty('--text-main', '#f9fafb');
        } else {
            root.classList.remove('dark');
            root.style.setProperty('--bg-main', '#f1f5f9'); // Slate light background
            root.style.setProperty('--text-main', '#0f172a');
        }
        localStorage.setItem('appDarkMode', isDarkMode);
    }, [isDarkMode, currentTheme]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);
    const changeTheme = (themeName) => setCurrentTheme(themeName);

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            changeTheme,
            isDarkMode,
            toggleDarkMode,
            themes
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
