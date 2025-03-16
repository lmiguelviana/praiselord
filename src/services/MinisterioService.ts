import { v4 as uuidv4 } from 'uuid';
import LocalDatabaseService from '@/lib/local-database';
import { Ministerio } from '@/types/usuario';

// Interface para membros do ministério para uso interno na service
interface MembroMinisterio {
  id: string;
  funcao: string;
  dataHoraEntrada: string;
}

export class MinisterioService {
  /**
   * Cria um novo ministério
   * @param ministerio Dados do ministério a ser criado
   * @returns O ministério criado
   */
  criarMinisterio(ministerio: Partial<Ministerio>): Ministerio {
    try {
      // Converter membros de array para contagem (se for array)
      let membrosCount = 0;
      let membrosArray: MembroMinisterio[] = [];
      
      if (Array.isArray(ministerio.membros)) {
        membrosCount = ministerio.membros.length;
        membrosArray = [...ministerio.membros];
      } else if (typeof ministerio.membros === 'number') {
        membrosCount = ministerio.membros;
      }
      
      const novoMinisterio: Ministerio = {
        id: ministerio.id || uuidv4(),
        nome: ministerio.nome || '',
        descricao: ministerio.descricao || '',
        adminId: ministerio.adminId || '',
        dataCriacao: ministerio.dataCriacao || new Date().toISOString(),
        membros: membrosCount, // Armazenar como número conforme a interface
        pins: ministerio.pins || [],
        // Armazenar o array de membros em uma propriedade separada para uso interno
        membrosDetalhes: membrosArray
      };

      // Salvar no banco de dados local
      return LocalDatabaseService.createRecord('ministerios', novoMinisterio);
    } catch (error) {
      console.error('Erro ao criar ministério:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os ministérios
   * @returns Lista de ministérios
   */
  getMinisterios(): Ministerio[] {
    try {
      return LocalDatabaseService.findRecords('ministerios', {});
    } catch (error) {
      console.error('Erro ao obter ministérios:', error);
      return [];
    }
  }

  /**
   * Obtém um ministério pelo ID
   * @param id ID do ministério
   * @returns O ministério encontrado ou null
   */
  getMinisterioById(id: string): Ministerio | null {
    try {
      const ministerios = LocalDatabaseService.findRecords('ministerios', { id });
      return ministerios.length > 0 ? ministerios[0] : null;
    } catch (error) {
      console.error(`Erro ao obter ministério ${id}:`, error);
      return null;
    }
  }

  /**
   * Atualiza um ministério existente
   * @param id ID do ministério
   * @param dadosAtualizados Dados a serem atualizados
   * @returns true se atualizado com sucesso, false caso contrário
   */
  atualizarMinisterio(id: string, dadosAtualizados: Partial<Ministerio>): boolean {
    try {
      // Se estiver atualizando membros como array, converter para número
      if (dadosAtualizados.membrosDetalhes) {
        dadosAtualizados.membros = dadosAtualizados.membrosDetalhes.length;
      }
      
      return LocalDatabaseService.updateRecord('ministerios', id, dadosAtualizados);
    } catch (error) {
      console.error(`Erro ao atualizar ministério ${id}:`, error);
      return false;
    }
  }

  /**
   * Exclui um ministério
   * @param id ID do ministério
   * @returns true se excluído com sucesso, false caso contrário
   */
  excluirMinisterio(id: string): boolean {
    try {
      return LocalDatabaseService.deleteRecord('ministerios', id);
    } catch (error) {
      console.error(`Erro ao excluir ministério ${id}:`, error);
      return false;
    }
  }

  /**
   * Adiciona um membro a um ministério
   * @param ministerioId ID do ministério
   * @param usuarioId ID do usuário a ser adicionado
   * @param funcao Função do membro no ministério
   * @returns true se adicionado com sucesso, false caso contrário
   */
  adicionarMembro(ministerioId: string, usuarioId: string, funcao: string = 'Membro'): boolean {
    try {
      // Obter o ministério
      const ministerio = this.getMinisterioById(ministerioId);
      if (!ministerio) {
        throw new Error('Ministério não encontrado');
      }
      
      // Obter os detalhes dos membros (se existirem)
      let membrosDetalhes: MembroMinisterio[] = ministerio.membrosDetalhes || [];
      
      // Verificar se o usuário já é membro
      const membroExistente = membrosDetalhes.find(m => m.id === usuarioId);
      if (membroExistente) {
        return true; // Já é membro, não precisa adicionar novamente
      }
      
      // Adicionar membro
      membrosDetalhes.push({
        id: usuarioId,
        funcao,
        dataHoraEntrada: new Date().toISOString()
      });
      
      // Atualizar ministério
      return this.atualizarMinisterio(ministerioId, { 
        membros: membrosDetalhes.length,
        membrosDetalhes
      });
    } catch (error) {
      console.error(`Erro ao adicionar membro ${usuarioId} ao ministério ${ministerioId}:`, error);
      return false;
    }
  }

  /**
   * Remove um membro de um ministério
   * @param ministerioId ID do ministério
   * @param usuarioId ID do usuário a ser removido
   * @returns true se removido com sucesso, false caso contrário
   */
  removerMembro(ministerioId: string, usuarioId: string): boolean {
    try {
      // Obter o ministério
      const ministerio = this.getMinisterioById(ministerioId);
      if (!ministerio) {
        throw new Error('Ministério não encontrado');
      }
      
      // Verificar se o usuário é o administrador
      if (ministerio.adminId === usuarioId) {
        throw new Error('Não é possível remover o administrador do ministério');
      }
      
      // Obter os detalhes dos membros
      const membrosDetalhes = ministerio.membrosDetalhes || [];
      
      // Remover membro
      const membrosAtualizados = membrosDetalhes.filter(m => m.id !== usuarioId);
      
      // Atualizar ministério
      return this.atualizarMinisterio(ministerioId, { 
        membros: membrosAtualizados.length,
        membrosDetalhes: membrosAtualizados
      });
    } catch (error) {
      console.error(`Erro ao remover membro ${usuarioId} do ministério ${ministerioId}:`, error);
      return false;
    }
  }

  /**
   * Gera um PIN de convite para um ministério
   * @param ministerioId ID do ministério
   * @returns O PIN gerado ou null em caso de erro
   */
  gerarPinConvite(ministerioId: string): string | null {
    try {
      // Obter o ministério
      const ministerio = this.getMinisterioById(ministerioId);
      if (!ministerio) {
        throw new Error('Ministério não encontrado');
      }
      
      // Gerar PIN aleatório
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let pin = '';
      for (let i = 0; i < 6; i++) {
        pin += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      
      // Adicionar PIN ao ministério
      const agora = new Date();
      const dataExpiracao = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // 24 horas
      
      const novoPin = {
        codigo: pin,
        dataCriacao: agora.toISOString(),
        dataExpiracao: dataExpiracao.toISOString(),
        usado: false,
        ministerioId // Adicionar o ministerioId ao PIN
      };
      
      const pins = [...(ministerio.pins || []), novoPin];
      
      // Atualizar ministério
      const atualizado = this.atualizarMinisterio(ministerioId, { pins });
      
      return atualizado ? pin : null;
    } catch (error) {
      console.error(`Erro ao gerar PIN para ministério ${ministerioId}:`, error);
      return null;
    }
  }
}

// Exportar uma instância singleton
export default new MinisterioService(); 