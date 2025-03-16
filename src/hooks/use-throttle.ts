/**
 * use-throttle.ts
 * 
 * Hook para gerenciamento de throttle
 * Responsável por:
 * - Limitação de chamadas de função
 * - Otimização de performance
 * - Limpeza de timeouts
 * - Acessibilidade
 */

import { useEffect, useState } from "react"

// Hook para usar throttle
export function useThrottle<T>(value: T, delay: number): T {
  // Estado para armazenar valor com throttle
  const [throttledValue, setThrottledValue] = useState<T>(value)

  useEffect(() => {
    // Timer para aplicar throttle
    const timer = setTimeout(() => {
      setThrottledValue(value)
    }, delay)

    // Limpar timer
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return throttledValue
} 