import { Usuario, Ministerio, UsuarioMinisterio } from '@/types/usuario';
import LocalDatabaseService from '@/lib/local-database';

// Função para gerar um ID único simples
function generateUniqueId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// Função de validação de email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função de validação de senha
function validatePassword(senha: string): boolean {
  // Senha deve ter pelo menos 8 caracteres
  return senha.length >= 8
}

// Função de registro de usuário
export function registerUser(data: {
  nome: string, 
  email: string, 
  senha: string, 
  dataNascimento?: Date, 
  pin?: string,
  foto?: string
}): Usuario {
  try {
    // Validações básicas
    if (!data.nome) throw new Error('Nome é obrigatório')
    if (!validateEmail(data.email)) throw new Error('Email inválido')
    if (!validatePassword(data.senha)) throw new Error('Senha deve ter pelo menos 8 caracteres')

    // Normalizar email (remover espaços e converter para minúsculas)
    const normalizedEmail = data.email.trim().toLowerCase()

    // Verificar se o email já existe
    const existingUsers = LocalDatabaseService.findRecords('usuarios', { email: normalizedEmail });
    
    if (existingUsers.length > 0) {
      throw new Error('Este email já está cadastrado no sistema')
    }

    // Verificar PIN e obter ID do ministério
    let ministerioId = '';
    let ministerioRole: 'admin' | 'member' | null = null;
    let ministerioInfo: { id: string, nome: string } | null = null;
    
    if (data.pin) {
      // Verificar se o PIN é válido
      ministerioInfo = verifyMinisterioPIN(data.pin);
      if (!ministerioInfo) {
        throw new Error('PIN de ministério inválido ou expirado');
      }
      ministerioId = ministerioInfo.id;
      
      // Marcar o PIN como usado
      const ministerios = LocalDatabaseService.findRecords('ministerios', { id: ministerioId }) as Ministerio[];
      if (ministerios.length > 0) {
        const ministerio = ministerios[0];
        if (ministerio.pins) {
          const pinsAtualizados = ministerio.pins.map(p => {
            if (p.codigo === data.pin) {
              return { ...p, usado: true };
            }
            return p;
          });
          
          LocalDatabaseService.updateRecord('ministerios', ministerioId, {
            pins: pinsAtualizados
          });
        }
      }
    } else {
      // Não criar mais um ministério padrão para o usuário
      // O usuário começará sem ministério e precisará criar um ou ingressar em um existente
      ministerioId = '';
      ministerioRole = null;
      
      // Apenas registrar o usuário sem ministério associado
      console.log("Usuário será registrado sem ministério associado.");
    }

    const usuario = data.nome || data.email.split('@')[0];
    const uniqueId = generateUniqueId();
    
    // Criar relação com ministério (se houver)
    const relacaoMinisterio = ministerioRole ? {
      ministerioId: ministerioId,
      role: ministerioRole,
      dataIngresso: new Date().toISOString()
    } : null;
    
    // Criar novo usuário
    const novoUsuario: Usuario = {
      id: uniqueId,
      nome: usuario,
      email: data.email,
      senha: data.senha,
      dataCriacao: new Date().toISOString(),
      dataNascimento: data.dataNascimento,
      pin: data.pin,
      ministerioId: ministerioId, // Ministério atual (vazio se não tiver)
      ministerios: relacaoMinisterio ? [relacaoMinisterio] : [], // Lista de ministérios (vazia se não tiver)
      role: 'member',
      foto: data.foto
    }

    // Salvar usuário usando o LocalDatabaseService
    LocalDatabaseService.createRecord('usuarios', novoUsuario);

    // Se o usuário criou um ministério, atualizar o adminId do ministério
    if (ministerioRole === 'admin') {
      LocalDatabaseService.updateRecord('ministerios', ministerioId, {
        adminId: novoUsuario.id
      });
    }

    // Log de registro
    console.log('Usuário registrado com sucesso:', novoUsuario.id)

    return novoUsuario
  } catch (error) {
    // Log de erro
    console.error('Erro no registro:', error)
    
    // Salvar log de erro
    const errorLogs = JSON.parse(localStorage.getItem('registrationErrorLogs') || '[]')
    errorLogs.push({
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('registrationErrorLogs', JSON.stringify(errorLogs))

    // Propagar o erro para ser tratado na página de registro
    throw error;
  }
}

// Função para obter logs de erro de registro
export function getRegistrationErrorLogs() {
  return JSON.parse(localStorage.getItem('registrationErrorLogs') || '[]')
}

// Função para limpar logs de erro de registro
export function clearRegistrationErrorLogs() {
  localStorage.removeItem('registrationErrorLogs')
}

// Função para verificar PIN de ministério
export function verifyMinisterioPIN(pin: string): { id: string, nome: string } | null {
  try {
    // Buscar todos os ministérios
    const ministerios = LocalDatabaseService.findRecords('ministerios') as Ministerio[];
    
    // Encontrar o ministério com este PIN
    for (const ministerio of ministerios) {
      if (!ministerio.pins) continue;
      
      const pinObj = ministerio.pins.find(p => p.codigo === pin && !p.usado);
      if (pinObj) {
        // Verificar se o PIN está expirado
        const dataExpiracao = new Date(pinObj.dataExpiracao);
        if (dataExpiracao < new Date()) {
          continue; // PIN expirado
        }
        
        return { id: ministerio.id, nome: ministerio.nome };
      }
    }
    
    // Verificar PINs estáticos para compatibilidade
    const validPins = {
      'PRAISE2024': { id: 'ministerio-louvor-1', nome: 'Ministério de Louvor Principal' },
      'LOUVOR2024': { id: 'ministerio-louvor-2', nome: 'Ministério de Louvor Secundário' }
    };
    
    return pin in validPins ? validPins[pin as keyof typeof validPins] : null;
  } catch (error) {
    console.error('Erro ao verificar PIN:', error);
    return null;
  }
}

// Função para buscar usuário por email
export function findUserByEmail(email: string): Usuario | null {
  const users = LocalDatabaseService.findRecords('usuarios', { email: email.trim().toLowerCase() });
  return users.length > 0 ? users[0] : null;
}