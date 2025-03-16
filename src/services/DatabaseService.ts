// DatabaseService.ts
// Serviço para emular um banco de dados usando localStorage

// Tipos para emular a interface do Firestore
export interface DocumentData {
  id: string;
  data(): Record<string, any>;
}

class DatabaseService {
  // Prefixo para chaves no localStorage
  private readonly storagePrefix = 'praiseapp_db_';

  // Obter uma coleção inteira
  async getCollection(collectionName: string): Promise<DocumentData[]> {
    return new Promise((resolve) => {
      try {
        // Simular latência de rede
        setTimeout(() => {
          const keys = this.getCollectionKeys(collectionName);
          const docs: DocumentData[] = [];
          
          keys.forEach(key => {
            const data = this.getItem(key);
            if (data) {
              const id = key.replace(`${this.storagePrefix}${collectionName}_`, '');
              docs.push({
                id,
                data: () => data
              });
            }
          });
          
          resolve(docs);
        }, 100);
      } catch (error) {
        console.error('Erro ao buscar coleção:', error);
        resolve([]);
      }
    });
  }

  // Obter um documento por ID
  async getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
    return new Promise((resolve) => {
      try {
        // Simular latência de rede
        setTimeout(() => {
          const key = `${this.storagePrefix}${collectionName}_${docId}`;
          const data = this.getItem(key);
          
          if (data) {
            resolve({
              id: docId,
              data: () => data
            });
          } else {
            resolve(null);
          }
        }, 50);
      } catch (error) {
        console.error('Erro ao buscar documento:', error);
        resolve(null);
      }
    });
  }

  // Adicionar ou atualizar um documento
  async setDocument(collectionName: string, docId: string, data: Record<string, any>): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Simular latência de rede
        setTimeout(() => {
          const key = `${this.storagePrefix}${collectionName}_${docId}`;
          this.setItem(key, data);
          resolve();
        }, 100);
      } catch (error) {
        console.error('Erro ao salvar documento:', error);
        resolve();
      }
    });
  }

  // Excluir um documento
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Simular latência de rede
        setTimeout(() => {
          const key = `${this.storagePrefix}${collectionName}_${docId}`;
          localStorage.removeItem(key);
          resolve();
        }, 75);
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
        resolve();
      }
    });
  }

  // Pesquisar documentos em uma coleção (emula uma consulta)
  async queryDocuments(
    collectionName: string, 
    conditions: Array<{field: string, operator: string, value: any}>
  ): Promise<DocumentData[]> {
    return new Promise((resolve) => {
      try {
        // Simular latência de rede
        setTimeout(async () => {
          const docs = await this.getCollection(collectionName);
          
          const filteredDocs = docs.filter(doc => {
            const data = doc.data();
            // Verificar se o documento atende a todas as condições
            return conditions.every(condition => {
              const { field, operator, value } = condition;
              
              switch (operator) {
                case '==':
                  return data[field] === value;
                case '!=':
                  return data[field] !== value;
                case '>':
                  return data[field] > value;
                case '>=':
                  return data[field] >= value;
                case '<':
                  return data[field] < value;
                case '<=':
                  return data[field] <= value;
                default:
                  return false;
              }
            });
          });
          
          resolve(filteredDocs);
        }, 150);
      } catch (error) {
        console.error('Erro ao consultar documentos:', error);
        resolve([]);
      }
    });
  }

  // Métodos auxiliares privados
  private getItem(key: string): Record<string, any> | null {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erro ao ler item do localStorage:', error);
      return null;
    }
  }

  private setItem(key: string, value: Record<string, any>): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erro ao salvar item no localStorage:', error);
    }
  }

  private getCollectionKeys(collectionName: string): string[] {
    const prefix = `${this.storagePrefix}${collectionName}_`;
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  }
}

// Exportar uma instância única do serviço
const dbService = new DatabaseService();
export default dbService; 