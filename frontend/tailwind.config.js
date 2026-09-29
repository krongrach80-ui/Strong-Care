/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DataPulse Modern Light Theme Palette
        canvas: '#F8FAFC',       // Pure Clean Off-White Background
        surface: '#FFFFFF',      // Pure White Card
        surfaceSubtle: '#F1F5F9', // Soft Slate Surface
        surfaceHover: '#F8FAFC',
        border: '#E2E8F0',       // Crisp Light Slate Border
        borderSubtle: '#F1F5F9',

        // Brand Accents
        brandGreen: {
          light: '#ECFDF5',      // Light Mint Pill
          border: '#A7F3D0',
          DEFAULT: '#10B981',    // Vibrant Primary Emerald (Start Free Trial)
          hover: '#059669',
          dark: '#047857',
        },
        brandBlue: {
          light: '#EFF6FF',
          border: '#BFDBFE',
          DEFAULT: '#2563EB',    // Royal Electric Blue
          hover: '#1D4ED8',
          dark: '#1E40AF',
        },
        brandViolet: {
          light: '#F5F3FF',
          border: '#DDD6FE',
          DEFAULT: '#7C3AED',    // Electric Violet
          hover: '#6D28D9',
          dark: '#5B21B6',
        },

        // Ramathibodi Hospital, Mahidol University Official Palette (From rama.mahidol.ac.th)
        rama: {
          teal: '#00A39E',        // Official Ramathibodi Medical Teal / Turquoise
          tealHover: '#008783',   // Darker Teal for button hover & active state
          tealLight: '#E6F7F7',   // Signature Pastel Mint/Teal Banner (from rama.mahidol.ac.th)
          tealBorder: '#B2EBE6',  // Crisp Mint Border
          deep: '#0F3D3E',        // Deep Teal Slate for Headings & Contrast
          canvas: '#FFFFFF',      // Pure Clean Hospital White
          subtle: '#F8FAFB',      // Light Clinical Soft Background
          blue: '#0284C7',        // Clinical Sky Cyan
          coral: '#E11D48',       // Hospital Heart Red / Emergency (Image 1)
        },

        // Mahidol University & Hospital Official Identity Palette
        mahidol: {
          navy: '#0F3D3E',        // Deep Teal Navy
          blue: '#008783',        // Rama Medium Teal
          royal: '#00A39E',       // Ramathibodi Teal
          tint: '#E6F7F7',        // Soft Hospital Mint Blue
          canvas: '#F8FAFB',      // Hospital Clean Slate Background
          gold: '#00A39E',        // Accent Teal
          goldLight: '#E6F7F7',   // Mint Pill
          goldBorder: '#B2EBE6',  // Mint Border
          goldHover: '#008783',   // Deep Teal
          goldDark: '#0F3D3E',    // Contrast Text
          mint: '#00A39E',        // Clinical Health Mint
        },

        // Text Hierarchy
        textPrimary: '#0F172A',   // Slate 900 (High Contrast Dark Navy)
        textSecondary: '#334155', // Slate 700
        textMuted: '#64748B',     // Slate 500
        textLight: '#94A3B8',     // Slate 400

        // Backward compatibility mappings
        background: '#F4F7FB',
        primary: {
          DEFAULT: '#002244',
          glow: 'rgba(0, 34, 68, 0.25)',
        },
        matcha: {
          DEFAULT: '#10B981',
          light: '#ECFDF5',
          powder: '#059669',
          deep: '#047857',
        },
        aiPurple: {
          DEFAULT: '#002244',
          light: '#0A4B8F',
          dark: '#001830',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.02)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      boxShadow: {
        'clean': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(15, 23, 42, 0.04), 0 0 1px 1px rgba(226, 232, 240, 0.8)',
        'card-hover': '0 20px 35px -8px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(203, 213, 225, 0.9)',
        'green-btn': '0 10px 25px -4px rgba(16, 185, 129, 0.35)',
        'blue-btn': '0 10px 25px -4px rgba(37, 99, 235, 0.25)',
      }
    },
  },
  plugins: [],
}
