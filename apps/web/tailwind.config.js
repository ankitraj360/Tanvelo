/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Dark navy
        card: '#111827',       // Charcoal card background
        cardHover: '#161F32',
        border: '#1F2937',     // Slate border
        borderMuted: '#2D3748',
        sidebar: '#080C14',
        accent: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          violet: '#8B5CF6',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};
