import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isBefore, isAfter } from 'date-fns';

// Interfaces
export interface Participante {
  id: string;
  nome: string;
  funcao: string;
  foto?: string;
  isMinistro?: boolean;
}

export interface MusicaEscala {
  id: number;
  titulo: string;
  artista: string;
  tom?: string;
  deezerId?: number;
  deezerCover?: string;
  youtubeId?: string;
  youtubeLink?: string;
}

export interface Escala {
  id: string;
  titulo: string;
  data: string; // ISO string
  horario: string;
  participantes: Participante[];
  musicas?: MusicaEscala[];
  ministerioId: string;
  criadoPor: string;
  dataHoraCriacao: string;
  observacoes?: string; // Campo para observações ou notas adicionais
}

// Chave para localStorage
const ESCALAS_STORAGE_KEY = 'praiseapp_escalas';

// Classe EscalaService
class EscalaService {
  // Obter todas as escalas do localStorage
  getTodasEscalas(): Escala[] {
    const escalasSalvas = localStorage.getItem(ESCALAS_STORAGE_KEY);
    return escalasSalvas ? JSON.parse(escalasSalvas) : [];
  }

  // Salvar uma escala
  salvarEscala(escala: Escala): Escala {
    const todasEscalas = this.getTodasEscalas();
    
    // Verificar se é uma atualização ou nova escala
    const index = todasEscalas.findIndex(e => e.id === escala.id);
    
    if (index >= 0) {
      // Atualizar escala existente
      todasEscalas[index] = escala;
    } else {
      // Adicionar nova escala
      todasEscalas.push(escala);
    }
    
    // Salvar no localStorage
    localStorage.setItem(ESCALAS_STORAGE_KEY, JSON.stringify(todasEscalas));
    
    return escala;
  }

  // Excluir uma escala
  excluirEscala(id: string): boolean {
    const todasEscalas = this.getTodasEscalas();
    const novaLista = todasEscalas.filter(e => e.id !== id);
    
    if (novaLista.length === todasEscalas.length) {
      return false; // Nenhuma escala foi removida
    }
    
    // Salvar no localStorage
    localStorage.setItem(ESCALAS_STORAGE_KEY, JSON.stringify(novaLista));
    return true;
  }

  // Obter escalas por ministério
  getEscalasPorMinisterio(ministerioId: string): Escala[] {
    const todasEscalas = this.getTodasEscalas();
    return todasEscalas.filter(e => e.ministerioId === ministerioId);
  }

  // Obter minhas escalas
  getMinhasEscalas(usuarioId: string): Escala[] {
    const todasEscalas = this.getTodasEscalas();
    return todasEscalas.filter(e => 
      e.participantes.some(p => p.id === usuarioId)
    );
  }

  // Obter escalas anteriores
  getEscalasAnteriores(): Escala[] {
    const todasEscalas = this.getTodasEscalas();
    const hoje = new Date();
    
    return todasEscalas.filter(e => 
      isBefore(parseISO(e.data), hoje)
    );
  }

  // Obter próximas escalas
  getProximasEscalas(): Escala[] {
    const todasEscalas = this.getTodasEscalas();
    const hoje = new Date();
    
    return todasEscalas.filter(e => 
      isAfter(parseISO(e.data), hoje)
    );
  }

  // Obter quantidade de escalas do usuário no mês atual
  getQtdEscalasMesAtual(usuarioId: string): number {
    const minhasEscalas = this.getMinhasEscalas(usuarioId);
    const dataAtual = new Date();
    const inicioMes = startOfMonth(dataAtual);
    const fimMes = endOfMonth(dataAtual);
    
    const escalasMesAtual = minhasEscalas.filter(escala => 
      isWithinInterval(parseISO(escala.data), { start: inicioMes, end: fimMes })
    );
    
    return escalasMesAtual.length;
  }

  // Obter participantes de um ministério
  getParticipantes(ministerioId: string, forcarExemplos: boolean = false): Participante[] {
    try {
      console.log("[EscalaService] Buscando participantes para o ministério:", ministerioId);
      
      // Obter usuários do localStorage - primeiro tenta membros do ministério
      const membrosMinisterioString = localStorage.getItem(`ministerio_${ministerioId}_membros`);
      if (membrosMinisterioString) {
        try {
          const membrosMinisterio = JSON.parse(membrosMinisterioString);
          console.log("[EscalaService] Encontrou membros específicos do ministério:", membrosMinisterio.length);
          
          // Se encontrou membros específicos do ministério, usa eles
          if (membrosMinisterio.length > 0) {
            return membrosMinisterio.map((membro: any) => ({
              id: membro.id || `membro-${Math.random().toString(36).substr(2, 9)}`,
              nome: membro.nome || (membro.email ? membro.email.split('@')[0] : 'Sem nome'),
              foto: membro.foto || '',
              funcao: membro.funcao || 'Participante',
              isMinistro: membro.isAdmin || membro.funcao === 'Ministro'
            }));
          }
        } catch (e) {
          console.error("[EscalaService] Erro ao processar membros do ministério:", e);
        }
      }
      
      // Obter usuários do localStorage - tenta todos os usuários
      const usersString = localStorage.getItem('users') || '[]';
      let users = JSON.parse(usersString);
      
      console.log("[EscalaService] Total de usuários encontrados:", users.length);
      
      // Verificar se há membros do ministério em outra chave do localStorage
      try {
        const membrosKey = `ministerio_${ministerioId}_usuarios`;
        const membrosString = localStorage.getItem(membrosKey);
        if (membrosString) {
          const membrosFromStorage = JSON.parse(membrosString);
          if (membrosFromStorage && membrosFromStorage.length > 0) {
            console.log("[EscalaService] Encontrou membros em chave específica:", membrosFromStorage.length);
            users = [...users, ...membrosFromStorage.filter((m: any) => 
              !users.some((u: any) => u.id === m.id)
            )];
          }
        }
      } catch (e) {
        console.error("[EscalaService] Erro ao verificar chave adicional:", e);
      }
      
      // Verificar também a chave de usuários do ministério
      try {
        const usuariosMinisterioKey = `ministerio_${ministerioId}_usuarios`;
        const usuariosMinisterioString = localStorage.getItem(usuariosMinisterioKey);
        if (usuariosMinisterioString) {
          const usuariosMinisterio = JSON.parse(usuariosMinisterioString);
          if (usuariosMinisterio && usuariosMinisterio.length > 0) {
            console.log("[EscalaService] Encontrou usuários na chave específica:", usuariosMinisterio.length);
            return usuariosMinisterio.map((usuario: any) => ({
              id: usuario.id,
              nome: usuario.nome || (usuario.email ? usuario.email.split('@')[0] : 'Sem nome'),
              foto: usuario.foto || '',
              funcao: usuario.funcao || 'Participante',
              isMinistro: usuario.isAdmin || usuario.funcao === 'Ministro'
            }));
          }
        }
      } catch (e) {
        console.error("[EscalaService] Erro ao verificar chave de usuários do ministério:", e);
      }
      
      // Obter usuários que participam deste ministério
      const participantes = users.filter((user: any) => {
        // Verificação mais flexível para ministério principal
        const isPrincipalMinisterio = user.ministerioId === ministerioId;
        
        // Verificação para ministérios adicionais
        const temMinisteriosArray = user.ministerios && 
                                  Array.isArray(user.ministerios) && 
                                  user.ministerios.length > 0;
        
        const participaMinisterio = temMinisteriosArray && 
                                  user.ministerios.some((m: any) => 
                                    (typeof m === 'string' && m === ministerioId) ||
                                    (typeof m === 'object' && (m.ministerioId === ministerioId || m.id === ministerioId))
                                  );
        
        // Também verifica se o ministério consta nos convites aceitos do usuário
        const temConvitesAceitos = user.convitesAceitos && 
                                Array.isArray(user.convitesAceitos) && 
                                user.convitesAceitos.includes(ministerioId);
        
        const resultado = isPrincipalMinisterio || participaMinisterio || temConvitesAceitos;
        console.log(`[EscalaService] Verificando usuário ${user.nome || user.email} para ministério ${ministerioId}:`, resultado);
        
        return resultado;
      });
      
      console.log("[EscalaService] Participantes encontrados:", participantes.length);
      
      // Se não encontrou participantes, verifica na tabela de convites
      if (participantes.length === 0) {
        try {
          const convitesString = localStorage.getItem(`ministerio_${ministerioId}_convites`) || '[]';
          const convites = JSON.parse(convitesString);
          
          if (convites.length > 0) {
            console.log("[EscalaService] Usando membros de convites:", convites.length);
            
            const membrosConvite = convites
              .filter((convite: any) => convite.aceito === true)
              .map((convite: any) => ({
                id: `convite-${convite.id || Math.random().toString(36).substr(2, 9)}`,
                nome: convite.nome || convite.email.split('@')[0],
                foto: '',
                funcao: 'Convidado',
                isMinistro: false
              }));
            
            if (membrosConvite.length > 0) {
              return membrosConvite;
            }
          }
        } catch (e) {
          console.error("[EscalaService] Erro ao processar convites:", e);
        }
      }
      
      // Mapear usuários para o formato de Participante
      return participantes.map((user: any) => ({
        id: user.id,
        nome: user.nome || (user.email ? user.email.split('@')[0] : 'Sem nome'),
        foto: user.foto || '',
        funcao: user.funcao || 'Participante',
        isMinistro: user.isAdmin || (typeof ministerioId === 'object' ? user.id === ministerioId.adminId : false)
      }));
      
    } catch (error) {
      console.error("[EscalaService] Erro ao obter participantes:", error);
      return [];
    }
  }
  
  // Método para criar participantes de exemplo - agora retorna vazio (sem dados fictícios)
  criarParticipantesExemplo(): Participante[] {
    console.log("[EscalaService] Método criarParticipantesExemplo() foi chamado, mas não criará dados fictícios");
    return []; // Retorna array vazio, sem dados fictícios
  }
  
  // Método auxiliar para obter membros do ministério (compatibilidade com interface atualizada)
  obterMembrosMinisterio(ministerioId: string): Promise<Participante[]> {
    return Promise.resolve(this.getParticipantes(ministerioId));
  }
}

export const escalaService = new EscalaService();
export default escalaService;