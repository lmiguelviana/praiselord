/**
 * use-theme.ts
 * 
 * Hook para gerenciamento de tema
 * Responsável por:
 * - Alternância entre temas
 * - Persistência de preferências
 * - Detecção de preferências do sistema
 * - Acessibilidade
 */

import { useEffect, useState } from "react"

// Tipos de tema disponíveis
type Theme = "dark" | "light" | "system"

// Hook para usar tema
export function useTheme() {
  // Estado para armazenar o tema atual
  const [theme, setTheme] = useState<Theme>(() => {
    // Recuperar tema do localStorage
    const savedTheme = localStorage.getItem("theme") as Theme
    return savedTheme || "system"
  })

  useEffect(() => {
    // Função para aplicar tema
    const applyTheme = () => {
      const root = window.document.documentElement

      // Remover classes anteriores
      root.classList.remove("light", "dark")

      // Aplicar tema baseado na preferência
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light"
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }

    // Aplicar tema inicial
    applyTheme()

    // Listener para mudanças de preferência do sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)

    // Limpar listener
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  // Função para alternar tema
  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return { theme, toggleTheme }
} 