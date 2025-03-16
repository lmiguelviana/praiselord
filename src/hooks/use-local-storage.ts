/**
 * use-local-storage.ts
 * 
 * Hook para gerenciamento de localStorage
 * Responsável por:
 * - Persistência de dados
 * - Sincronização de estado
 * - Tratamento de erros
 * - Acessibilidade
 */

import { useState, useEffect } from "react"

// Hook para usar localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Recuperar valor do localStorage
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  // Função para atualizar valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Salvar estado
      setStoredValue(valueToStore)

      // Salvar no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  // Sincronizar com outros tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue)
        } catch (error) {
          console.error(error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [key, initialValue])

  return [storedValue, setValue] as const
} 