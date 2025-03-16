/**
 * use-click-outside.ts
 * 
 * Hook para gerenciamento de clique fora
 * Responsável por:
 * - Detecção de cliques fora de elementos
 * - Fechamento de modais e menus
 * - Limpeza de listeners
 * - Acessibilidade
 */

import { useEffect, RefObject } from "react"

// Hook para usar clique fora
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    // Função para verificar clique
    const listener = (event: MouseEvent | TouchEvent) => {
      // Verificar se o elemento existe
      if (!ref.current) {
        return
      }

      // Verificar se o clique foi fora do elemento
      if (!ref.current.contains(event.target as Node)) {
        handler(event)
      }
    }

    // Adicionar listeners
    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    // Limpar listeners
    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
} 