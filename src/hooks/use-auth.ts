import { useEffect, useState } from 'react';

// Definir o tipo de usuário
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Hook simplificado para verificar permissões - sem Context API
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se há um usuário autenticado ao carregar o componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Em uma aplicação real, você faria uma requisição ao backend
        // Por enquanto, vamos simular um usuário autenticado
        const storedUser = localStorage.getItem('praiseappUser');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
        } else {
          // TEMPORÁRIO: Para fins de demonstração, criar um usuário padrão
          const defaultUser: User = {
            id: '1',
            name: 'Usuário Demo',
            email: 'demo@exemplo.com',
            role: 'admin' // Altere para 'user' para testar as permissões
          };
          
          localStorage.setItem('praiseappUser', JSON.stringify(defaultUser));
          setUser(defaultUser);
          setIsAdmin(defaultUser.role === 'admin');
        }
      } catch (err) {
        setError('Falha ao recuperar usuário autenticado');
        console.error('Erro de autenticação:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simular login bem-sucedido
      const mockUser: User = {
        id: '1',
        name: 'Usuário Autenticado',
        email: email,
        role: email.includes('admin') ? 'admin' : 'user'
      };
      
      setUser(mockUser);
      setIsAdmin(mockUser.role === 'admin');
      localStorage.setItem('praiseappUser', JSON.stringify(mockUser));
      setError(null);
    } catch (err) {
      setError('Falha na autenticação');
      console.error('Erro de login:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('praiseappUser');
      setUser(null);
      setIsAdmin(false);
      setError(null);
    } catch (err) {
      setError('Falha ao fazer logout');
      console.error('Erro de logout:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retornar os dados de autenticação e permissões
  return {
    user,
    isAdmin,
    loading,
    error,
    login,
    logout
  };
}

export default useAuth; 