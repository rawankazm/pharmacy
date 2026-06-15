/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                coffee: {
                    50: 'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    200: 'var(--color-primary-200)',
                    300: 'var(--color-primary-300)',
                    400: 'var(--color-primary-400)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                    800: 'var(--color-primary-800)',
                    900: 'var(--color-primary-900)',
                },
                pharmacy: {
                    bgOuter: '#EAEBF3',
                    bgInner: '#FDFCF5',
                    activeYellow: '#FCEB55',
                    green: '#00D26A',
                    red: '#F87171',
                    textDark: '#1A1D1F',
                    textGray: '#6F767E',
                }
            },
            fontFamily: {
                sans: ['Speda', 'Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
