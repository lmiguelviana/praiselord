/**
 * use-debounce.ts
 * 
 * Hook para gerenciamento de debounce
 * Responsável por:
 * - Limitação de chamadas de função
 * - Otimização de performance
 * - Limpeza de timeouts
 * - Acessibilidade
 */

import { useEffect, useState } from "react"

// Hook para usar debounce
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para armazenar valor com debounce
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Timer para aplicar debounce
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpar timer
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
} 