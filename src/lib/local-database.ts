import { Usuario } from '@/types/usuario';

class LocalDatabaseService {
  private storageKey = 'praiseapp_database';

  private getDatabase(): { 
    usuarios: Usuario[], 
    ministerios: any[] 
  } {
    const dbString = localStorage.getItem(this.storageKey);
    return dbString ? JSON.parse(dbString) : { 
      usuarios: [], 
      ministerios: [] 
    };
  }

  private saveDatabase(db: { 
    usuarios: Usuario[], 
    ministerios: any[] 
  }) {
    localStorage.setItem(this.storageKey, JSON.stringify(db));
  }

  createRecord(table: string, data: any) {
    const db = this.getDatabase();
    
    if (table === 'usuarios') {
      // Verificar se já existe um usuário com o mesmo email
      const existingUser = db.usuarios.find(u => u.email.toLowerCase() === data.email.toLowerCase());
      if (existingUser) {
        throw new Error('Usuário com este email já existe');
      }
      db.usuarios.push(data);
    } else if (table === 'ministerios') {
      db.ministerios.push(data);
    }

    this.saveDatabase(db);
    return data;
  }

  findRecords(table: string, conditions: Record<string, any> = {}): any[] {
    const db = this.getDatabase();
    
    if (table === 'usuarios') {
      return db.usuarios.filter(user => 
        Object.entries(conditions).every(([key, value]) => {
          // Comparação case-insensitive para email
          if (key === 'email' && user.email && value) {
            return user.email.toLowerCase() === value.toLowerCase();
          }
          return user[key] === value;
        })
      );
    }

    if (table === 'ministerios') {
      return db.ministerios.filter(ministerio => 
        Object.entries(conditions).every(([key, value]) => ministerio[key] === value)
      );
    }

    return [];
  }

  // Método para atualizar um registro
  updateRecord(table: string, id: string, data: Partial<any>): boolean {
    const db = this.getDatabase();
    let updated = false;
    
    if (table === 'usuarios') {
      const index = db.usuarios.findIndex(u => u.id === id);
      if (index !== -1) {
        db.usuarios[index] = { ...db.usuarios[index], ...data };
        updated = true;
      }
    } else if (table === 'ministerios') {
      const index = db.ministerios.findIndex(m => m.id === id);
      if (index !== -1) {
        db.ministerios[index] = { ...db.ministerios[index], ...data };
        updated = true;
      }
    }
    
    if (updated) {
      this.saveDatabase(db);
    }
    
    return updated;
  }

  // Método para excluir um registro
  deleteRecord(table: string, id: string): boolean {
    const db = this.getDatabase();
    let deleted = false;
    
    if (table === 'usuarios') {
      const initialLength = db.usuarios.length;
      db.usuarios = db.usuarios.filter(u => u.id !== id);
      deleted = db.usuarios.length < initialLength;
    } else if (table === 'ministerios') {
      const initialLength = db.ministerios.length;
      db.ministerios = db.ministerios.filter(m => m.id !== id);
      deleted = db.ministerios.length < initialLength;
    }
    
    if (deleted) {
      this.saveDatabase(db);
    }
    
    return deleted;
  }

  // Método para inicializar o banco de dados com dados padrão
  initializeDatabase() {
    const db = this.getDatabase();
    
    // Se não houver usuários, criar usuário inicial
    if (db.usuarios.length === 0) {
      // Não criar mais ministério padrão
      
      // Criar usuário padrão do sistema
      const userId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const usuario = {
        id: userId,
        nome: 'Admin',
        email: 'admin@praiseapp.com',
        senha: 'admin', // Em um app real, isso seria criptografado
        dataCriacao: new Date().toISOString(),
        ministerioId: '',
        ministerios: []
      };
      
      // Adicionar usuário ao banco
      db.usuarios.push(usuario);
      
      // Salvar o banco de dados
      localStorage.setItem(this.storageKey, JSON.stringify(db));
      
      console.log('Banco de dados inicializado com sucesso');
    }
  }

  // Método para limpar o banco de dados (útil para testes)
  clearDatabase() {
    localStorage.removeItem(this.storageKey);
  }

  // Método para inicializar o banco de dados com dados de exemplo
  initializeWithSampleData() {
    // Verificar se já existem dados
    const db = this.getDatabase();
    if (db.usuarios.length > 0) {
      return; // Já existem dados, não inicializar novamente
    }

    // Obter o usuário atual do localStorage
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
      return; // Não há usuário logado
    }

    const userData = JSON.parse(userDataStr);
    const ministerioId = userData.ministerioId || 'ministerio1';

    // Criar relação do usuário com o ministério
    const relacaoMinisterioAdmin = {
      ministerioId: ministerioId,
      role: 'admin' as 'admin' | 'member',
      dataIngresso: new Date().toISOString()
    };

    const relacaoMinisterioMembro = {
      ministerioId: ministerioId,
      role: 'member' as 'admin' | 'member',
      dataIngresso: new Date().toISOString()
    };

    // Criar usuários de exemplo com datas de nascimento
    const hoje = new Date();
    const usuarios = [
      {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        senha: userData.senha || '',
        ministerioId: ministerioId,
        ministerios: userData.ministerios || [relacaoMinisterioAdmin],
        dataNascimento: new Date(hoje.getFullYear() - 30, hoje.getMonth(), hoje.getDate() - 5),
        role: 'admin',
        telefone: '(11) 98765-4321',
        funcao: 'Vocal / Violão'
      },
      {
        id: 'user2',
        nome: 'Maria Silva',
        email: 'maria.silva@exemplo.com',
        senha: 'senha123',
        ministerioId: ministerioId,
        ministerios: [relacaoMinisterioMembro],
        dataNascimento: new Date(hoje.getFullYear() - 25, hoje.getMonth(), hoje.getDate()), // Aniversário hoje
        role: 'membro',
        telefone: '(11) 91234-5678',
        funcao: 'Vocal'
      },
      {
        id: 'user3',
        nome: 'Pedro Santos',
        email: 'pedro.santos@exemplo.com',
        senha: 'senha123',
        ministerioId: ministerioId,
        ministerios: [relacaoMinisterioMembro],
        dataNascimento: new Date(hoje.getFullYear() - 28, hoje.getMonth(), hoje.getDate()), // Aniversário hoje
        role: 'membro',
        telefone: '(11) 99876-5432',
        funcao: 'Guitarra'
      },
      {
        id: 'user4',
        nome: 'Ana Lima',
        email: 'ana.lima@exemplo.com',
        senha: 'senha123',
        ministerioId: ministerioId,
        ministerios: [relacaoMinisterioMembro],
        dataNascimento: new Date(hoje.getFullYear() - 22, hoje.getMonth(), hoje.getDate() + 2),
        role: 'membro',
        telefone: '(11) 95555-4444',
        funcao: 'Teclado'
      },
      {
        id: 'user5',
        nome: 'Carlos Mendes',
        email: 'carlos.mendes@exemplo.com',
        senha: 'senha123',
        ministerioId: ministerioId,
        ministerios: [relacaoMinisterioMembro],
        dataNascimento: new Date(hoje.getFullYear() - 35, hoje.getMonth(), hoje.getDate() - 10),
        role: 'membro',
        telefone: '(11) 94444-3333',
        funcao: 'Bateria'
      }
    ];

    // Adicionar usuários ao banco de dados
    db.usuarios = usuarios;
    this.saveDatabase(db);
    
    console.log('Banco de dados inicializado com dados de exemplo');
  }
}

export default new LocalDatabaseService();