import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, UserCheck, Users, Plus, Bell, StickyNote, Cake, CalendarDays, SkipForward, DoorOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotas, Nota } from '@/hooks/useNotas';
import { useUsuario } from '@/hooks/useUsuario';
import { useMinisterio } from '@/hooks/useMinisterio';
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import escalaService from "@/services/EscalaService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Dados fictícios para notificações
const notificacoes = [
  { id: 1, tipo: 'info', mensagem: 'Atualização no sistema', data: '01/05/2023' },
  { id: 2, tipo: 'alerta', mensagem: 'Nova funcionalidade adicionada', data: '03/05/2023' },
  { id: 3, tipo: 'convite', mensagem: 'Você foi convidado para um novo ministério', data: '05/05/2023' },
];

// Componente para o calendário simplificado
const CalendarioSimplificado = ({ onDiaClick }: { onDiaClick: (dia: number) => void }) => {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  
  // Obter o primeiro dia do mês e o número de dias no mês
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  
  // Nomes dos meses em português
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Função para navegar para o mês anterior
  const mesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };
  
  // Função para navegar para o próximo mês
  const proximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };
  
  // Dias com eventos (simulados)
  const diasComEventos = [1, 5, 12, 15, 21, 28];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm">{nomesMeses[mesAtual]} {anoAtual}</h3>
        <div className="flex gap-2">
          <button 
            className="p-2 rounded hover:bg-accent"
            onClick={mesAnterior}
          >
            ◀
          </button>
          <button 
            className="p-2 rounded hover:bg-accent"
            onClick={proximoMes}
          >
            ▶
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho do calendário */}
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, index) => (
          <div key={`header-${index}`} className="text-center font-semibold p-2">
            {dia}
          </div>
        ))}
        
        {/* Dias vazios antes do primeiro dia do mês */}
        {Array.from({ length: primeiroDiaMes }, (_, i) => (
          <div key={`empty-${i}`} className="text-center p-2"></div>
        ))}
        
        {/* Dias do mês */}
        {Array.from({ length: diasNoMes }, (_, i) => {
          const dia = i + 1;
          const temEvento = diasComEventos.includes(dia);
          const hoje = new Date();
          const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
          
          return (
            <div 
              key={`day-${i}`} 
              className={`text-center p-2 rounded-full w-8 h-8 mx-auto flex items-center justify-center 
              ${ehHoje ? 'bg-primary text-primary-foreground' : ''}
              ${temEvento && !ehHoje ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30' : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'}`}
              onClick={() => onDiaClick(dia)}
            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<Nota | null>(null);
  const { notas } = useNotas();
  const { usuario, obterAniversariantesDoDia, calcularIdade } = useUsuario();
  const { ministerioAtual, ministerios, loading: ministerioLoading, obterMembrosMinisterio } = useMinisterio();
  const [membrosMinisterio, setMembrosMinisterio] = useState<any[]>([]);
  const [escalasMes, setEscalasMes] = useState(0);
  const [proximasEscalas, setProximasEscalas] = useState<any[]>([]);

  // Carregar membros do ministério atual
  useEffect(() => {
    const carregarMembros = async () => {
      if (ministerioAtual) {
        const membros = await obterMembrosMinisterio(ministerioAtual.id);
        setMembrosMinisterio(membros);
      }
    };
    
    carregarMembros();
  }, [ministerioAtual, obterMembrosMinisterio]);

  // Efeito para carregar dados do dashboard
  useEffect(() => {
    // Carrega os dados do dashboard
    const carregarDados = async () => {
      try {
        // ... existing code ...
        
        // Contar escalas do usuário no mês atual
        if (usuario && ministerioAtual) {
          // Usar o serviço para obter a quantidade real de escalas do mês
          const qtdEscalas = escalaService.getQtdEscalasMesAtual(usuario.id);
          setEscalasMes(qtdEscalas);
        }

        // Carregar próximas escalas
        if (usuario && ministerioAtual) {
          const escalasProximas = escalaService.getProximasEscalas()
            .filter(escala => escala.ministerioId === ministerioAtual.id)
            .sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime())
            .slice(0, 3); // Limitar para mostrar apenas as 3 próximas
          
          setProximasEscalas(escalasProximas);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      }
    };

    carregarDados();
  }, [usuario, ministerioAtual]);

  const handleDiaClick = (dia: number) => {
    // Implementação para quando um dia é clicado no calendário
    // Pode ser usado posteriormente para mostrar eventos ou detalhes desse dia
  };

  // Componente para exibir as notas no Dashboard
  const NotasComponent = () => {
    // Verificar se há notas e se o ministério atual está definido
    if (!ministerioAtual) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p>Selecione um ministério para ver as notas.</p>
        </div>
      );
    }
    
    if (!notas || notas.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p>Nenhuma nota encontrada.</p>
          {usuario && ministerioAtual && ministerioAtual.adminId === usuario.id && (
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm"
              onClick={() => navigate('/notas')}
            >
              Adicionar uma nota
            </Button>
          )}
        </div>
      );
    }
    
    const notasRecentes = notas.slice(0, 3); // Exibir apenas as 3 notas mais recentes
    
    return (
      <div className="space-y-3">
        {notasRecentes.map((nota) => (
          <div 
            key={nota.id} 
            className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => setNotaSelecionada(nota)}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-sm">{nota.titulo}</h4>
              {nota.prioridade && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  nota.prioridade === 'alta' ? 'bg-red-100 text-red-500' :
                  nota.prioridade === 'media' ? 'bg-yellow-100 text-yellow-500' :
                  'bg-green-100 text-green-500'
                }`}>
                  {nota.prioridade}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{nota.conteudo}</p>
            <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              <span>{nota.data}</span>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          className="w-full text-xs"
          onClick={() => navigate('/notas')}
        >
          {usuario && ministerioAtual && ministerioAtual.adminId === usuario?.id 
            ? "Gerenciar notas" 
            : "Ver todas as notas"}
        </Button>
      </div>
    );
  };

  // Componente para exibir os aniversariantes do dia
  const AniversariantesComponent = () => {
    const aniversariantes = obterAniversariantesDoDia();
    
    if (aniversariantes.length === 0) {
      return (
        <div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Nenhum aniversariante hoje</p>
        </div>
      );
    }
    
    // Exibir o primeiro aniversariante
    const aniversariante = aniversariantes[0];
    const idade = aniversariante.dataNascimento ? calcularIdade(aniversariante.dataNascimento) : 0;
    
    return (
      <div>
        <div className="text-2xl font-bold">{aniversariantes.length}</div>
        <p className="text-xs text-muted-foreground">
          {aniversariante.nome} {idade > 0 ? `(${idade} anos)` : ""}
          {aniversariantes.length > 1 && (
            <span className="text-primary ml-1">
              + {aniversariantes.length - 1} outro{aniversariantes.length > 2 ? 's' : ''}
            </span>
          )}
        </p>
      </div>
    );
  };

  // Função para navegar para a página de escalas na aba específica
  const navegarParaEscalas = (tab = "minhas-escalas") => {
    navigate('/escalas', { state: { tab } });
  };

  // Função para obter as iniciais do nome para o fallback do avatar
  const obterIniciais = (nome: string) => {
    return nome
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Função para formatar a data
  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return dataString;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 animate-fade-up">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta{usuario ? ', ' + usuario.nome.split(' ')[0] : ''}!</h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu ministério de louvor.
          </p>
        </div>
        
        {ministerioAtual ? (
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{ministerioAtual.nome}</span>
              {ministerios.length > 1 && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/configuracoes')}
                >
                  Alternar ministério
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
            <span>Nenhum ministério selecionado</span>
          </div>
        )}
      </div>

      {/* Verificar se o usuário tem ministério antes de renderizar os cartões de estatísticas */}
      {ministerioAtual ? (
        // Renderiza o conteúdo normal do Dashboard quando o usuário tem ministério
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {/* Box: Minhas Escalas do Mês */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navegarParaEscalas("minhas-escalas")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Minhas Escalas do Mês</p>
                  <div className="text-2xl font-bold">{escalasMes}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Box: Membros ativos */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/membros')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Membros ativos</p>
                  {ministerioLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">{membrosMinisterio.length}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {ministerioAtual && ministerioAtual.adminId === usuario?.id 
                      ? <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs"
                          onClick={() => navigate('/membros')}
                        >
                          Gerenciar membros
                        </Button>
                      : "Membros do ministério"}
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Box: Aniversariante do Dia */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Aniversariante do Dia</p>
                  <AniversariantesComponent />
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Cake className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Renderiza uma mensagem orientando o usuário a ingressar em um ministério
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bem-vindo(a) ao PraiseApp!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-16 w-16 text-primary mb-6" />
              <h2 className="text-xl font-medium mb-3">Você não está em nenhum ministério ainda</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Para visualizar o dashboard e acessar todas as funcionalidades, 
                você precisa ingressar em um ministério existente.
              </p>
              <Button 
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2"
              >
                <DoorOpen className="h-4 w-4" />
                Ingressar em um Ministério
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards Principais - Todos na mesma fileira */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Próximas Escalas */}
        <Card className="md:col-span-1 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">Próximas Escalas</CardTitle>
              <CardDescription>Escalas agendadas</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => navegarParaEscalas("proximas-escalas")}
            >
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">Ver todas</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 overflow-auto max-h-[350px]">
            {proximasEscalas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">Não há escalas agendadas para os próximos dias.</p>
                {usuario && ministerioAtual && ministerioAtual.adminId === usuario?.id && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm mt-2"
                    onClick={() => navigate('/escalas', { state: { tab: 'proximas-escalas' } })}
                  >
                    Criar uma escala
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {proximasEscalas.map((escala) => (
                  <div 
                    key={escala.id} 
                    className="p-3 border rounded-lg hover:bg-accent/20 transition-colors cursor-pointer"
                    onClick={() => navegarParaEscalas("proximas-escalas")}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{escala.titulo}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatarData(escala.data)}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{escala.horario}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {escala.participantes.slice(0, 4).map((participante: any) => (
                        <Avatar key={participante.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={participante.foto} />
                          <AvatarFallback className={participante.isMinistro ? "bg-primary/30" : ""}>
                            {obterIniciais(participante.nome)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      
                      {escala.participantes.length > 4 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          +{escala.participantes.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full text-xs"
                  onClick={() => navegarParaEscalas("proximas-escalas")}
                >
                  Ver todas as escalas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendário (sem a aba de Notificações) */}
        <Card className="md:col-span-1 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg font-medium">Calendário</CardTitle>
            <CardDescription>Visão mensal</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <CalendarioSimplificado onDiaClick={handleDiaClick} />
          </CardContent>
        </Card>

        {/* Notas */}
        <Card className="md:col-span-1 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">Notas</CardTitle>
              <CardDescription>Lembretes e recados</CardDescription>
            </div>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 overflow-auto max-h-[350px]">
            <NotasComponent />
          </CardContent>
        </Card>
      </div>

      {/* Modal para Notas */}
      <Dialog open={!!notaSelecionada} onOpenChange={() => setNotaSelecionada(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{notaSelecionada?.titulo}</DialogTitle>
          </DialogHeader>
          {notaSelecionada && (
            <div className="space-y-2">
              {notaSelecionada.prioridade && (
                <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                  notaSelecionada.prioridade === 'alta' ? 'bg-red-100 text-red-500' :
                  notaSelecionada.prioridade === 'media' ? 'bg-yellow-100 text-yellow-500' :
                  'bg-green-100 text-green-500'
                }`}>
                  Prioridade: {notaSelecionada.prioridade.charAt(0).toUpperCase() + notaSelecionada.prioridade.slice(1)}
                </div>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notaSelecionada.conteudo}</p>
              <span className="text-xs text-muted-foreground block">{notaSelecionada.data}</span>
              <div className="pt-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    setNotaSelecionada(null);
                    navigate('/notas');
                  }}
                >
                  Ir para Notas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
