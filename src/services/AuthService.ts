import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import LocalDatabaseService from '@/lib/local-database';

// Interfaces
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  dataNascimento?: Date;
  foto?: string;
  ministerioId: string | null;
  ministerios: string[];
  role?: string;
}

export interface MinisterioInfo {
  id: string;
  nome: string;
  descricao?: string;
  foto?: string;
}

export interface UsuarioMinisterio {
  ministerioId: string;
  usuarioId: string;
  role: string;
}

// Classe para gerenciar autenticação
class AuthService {
  // Registrar um novo usuário
  async register(userData: Omit<Usuario, 'id' | 'ministerioId' | 'ministerios'> & { senha: string }): Promise<{ success: boolean; message: string; user?: Usuario }> {
    try {
      console.log('Iniciando registro de usuário:', userData.email);
      
      // Verificar se o usuário já existe
      const users = this.getAllUsers();
      console.log('Usuários existentes:', users.length);
      
      const userExists = users.some(user => user.email.toLowerCase() === userData.email.toLowerCase());
      
      if (userExists) {
        console.log('E-mail já está em uso:', userData.email);
        return { success: false, message: 'Este e-mail já está em uso.' };
      }
      
      // Hash na senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.senha, salt);
      
      // Criar o novo usuário
      const newUser: Usuario = {
        id: uuidv4(),
        nome: userData.nome,
        email: userData.email.toLowerCase(),
        senha: hashedPassword,
        telefone: userData.telefone,
        dataNascimento: userData.dataNascimento,
        foto: userData.foto,
        ministerioId: null, // Inicialmente sem ministério
        ministerios: [], // Array vazio de ministérios
        role: 'user',
      };
      
      console.log('Novo usuário criado:', newUser.id, newUser.email);
      
      // Salvar o usuário no banco de dados local
      LocalDatabaseService.createRecord('users', newUser);
      console.log('Usuário salvo no banco de dados local');
      
      // Remover a senha antes de retornar o usuário
      const { senha, ...userWithoutPassword } = newUser;
      
      return { 
        success: true, 
        message: 'Usuário registrado com sucesso.', 
        user: userWithoutPassword as Usuario 
      };
    } catch (error) {
      console.error('Erro detalhado ao registrar usuário:', error);
      return { success: false, message: 'Erro ao registrar usuário.' };
    }
  }
  
  // Login de usuário
  async login(email: string, senha: string): Promise<{ success: boolean; message: string; user?: Usuario; token?: string }> {
    try {
      const users = this.getAllUsers();
      const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { success: false, message: 'Usuário não encontrado.' };
      }
      
      // Verificar a senha
      const isPasswordValid = user.senha ? await bcrypt.compare(senha, user.senha) : false;
      
      if (!isPasswordValid) {
        return { success: false, message: 'Senha incorreta.' };
      }
      
      // Gerar token simulado (em produção seria JWT)
      const token = this.generateToken(user.id);
      
      // Salvar no localStorage
      const { senha: userPassword, ...userWithoutPassword } = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      return { 
        success: true, 
        message: 'Login realizado com sucesso.', 
        user: userWithoutPassword, 
        token 
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, message: 'Erro ao fazer login.' };
    }
  }
  
  // Logout de usuário
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  // Verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }
  
  // Obter usuário autenticado
  getAuthenticatedUser(): Usuario | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as Usuario;
    } catch (error) {
      console.error('Erro ao parsear usuário:', error);
      return null;
    }
  }
  
  // Atualizar informações do usuário
  async updateUser(userId: string, userData: Partial<Usuario>): Promise<{ success: boolean; message: string; user?: Usuario }> {
    try {
      const users = this.getAllUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'Usuário não encontrado.' };
      }
      
      // Se estiver atualizando a senha, fazer hash
      if (userData.senha) {
        const salt = await bcrypt.genSalt(10);
        userData.senha = await bcrypt.hash(userData.senha, salt);
      }
      
      // Atualizar o usuário
      const updatedUser = { ...users[userIndex], ...userData };
      users[userIndex] = updatedUser;
      
      // Salvar no banco de dados local
      LocalDatabaseService.setRecords('users', users);
      
      // Se for o usuário logado, atualizar no localStorage
      const authenticatedUser = this.getAuthenticatedUser();
      if (authenticatedUser && authenticatedUser.id === userId) {
        const { senha, ...userWithoutPassword } = updatedUser;
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      }
      
      // Remover senha antes de retornar
      const { senha: userPassword, ...userWithoutPassword } = updatedUser;
      
      return { 
        success: true, 
        message: 'Usuário atualizado com sucesso.', 
        user: userWithoutPassword as Usuario 
      };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, message: 'Erro ao atualizar usuário.' };
    }
  }
  
  // Resetar senha (simulado)
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const users = this.getAllUsers();
    const userExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      return { success: false, message: 'Usuário não encontrado.' };
    }
    
    // Em uma aplicação real, enviaria um e-mail com link para resetar senha
    return { success: true, message: 'Instruções enviadas para o seu e-mail.' };
  }
  
  // Obter todos os usuários
  getAllUsers(): Usuario[] {
    return LocalDatabaseService.getRecords('users') || [];
  }
  
  // Gerar token simulado (em produção seria JWT)
  private generateToken(userId: string): string {
    return `simulated-token-${userId}-${Date.now()}`;
  }
}

export default new AuthService(); 