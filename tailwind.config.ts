/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
      ],
  theme: {
    container:{
        center: true,
        padding:{
            DEFAULT : '1rem',
            md: '1.5rem',
            lg: '2rem'
        }
    },
    
    fontSize: {
      h1: ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      h2: ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      h3: ['1.5rem', { lineHeight: '2rem' }], // 24px
      h4: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      h5: ['1rem', { lineHeight: '1.5rem' }], // 16px
      h6: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      p: ['1rem', { lineHeight: '1.5rem' }], // 16px (default for paragraphs)
    },
    colors:{
        primary: {
            DEFAULT: {

            }
        }
    },
    fontWeight: {
      h1: '700',
      h2: '700',
      h4: '600',
      h5: '500',
      h6: '500',
      p: '400', // Default for paragraphs
    },
    extend: {
      dropShadow: {
        'xl': '0 4px 4px #64249E',
        'l': '0 2px 2px #64249E',
        '4xl': [
            '0 35px 35px #64249E',
            '0 45px 65px #64249E'
        ]
      },
      animation: {
        float: "float 5s ease-in-out infinite",
      },
      keyframes: {
        float: {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-6px)" },
          },
        },
      height: {
        "88vh": "88vh"
      },
      width: {
        "15.6rem": "15.6rem",
        "19.5rem": "19.5rem",
        "25rem": "25rem",
        "34rem": "34rem",
        "36rem": "36rem",
        "45rem": "45rem",
        "56.8rem": "56.8rem",
        "90rem": "90rem"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ['var(--font-nunito-sans)', 'sans-serif'],
        customFont: ['GTWalsheim', 'GT-Walsheim-Pro'], 
      },

      spacing: {
        "15rem": "15rem"
      },
      boxShadow: {
        '3xl': '0 10px 40px rgba(0, 0, 0, 0.1)'
      },
      screens: {
        "wide": "1440px"
      }
    },
  },
  plugins: []
};
export default config;

function createThemes(arg0: { light: any; dark: any; }) {
    throw new Error("Function not implemented.");
}
