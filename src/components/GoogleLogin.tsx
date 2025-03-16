/**
 * GoogleLogin.tsx
 * 
 * Componente para realizar login usando a conta Google.
 * Utiliza a API de autenticação do Google para facilitar o processo de login.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Propriedades do componente
interface GoogleLoginProps {
  onSuccess: (credential: any) => void;
  onError?: () => void;
  disabled?: boolean;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ 
  onSuccess, 
  onError, 
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  // Configuração do Google OAuth
  const GOOGLE_CLIENT_ID = "922535634413-njtjajjjo847grj5943u4oftt99337uo.apps.googleusercontent.com";

  React.useEffect(() => {
    // Carregar a API do Google
    const loadGoogleAPI = () => {
      if (typeof window === 'undefined' || (window as any).google) return;

      setIsLoading(true);
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleLogin;
      script.onerror = handleScriptError;
      document.body.appendChild(script);
    };

    // Inicializar o login do Google quando a API estiver carregada
    const initializeGoogleLogin = () => {
      if (!(window as any).google) {
        console.error('API do Google não carregou corretamente');
        setIsLoading(false);
        return;
      }

      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
      } catch (error) {
        console.error('Erro ao inicializar Google Sign-In', error);
      }
      setIsLoading(false);
    };

    const handleScriptError = () => {
      console.error('Erro ao carregar o script do Google');
      setIsLoading(false);
      if (onError) onError();
    };

    loadGoogleAPI();

    // Limpar recursos quando o componente for desmontado
    return () => {
      // Limpar qualquer recurso do Google se necessário
    };
  }, [onError, GOOGLE_CLIENT_ID]);

  // Lidar com a resposta do Google após o login
  const handleGoogleResponse = (response: any) => {
    if (response && response.credential) {
      onSuccess(response);
    } else {
      if (onError) onError();
    }
  };

  // Iniciar o login quando o botão for clicado
  const handleGoogleLogin = () => {
    setIsLoading(true);
    try {
      if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // O modal não foi exibido, vamos abrir o seletor de contas
            (window as any).google.accounts.oauth2.initCodeClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'email profile',
              callback: handleGoogleResponse,
            }).requestCode();
          }
          setIsLoading(false);
        });
      } else {
        console.error('API do Google não está disponível');
        setIsLoading(false);
        if (onError) onError();
      }
    } catch (error) {
      console.error('Erro ao iniciar login do Google', error);
      setIsLoading(false);
      if (onError) onError();
    }
  };

  return (
    <Button 
      type="button" 
      variant="outline" 
      className="w-full"
      onClick={handleGoogleLogin}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      Entrar com Google
    </Button>
  );
};

export default GoogleLogin; 