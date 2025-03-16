import React, { createContext, useState, useContext, useEffect } from 'react';
import { LocalStorageService } from '../services/LocalStorageService';
import { LocalDatabaseService } from '../services/LocalDatabaseService';
import { useUsuario } from './useUsuario';
import { toast } from 'sonner';

interface AuthContextProps {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (googleUserData?: any) => Promise<boolean>;
  register: (nome: string, email: string, password: string, photoURL?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '922535634413-njtjajjjo847grj5943u4oftt99337uo.apps.googleusercontent.com';
// A URI de redirecionamento agora será calculada dinamicamente

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setUsuario } = useUsuario();

  // Verificar autenticação ao iniciar
  useEffect(() => {
    checkSession();
  }, []);

  // Verificar se o usuário está logado
  const checkSession = () => {
    setLoading(true);
    try {
      const storedUser = LocalStorageService.getItem('user');
      const token = LocalStorageService.getItem('token');
      
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUsuario(parsedUser);
      } else {
        setIsAuthenticated(false);
        setUsuario(null);
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      setIsAuthenticated(false);
      setUsuario(null);
    }
    setLoading(false);
  };

  // Função de login normal
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar se é uma tentativa de login de uma conta criada com Google
      const usuarios = LocalDatabaseService.getAll('usuarios');
      const usuarioEncontrado = usuarios.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (usuarioEncontrado && usuarioEncontrado.googleId) {
        setError("Esta conta foi criada com o Google. Por favor, use o botão 'Continuar com Google'.");
        setLoading(false);
        return false;
      }
      
      // Verificar credenciais
      if (!usuarioEncontrado || usuarioEncontrado.password !== password) {
        setError("Credenciais inválidas");
        setLoading(false);
        return false;
      }
      
      // Login bem-sucedido
      const { password: _, ...usuarioSemSenha } = usuarioEncontrado;
      
      // Salvar no localStorage
      LocalStorageService.setItem('user', JSON.stringify(usuarioSemSenha));
      LocalStorageService.setItem('token', 'fake-jwt-token');
      
      setIsAuthenticated(true);
      setUsuario(usuarioSemSenha);
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError("Erro ao fazer login");
      setLoading(false);
      return false;
    }
  };

  // Função de login com Google
  const loginWithGoogle = async (googleUserData?: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Se não houver dados do usuário Google, iniciar o fluxo de autenticação
      if (!googleUserData) {
        // Em um ambiente de produção, redirecionaríamos para a URL de autenticação do Google
        // Mas para desenvolvimento, vamos simular o processo
        
        if (window.location.hostname !== 'localhost') {
          // Em produção, redirecionar para o Google OAuth
          const redirectUri = `${window.location.protocol}//${window.location.host}`;
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile`;
          window.location.href = authUrl;
          return false; // O fluxo será interrompido pelo redirecionamento
        }
        
        // Simulação para ambiente de desenvolvimento
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay de rede
        
        // Gerar um email aleatório para simular um usuário Google
        const randomNum = Math.floor(Math.random() * 10000);
        googleUserData = {
          email: `user${randomNum}@gmail.com`,
          name: "Usuário Google",
          picture: "",
          sub: `google-${randomNum}`
        };
      }
      
      // Extrair informações do usuário Google
      const { email, name, picture, sub: googleId } = googleUserData;
      
      if (!email) {
        throw new Error("Não foi possível obter o email do Google");
      }
      
      // Verificar se o usuário já existe
      const usuarios = LocalDatabaseService.getAll('usuarios');
      let usuarioEncontrado = usuarios.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase()
      );
      
      // Se o usuário não existir, criar um novo
      if (!usuarioEncontrado) {
        // Não criar mais um ministério padrão automaticamente
        
        // Criar o usuário
        const userId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const novoUsuario = {
          id: userId,
          nome: name || email.split('@')[0],
          email: email,
          foto: picture || '',
          dataCriacao: new Date().toISOString(),
          ministerioId: '', // Usuário sem ministério inicialmente
          ministerios: [] // Usuário sem ministérios inicialmente
        };
        
        // Salvar o novo usuário
        LocalDatabaseService.createRecord('usuarios', novoUsuario);
        
        // Atualizar o usuário encontrado para continuar o fluxo
        usuarioEncontrado = novoUsuario;
        
        console.log('Usuário cadastrado com sucesso via Google:', novoUsuario);
        
        // Mostrar mensagem de boas-vindas
        toast.success(`Bem-vindo, ${name || 'Novo usuário'}! Você foi cadastrado com sucesso.`);
        toast("Para começar, crie ou ingresse em um ministério na sua página de perfil", {
          duration: 5000,
        });
      } else {
        // Atualizar informações do usuário existente se necessário
        if (!usuarioEncontrado.googleId) {
          LocalDatabaseService.updateRecord('usuarios', usuarioEncontrado.id, {
            googleId: googleId,
            photoURL: picture || usuarioEncontrado.photoURL
          });
          usuarioEncontrado.googleId = googleId;
          usuarioEncontrado.photoURL = picture || usuarioEncontrado.photoURL;
        }
        
        // Garantir que o usuário tenha a propriedade ministerios
        if (!usuarioEncontrado.ministerios) {
          // Apenas inicializar com array vazio
          usuarioEncontrado.ministerios = [];
          LocalDatabaseService.updateRecord('usuarios', usuarioEncontrado.id, {
            ministerios: []
          });
          
          // Informar ao usuário que ele precisa criar ou ingressar em um ministério
          toast("Para começar a usar o app, crie ou ingresse em um ministério na página de perfil", {
            duration: 5000,
          });
        }
      }
      
      // Remover campos sensíveis
      const { password, ...usuarioSemSenha } = usuarioEncontrado;
      
      // Salvar dados do usuário no localStorage
      LocalStorageService.setItem('user', JSON.stringify(usuarioSemSenha));
      LocalStorageService.setItem('token', 'google-jwt-token');
      
      // Inicializar dados de exemplo para aniversariantes
      if (LocalDatabaseService.initializeWithSampleData) {
        LocalDatabaseService.initializeWithSampleData();
      }
      
      setIsAuthenticated(true);
      setUsuario(usuarioSemSenha);
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      setError(error.message || "Ocorreu um erro ao processar sua solicitação com o Google.");
      setLoading(false);
      return false;
    }
  };

  // Função de registro
  const register = async (nome: string, email: string, password: string, photoURL?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar se o email já está cadastrado
      const usuarios = LocalDatabaseService.getAll('usuarios');
      const emailJaCadastrado = usuarios.some(
        (u: any) => u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (emailJaCadastrado) {
        setError("Email já cadastrado");
        setLoading(false);
        return false;
      }
      
      // Não criar mais um ministério padrão automaticamente
      
      // Criar o usuário
      const userId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const novoUsuario = {
        id: userId,
        nome: nome,
        email: email,
        senha: password, // Normalmente você faria um hash dessa senha
        foto: photoURL || '',
        dataCriacao: new Date().toISOString(),
        ministerioId: '', // Usuário sem ministério inicialmente
        ministerios: [] // Usuário sem ministérios inicialmente
      };
      
      // Salvar o novo usuário no banco de dados
      LocalDatabaseService.createRecord('usuarios', novoUsuario);
      
      console.log('Usuário cadastrado com sucesso:', novoUsuario);
      
      // Mostrar mensagem de boas-vindas
      toast.success(`Bem-vindo, ${nome}! Você foi cadastrado com sucesso.`);
      toast("Para começar, crie ou ingresse em um ministério na sua página de perfil", {
        duration: 5000,
      });
      
      // Fazer login automaticamente
      const { password: senhaRemovida, ...usuarioSemSenha } = novoUsuario;
      LocalStorageService.setItem('user', JSON.stringify(usuarioSemSenha));
      LocalStorageService.setItem('token', 'fake-jwt-token');
      
      setUsuario(usuarioSemSenha);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Erro ao registrar:", error);
      setError("Erro ao criar conta");
      setLoading(false);
      return false;
    }
  };

  // Função de logout
  const logout = () => {
    LocalStorageService.removeItem('user');
    LocalStorageService.removeItem('token');
    setIsAuthenticated(false);
    setUsuario(null);
  };

  // Limpar erros
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};