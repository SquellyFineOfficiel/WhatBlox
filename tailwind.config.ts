import { defineConfig } from 'tailwindcss'

export default defineConfig({
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'wb-pack-close': {
          '0%': { transform: 'perspective(1000px) rotateY(0deg) scale(1)', filter: 'brightness(1)' },
          '100%': { transform: 'perspective(1000px) rotateY(-95deg) scale(0.9)', filter: 'brightness(0.4)', opacity: '0.35' },
        },
        'wb-pack-open': {
          '0%': { transform: 'perspective(1000px) rotateY(95deg) scale(0.9)', filter: 'brightness(2.2)', opacity: '0' },
          '45%': { opacity: '1', filter: 'brightness(1.3)' },
          '70%': { transform: 'perspective(1000px) rotateY(-7deg) scale(1.035)', filter: 'brightness(1.05)' },
          '100%': { transform: 'perspective(1000px) rotateY(0deg) scale(1)', filter: 'brightness(1)', opacity: '1' },
        },
        'wb-flash-pop': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '28%': { opacity: '0.9', transform: 'scale(1.1)' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
        'wb-shine-sweep': {
          '0%': { left: '-160%', opacity: '0' },
          '12%': { opacity: '1' },
          '55%': { opacity: '1' },
          '100%': { left: '160%', opacity: '0' },
        },
        'wb-particle-burst': {
          '0%': { transform: 'translate(-50%, -50%) translate(0, 0) scale(0)', opacity: '1' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1)', opacity: '0' },
        },
        'wb-card-in': {
          from: { opacity: '0', transform: 'scale(0.98) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'wb-pack-close': 'wb-pack-close 0.26s cubic-bezier(0.4, 0, 1, 1) forwards',
        'wb-pack-open': 'wb-pack-open 0.56s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'wb-flash-pop': 'wb-flash-pop 0.55s ease-out',
        'wb-shine-sweep': 'wb-shine-sweep 0.6s ease-out',
        'wb-particle-burst': 'wb-particle-burst 500ms cubic-bezier(0.2, 0.8, 0.3, 1) forwards',
        'wb-card-in': 'wb-card-in 0.32s ease both',
      },
    },
  },
  plugins: [],
})