import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

// Configuração do Google OAuth
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = React.useState(false);

  // Verificar se há um token na URL após o redirecionamento do Google
  React.useEffect(() => {
    const handleGoogleRedirect = async () => {
      // Evitar processamento duplicado
      if (processing) return;
      
      // Verificar se há fragmentos na URL (formato: #access_token=...)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        setProcessing(true);
        
        // Extrair o token de acesso e o state
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const state = params.get('state'); // 'register' ou null (para login)
        
        if (accessToken) {
          // Buscar informações do usuário usando o token
          try {
            await fetchAndProcessUserInfo(accessToken, state || 'login');
          } catch (error) {
            console.error('Erro ao processar token:', error);
            
            // Se estamos em uma janela pop-up
            if (window.opener && !window.opener.closed) {
              try {
                // Sinalizar erro para a janela principal
                window.opener.localStorage.setItem('google_auth_error', JSON.stringify({
                  message: error instanceof Error ? error.message : 'Erro desconhecido',
                  timestamp: new Date().toISOString()
                }));
              } catch (e) {
                console.error('Não foi possível comunicar com a janela principal:', e);
              }
              
              // Fechar a janela pop-up após sinalizar o erro
              window.close();
            } else {
              // Mostrar mensagem de erro
              toast({
                variant: "destructive",
                title: "Erro na autenticação",
                description: "Não foi possível completar o login com Google."
              });
              
              // Redirecionar para a página de login em caso de erro
              navigate('/login');
            }
          } finally {
            setProcessing(false);
          }
        }
      } else {
        // Verificar se há parâmetros na URL para login/registro com Google
        const urlParams = new URLSearchParams(window.location.search);
        const googleAction = urlParams.get('google');
        const isRegister = urlParams.get('register') === 'true';
        const googleUserData = localStorage.getItem('googleUserData');
        
        if (googleAction === 'true' && googleUserData) {
          setProcessing(true);
          
          try {
            // Processar o login/registro com Google usando os dados armazenados
            const userData = JSON.parse(googleUserData);
            
            if (isRegister) {
              await processGoogleRegister(userData);
            } else {
              await processGoogleLogin(userData);
            }
            
            // Limpar os dados do localStorage
            localStorage.removeItem('googleUserData');
          } catch (error) {
            console.error('Erro ao processar dados do usuário:', error);
            toast({
              variant: "destructive",
              title: "Erro na autenticação",
              description: "Não foi possível completar o login com Google."
            });
          } finally {
            setProcessing(false);
          }
        }
      }
    };

    const fetchAndProcessUserInfo = async (accessToken: string, action: string) => {
      // Fazer uma requisição para a API do Google para obter informações do usuário
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao obter informações do usuário do Google');
      }

      const userData = await response.json();
      
      // Verificar se estamos em uma janela pop-up
      if (window.opener && !window.opener.closed) {
        try {
          // Armazenar os dados do usuário no localStorage da janela principal
          window.opener.localStorage.setItem('googleUserData', JSON.stringify(userData));
          
          // Definir o sinalizador de processamento para a janela principal
          window.opener.localStorage.setItem('google_auth_processing', 'success');
          
          // Redirecionar a janela principal para a página adequada
          if (action === 'register') {
            // Redirecionar para o dashboard após registro
            window.opener.location.href = '/dashboard?google=true&register=true';
          } else {
            // Redirecionar para o dashboard após login
            window.opener.location.href = '/dashboard?google=true';
          }
          
          // Fechar a janela pop-up após o processamento
          setTimeout(() => window.close(), 1000);
          
        } catch (e) {
          console.error('Não foi possível comunicar com a janela principal:', e);
          throw new Error('Falha na comunicação entre janelas');
        }
      } else {
        // Se não estamos em uma janela pop-up, processar localmente
        
        // Limpar a URL para remover o token
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Processar os dados do usuário conforme o tipo de ação
        if (action === 'register') {
          await processGoogleRegister(userData);
        } else {
          await processGoogleLogin(userData);
        }
      }
    };

    const processGoogleLogin = async (userData: any) => {
      // Usar o hook useAuth para processar o login com Google
      const success = await loginWithGoogle(userData);
      
      if (!success) {
        throw new Error('Falha ao processar login com Google');
      }
      
      // Feedback ao usuário
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo(a) de volta!"
      });
      
      // Redirecionar para o dashboard
      navigate('/dashboard');
    };

    const processGoogleRegister = async (userData: any) => {
      // Criar um novo usuário com os dados do Google
      const success = await loginWithGoogle(userData);
      
      if (!success) {
        throw new Error('Falha ao processar registro com Google');
      }
      
      // Feedback ao usuário
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Sua conta foi criada e você já está logado!"
      });
      
      // Redirecionar para o dashboard
      navigate('/dashboard');
    };

    // Verificar se há um token na URL quando o componente é montado
    handleGoogleRedirect();
    
  }, [loginWithGoogle, navigate, toast, processing]);

  return (
    <div data-google-oauth-provider data-client-id={GOOGLE_CLIENT_ID}>
      {children}
    </div>
  );
};

export default GoogleAuthProvider;