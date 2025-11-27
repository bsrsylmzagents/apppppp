/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class", '[data-theme="midnight"]'],
	content: [
	  "./src/**/*.{js,jsx,ts,tsx}",
	  "./public/index.html"
	],
	theme: {
	  container: {
		center: true,
		padding: "2rem",
		screens: {
		  "2xl": "1400px",
		},
	  },
	  extend: {
		colors: {
		  // --- BU KISIM EKSİKTİ, O YÜZDEN MENÜLER YOKTU ---
		  sidebar: {
			DEFAULT: "var(--sidebar-bg)",     // App.css'teki #1A3C34 rengini çeker
			foreground: "var(--sidebar-text)", // Beyaz rengi çeker
			hover: "var(--sidebar-hover)",     // Hover rengini çeker
		  },
		  // -------------------------------------------------
  
		  border: "var(--border-color)",
		  input: "var(--input-bg)",
		  ring: "var(--focus-ring-color)",
		  background: "var(--bg-app)",
		  foreground: "var(--text-primary)",
		  
		  card: {
			DEFAULT: "var(--bg-card)",
			foreground: "var(--text-primary)",
		  },
		  
		  primary: {
			DEFAULT: "var(--primary-accent)",
			foreground: "#ffffff",
		  },
		  secondary: {
			DEFAULT: "var(--bg-elevated)",
			foreground: "var(--text-secondary)",
		  },
		  muted: {
			DEFAULT: "var(--bg-elevated)",
			foreground: "var(--text-muted)",
		  }
		},
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  };
  