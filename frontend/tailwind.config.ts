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
          DEFAULT: "#F7F5EF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(11, 46, 36, 0.06), 0 1px 6px 0 rgba(11, 46, 36, 0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
