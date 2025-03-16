export interface Ministerio {
  id: string;
  nome: string;
  descricao: string;
  adminId: string; // ID do usuário que é administrador do ministério
  dataCriacao: string; // Data em formato ISO
  membros?: number; // Número de membros (opcional, para exibição)
  pins?: MinisterioPin[]; // Lista de PINs gerados para este ministério
}

export interface MinisterioPin {
  codigo: string;
  dataCriacao: string; // Data em formato ISO
  dataExpiracao: string; // Data em formato ISO
  usado: boolean;
  ministerioId: string;
}

export interface UsuarioMinisterio {
  ministerioId: string;
  role: 'admin' | 'member'; // Papel do usuário no ministério
  dataIngresso: string; // Data em formato ISO
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  ministerioId: string; // Ministério atual (para compatibilidade)
  ministerios: UsuarioMinisterio[]; // Lista de ministérios que o usuário participa
  dataNascimento?: Date;
  pin?: string;
  role?: string;
  telefone?: string;
  foto?: string;
  funcao?: string;
}