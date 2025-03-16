import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, EyeOff, Eye, CheckCircle, AlertCircle, Loader2, Music } from 'lucide-react';
import LocalDatabaseService from '@/lib/local-database';
import { Usuario } from '@/types/usuario';
import { findUserByEmail } from '@/hooks/useRegister';
import { useAppConfigSection, useAppConfigValue } from '@/components/ui/hooks/use-app-config';
import { useForm } from 'react-hook-form';
import GoogleLogin from '@/components/GoogleLogin';

// Configuração do Google OAuth
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    success: boolean;
    title: string;
    message: string;
  }>({ success: false, title: '', message: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Obter configurações personalizadas
  const logoConfig = useAppConfigSection('logos');
  const textsConfig = useAppConfigSection('texts');

  // Inicializar o banco de dados local se necessário
  useEffect(() => {
    LocalDatabaseService.initializeDatabase();
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Usar a URL atual como URI de redirecionamento
      const currentUrl = new URL(window.location.href);
      const redirectUri = `${currentUrl.protocol}//${currentUrl.host}`;
      
      // Limpar qualquer resíduo de autenticação anterior
      localStorage.removeItem('google_auth_processing');
      localStorage.removeItem('google_auth_error');
      
      // Informar ao usuário que o processo está começando
      toast({
        title: "Autenticação Google",
        description: "Abrindo janela de login do Google..."
      });
      
      // Construir URL de autenticação do Google
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile`;
      
      // Abrir uma nova janela para a autenticação do Google
      const authWindow = window.open(googleAuthUrl, 'googleAuthWindow', 'width=500,height=600');
      
      // Se a janela não puder ser aberta (bloqueador de pop-ups, etc)
      if (!authWindow) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "O bloqueador de pop-ups impediu a abertura da janela de autenticação. Por favor, permita pop-ups para este site e tente novamente."
        });
        
        setIsGoogleLoading(false);
        return;
      }
      
      // Criar um intervalo para verificar se a janela foi fechada
      const checkWindowClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindowClosed);
          setIsGoogleLoading(false);
          
          // Verificar se a autenticação foi bem-sucedida através do localStorage
          // (O GoogleAuthProvider terá processado o token e armazenado informações)
          const googleProcessed = localStorage.getItem('google_auth_processing');
          if (googleProcessed === 'success') {
            localStorage.removeItem('google_auth_processing');
            toast({
              title: "Autenticação bem-sucedida",
              description: "Processando o login..."
            });
            // Redirecionar para o dashboard após login bem-sucedido
            navigate('/dashboard');
          }
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      // Mostrar modal de erro
      setModalInfo({
        success: false,
        title: "Erro na autenticação com Google",
        message: error.message || "Ocorreu um erro ao processar sua solicitação com o Google."
      });
      setShowModal(true);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificar se o email e senha foram fornecidos
      if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos');
      }

      // Buscar usuário pelo email
      const users = LocalDatabaseService.findRecords('usuarios', { email });
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const user = users[0] as Usuario;
      
      // Verificar a senha
      if (user.senha !== password) {
        throw new Error('Senha incorreta');
      }

      // Verificar se o usuário tem a propriedade ministerios
      if (!user.ministerios || !Array.isArray(user.ministerios)) {
        // Inicializar a propriedade ministerios como array vazio se não existir
        user.ministerios = [];
        LocalDatabaseService.updateRecord('usuarios', user.id, {
          ministerios: []
        });
        
        // Informar ao usuário que ele precisa criar ou ingressar em um ministério
        toast({
          title: "Aviso",
          description: "Para começar a usar o app, crie ou ingresse em um ministério na página de perfil"
        });
      } else if (user.ministerios.length === 0) {
        // Se o usuário já tem a propriedade ministerios, mas está vazia
        toast({
          title: "Aviso",
          description: "Para começar a usar o app, crie ou ingresse em um ministério na página de perfil"
        });
      } else {
        // Verificar se os ministérios do usuário existem no banco de dados
        let ministeriosValidos = 0;
        const db = JSON.parse(localStorage.getItem('praiseapp_database') || '{"ministerios":[]}');
        
        for (const relacao of user.ministerios) {
          const ministerioExiste = db.ministerios.some((m: any) => m.id === relacao.ministerioId);
          if (ministerioExiste) {
            ministeriosValidos++;
          }
        }
        
        if (ministeriosValidos === 0) {
          toast({
            title: "Aviso",
            description: "Não encontramos nenhum ministério válido associado à sua conta. Por favor, crie ou ingresse em um ministério."
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
        ministerios: user.ministerios
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'jwt-token');
      
      // Inicializar dados de exemplo para aniversariantes
      LocalDatabaseService.initializeWithSampleData();
      
      // Mostrar modal de sucesso
      setModalInfo({
        success: true,
        title: "Login realizado com sucesso!",
        message: `Bem-vindo(a) ${user.nome}! Você será redirecionado para o dashboard em alguns segundos.`
      });
      setShowModal(true);
      
      // Redirecionar para dashboard após 3 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Mostrar modal de erro
      setModalInfo({
        success: false,
        title: "Erro no login",
        message: error.message || 'Ocorreu um erro ao fazer login. Por favor, tente novamente.'
      });
      setShowModal(true);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (modalInfo.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-20 w-auto"
          src={logoConfig.loginLogo}
          alt={textsConfig.appName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo-login.png';
          }}
        />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {textsConfig.loginWelcome}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {textsConfig.appDescription}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu.email@exemplo.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  to="/recuperar-senha" 
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => {
                    toast({
                      variant: "destructive",
                      title: "Erro no login Google",
                      description: "Não foi possível fazer login com sua conta Google. Tente novamente.",
                    });
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Registre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        {textsConfig.footerText}
      </div>

      {/* Modal de confirmação */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalInfo.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {modalInfo.title}
            </DialogTitle>
            <DialogDescription>
              {modalInfo.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleCloseModal}
              variant={modalInfo.success ? "default" : "outline"}
            >
              {modalInfo.success ? "Ir para Dashboard" : "Fechar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
