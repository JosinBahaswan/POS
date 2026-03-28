import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0e1e38",
        sky: "#dce7ff"
      }
    }
  },
  plugins: []
};

export default config;
