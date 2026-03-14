/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // keep this too if you actually use src/
  ],
  theme: {
    extend: {
      colors: {
        themeBg: "var(--color-bg)",
        themeText: "var(--color-text)",
        invertedBg: "var(--color-inverted-bg)",
        invertedText: "var(--color-inverted-text)",
      },
    },
  },
  plugins: [],
};
