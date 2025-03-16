import { useState, useEffect } from 'react';
import { Usuario } from '@/types/usuario';
import LocalDatabaseService from '@/lib/local-database';

export function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        
        // Buscar dados completos do usuário no banco de dados local
        const usuarios = LocalDatabaseService.findRecords('usuarios', { id: userData.id });
        if (usuarios.length > 0) {
          // Converter a data de nascimento para objeto Date se existir
          const usuarioCompleto = usuarios[0];
          if (usuarioCompleto.dataNascimento) {
            usuarioCompleto.dataNascimento = new Date(usuarioCompleto.dataNascimento);
          }
          setUsuario(usuarioCompleto);
        } else {
          setUsuario(userData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar dados do usuário
  const atualizarUsuario = (dadosAtualizados: Partial<Usuario>) => {
    if (!usuario) return false;
    
    try {
      // Log para depuração
      console.log('Atualizando usuário com dados:', dadosAtualizados);
      
      // Garantir que as relações de ministério são preservadas
      if (dadosAtualizados.ministerioId && !dadosAtualizados.ministerios) {
        console.log('Atualizando ministerioId sem atualizar array de ministerios, preservando relações existentes');
        // Se estiver atualizando apenas o ministério atual, manter o array de ministérios
        dadosAtualizados.ministerios = usuario.ministerios;
      }

      // Atualizar no banco de dados local
      const sucesso = LocalDatabaseService.updateRecord('usuarios', usuario.id, dadosAtualizados);
      
      if (sucesso) {
        // Atualizar o estado local
        const usuarioAtualizado = { ...usuario, ...dadosAtualizados };
        setUsuario(usuarioAtualizado);
        
        // Atualizar no localStorage (incluindo informações de ministério)
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const dadosBasicos = {
            ...userData,
            nome: usuarioAtualizado.nome,
            email: usuarioAtualizado.email,
            foto: usuarioAtualizado.foto,
          };
          
          // Garantir que as informações de ministério sejam incluídas
          if (dadosAtualizados.ministerioId) {
            dadosBasicos.ministerioId = dadosAtualizados.ministerioId;
            console.log('Atualizando ministerioId no localStorage para:', dadosAtualizados.ministerioId);
          }
          
          if (dadosAtualizados.ministerios) {
            dadosBasicos.ministerios = dadosAtualizados.ministerios;
            console.log('Atualizando lista de ministerios no localStorage:', dadosAtualizados.ministerios);
          }
          
          localStorage.setItem('user', JSON.stringify(dadosBasicos));
          console.log('Dados do usuário atualizados no localStorage:', dadosBasicos);
          
          // Disparar evento personalizado para notificar outras partes da aplicação
          window.dispatchEvent(new Event('userUpdated'));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      setError('Erro ao atualizar dados do usuário');
      return false;
    }
  };

  // Função específica para atualizar a foto do usuário
  const atualizarFotoUsuario = (fotoBase64: string) => {
    return atualizarUsuario({ foto: fotoBase64 });
  };

  // Obter todos os usuários do ministério
  const obterUsuariosMinisterio = (): Usuario[] => {
    if (!usuario || !usuario.ministerioId) return [];
    
    try {
      const usuarios = LocalDatabaseService.findRecords('usuarios', { ministerioId: usuario.ministerioId });
      
      // Converter as datas de nascimento para objetos Date
      return usuarios.map(u => {
        if (u.dataNascimento) {
          return { ...u, dataNascimento: new Date(u.dataNascimento) };
        }
        return u;
      });
    } catch (error) {
      console.error('Erro ao obter usuários do ministério:', error);
      return [];
    }
  };

  // Verificar se há aniversariantes do dia
  const obterAniversariantesDoDia = (): Usuario[] => {
    const usuarios = obterUsuariosMinisterio();
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth();
    
    return usuarios.filter(u => {
      if (!u.dataNascimento) return false;
      
      const dataNasc = new Date(u.dataNascimento);
      return dataNasc.getDate() === dia && dataNasc.getMonth() === mes;
    });
  };

  // Calcular idade a partir da data de nascimento
  const calcularIdade = (dataNascimento: Date): number => {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const m = hoje.getMonth() - dataNascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  return {
    usuario,
    loading,
    error,
    atualizarUsuario,
    atualizarFotoUsuario,
    obterUsuariosMinisterio,
    obterAniversariantesDoDia,
    calcularIdade
  };
} 