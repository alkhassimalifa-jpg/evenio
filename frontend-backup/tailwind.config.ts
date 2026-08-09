import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wa: {
          deep: "#075E54",
          teal: "#128C7E",
          accent: "#25D366",
          accentDark: "#1FAA57",
        },
        surface: "#F7F5F2",
        panel: "#FFFFFF",
        ink: "#111B21",
        muted: "#667781",
        border: "#E5E1DA",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        bubble: "1.25rem 1.25rem 1.25rem 0.25rem",
      },
    },
  },
  plugins: [],
};
export default config;