/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        editor: {
          bg: '#18181b', // slate-900 / dark zinc
          panel: '#202024',
          subpanel: '#27272a',
          header: '#1e1e22',
          toolbar: '#1a1a1e',
          border: '#333338',
          hover: '#3a3a42',
          active: '#454550',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          text: '#e4e4e7',
          muted: '#a1a1aa',
          dim: '#71717a',
          workspace: '#2f2f35',
        },
      },
    },
  },
  plugins: [],
};
