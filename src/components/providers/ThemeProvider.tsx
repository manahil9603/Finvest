'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeCtx {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Dark is the default — no class needed on :root
  const [theme, setTheme] = useState<Theme>('dark')

  // Sync with localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem('finvest-theme') as Theme | null
    if (stored === 'light') {
      setTheme('light')
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('finvest-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
