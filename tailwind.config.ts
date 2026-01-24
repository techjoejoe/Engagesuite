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
        'xs': '320px',      // Small phones
        'sm': '640px',      // Large phones
        'md': '768px',      // Tablets
        'lg': '1024px',     // Desktop
        'xl': '1280px',     // Large desktop
        '2xl': '1536px',    // Extra large desktop
        
        // Custom breakpoints for educational contexts
        'smartboard': '1920px',   // Large touch displays (Smartboards)
        'tablet-landscape': '1024px',  // Tablets in landscape
        'mobile-landscape': '568px',   // Phones in landscape
        
        // Max-width breakpoints (for mobile-first design)
        'max-sm': { 'max': '639px' },
        'max-md': { 'max': '767px' },
        'max-lg': { 'max': '1023px' },
      },
      
      spacing: {
        // Touch-friendly spacing for Smartboards
        'touch': '48px',     // Minimum touch target size
        'touch-lg': '64px',  // Large touch target
      },
      
      fontSize: {
        // Readable sizes for different screen sizes
        'smartboard': ['2.5rem', { lineHeight: '3rem' }],
        'smartboard-lg': ['3.5rem', { lineHeight: '4rem' }],
      },
      
      maxWidth: {
        // Content width constraints
        'reading': '65ch',    // Optimal reading width
        'smartboard': '90%',  // Smartboard content width
      },
    },
  },
  plugins: [],
};

export default config;
