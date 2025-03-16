/**
 * use-mount.ts
 * 
 * Hook para gerenciamento de montagem
 * Responsável por:
 * - Detecção de montagem de componentes
 * - Animações de entrada
 * - Otimização de performance
 * - Acessibilidade
 */

import { useEffect, useState } from "react"

// Hook para usar montagem
export function useMount() {
  // Estado para armazenar status de montagem
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Atualizar estado após montagem
    setMounted(true)
  }, [])

  return mounted
} 