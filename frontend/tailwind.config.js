/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    screens: {
      "mobile-lg": "481px",
      "tablet": "768px",
      "tablet-landscape": "1025px",
      "desktop": "1200px",
      "desktop-large": "1440px",
      "tv": "1920px",
      sm: "481px",
      md: "768px",
      lg: "1025px",
      xl: "1200px",
      "2xl": "1440px",
    },
    extend: {
      colors: {
        // Core Layout
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        card: "rgb(var(--card-rgb) / <alpha-value>)",
        "card-soft": "rgb(var(--card-soft-rgb) / <alpha-value>)",
        "card-text": "rgb(var(--card-text-rgb) / <alpha-value>)",

        // Brand Palette
        "primary": "rgb(var(--primary-rgb) / <alpha-value>)",
        "primary-hover": "rgb(var(--primary-hover-rgb) / <alpha-value>)",
        "primary-active": "rgb(var(--primary-active-rgb) / <alpha-value>)",
        "secondary": "rgb(var(--secondary-rgb) / <alpha-value>)",
        "accent": "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover-rgb) / <alpha-value>)",

        // Navigation & Footer
        navbar: "rgb(var(--navbar-rgb) / <alpha-value>)",
        "navbar-text": "rgb(var(--navbar-text-rgb) / <alpha-value>)",
        sidebar: "rgb(var(--sidebar-rgb) / <alpha-value>)",
        footer: "rgb(var(--footer-rgb) / <alpha-value>)",
        "footer-text": "rgb(var(--footer-text-rgb) / <alpha-value>)",

        // Buttons
        "button-bg": "rgb(var(--button-bg-rgb) / <alpha-value>)",
        "button-text": "rgb(var(--button-text-rgb) / <alpha-value>)",
        "button-hover": "rgb(var(--button-hover-rgb) / <alpha-value>)",
        "button-alt-bg": "rgb(var(--button-alt-bg-rgb) / <alpha-value>)",
        "button-alt-text": "rgb(var(--button-alt-text-rgb) / <alpha-value>)",
        "button-alt-hover": "rgb(var(--button-alt-hover-rgb) / <alpha-value>)",
        "button-buy": "rgb(var(--button-buy-rgb) / <alpha-value>)",
        "button-buy-text": "rgb(var(--button-buy-text-rgb) / <alpha-value>)",

        // UI Elements
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        "border-muted": "rgb(var(--border-muted-rgb) / <alpha-value>)",
        input: "rgb(var(--input-rgb) / <alpha-value>)",
        "input-border": "rgb(var(--input-border-rgb) / <alpha-value>)",
        ring: "var(--ring)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        heading: "rgb(var(--heading-rgb) / <alpha-value>)",
        body: "rgb(var(--body-rgb) / <alpha-value>)",

        // Semantic Colors
        "success": "rgb(var(--success-rgb) / <alpha-value>)",
        "success-light": "rgb(var(--success-light-rgb) / <alpha-value>)",
        "success-text": "rgb(var(--success-text-rgb) / <alpha-value>)",
        
        "error": "rgb(var(--error-rgb) / <alpha-value>)",
        "error-light": "rgb(var(--error-light-rgb) / <alpha-value>)",
        "error-text": "rgb(var(--error-text-rgb) / <alpha-value>)",
        
        "warning": "rgb(var(--warning-rgb) / <alpha-value>)",
        "warning-light": "rgb(var(--warning-light-rgb) / <alpha-value>)",
        "warning-text": "rgb(var(--warning-text-rgb) / <alpha-value>)",
        
        "info": "rgb(var(--info-rgb) / <alpha-value>)",
        "info-light": "rgb(var(--info-light-rgb) / <alpha-value>)",
        "info-text": "rgb(var(--info-text-rgb) / <alpha-value>)",

        // eCommerce Specific
        "sale": "rgb(var(--sale-rgb) / <alpha-value>)",
        "sale-dark": "rgb(var(--sale-dark-rgb) / <alpha-value>)",
        "sale-flash": "rgb(var(--sale-flash-rgb) / <alpha-value>)",
        
        "coupon": "rgb(var(--coupon-rgb) / <alpha-value>)",
        "coupon-mid": "rgb(var(--coupon-mid-rgb) / <alpha-value>)",
        "coupon-light": "rgb(var(--coupon-light-rgb) / <alpha-value>)",
        
        "urgency": "rgb(var(--urgency-rgb) / <alpha-value>)",
        "urgency-dark": "rgb(var(--urgency-dark-rgb) / <alpha-value>)",
        
        "star": "rgb(var(--star-rgb) / <alpha-value>)",
        "skeleton": "rgb(var(--skeleton-rgb) / <alpha-value>)",
        "skeleton-shine": "rgb(var(--skeleton-shine-rgb) / <alpha-value>)",
      },

      fontFamily: {
        sans: ["Roboto", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
        heading: ["Inter", "Roboto", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },

      boxShadow: {
        soft: "0 2px 15px -3px rgba(var(--shadow-color), 0.08)",
        card: "0 1px 4px 0 rgba(var(--shadow-color), 0.10)",
        lift: "0 10px 24px -4px rgba(var(--shadow-color), 0.18)",
        premium: "0 20px 40px -10px rgba(var(--shadow-color), 0.12)",
      },

      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },

  plugins: [],
};
