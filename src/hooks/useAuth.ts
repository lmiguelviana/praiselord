import { useNavigate } from 'react-router-dom';
import LocalDatabaseService from '@/lib/local-database';

export function useAuth() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('useAuth: Realizando logout');
    // Limpar dados de autenticação do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para a página de login
    navigate('/login');
  };

  const loginWithGoogle = async (googleUserData: any) => {
    console.log('useAuth: Iniciando loginWithGoogle com dados:', googleUserData);
    
    try {
      if (!googleUserData || !googleUserData.email) {
        console.error('useAuth: Dados inválidos do Google', googleUserData);
        return false;
      }
      
      // Verificar se o usuário já existe
      const users = LocalDatabaseService.findRecords('usuarios', { email: googleUserData.email });
      console.log('useAuth: Usuário encontrado?', users.length > 0);
      
      let user = users[0];

      if (!user) {
        console.log('useAuth: Criando novo usuário com email', googleUserData.email);
        // Criar um novo usuário com os dados do Google
        const userId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const ministerioId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

        // Criar ministério padrão
        const novoMinisterio = {
          id: ministerioId,
          nome: `Ministério de ${googleUserData.name || googleUserData.given_name || 'Usuário Google'}`,
          descricao: 'Ministério pessoal',
          adminId: userId,
          dataCriacao: new Date().toISOString(),
          membros: 1,
          pins: []
        };
        
        console.log('useAuth: Criando ministério padrão', novoMinisterio);
        LocalDatabaseService.createRecord('ministerios', novoMinisterio);

        // Criar relação do usuário com o ministério
        const relacaoMinisterio = {
          ministerioId: ministerioId,
          role: 'admin' as 'admin' | 'member',
          dataIngresso: new Date().toISOString()
        };

        // Criar o usuário
        user = {
          id: userId,
          nome: googleUserData.name || googleUserData.given_name || 'Usuário Google',
          email: googleUserData.email,
          senha: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          ministerioId: ministerioId,
          ministerios: [relacaoMinisterio],
          role: 'member',
          googleId: googleUserData.sub, // ID único do Google
          photoURL: googleUserData.picture || ''
        };

        console.log('useAuth: Salvando novo usuário no banco de dados', user);
        LocalDatabaseService.createRecord('usuarios', user);
        
        // Inicializar dados de exemplo
        if (LocalDatabaseService.initializeWithSampleData) {
          console.log('useAuth: Inicializando dados de exemplo');
          LocalDatabaseService.initializeWithSampleData();
        }
      } else {
        console.log('useAuth: Atualizando usuário existente', user.id);
        // Garantir que o usuário tenha a propriedade ministerios
        if (!user.ministerios) {
          console.log('useAuth: Usuário não possui ministerios, criando relação');
          // Se o usuário não tiver ministerios, criar um ministério padrão
          const ministerioId = user.ministerioId || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
          
          // Verificar se o ministério existe
          const ministerios = LocalDatabaseService.findRecords('ministerios', { id: ministerioId });
          
          if (ministerios.length === 0) {
            console.log('useAuth: Criando ministério para usuário existente');
            // Criar um novo ministério
            const novoMinisterio = {
              id: ministerioId,
              nome: `Ministério de ${user.nome}`,
              descricao: 'Ministério pessoal',
              adminId: user.id,
              dataCriacao: new Date().toISOString(),
              membros: 1,
              pins: []
            };
            
            LocalDatabaseService.createRecord('ministerios', novoMinisterio);
          }
          
          // Criar relação do usuário com o ministério
          const relacaoMinisterio = {
            ministerioId: ministerioId,
            role: 'admin' as 'admin' | 'member',
            dataIngresso: new Date().toISOString()
          };
          
          // Atualizar o usuário
          user.ministerios = [relacaoMinisterio];
          LocalDatabaseService.updateRecord('usuarios', user.id, {
            ministerios: [relacaoMinisterio],
            googleId: googleUserData.sub, // Garantir que o ID do Google esteja atualizado
            photoURL: googleUserData.picture || user.photoURL || ''
          });
        }
      }

      // Salvar dados do usuário no localStorage
      const userData = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role || 'member',
        ministerioId: user.ministerioId,
        ministerios: user.ministerios,
        photoURL: user.photoURL || googleUserData.picture || ''
      };

      console.log('useAuth: Salvando dados do usuário no localStorage', userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'google-jwt-token');

      return true;
    } catch (error) {
      console.error('useAuth: Erro no login com Google:', error);
      return false;
    }
  };

  return {
    handleLogout,
    loginWithGoogle
  };
} 