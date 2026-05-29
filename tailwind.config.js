/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: '#050505',
                'bg-secondary': '#0f0f0f',
                primary: '#00ff88',
                text: '#ffffff',
            },
            fontFamily: {
                sans: ['Manrope', 'Noto Sans', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
}




