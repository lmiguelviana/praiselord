import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Mail, User, Key, Music, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  registerUser, 
  verifyMinisterioPIN 
} from '@/hooks/useRegister';
import LocalDatabaseService from '@/lib/local-database';

// Configuração do Google OAuth
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Componente personalizado para o seletor de mês e ano
const CustomCalendarHeader = ({
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
}: {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}) => {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="flex justify-between items-center p-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMonthChange(currentMonth - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <select
          value={currentMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {months.map((month, i) => (
            <option key={i} value={i}>
              {month}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMonthChange(currentMonth + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <select
        value={currentYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {Array.from({ length: 100 }, (_, i) => currentYear - 80 + i).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState<Date>();
  const [pin, setPin] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    success: boolean;
    title: string;
    message: string;
  }>({ success: false, title: '', message: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear() - 20); // Começar com 20 anos atrás por padrão
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Inicializar o banco de dados local se necessário
  React.useEffect(() => {
    LocalDatabaseService.initializeDatabase();
  }, []);

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Usar a URL atual como URI de redirecionamento
      const currentUrl = new URL(window.location.href);
      const redirectUri = `${currentUrl.protocol}//${currentUrl.host}`;
      
      // Informar ao usuário que o processo está começando
      toast({
        title: "Autenticação Google",
        description: "Abrindo janela de login do Google..."
      });
      
      // Adicionar parâmetro para indicar que é um registro, não um login
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile&state=register`;
      
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
              title: "Cadastro bem-sucedido",
              description: "Processando o cadastro com Google..."
            });
            // Redirecionar para o dashboard após cadastro bem-sucedido
            navigate('/dashboard');
          }
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Erro no registro com Google:', error);
      
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

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar o tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione uma imagem válida."
      });
      return;
    }

    // Verificar o tamanho do arquivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB."
      });
      return;
    }

    // Converter a imagem para Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFoto(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = () => {
    setFoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!nome || !email || !senha) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      if (senha.length < 8) {
        throw new Error('A senha deve ter pelo menos 8 caracteres');
      }

      // Registrar o usuário
      const userData = registerUser({
        nome,
        email,
        senha,
        dataNascimento,
        pin,
        foto: foto || undefined
      });

      // Mostrar modal de sucesso
      setModalInfo({
        success: true,
        title: "Cadastro Realizado!",
        message: `Conta criada com sucesso para ${nome}. Você será redirecionado para a página de login em alguns segundos.`
      });
      setShowModal(true);
      
      // Redirecionar para login após 5 segundos
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Mostrar modal de erro
      setModalInfo({
        success: false,
        title: "Erro no Cadastro",
        message: error.message || "Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente."
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (modalInfo.success) {
      navigate('/login');
    }
  };

  // Manipuladores para o calendário personalizado
  const handleMonthChange = (month: number) => {
    if (month < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else if (month > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(month);
    }
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDataNascimento(date);
    if (date) {
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <img 
          src="/placeholder.svg" 
          alt="Logo" 
          className="h-8 w-8"
        />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Praise</span>Lord
          </h1>
          <p className="text-foreground/70 text-sm mt-1">
            Crie sua conta e junte-se a um ministério
          </p>
        </div>

        <Card className="w-full card-shadow glass-morphism">
          <CardHeader>
            <CardTitle>Registro</CardTitle>
            <CardDescription>
              Preencha seus dados para criar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {foto ? (
                      <img src={foto} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0"
                    onClick={handleFileButtonClick}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="text-center">
                  <Label className="text-sm">Foto de Perfil</Label>
                  <p className="text-xs text-muted-foreground">Opcional</p>
                  {foto && (
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={handleRemoveFoto}
                      className="mt-1 h-auto py-1 px-2 text-xs"
                    >
                      Remover foto
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="nome" 
                    placeholder="Digite seu nome completo" 
                    className="pl-8"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Digite seu e-mail" 
                    className="pl-8"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="senha" 
                    type="password" 
                    placeholder="Digite sua senha" 
                    className="pl-8"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 8 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!dataNascimento && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataNascimento ? format(dataNascimento, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 border-b">
                      <CustomCalendarHeader 
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        onMonthChange={handleMonthChange}
                        onYearChange={handleYearChange}
                      />
                    </div>
                    <Calendar
                      mode="single"
                      selected={dataNascimento}
                      onSelect={handleDateSelect}
                      month={new Date(currentYear, currentMonth)}
                      onMonthChange={(date) => {
                        setCurrentMonth(date.getMonth());
                        setCurrentYear(date.getFullYear());
                      }}
                      initialFocus
                      locale={ptBR}
                      className="rounded-md border-none"
                      classNames={{
                        caption_label: "hidden", // Esconder o cabeçalho padrão
                        nav: "hidden", // Esconder a navegação padrão
                        head_cell: "text-muted-foreground font-normal text-xs",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Ingressar em um Ministério</Label>
                <div className="relative">
                  <Music className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Digite o PIN do ministério" 
                    className="pl-8"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Se você já tem um PIN de convite, insira-o acima para ingressar em um ministério existente.
                  Se não tiver um PIN, um ministério pessoal será criado para você.
                </p>
              </div>

              <div className="space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continue com
                    </span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleRegister}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando com Google...
                    </>
                  ) : (
                    <>
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
                        <path d="M1 1h22v22H1z" fill="none" />
                      </svg>
                      Criar conta com Google
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Faça login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
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
              {modalInfo.success ? "Ir para Login" : "Fechar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
