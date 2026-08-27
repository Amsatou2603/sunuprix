import type { Config } from "tailwindcss";

/**
 * Palette SunuPrix — définie une seule fois ici et référencée partout via
 * les classes utilitaires Tailwind (`bg-primary`, `text-accent`, etc.).
 * Ne jamais coder en dur un code couleur hexadécimal dans les composants.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F6E56",
          light: "#15956F",
          dark: "#0B5443",
        },
        accent: {
          DEFAULT: "#EF9F27",
          light: "#F5B75A",
          dark: "#C97F16",
        },
        header: {
          DEFAULT: "#0B2E24",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          card: "#F5F5F7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(11, 46, 36, 0.06), 0 1px 6px 0 rgba(11, 46, 36, 0.08)",
      },
      borderRadius: {
        xl2: "1.5rem",
        xl3: "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "lueur-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.18)" },
        },
        "flotter": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "lueur-pulse": "lueur-pulse 2.4s ease-in-out infinite",
        "flotter": "flotter 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
