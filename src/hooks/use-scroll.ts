/**
 * use-scroll.ts
 * 
 * Hook para gerenciamento de scroll
 * Responsável por:
 * - Detecção de direção do scroll
 * - Atualização de estado
 * - Limpeza de listeners
 * - Acessibilidade
 */

import { useEffect, useState } from "react"

// Interface para o estado do scroll
interface ScrollState {
  x: number
  y: number
  direction: "up" | "down" | null
}

// Hook para usar scroll
export function useScroll() {
  // Estado para armazenar informações do scroll
  const [scroll, setScroll] = useState<ScrollState>({
    x: 0,
    y: 0,
    direction: null,
  })

  useEffect(() => {
    // Função para atualizar estado do scroll
    const handleScroll = () => {
      const currentY = window.scrollY
      const currentX = window.scrollX

      setScroll((prev) => ({
        x: currentX,
        y: currentY,
        direction: currentY > prev.y ? "down" : currentY < prev.y ? "up" : null,
      }))
    }

    // Adicionar listener
    window.addEventListener("scroll", handleScroll)

    // Limpar listener
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return scroll
} 