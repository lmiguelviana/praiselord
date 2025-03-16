import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  SkipBack, 
  SkipForward, 
  User, 
  PlusCircle, 
  Lock, 
  CalendarDays, 
  X, 
  Search, 
  Music, 
  Info, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMinisterio } from "@/hooks/useMinisterio";
import { useUsuario } from "@/hooks/useUsuario";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useLocation } from "react-router-dom";
import escalaService, { Escala as EscalaType, Participante as ParticipanteType, MusicaEscala } from "@/services/EscalaService";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Check } from 'lucide-react';
import { Usuario } from '@/types/usuario';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import musicaService from "@/services/MusicaService";

interface Escala extends EscalaType {}
interface Participante extends ParticipanteType {}

const Escalas = () => {
  const { ministerioAtual } = useMinisterio();
  const { usuario, obterUsuariosMinisterio } = useUsuario();
  const location = useLocation();
  
  // Verificar se há um tab inicial definido via state da navegação
  const initialTab = location.state?.tab || "minhas-escalas";
  
  // Verificar se o usuário é administrador do ministério
  const isAdmin = ministerioAtual && usuario && ministerioAtual.adminId === usuario.id;
  
  // Estado para controlar a abertura/fechamento do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [escalaAtual, setEscalaAtual] = useState<Escala | null>(null);
  
  // Estados para os campos do formulário
  const [nomeEvento, setNomeEvento] = useState("");
  const [dataEvento, setDataEvento] = useState<Date | undefined>(undefined);
  const [dataAberta, setDataAberta] = useState(false);
  const [horaEvento, setHoraEvento] = useState<string>("");
  
  // Estado para a busca de participantes no formulário de criação/edição
  const [searchParticipante, setSearchParticipante] = useState('');
  const [membrosMinisterio, setMembrosMinisterio] = useState<Participante[]>([]);
  
  // Estados para a busca de músicas no formulário de criação/edição
  const [searchMusica, setSearchMusica] = useState('');
  const [musicasMinisterio, setMusicasMinisterio] = useState<MusicaEscala[]>([]);
  const [musicasSelecionadas, setMusicasSelecionadas] = useState<MusicaEscala[]>([]);
  
  // Estados para a busca de participantes
  const [abrirCombobox, setAbrirCombobox] = useState(false);
  const [valorBusca, setValorBusca] = useState("");
  const [participantesSelecionados, setParticipantesSelecionados] = useState<Participante[]>([]);
  
  // Lista de participantes do ministério - inicializada vazia
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Participante[]>([]);
  
  // Escalas - carregadas do serviço
  const [todasEscalas, setTodasEscalas] = useState<Escala[]>([]);

  // Simulação de estado quando não há participantes
  const [temParticipantes, setTemParticipantes] = useState(false);
  
  // Filtrar escalas do mês atual para contabilização na dashboard
  const mesAtual = new Date();
  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  
  const escalasMesAtual = todasEscalas.filter(escala => 
    usuario && 
    escala.participantes.some(p => p.id === usuario.id) &&
    isWithinInterval(parseISO(escala.data), { start: inicioMes, end: fimMes })
  );
  
  // Efeito para exportar a contagem para a dashboard, se necessário
  useEffect(() => {
    // Aqui poderia salvar a contagem no localStorage ou em um contexto global
    // para ser acessado pela dashboard sem precisar recalcular
    if (usuario) {
      console.log(`Usuário tem ${escalasMesAtual.length} escalas no mês atual`);
    }
  }, [escalasMesAtual.length, usuario]);
  
  // Filtrar as escalas por categoria
  const minhasEscalas = todasEscalas.filter(escala => 
    usuario && escala.participantes.some(p => p.id === usuario.id)
  );
  
  const escalasAnteriores = todasEscalas.filter(escala => 
    isBefore(parseISO(escala.data), new Date())
  );
  
  const proximasEscalas = todasEscalas.filter(escala => 
    isAfter(parseISO(escala.data), new Date())
  );
  
  // Filtrar participantes disponíveis que ainda não foram selecionados
  const participantesFiltrados = participantesDisponiveis
    .filter(p => !participantesSelecionados.some(s => s.id === p.id))
    .filter(p => 
      p.nome.toLowerCase().includes(valorBusca.toLowerCase()) || 
      p.funcao.toLowerCase().includes(valorBusca.toLowerCase())
    );

  // Função para abrir o modal
  const abrirModal = async () => {
    setModalAberto(true);
    
    // Recarregar os participantes quando o modal é aberto
    if (ministerioAtual) {
      console.log("[Escalas] Carregando participantes para o ministério:", ministerioAtual.id);
      
      // Buscar membros do ministério usando o hook de usuários
      const membros = obterUsuariosMinisterio();
      if (membros && membros.length > 0) {
        console.log("[Escalas] Encontrou membros via hook useUsuario:", membros.length);
        
        // Converter para o formato de Participante
        const participantes = membros.map(membro => ({
          id: membro.id,
          nome: membro.nome || membro.email?.split('@')[0] || 'Sem nome',
          foto: membro.foto || '',
          funcao: membro.funcao || 'Participante',
          isMinistro: membro.id === ministerioAtual.adminId
        }));
        
        setParticipantesDisponiveis(participantes);
        setMembrosMinisterio(participantes);
        setTemParticipantes(participantes.length > 0);
      } else {
        // Se não encontrou participantes, buscar via método alternativo
        buscarMembrosDoMinisterio();
      }
      
      // Carregar músicas do ministério
      await carregarMusicasDoMinisterio();
    }
  };

  // Função para carregar músicas do ministério
  const carregarMusicasDoMinisterio = async () => {
    if (ministerioAtual) {
      console.log("[Escalas] Carregando músicas para o ministério:", ministerioAtual.id);
      
      try {
        // Obter todas as músicas do repositório
        const musicas = await musicaService.getTodasMusicas();
        console.log("[Escalas] Músicas encontradas:", musicas.length);
        
        // Converter para o formato MusicaEscala
        const musicasFormatadas = musicas.map(musica => ({
          id: musica.id,
          titulo: musica.titulo,
          artista: musica.artista,
          tom: musica.tom || '',
          deezerId: musica.deezerId,
          deezerCover: musica.deezerCover
        }));
        
        setMusicasMinisterio(musicasFormatadas);
      } catch (error) {
        console.error("[Escalas] Erro ao carregar músicas:", error);
        setMusicasMinisterio([]);
      }
    }
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
    // Resetar os campos do formulário
    setNomeEvento("");
    setDataEvento(undefined);
    setHoraEvento("");
    setParticipantesSelecionados([]);
    setMusicasSelecionadas([]);
    setAbrirCombobox(false);
    setValorBusca("");
    setSearchMusica("");
    setEscalaAtual(null);
  };
  
  // Função para abrir o modal de detalhes
  const abrirDetalhes = (escala: Escala) => {
    setEscalaAtual(escala);
    setModalDetalhesAberto(true);
  };
  
  // Função para fechar o modal de detalhes
  const fecharDetalhes = () => {
    setModalDetalhesAberto(false);
    setEscalaAtual(null);
  };
  
  // Função para adicionar um participante
  const adicionarParticipante = (participante: Participante) => {
    setParticipantesSelecionados(prev => {
      // Ordena para que ministros apareçam primeiro
      const novoArray = [...prev, participante].sort((a, b) => {
        if (a.isMinistro && !b.isMinistro) return -1;
        if (!a.isMinistro && b.isMinistro) return 1;
        return 0;
      });
      return novoArray;
    });
    setValorBusca("");
    setAbrirCombobox(false);
  };
  
  // Função para remover um participante
  const removerParticipante = (id: string) => {
    setParticipantesSelecionados(prev => prev.filter(p => p.id !== id));
  };
  
  // Função para adicionar uma música
  const adicionarMusica = (musica: MusicaEscala) => {
    if (!musicasSelecionadas.some(m => m.id === musica.id)) {
      setMusicasSelecionadas(prev => [...prev, musica]);
    }
    setSearchMusica("");
  };
  
  // Função para remover uma música
  const removerMusica = (id: number) => {
    setMusicasSelecionadas(musicasSelecionadas.filter(musica => musica.id !== id));
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
  
  // Função para lidar com o clique no botão do combobox
  const handleComboboxClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir o comportamento padrão
    setAbrirCombobox(!abrirCombobox);
  };
  
  // Função para formatar a data
  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return dataString;
    }
  };
  
  // Função para editar uma escala (apenas para admin)
  const editarEscala = async (escala: Escala) => {
    setEscalaAtual(escala);
    setNomeEvento(escala.titulo);
    setDataEvento(parseISO(escala.data));
    setHoraEvento(escala.horario);
    setParticipantesSelecionados(escala.participantes);
    setMusicasSelecionadas(escala.musicas || []);
    
    // Fechar modal de detalhes se estiver aberto
    setModalDetalhesAberto(false);
    
    // Abrir modal de criação/edição
    await abrirModal();
  };
  
  // Função para excluir uma escala (apenas para admin)
  const excluirEscala = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta escala?')) {
      // Usar o serviço para excluir
      const sucesso = escalaService.excluirEscala(id);
      
      if (sucesso) {
        // Atualizar o estado local após excluir
        setTodasEscalas(prev => prev.filter(e => e.id !== id));
        
        // Fechar modal de detalhes se estiver aberto
        if (modalDetalhesAberto && escalaAtual?.id === id) {
          setModalDetalhesAberto(false);
          setEscalaAtual(null);
        }
      }
    }
  };
  
  // Função para salvar a escala
  const salvarEscala = () => {
    if (!dataEvento || !horaEvento || !nomeEvento || participantesSelecionados.length === 0) {
      toast.error('Por favor, preencha todos os campos e selecione pelo menos um participante.');
      return;
    }

    // Criar objeto da nova escala
      const novaEscala: Escala = {
      id: escalaAtual ? escalaAtual.id : uuidv4(),
      titulo: nomeEvento,
      data: dataEvento.toISOString(),
      horario: horaEvento,
      participantes: participantesSelecionados,
      musicas: musicasSelecionadas.length > 0 ? musicasSelecionadas : undefined,
      ministerioId: ministerioAtual?.id || '',
      criadoPor: usuario?.id || '',
      dataHoraCriacao: new Date().toISOString()
    };
    
    // Usar o serviço para salvar
    const escalaSalva = escalaService.salvarEscala(novaEscala);
    
    // Atualizar o estado local
    if (escalaAtual) {
      setTodasEscalas(prev => 
        prev.map(e => e.id === escalaAtual.id ? escalaSalva : e)
      );
    } else {
      setTodasEscalas(prev => [...prev, escalaSalva]);
    }
    
    console.log("Escala salva com sucesso:", escalaSalva);
    fecharModal();
  };

  // Função para forçar o carregamento de participantes - agora busca membros reais
  const forcarParticipantesExemplo = () => {
    if (ministerioAtual) {
      console.log("[Escalas] Tentando buscar membros do ministério:", ministerioAtual.id);
      
      // Primeiro, tentar obter usuários via hook
      const membros = obterUsuariosMinisterio();
      if (membros && membros.length > 0) {
        console.log("[Escalas] Encontrou membros via hook useUsuario:", membros.length);
        
        // Converter para o formato de Participante
        const participantes = membros.map(membro => ({
          id: membro.id,
          nome: membro.nome || membro.email?.split('@')[0] || 'Sem nome',
          foto: membro.foto || '',
          funcao: membro.funcao || 'Participante',
          isMinistro: membro.id === ministerioAtual.adminId
        }));
        
        setParticipantesDisponiveis(participantes);
        setMembrosMinisterio(participantes);
        setTemParticipantes(participantes.length > 0);
        
        // Salvar para uso futuro
        localStorage.setItem(`ministerio_${ministerioAtual.id}_membros`, JSON.stringify(participantes));
        return;
      }
      
      // Se não encontrou nenhum, tenta no service
      const participantes = escalaService.getParticipantes(ministerioAtual.id);
      if (participantes && participantes.length > 0) {
        console.log("[Escalas] Encontrou participantes via serviço:", participantes.length);
        setParticipantesDisponiveis(participantes);
        setMembrosMinisterio(participantes);
        setTemParticipantes(participantes.length > 0);
        return;
      }
      
      // Como último recurso, mostra apenas o admin
      if (usuario) {
        console.log("[Escalas] Criando participante para o administrador:", usuario.id);
        const admin = {
          id: usuario.id,
          nome: usuario.nome || 'Administrador',
          foto: usuario.foto || '',
          funcao: 'Administrador / Ministro',
          isMinistro: true
        };
        
        setParticipantesDisponiveis([admin]);
        setMembrosMinisterio([admin]);
        setTemParticipantes(true);
        
        toast.info("Apenas o administrador foi encontrado. Convide mais membros para o seu ministério nas configurações.", {
          duration: 5000
        });
      }
    }
  };

  // Função para buscar membros do ministério
  const buscarMembrosDoMinisterio = () => {
    if (ministerioAtual) {
      console.log("[Escalas] Buscando membros do ministério:", ministerioAtual.id);
      
      // Primeiro, tentar obter usuários via hook (fonte principal e oficial)
      const membros = obterUsuariosMinisterio();
      if (membros && membros.length > 0) {
        console.log("[Escalas] Encontrou membros via hook useUsuario:", membros.length);
        
        // Converter para o formato de Participante
        const participantes = membros.map(membro => ({
          id: membro.id,
          nome: membro.nome || membro.email?.split('@')[0] || 'Sem nome',
          foto: membro.foto || '',
          funcao: membro.funcao || 'Participante',
          isMinistro: membro.id === ministerioAtual.adminId
        }));
        
        setParticipantesDisponiveis(participantes);
        setMembrosMinisterio(participantes);
        setTemParticipantes(participantes.length > 0);
        
        // Salvar para uso futuro
        localStorage.setItem(`ministerio_${ministerioAtual.id}_membros`, JSON.stringify(participantes));
        return;
      }
      
      // Verificar no localStorage se tem membros salvos para este ministério (segunda opção)
      try {
        const membrosKey = `ministerio_${ministerioAtual.id}_membros`;
        const membrosString = localStorage.getItem(membrosKey);
        
        if (membrosString) {
          const membros = JSON.parse(membrosString);
          if (membros && membros.length > 0) {
            console.log("[Escalas] Encontrou membros no localStorage:", membros.length);
            setParticipantesDisponiveis(membros);
            setMembrosMinisterio(membros);
            setTemParticipantes(true);
            return;
          }
        }
        
        // Se não encontrou no localStorage, tenta buscar usando o serviço (terceira opção)
        const participantes = escalaService.getParticipantes(ministerioAtual.id);
        
        if (participantes && participantes.length > 0) {
          console.log("[Escalas] Encontrou participantes via serviço:", participantes.length);
          setParticipantesDisponiveis(participantes);
          setMembrosMinisterio(participantes);
          setTemParticipantes(true);
          
          // Salvar para uso futuro
          localStorage.setItem(membrosKey, JSON.stringify(participantes));
          return;
        }
        
        // Se não achou via serviço, tenta apenas com o administrador
        if (usuario) {
          console.log("[Escalas] Criando participante para o administrador:", usuario.id);
          const admin = {
            id: usuario.id,
            nome: usuario.nome || 'Administrador',
            foto: usuario.foto || '',
            funcao: 'Administrador / Ministro',
            isMinistro: true
          };
          
          setParticipantesDisponiveis([admin]);
          setMembrosMinisterio([admin]);
          setTemParticipantes(true);
          
          toast.info("Apenas o administrador foi encontrado. Convide mais membros para o seu ministério na página de membros.", {
            duration: 5000
          });
        }
      } catch (e) {
        console.error("[Escalas] Erro ao buscar membros do ministério:", e);
        
        // Em caso de erro, tenta mostrar pelo menos o administrador
        if (usuario) {
          const admin = {
            id: usuario.id,
            nome: usuario.nome || 'Administrador',
            foto: usuario.foto || '',
            funcao: 'Administrador / Ministro',
            isMinistro: true
          };
          
          setParticipantesDisponiveis([admin]);
          setMembrosMinisterio([admin]);
          setTemParticipantes(true);
        }
      }
    }
  };

  // Carregar dados quando o componente montar
  useEffect(() => {
    // Carregar escalas do serviço
    if (ministerioAtual) {
      console.log("[Escalas] Carregando dados para o ministério:", ministerioAtual.id, ministerioAtual.nome);
      
      const escalas = escalaService.getEscalasPorMinisterio(ministerioAtual.id);
      setTodasEscalas(escalas);
      
      // Sempre carregar participantes a partir do hook useUsuario primeiro (fonte oficial)
      const membros = obterUsuariosMinisterio();
      if (membros && membros.length > 0) {
        console.log("[Escalas] Encontrou membros via hook useUsuario:", membros.length);
        
        // Converter para o formato de Participante
        const participantes = membros.map(membro => ({
          id: membro.id,
          nome: membro.nome || membro.email?.split('@')[0] || 'Sem nome',
          foto: membro.foto || '',
          funcao: membro.funcao || 'Participante',
          isMinistro: membro.id === ministerioAtual.adminId
        }));
        
        setParticipantesDisponiveis(participantes);
        setMembrosMinisterio(participantes);
        setTemParticipantes(participantes.length > 0);
        
        // Salvar para uso futuro
        localStorage.setItem(`ministerio_${ministerioAtual.id}_membros`, JSON.stringify(participantes));
      } else {
        // Se não encontrou participantes via hook, busca pelo método anterior
        buscarMembrosDoMinisterio();
      }
    } else {
      console.log("[Escalas] Nenhum ministério atual definido");
      setTodasEscalas([]);
      setParticipantesDisponiveis([]);
      setTemParticipantes(false);
    }
  }, [ministerioAtual]);

  // Filtrar membros do ministério com base na pesquisa
  const membrosMinisterioFiltrados = useMemo(() => {
    if (!searchParticipante.trim()) return [];
    
    const termoBusca = searchParticipante.toLowerCase();
    return membrosMinisterio.filter(membro => 
      membro.nome.toLowerCase().includes(termoBusca) || 
      (membro.funcao && membro.funcao.toLowerCase().includes(termoBusca))
    );
  }, [searchParticipante, membrosMinisterio]);

  // Filtrar músicas por texto de busca
  const musicasMinisterioFiltradas = useMemo(() => {
    const termoBusca = searchMusica.toLowerCase();
    return musicasMinisterio
      .filter(musica => 
        !musicasSelecionadas.some(m => m.id === musica.id) &&
        (musica.titulo.toLowerCase().includes(termoBusca) || 
         musica.artista.toLowerCase().includes(termoBusca) ||
         (musica.tom && musica.tom.toLowerCase().includes(termoBusca)))
      )
      .slice(0, 10); // Limitar a 10 resultados para melhor performance
  }, [searchMusica, musicasMinisterio, musicasSelecionadas]);

  // Componente para renderizar um card de escala
  const EscalaCard = ({ escala }: { escala: Escala }) => {
    // Função para compartilhar a escala no WhatsApp
    const compartilharNoWhatsApp = (e: React.MouseEvent) => {
      e.stopPropagation(); // Impedir que abra o modal de detalhes
      
      // Função interna para formatar texto para URL
      const formatarParaURL = (texto: string): string => {
        if (!texto) return '';
        
        // Converter para minúsculas
        let formatado = texto.toLowerCase();
        
        // Remover acentos
        formatado = formatado.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Substituir espaços por hífens e remover caracteres especiais
        formatado = formatado.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        
        // Remover hífens duplicados
        formatado = formatado.replace(/-+/g, '-');
        
        // Remover hífens no início e no fim
        formatado = formatado.replace(/^-+|-+$/g, '');
        
        return formatado;
      };
      
      // Construir a mensagem com todos os detalhes da escala
      let mensagem = `*PraiseApp - Escala de Louvor*\n\n`;
      mensagem += `*${escala.titulo}*\n`;
      mensagem += `📅 Data: ${formatarData(escala.data)}\n`;
      mensagem += `⏰ Horário: ${escala.horario}\n\n`;
      
      // Adicionar participantes
      mensagem += `*Participantes:*\n`;
      escala.participantes.forEach(participante => {
        mensagem += `- ${participante.nome} (${participante.funcao})`;
        if (participante.isMinistro) mensagem += ` 👑`;
        mensagem += `\n`;
      });
      
      // Adicionar músicas e links, se houver
      if (escala.musicas && escala.musicas.length > 0) {
        mensagem += `\n*Repertório:*\n`;
        escala.musicas.forEach(musica => {
          const artistaFormatado = formatarParaURL(musica.artista);
          const tituloFormatado = formatarParaURL(musica.titulo);
          const cifraUrl = `https://www.cifraclub.com.br/${artistaFormatado}/${tituloFormatado}/`;
          mensagem += `- ${musica.titulo} - ${musica.artista}`;
          if (musica.tom) mensagem += ` (Tom: ${musica.tom})`;
          mensagem += `\n  Cifra: ${cifraUrl}\n`;
        });
      }
      
      // Adicionar mensagem de rodapé
      mensagem += `\nGerado via PraiseApp`;
      
      // Codificar a mensagem para URL
      const mensagemCodificada = encodeURIComponent(mensagem);
      
      // Abrir link do WhatsApp
      window.open(`https://wa.me/?text=${mensagemCodificada}`, '_blank');
    };
    
    return (
      <Card 
        className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => abrirDetalhes(escala)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-lg">{escala.titulo}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>{formatarData(escala.data)}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{escala.horario}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      editarEscala(escala);
                    }}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirEscala(escala.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 text-green-600"
                title="Compartilhar no WhatsApp"
                onClick={compartilharNoWhatsApp}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {escala.participantes.slice(0, 4).map((participante) => (
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
          
          {/* Mostrar músicas da escala */}
          {escala.musicas && escala.musicas.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                <Music className="h-3 w-3" />
                <span>Repertório</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {escala.musicas.map((musica) => (
                  <Badge key={musica.id} variant="outline" className="text-xs bg-secondary/10">
                    {musica.titulo} {musica.tom && `(${musica.tom})`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Escalas do Ministério</h1>
          
          {isAdmin ? (
            <Button onClick={abrirModal}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Escala
            </Button>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Apenas o administrador do ministério pode criar escalas</span>
            </div>
          )}
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="escalas-anteriores" className="flex items-center gap-2">
              <SkipBack className="h-4 w-4" />
              <span className="hidden sm:inline">Escalas Anteriores</span>
              <span className="sm:hidden">Anteriores</span>
            </TabsTrigger>
            <TabsTrigger value="minhas-escalas" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Minhas Escalas</span>
              <span className="sm:hidden">Minhas</span>
            </TabsTrigger>
            <TabsTrigger value="proximas-escalas" className="flex items-center gap-2">
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">Próximas Escalas</span>
              <span className="sm:hidden">Próximas</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da aba Escalas Anteriores */}
          <TabsContent value="escalas-anteriores">
            <div className="mb-2">
              <h2 className="text-lg font-medium mb-4">Escalas Passadas</h2>
              
              {escalasAnteriores.length === 0 ? (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Nenhuma escala anterior</p>
                      <p className="text-muted-foreground">
                        As escalas passadas serão exibidas aqui quando houver.
                      </p>
            </div>
                  </CardContent>
                </Card>
              ) : (
                escalasAnteriores.map(escala => (
                  <EscalaCard key={escala.id} escala={escala} />
                ))
              )}
            </div>
          </TabsContent>

          {/* Conteúdo da aba Minhas Escalas */}
          <TabsContent value="minhas-escalas">
            <div className="mb-2">
              <h2 className="text-lg font-medium mb-4">Minhas Escalas</h2>
              
              {minhasEscalas.length === 0 ? (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Você não tem escalas atribuídas</p>
                      <p className="text-muted-foreground">
                        Quando você for adicionado a uma escala, ela aparecerá aqui.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                minhasEscalas.map(escala => (
                  <EscalaCard key={escala.id} escala={escala} />
                ))
              )}
            </div>
          </TabsContent>

          {/* Conteúdo da aba Próximas Escalas */}
          <TabsContent value="proximas-escalas">
            <div className="mb-2">
              <h2 className="text-lg font-medium mb-4">Próximas Escalas</h2>
              
              {proximasEscalas.length === 0 ? (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Nenhuma escala futura</p>
                      <p className="text-muted-foreground">
                        As próximas escalas programadas serão exibidas aqui quando forem criadas.
                      </p>
          </div>
                  </CardContent>
                </Card>
              ) : (
                proximasEscalas.map(escala => (
                  <EscalaCard key={escala.id} escala={escala} />
                ))
              )}
        </div>
          </TabsContent>
        </Tabs>

        {/* Modal para visualizar detalhes da escala */}
        <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            {escalaAtual && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{escalaAtual.titulo}</DialogTitle>
                  <DialogDescription className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{formatarData(escalaAtual.data)}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{escalaAtual.horario}</span>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Participantes ({escalaAtual.participantes.length})
                  </h3>
                  
                  <div className="space-y-2 mt-2">
                    {escalaAtual.participantes.map((participante) => (
                      <div 
                        key={participante.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border 
                          ${participante.isMinistro ? "bg-primary/10 border-primary/20" : "bg-muted/50"}
                        `}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participante.foto} />
                          <AvatarFallback>{obterIniciais(participante.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {participante.nome}
                            {participante.isMinistro && (
                              <span className="text-xs text-primary ml-2">(Ministro)</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{participante.funcao}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Seção de músicas com links */}
                  {escalaAtual.musicas && escalaAtual.musicas.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        Repertório ({escalaAtual.musicas.length})
                      </h3>
                      
                      <div className="space-y-3 mt-2">
                        {escalaAtual.musicas.map((musica) => {
                          // Formatação para gerar URLs das cifras e YouTube
                          const artistaFormatado = musica.artista.toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                            .replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                            
                          const tituloFormatado = musica.titulo.toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                            .replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                            
                          // IMPORTANTE: Ordem correta é artista/título (não título/artista)
                          // URLs CORRIGIDAS - formato artista/música
                          const cifraUrl = `https://www.cifraclub.com.br/${artistaFormatado}/${tituloFormatado}/`;
                          const letrasUrl = `https://www.letras.mus.br/${artistaFormatado}/${tituloFormatado}/`;
                          const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${musica.titulo} ${musica.artista}`)}`;
                          
                          return (
                            <div key={musica.id} className="p-3 border rounded-lg bg-muted/30">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium">{musica.titulo}</div>
                                  <div className="text-sm text-muted-foreground">{musica.artista}</div>
                                </div>
                                {musica.tom && (
                                  <Badge className="bg-secondary/20">{musica.tom}</Badge>
                                )}
                              </div>
                              
                              <div className="flex gap-2 mt-3">
                                <a 
                                  href={youtubeSearchUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                  YouTube
                                </a>
                                <a 
                                  href={cifraUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 transition-colors"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                  </svg>
                                  Cifra
                                </a>
                                <a 
                                  href={letrasUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                  Letra
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Observações (se houver) */}
                  {escalaAtual.observacoes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Observações
                      </h3>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm">
                        {escalaAtual.observacoes}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={fecharDetalhes}>
                    Fechar
                  </Button>
                  {isAdmin && (
                    <Button onClick={() => editarEscala(escalaAtual)}>
                      Editar Escala
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Modal para criar/editar escala */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {escalaAtual ? 'Editar Escala' : 'Criar Nova Escala'}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes para {escalaAtual ? 'atualizar a' : 'criar uma nova'} escala de ministério.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Nome do Evento */}
              <div className="grid gap-2">
                <Label htmlFor="nome-evento" className="font-medium">
                  Nome do Evento
                </Label>
                  <Input
                  id="nome-evento"
                    placeholder="Ex: Culto de Domingo"
                  value={nomeEvento}
                  onChange={(e) => setNomeEvento(e.target.value)}
                  className="w-full"
                  />
                </div>
              
              {/* Data e Hora do Evento - lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data do Evento */}
                <div className="grid gap-2">
                  <Label className="font-medium">Data</Label>
                  <Popover open={dataAberta} onOpenChange={setDataAberta}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataEvento && "text-muted-foreground"
                        )}
                        type="button"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {dataEvento ? (
                          format(dataEvento, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataEvento}
                        onSelect={(date) => {
                          setDataEvento(date);
                          setDataAberta(false);
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Hora do Evento */}
                <div className="grid gap-2">
                  <Label className="font-medium">Horário</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                      value={horaEvento}
                      onChange={(e) => setHoraEvento(e.target.value)}
                      className="w-full"
                  />
                  </div>
                </div>
              </div>

              {/* Seção de músicas com links */}
              <div className="grid gap-2">
                <Label className="font-medium flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Músicas do Repertório
                </Label>
                
                {/* Barra de pesquisa de músicas */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="musicas-search"
                    placeholder="Pesquisar músicas..."
                    className="pl-8"
                    value={searchMusica}
                    onChange={(e) => setSearchMusica(e.target.value)}
                    onClick={(e) => e.preventDefault()}
                    type="text"
                  />
                  
                  {searchMusica.length > 0 && (
                    <div className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1 py-1 max-h-56 overflow-y-auto">
                      {musicasMinisterioFiltradas.length > 0 ? (
                        musicasMinisterioFiltradas.map((musica) => (
                          <div
                            key={musica.id}
                            className="flex items-center px-3 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              if (!musicasSelecionadas.some(m => m.id === musica.id)) {
                                setMusicasSelecionadas([...musicasSelecionadas, musica]);
                              }
                              setSearchMusica('');
                            }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{musica.titulo}</p>
                              <p className="text-xs text-muted-foreground">{musica.artista}</p>
                              {musica.tom && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                  Tom: {musica.tom}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Nenhuma música encontrada
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Lista de músicas selecionadas */}
                {musicasSelecionadas.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm font-medium text-foreground">Músicas selecionadas:</div>
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                      {musicasSelecionadas.map((musica) => (
                        <div
                          key={musica.id}
                          className="flex items-center bg-accent rounded-md pr-2 pl-1 py-1 gap-2 group"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{musica.titulo}</span>
                            <span className="text-xs text-muted-foreground">{musica.artista}</span>
                            {musica.tom && (
                              <span className="text-xs text-muted-foreground">Tom: {musica.tom}</span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                            onClick={() => removerMusica(musica.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Observações - opcional */}
              <div className="grid gap-2">
                <Label htmlFor="observacoes" className="font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Observações (opcional)
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Instruções especiais ou detalhes adicionais..."
                  className="min-h-[80px]"
                  value={escalaAtual?.observacoes || ""}
                  onChange={(e) => 
                    setEscalaAtual(prev => 
                      prev ? {...prev, observacoes: e.target.value} : null
                    )
                  }
                />
              </div>
            </div>

            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button
                type="button" 
                onClick={salvarEscala}
                disabled={!membrosMinisterio || membrosMinisterio.length === 0 || !nomeEvento || !dataEvento || !horaEvento || participantesSelecionados.length === 0}
              >
                {escalaAtual ? 'Atualizar' : 'Criar'} Escala
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Escalas;
