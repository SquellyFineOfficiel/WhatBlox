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
    },
  },
  plugins: [],
} satisfies Config;
