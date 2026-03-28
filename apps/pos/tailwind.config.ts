import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122137",
        background: "#f7f9ff",
        surface: "#f7f9ff",
        "surface-container-low": "#f1f4fa",
        "surface-container-high": "#e5e8ee",
        "surface-container-highest": "#dfe3e8",
        "surface-container-lowest": "#ffffff",
        primary: "#004d64",
        "primary-container": "#006684",
        "primary-fixed": "#bee9ff",
        "on-primary": "#ffffff",
        "on-primary-fixed-variant": "#004d64",
        "on-surface": "#181c20",
        "on-surface-variant": "#3f484d",
        "secondary-container": "#a0f399",
        "on-secondary-container": "#217128",
        tertiary: "#6b3a00",
        "tertiary-fixed": "#ffdcc0",
        "on-tertiary-fixed-variant": "#6b3b00",
        outline: "#70787e",
        "outline-variant": "#bfc8cd",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a"
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        headline: ["Manrope", "sans-serif"],
        label: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
