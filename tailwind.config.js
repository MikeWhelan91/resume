module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--tc-bg))',
        surface: 'rgb(var(--tc-surface))',
        text: 'rgb(var(--tc-text))',
        muted: 'rgb(var(--tc-muted))',
        border: 'rgb(var(--tc-border))',
        accent: 'rgb(var(--tc-accent))',
        'accent-contrast': 'rgb(var(--tc-accent-contrast))'
      },
      borderRadius: {
        sm: 'var(--tc-radius-sm)',
        md: 'var(--tc-radius-md)',
        lg: 'var(--tc-radius-lg)',
        xl: 'var(--tc-radius-xl)',
        '2xl': 'var(--tc-radius-2xl)'
      },
      boxShadow: {
        sm: 'var(--tc-shadow-sm)',
        DEFAULT: 'var(--tc-shadow)',
        lg: 'var(--tc-shadow-lg)'
      },
      transitionDuration: {
        fast: 'var(--tc-dur-fast)',
        DEFAULT: 'var(--tc-dur)',
        slow: 'var(--tc-dur-slow)'
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--tc-ease)',
        out: 'var(--tc-ease-out)'
      },
      fontFamily: {
        sans: 'var(--tc-font-sans)'
      }
    }
  },
  plugins: []
};
