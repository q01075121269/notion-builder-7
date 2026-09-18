/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        notion: {
          light: {
            bg: '#FFFFFF',
            sidebar: '#F7F6F3',
            card: '#FFFFFF',
            border: '#E9E9E7',
            text: '#37352F',
            muted: '#787774',
            hover: '#EFEFEF',
            callout: '#F1F1EF',
          },
          dark: {
            bg: '#191919',
            sidebar: '#202020',
            card: '#252525',
            border: '#2E2E2E',
            text: '#D4D4D4',
            muted: '#9B9A97',
            hover: '#2A2A2A',
            callout: '#262626',
          },
          tag: {
            gray: { bg: '#E3E2E0', text: '#32302C', darkBg: '#32302C', darkText: '#9B9A97' },
            brown: { bg: '#EEE0DA', text: '#442A1E', darkBg: '#43291F', darkText: '#D9730D' },
            orange: { bg: '#FADEC9', text: '#49290E', darkBg: '#593A17', darkText: '#FF8A00' },
            yellow: { bg: '#FDECC8', text: '#402C1B', darkBg: '#564319', darkText: '#DFAB01' },
            green: { bg: '#DBEDDB', text: '#1C3829', darkBg: '#203C2B', darkText: '#0F7B6C' },
            blue: { bg: '#D3E5EF', text: '#183347', darkBg: '#1D3B53', darkText: '#0B6E99' },
            purple: { bg: '#E8DEEE', text: '#412454', darkBg: '#3E284D', darkText: '#6940A5' },
            pink: { bg: '#F5E0E9', text: '#4C2337', darkBg: '#4E2C3D', darkText: '#AD1A72' },
            red: { bg: '#FFE2DD', text: '#5D1715', darkBg: '#522E2A', darkText: '#E03E3E' },
          }
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
