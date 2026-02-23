import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#fffdf8",
        canvas: "#120101",
        panel: "#1b0505",
        accent: "#d90614",
        muted: "#f0d7bf",
        line: "#fff1e280"
      },
      boxShadow: {
        card: "0 18px 40px rgba(0,0,0,0.45)",
        glow: "0 0 0 1px rgba(217,6,20,0.3), 0 8px 32px rgba(217,6,20,0.12)"
      }
    }
  },
  plugins: []
};

export default config;
