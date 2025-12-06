import {heroui} from "@heroui/theme"
import typography from "@tailwindcss/typography"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#23d375",
          50: "#e8faf0",
          100: "#d1f5e1",
          200: "#a3ebc3",
          300: "#75e1a5",
          400: "#47d787",
          500: "#23d375",
          600: "#1ca95d",
          700: "#157f45",
          800: "#0e552e",
          900: "#072a17",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        skeleton: {
          "0%": { backgroundPosition: "-100% 0" },
          "100%": { backgroundPosition: "100% 0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out forwards",
        skeleton: "skeleton 2s ease-in-out infinite",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#23d375",
              50: "#e8faf0",
              100: "#d1f5e1",
              200: "#a3ebc3",
              300: "#75e1a5",
              400: "#47d787",
              500: "#23d375",
              600: "#1ca95d",
              700: "#157f45",
              800: "#0e552e",
              900: "#072a17",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#23d375",
              50: "#072a17",
              100: "#0e552e",
              200: "#157f45",
              300: "#1ca95d",
              400: "#23d375",
              500: "#47d787",
              600: "#75e1a5",
              700: "#a3ebc3",
              800: "#d1f5e1",
              900: "#e8faf0",
            },
          },
        },
      },
    }),
    typography(),
  ],
}
