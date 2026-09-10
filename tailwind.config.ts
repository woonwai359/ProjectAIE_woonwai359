import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CSMJU2030 design tokens — see @csmju2030/design-system
        primary: {
          DEFAULT: '#004C99', // Maejo Blue
          dark: '#003970',
          light: '#1F66B0',
        },
        secondary: '#E6F2FF',
        neutral: '#334155',
        surface: '#F8FAFC',
        success: '#0F8A5F',
        warning: '#B45309',
        danger: '#B42318',
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['14px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
