import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "#F0ECDF",
          rose: "#B8858E",
          sage: "#8BA37D",
          olive: "#587055",
          forest: "#0B3816",
        },
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
