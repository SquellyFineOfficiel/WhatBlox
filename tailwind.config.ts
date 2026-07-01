import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        rbx: {
          bg: '#080810',
          surface: '#10101c',
          'surface-2': '#18182a',
          'surface-3': '#22223a',
          border: '#2e2e48',
          muted: '#7878a0',
          red: '#e8145c',
          orange: '#ff6b00',
          purple: '#9333ea',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
        'fade-up-slow': 'fade-up 0.6s ease both',
        'fade-in': 'fade-in 0.3s ease both',
        'scale-in': 'scale-in 0.35s ease both',
      },
    },
  },
  plugins: [],
} satisfies Config;
