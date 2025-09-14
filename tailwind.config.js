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
        'surface-elevated': 'rgb(var(--tc-surface-elevated))',
        text: 'rgb(var(--tc-text))',
        'text-secondary': 'rgb(var(--tc-text-secondary))',
        muted: 'rgb(var(--tc-muted))',
        border: 'rgb(var(--tc-border))',
        'border-strong': 'rgb(var(--tc-border-strong))',
        primary: 'rgb(var(--tc-primary))',
        'primary-hover': 'rgb(var(--tc-primary-hover))',
        'primary-light': 'rgb(var(--tc-primary-light))',
        'primary-contrast': 'rgb(var(--tc-primary-contrast))',
        success: 'rgb(var(--tc-success))',
        'success-light': 'rgb(var(--tc-success-light))',
        warning: 'rgb(var(--tc-warning))',
        'warning-light': 'rgb(var(--tc-warning-light))',
        error: 'rgb(var(--tc-error))',
        'error-light': 'rgb(var(--tc-error-light))',
        accent: 'rgb(var(--tc-accent))',
        'accent-contrast': 'rgb(var(--tc-accent-contrast))'
      },
      borderRadius: {
        xs: 'var(--tc-radius-xs)',
        sm: 'var(--tc-radius-sm)', 
        md: 'var(--tc-radius-md)',
        lg: 'var(--tc-radius-lg)',
        xl: 'var(--tc-radius-xl)',
        '2xl': 'var(--tc-radius-2xl)',
        '3xl': 'var(--tc-radius-3xl)'
      },
      boxShadow: {
        xs: 'var(--tc-shadow-xs)',
        sm: 'var(--tc-shadow-sm)',
        DEFAULT: 'var(--tc-shadow)',
        lg: 'var(--tc-shadow-lg)',
        xl: 'var(--tc-shadow-xl)'
      },
      transitionDuration: {
        0: 'var(--tc-dur-instant)',
        fast: 'var(--tc-dur-fast)',
        DEFAULT: 'var(--tc-dur)',
        slow: 'var(--tc-dur-slow)',
        slower: 'var(--tc-dur-slower)',
        250: '250ms',
        350: '350ms',
        500: '500ms'
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
