/**
 * use-copy.ts
 * 
 * Hook para gerenciamento de cópia
 * Responsável por:
 * - Cópia de texto para clipboard
 * - Feedback de sucesso/erro
 * - Tratamento de erros
 * - Acessibilidade
 */

import { useState } from "react"

// Hook para usar cópia
export function useCopy() {
  // Estado para armazenar status da cópia
  const [copied, setCopied] = useState(false)

  // Função para copiar texto
  const copy = async (text: string) => {
    try {
      // Copiar texto para clipboard
      await navigator.clipboard.writeText(text)

      // Atualizar estado
      setCopied(true)

      // Resetar estado após 2 segundos
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Erro ao copiar texto:", error)
    }
  }

  return { copy, copied }
} 