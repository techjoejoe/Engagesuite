import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Mobile-first breakpoints
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        
        // Custom breakpoints for educational contexts
        'smartboard': '1920px',
        'tablet-landscape': '1024px',
        'mobile-landscape': '568px',
        
        // Max-width breakpoints
        'max-sm': { 'max': '639px' },
        'max-md': { 'max': '767px' },
        'max-lg': { 'max': '1023px' },
      },
      
      spacing: {
        'touch': '48px',
        'touch-lg': '64px',
      },
      
      fontSize: {
        'smartboard': ['2.5rem', { lineHeight: '3rem' }],
        'smartboard-lg': ['3.5rem', { lineHeight: '4rem' }],
      },
      
      maxWidth: {
        'reading': '65ch',
        'smartboard': '90%',
      },
    },
  },
  plugins: [],
};

export default config;
