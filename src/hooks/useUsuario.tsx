import React, { createContext, useState, useContext, useEffect } from 'react';
import { LocalStorageService } from '../services/LocalStorageService';
import { LocalDatabaseService } from '../services/LocalDatabaseService';

// Defina a interface para o usuário
interface Usuario {
  id: string;
  nome: string;
  email: string;
  photoURL?: string;
  googleAccount?: boolean;
  [key: string]: any;
}

interface UsuarioContextProps {
  usuario: Usuario | null;
  setUsuario: React.Dispatch<React.SetStateAction<Usuario | null>>;
  carregando: boolean;
  obterUsuarioLogado: () => Promise<Usuario | null>;
  atualizarPerfil: (dadosAtualizados: Partial<Usuario>) => Promise<boolean>;
}

const UsuarioContext = createContext<UsuarioContextProps | undefined>(undefined);

export const UsuarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Função para obter o usuário logado do localStorage
  const obterUsuarioLogado = async (): Promise<Usuario | null> => {
    try {
      const userJSON = LocalStorageService.getItem('user');
      if (!userJSON) return null;
      
      const userData = JSON.parse(userJSON);
      return userData as Usuario;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  };

  // Função para atualizar o perfil do usuário, incluindo a foto
  const atualizarPerfil = async (dadosAtualizados: Partial<Usuario>): Promise<boolean> => {
    try {
      // Obter informações atuais do usuário
      const usuarioAtual = await obterUsuarioLogado();
      
      if (!usuarioAtual) {
        throw new Error('Usuário não está logado');
      }
      
      // Atualizar as informações do usuário, incluindo a possível foto
      const usuarioAtualizado = {
        ...usuarioAtual,
        ...dadosAtualizados,
        // Garantir que a foto é atualizada apenas se fornecida
        photoURL: dadosAtualizados.photoURL || usuarioAtual.photoURL
      };
      
      // Atualizar no LocalStorage e no banco de dados local
      LocalStorageService.setItem('user', JSON.stringify(usuarioAtualizado));
      
      // Atualizar na coleção de usuários
      const usuarios = LocalDatabaseService.getAll('usuarios');
      const index = usuarios.findIndex((u: any) => u.id === usuarioAtual.id);
      
      if (index !== -1) {
        usuarios[index] = {
          ...usuarios[index],
          ...dadosAtualizados,
          photoURL: dadosAtualizados.photoURL || usuarios[index].photoURL
        };
        
        LocalDatabaseService.setAll('usuarios', usuarios);
      }
      
      // Atualizar o estado local
      setUsuario(usuarioAtualizado);
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  };

  // Carregar usuário ao iniciar
  useEffect(() => {
    const carregarUsuario = async () => {
      setCarregando(true);
      const usuarioLogado = await obterUsuarioLogado();
      if (usuarioLogado) {
        setUsuario(usuarioLogado);
      }
      setCarregando(false);
    };

    carregarUsuario();
  }, []);

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        setUsuario,
        carregando,
        obterUsuarioLogado,
        atualizarPerfil
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
};

export const useUsuario = () => {
  const context = useContext(UsuarioContext);
  if (context === undefined) {
    throw new Error('useUsuario deve ser usado dentro de um UsuarioProvider');
  }
  return context;
}; 