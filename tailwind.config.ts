import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff9eb',
          100: '#ffefc6',
          200: '#fedd88',
          300: '#fdc44a',
          400: '#fca71a', // Warm Construction Gold / Ochre - Ayodhya inspired
          500: '#f5870b',
          600: '#d96206',
          700: '#b44109',
          800: '#92330e',
          900: '#782b0f',
          dark: '#1e293b',
          primary: '#EFC41A', // HomeRun Yellow-Gold
          secondary: '#0F172A', // Slate 900
          success: '#059669', // Emerald 600
        },
      },
    },
  },
  plugins: [],
};
export default config;
