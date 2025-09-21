import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        timer: {
          DEFAULT: "hsl(var(--timer))",
          foreground: "hsl(var(--timer-foreground))",
          light: "hsl(var(--timer-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Activity-based colors for schedule blocks
        "blue-family": {
          DEFAULT: "hsl(var(--blue-family))",
          light: "hsl(var(--blue-family-light))",
        },
        "purple-family": {
          DEFAULT: "hsl(var(--purple-family))",
          light: "hsl(var(--purple-family-light))",
        },
        "green-family": {
          DEFAULT: "hsl(var(--green-family))",
          light: "hsl(var(--green-family-light))",
        },
        "orange-family": {
          DEFAULT: "hsl(var(--orange-family))",
          light: "hsl(var(--orange-family-light))",
        },
        "yellow-family": {
          DEFAULT: "hsl(var(--yellow-family))",
          light: "hsl(var(--yellow-family-light))",
        },
        // Calming backgrounds
        "bg-soft": "hsl(var(--bg-soft))",
        "bg-warm": "hsl(var(--bg-warm))",
        "bg-cool": "hsl(var(--bg-cool))",
        "bg-neutral": "hsl(var(--bg-neutral))",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius-sm)",
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'var(--gradient-success)',  
        'gradient-timer': 'var(--gradient-timer)',
        'gradient-accent': 'var(--gradient-accent)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow)',
        'lg': 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--transition)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
