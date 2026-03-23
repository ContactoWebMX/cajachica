/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontSize: {
                'xs': ['0.8125rem', { lineHeight: '1.5rem' }],  // 13px (era 12px)
                'sm': ['0.9375rem', { lineHeight: '1.5rem' }],  // 15px (era 14px)
            },
            colors: {
                primary: '#0F172A',
                secondary: '#334155',
                accent: '#3B82F6',
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                sidebar: {
                    bg: 'var(--color-sidebar-bg)',
                    text: 'var(--color-sidebar-text)',
                    hover: 'var(--color-sidebar-hover)',
                    active: 'var(--color-sidebar-active)'
                },
                button: {
                    bg: 'var(--color-button-bg)',
                    hover: 'var(--color-button-hover)',
                    border: 'var(--color-button-border)',
                    text: 'var(--color-button-text)'
                }
            }
        },
    },

    plugins: [],
}
