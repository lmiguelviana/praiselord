/**
 * dev-auth.ts
 * 
 * Utilitário para verificação de autorização de desenvolvedor.
 * Oferece funções para validar se o usuário atual tem permissões de desenvolvedor.
 */

import { useEffect, useState } from 'react';

// Email autorizado como desenvolvedor
export const AUTHORIZED_DEV_EMAIL = 'lmiguelviana@hotmail.com';

/**
 * Verifica se o usuário atual é o desenvolvedor autorizado
 * @returns true se for o desenvolvedor autorizado, false caso contrário
 */
export function isDeveloper(): boolean {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return false;
    
    const user = JSON.parse(userData);
    return user.email === AUTHORIZED_DEV_EMAIL;
  } catch (error) {
    console.error('Erro ao verificar permissões de desenvolvedor:', error);
    return false;
  }
}

/**
 * Verifica se o usuário é desenvolvedor e redireciona para o dashboard se não for
 * @returns true se for o desenvolvedor autorizado, false caso contrário
 */
export function checkDevAccess(): boolean {
  const isAuthorized = isDeveloper();
  
  if (!isAuthorized) {
    // Verificar se o usuário está logado
    const userData = localStorage.getItem('user');
    
    if (userData) {
      // Usuário logado, mas não é desenvolvedor - redirecionar para dashboard
      console.log("Acesso não autorizado à página de desenvolvedor");
      window.location.href = '/dashboard';
    } else {
      // Usuário não logado - redirecionar para login
      window.location.href = '/login';
    }
  }
  
  return isAuthorized;
}

/**
 * Hook para usar em componentes React para verificar acesso de desenvolvedor
 * @returns objeto contendo o status da autorização
 */
export function useDevAuth() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const authorized = checkDevAccess();
    setIsAuthorized(authorized);
    setIsLoading(false);
  }, []);
  
  return { isAuthorized, isLoading };
}

export default {
  isDeveloper,
  checkDevAccess,
  useDevAuth,
  AUTHORIZED_DEV_EMAIL
}; 