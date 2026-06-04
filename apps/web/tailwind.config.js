/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        raised: "var(--bg-raised)",
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        text: {
          primary: "var(--text-primary)",
          muted: "var(--text-muted)",
          hint: "var(--text-hint)",
        }
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
