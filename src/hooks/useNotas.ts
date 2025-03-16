import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMinisterio } from './useMinisterio';
import { useUsuario } from './useUsuario';

export type Nota = {
  id: number;
  titulo: string;
  conteudo: string;
  data: string;
  prioridade: 'alta' | 'media' | 'baixa';
  ministerioId: string; // ID do ministério ao qual a nota pertence
  autorId: string; // ID do usuário que criou a nota
};

// Função para obter a data atual formatada
const getDataFormatada = (): string => {
  const hoje = new Date();
  const dia = hoje.getDate().toString().padStart(2, '0');
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

// Função para carregar notas do localStorage
const carregarNotas = (ministerioId?: string): Nota[] => {
  try {
    const notasString = localStorage.getItem('praiselord_notas');
    if (notasString) {
      const todasNotas = JSON.parse(notasString) as Partial<Nota>[];
      
      // Garantir que todas as notas tenham as propriedades necessárias
      const notasCompletas = todasNotas.map(nota => {
        if (!nota.ministerioId) {
          // Se não tiver ministerioId, é uma nota antiga
          return {
            ...nota,
            ministerioId: ministerioId || 'default',
            autorId: 'unknown'
          } as Nota;
        }
        return nota as Nota;
      });
      
      // Se um ministério específico foi fornecido, filtrar as notas desse ministério
      if (ministerioId) {
        return notasCompletas.filter(nota => 
          nota.ministerioId === ministerioId || !nota.ministerioId
        );
      }
      
      return notasCompletas;
    }
  } catch (error) {
    console.error('Erro ao carregar notas do localStorage:', error);
  }
  return []; // Retorna array vazio em vez das notas fictícias
};

// Função para salvar notas no localStorage
const salvarNotas = (notas: Nota[]): void => {
  try {
    // Obter todas as notas existentes
    const notasString = localStorage.getItem('praiselord_notas');
    let todasNotas: Nota[] = [];
    
    if (notasString) {
      const notasExistentes = JSON.parse(notasString) as Nota[];
      
      // Filtrar as notas que não pertencem ao ministério atual
      if (notas.length > 0) {
        const ministerioId = notas[0].ministerioId;
        todasNotas = [
          ...notasExistentes.filter(nota => nota.ministerioId !== ministerioId),
          ...notas
        ];
      } else {
        todasNotas = notasExistentes;
      }
    } else {
      todasNotas = notas;
    }
    
    localStorage.setItem('praiselord_notas', JSON.stringify(todasNotas));
  } catch (error) {
    console.error('Erro ao salvar notas no localStorage:', error);
  }
};

export const useNotas = () => {
  const queryClient = useQueryClient();
  const { ministerioAtual } = useMinisterio();
  const { usuario } = useUsuario();

  // Verificar se o usuário é administrador do ministério atual
  const isAdmin = usuario?.ministerios.find(
    m => m.ministerioId === ministerioAtual?.id
  )?.role === 'admin';

  // Buscar notas do localStorage
  const { data: notas = [] } = useQuery({
    queryKey: ['notas', ministerioAtual?.id],
    queryFn: () => Promise.resolve(carregarNotas(ministerioAtual?.id)),
    enabled: !!ministerioAtual,
  });

  const adicionarNota = useMutation({
    mutationFn: async (novaNota: Omit<Nota, 'id' | 'data' | 'ministerioId' | 'autorId'>) => {
      // Verificar se o usuário é administrador
      if (!isAdmin) {
        throw new Error('Apenas administradores podem criar notas');
      }
      
      if (!ministerioAtual || !usuario) {
        throw new Error('Ministério ou usuário não encontrado');
      }
      
      const id = notas.length > 0 ? Math.max(...notas.map(n => n.id)) + 1 : 1;
      const notaCompleta: Nota = { 
        ...novaNota, 
        id, 
        data: getDataFormatada(),
        ministerioId: ministerioAtual.id,
        autorId: usuario.id
      };
      
      const notasAtualizadas = [...notas, notaCompleta];
      salvarNotas(notasAtualizadas);
      
      return notaCompleta;
    },
    onSuccess: (novaNota) => {
      queryClient.setQueryData(['notas', ministerioAtual?.id], (old: Nota[] = []) => [...old, novaNota]);
    },
  });

  const editarNota = useMutation({
    mutationFn: async (notaAtualizada: Partial<Nota> & { id: number }) => {
      // Verificar se o usuário é administrador
      if (!isAdmin) {
        throw new Error('Apenas administradores podem editar notas');
      }
      
      if (!ministerioAtual || !usuario) {
        throw new Error('Ministério ou usuário não encontrado');
      }
      
      // Encontrar a nota original
      const notaOriginal = notas.find(n => n.id === notaAtualizada.id);
      if (!notaOriginal) {
        throw new Error('Nota não encontrada');
      }
      
      // Garantir que a nota atualizada tenha todas as propriedades necessárias
      const notaCompletaAtualizada: Nota = {
        ...notaOriginal,
        ...notaAtualizada,
        ministerioId: notaOriginal.ministerioId || ministerioAtual.id,
        autorId: notaOriginal.autorId || usuario.id
      };
      
      const notasAtualizadas = notas.map(nota => 
        nota.id === notaCompletaAtualizada.id ? notaCompletaAtualizada : nota
      );
      
      salvarNotas(notasAtualizadas);
      return notaCompletaAtualizada;
    },
    onSuccess: (notaAtualizada) => {
      queryClient.setQueryData(['notas', ministerioAtual?.id], (old: Nota[] = []) =>
        old.map(nota => nota.id === notaAtualizada.id ? notaAtualizada : nota)
      );
    },
  });

  const excluirNota = useMutation({
    mutationFn: async (id: number) => {
      // Verificar se o usuário é administrador
      if (!isAdmin) {
        throw new Error('Apenas administradores podem excluir notas');
      }
      
      const notasAtualizadas = notas.filter(nota => nota.id !== id);
      salvarNotas(notasAtualizadas);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['notas', ministerioAtual?.id], (old: Nota[] = []) =>
        old.filter(nota => nota.id !== id)
      );
    },
  });

  const limparNotas = useMutation({
    mutationFn: async () => {
      // Verificar se o usuário é administrador
      if (!isAdmin) {
        throw new Error('Apenas administradores podem limpar notas');
      }
      
      salvarNotas([]);
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(['notas', ministerioAtual?.id], []);
    },
  });

  return {
    notas,
    adicionarNota,
    editarNota,
    excluirNota,
    limparNotas,
    isAdmin
  };
}; 