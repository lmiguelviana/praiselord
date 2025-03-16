import { Usuario } from '@/types/usuario';
import LocalDatabaseService from '@/lib/local-database';
import { MinisterioService } from './MinisterioService';

export class UsuarioService {
  criarUsuario(usuario: Usuario): Usuario {
    // ... existing code ...
    
    // Remover ou comentar o trecho que cria um ministério padrão
    // const ministerioService = new MinisterioService();
    // const novoMinisterio = ministerioService.criarMinisterio({
    //   nome: `Ministério de ${usuario.nome}`,
    //   descricao: 'Ministério pessoal criado automaticamente',
    //   adminId: novoUsuario.id,
    //   membros: [{ id: novoUsuario.id, funcao: 'Líder', dataHoraEntrada: new Date().toISOString() }]
    // });
    
    // Não associar o ministério ao usuário
    // novoUsuario.ministerioAtualId = novoMinisterio.id;
    // novoUsuario.ministerios = [novoMinisterio.id];
    
    // ... existing code ...
  }
  
  /**
   * Limpa o banco de dados, mantendo apenas o usuário lmiguelviana@hotmail.com
   * e os ministérios associados a ele.
   * @returns {boolean} - Retorna true se a operação foi bem-sucedida
   */
  limparDadosExcetoUsuario(emailManter: string = 'lmiguelviana@hotmail.com'): boolean {
    try {
      // 1. Obter todos os usuários do banco de dados
      const todosUsuarios = LocalDatabaseService.findAllRecords('usuarios');
      
      // 2. Encontrar o usuário a ser mantido
      const usuarioManter = todosUsuarios.find(u => u.email === emailManter);
      
      if (!usuarioManter) {
        console.error(`Usuário com e-mail ${emailManter} não encontrado!`);
        return false;
      }
      
      // 3. Guardar IDs dos ministérios associados ao usuário que será mantido
      const ministeriosAManter = usuarioManter.ministerios || [];
      
      // 4. Limpar todos os usuários exceto o que será mantido
      const idsARemover = todosUsuarios
        .filter(u => u.id !== usuarioManter.id)
        .map(u => u.id);
      
      idsARemover.forEach(id => {
        LocalDatabaseService.deleteRecord('usuarios', id);
      });
      
      // 5. Limpar ministérios não associados ao usuário mantido
      const ministerioService = new MinisterioService();
      const todosMinisterios = ministerioService.getMinisterios();
      
      todosMinisterios.forEach(ministerio => {
        if (!ministeriosAManter.includes(ministerio.id)) {
          ministerioService.excluirMinisterio(ministerio.id);
        }
      });
      
      // 6. Limpar variáveis localStorage
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.id !== usuarioManter.id) {
          localStorage.removeItem('user');
        }
      }
      
      console.log(`Banco de dados limpo. Apenas o usuário ${emailManter} e seus ministérios foram mantidos.`);
      return true;
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      return false;
    }
  }
  
  /**
   * Executa limpeza de dados ao inicializar o app
   * Deve ser chamado em um componente de inicialização
   */
  limparDadosAoInicializar(): void {
    // Verificar se a limpeza já foi executada
    const limpezaExecutada = localStorage.getItem('limpezaDadosExecutada');
    
    if (!limpezaExecutada) {
      this.limparDadosExcetoUsuario();
      localStorage.setItem('limpezaDadosExecutada', 'true');
    }
  }
} 