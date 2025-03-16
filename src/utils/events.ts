/**
 * events.ts
 * 
 * Utilitários para gerenciar eventos personalizados na aplicação
 */

// Evento para notificar quando os dados do usuário são atualizados
export const dispatchUserUpdatedEvent = () => {
  // Disparar um evento personalizado
  const event = new Event('user-updated');
  window.dispatchEvent(event);
  
  // Também podemos simular uma alteração no localStorage para acionar o evento 'storage'
  const userDataStr = localStorage.getItem('user');
  if (userDataStr) {
    const tempKey = 'temp-trigger-' + Date.now();
    localStorage.setItem(tempKey, 'trigger');
    localStorage.removeItem(tempKey);
  }
};

// Função para adicionar um listener para o evento de atualização do usuário
export const addUserUpdatedListener = (callback: () => void) => {
  window.addEventListener('user-updated', callback);
  return () => window.removeEventListener('user-updated', callback);
}; 