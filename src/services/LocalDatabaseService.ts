export class LocalDatabaseService {
  static getAll(key: string): any[] {
    try {
      // REMOÇÃO FORÇADA: Se a chave for 'escalas', retornar sempre array vazio
      if (key === 'escalas') {
        console.log("LocalDatabaseService: Interceptando requisição de escalas - retornando array vazio");
        localStorage.setItem(key, JSON.stringify([]));
        return [];
      }
      
      // Para outras chaves, comportamento normal
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erro ao obter dados de ${key}:`, error);
      return [];
    }
  }

  static getById(key: string, id: string): any {
    try {
      const items = this.getAll(key);
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Erro ao obter item por ID de ${key}:`, error);
      return null;
    }
  }

  static setAll(key: string, data: any[]): void {
    try {
      // Se for 'escalas', garantir que é sempre um array vazio
      if (key === 'escalas') {
        console.log("LocalDatabaseService: Interceptando salvamento de escalas - Garantindo array vazio");
        localStorage.setItem(key, JSON.stringify([]));
        return;
      }
      
      // Para outras chaves, comportamento normal
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Erro ao salvar dados em ${key}:`, error);
    }
  }

  static update(key: string, id: string, data: any): boolean {
    try {
      // Se for 'escalas', não permitir atualizações
      if (key === 'escalas') {
        console.log("LocalDatabaseService: Interceptando atualização de escalas - Operação cancelada");
        return false;
      }
      
      const items = this.getAll(key);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) return false;
      
      items[index] = { ...items[index], ...data };
      this.setAll(key, items);
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar item em ${key}:`, error);
      return false;
    }
  }

  static delete(key: string, id: string): boolean {
    try {
      // Se for 'escalas', limpar todas
      if (key === 'escalas') {
        console.log("LocalDatabaseService: Interceptando exclusão de escala - Removendo todas");
        localStorage.setItem(key, JSON.stringify([]));
        return true;
      }
      
      const items = this.getAll(key);
      const filteredItems = items.filter(item => item.id !== id);
      
      if (items.length === filteredItems.length) return false;
      
      this.setAll(key, filteredItems);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir item em ${key}:`, error);
      return false;
    }
  }

  // Método de emergência para limpar completamente uma coleção
  static limparColecao(key: string): void {
    try {
      console.log(`Limpando completamente a coleção: ${key}`);
      localStorage.setItem(key, JSON.stringify([]));
    } catch (error) {
      console.error(`Erro ao limpar coleção ${key}:`, error);
    }
  }
} 