/**
 * use-key-press.ts
 * 
 * Hook para gerenciamento de teclas
 * Responsável por:
 * - Detecção de teclas pressionadas
 * - Atalhos de teclado
 * - Limpeza de listeners
 * - Acessibilidade
 */

import { useEffect } from "react"

// Hook para usar teclas
export function useKeyPress(
  targetKey: string,
  handler: (event: KeyboardEvent) => void
) {
  useEffect(() => {
    // Função para verificar tecla
    const handleKeyPress = (event: KeyboardEvent) => {
      // Verificar se a tecla pressionada é a alvo
      if (event.key === targetKey) {
        handler(event)
      }
    }

    // Adicionar listener
    window.addEventListener("keydown", handleKeyPress)

    // Limpar listener
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [targetKey, handler])
} 