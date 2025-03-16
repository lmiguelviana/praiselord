/**
 * use-previous.ts
 * 
 * Hook para gerenciamento de valor anterior
 * Responsável por:
 * - Armazenamento de valores anteriores
 * - Comparação de valores
 * - Otimização de performance
 * - Acessibilidade
 */

import { useEffect, useRef } from "react"

// Hook para usar valor anterior
export function usePrevious<T>(value: T): T | undefined {
  // Referência para armazenar valor anterior
  const ref = useRef<T>()

  useEffect(() => {
    // Atualizar referência com valor atual
    ref.current = value
  }, [value])

  return ref.current
} 