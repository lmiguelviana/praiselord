/**
 * use-media-query.ts
 * 
 * Hook para gerenciamento de media queries
 * Responsável por:
 * - Detecção de breakpoints
 * - Atualização de estado
 * - Limpeza de listeners
 * - Acessibilidade
 */

import { useEffect, useState } from "react"

// Hook para usar media queries
export function useMediaQuery(query: string) {
  // Estado para armazenar o resultado da media query
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Criar media query
    const media = window.matchMedia(query)

    // Definir estado inicial
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Função para atualizar estado
    const listener = () => setMatches(media.matches)

    // Adicionar listener
    window.addEventListener("resize", listener)

    // Limpar listener
    return () => window.removeEventListener("resize", listener)
  }, [matches, query])

  return matches
} 