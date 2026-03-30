/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": {
                    DEFAULT: "#61b869",
                    50: "#f0faf1",
                    100: "#dbf2dd",
                    200: "#b9e5be",
                    300: "#8bd393",
                    400: "#61b869",
                    500: "#61b869",
                    600: "#3a9d43",
                    700: "#2f7d36",
                    800: "#28632d",
                    900: "#235227",
                    dark: "#3a9d43",
                },
                "background": {
                    DEFAULT: "#f6f8f6",
                    light: "#f6f7f6",
                    dark: "#0f1710",
                },
                "surface": {
                    DEFAULT: "#ffffff",
                    light: "#ffffff",
                    dark: "#1a241b",
                },
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "sans": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                "full": "9999px"
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.3s ease-out forwards",
            },
        },
    },
    plugins: [forms, containerQueries],
}
