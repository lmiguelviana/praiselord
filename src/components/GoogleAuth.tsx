import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface GoogleAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  isLoading?: boolean;
  className?: string;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onSuccess,
  onError,
  buttonText = "Continuar com Google",
  isLoading = false,
  className = "",
}) => {
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      // Verificar se estamos em ambiente de produção ou desenvolvimento
      const isDevelopment = window.location.hostname === 'localhost';
      
      // Configuração do Google OAuth
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '922535634413-njtjajjjo847grj5943u4oftt99337uo.apps.googleusercontent.com';
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin;
      
      // Redirecionar para a página de autenticação do Google
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile`;
      window.location.href = authUrl;
      
      // Em desenvolvimento, podemos simular o login com Google
      if (isDevelopment && import.meta.env.DEV) {
        // Simular o login com Google para desenvolvimento
        const success = await loginWithGoogle();
        
        if (success && onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  return (
    <button
      type="button"
      className={`flex items-center justify-center gap-2 ${className}`}
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Conectando...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
};

export default GoogleAuth;
