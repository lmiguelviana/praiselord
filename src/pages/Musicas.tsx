/**
 * Página de Músicas - Gerenciamento do repertório musical
 * 
 * Controle de Permissões:
 * - Administradores: Podem visualizar, adicionar, editar e excluir músicas
 * - Usuários comuns: Podem apenas visualizar músicas e informações
 * 
 * Para testar as diferentes permissões, use o botão "Alternar para administrador/usuário normal" 
 * no topo da página. Este componente de alternância é apenas para demonstração e seria substituído
 * por um sistema real de autenticação em produção.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Music, Plus, Eye, Edit, Trash2, Heart, AlignLeft, Clock, Tag, 
  Info, ExternalLink, Youtube, Loader2, Guitar, Globe, ChevronDown, Headphones, PlayCircle, Building2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import musicaService, { Musica, ResultadoPesquisa } from '@/services/MusicaService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeezerPlayer from '@/components/DeezerPlayer';
import { useAuth } from '@/hooks/use-auth';
import MusicaCard from '@/components/MusicaCard';
import { useMinisterio } from '@/contexts/MinisterioContext';

// Funções utilitárias para normalização e validação de músicas
const normalizeText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\(.*?\)/g, "") // Remove parênteses e conteúdo interno
    .replace(/\s-\s.*$/, "") // Remove hífens e sufixos
    .replace(/\[.*?\]/g, "") // Remove colchetes e conteúdo interno
    .replace(/\bfeat\b.*$/i, "") // Remove "feat" e o que vem depois
    .replace(/\blive\b/i, "") // Remove menções a "live"
    .replace(/\bao vivo\b/i, "") // Remove menções a "ao vivo"
    .replace(/\bacústico\b/i, "") // Remove menções a "acústico"
    .replace(/\bacoustic\b/i, "") // Remove menções a "acoustic"
    .replace(/\bcover\b/i, "") // Remove menções a "cover"
    .trim();
};

// Função para formatar texto para comparação
const formatForComparison = (text: string) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, ""); // Remove caracteres especiais
};

// Validar correspondência entre entrada do usuário e resultado do Deezer
const validateMatch = (artistInput: string, songInput: string, deezerArtist: string, deezerSong: string) => {
  const inputArtistNorm = formatForComparison(artistInput);
  const inputSongNorm = formatForComparison(songInput);
  const deezerArtistNorm = formatForComparison(deezerArtist);
  const deezerSongNorm = formatForComparison(deezerSong);

  // Verificar se o artista corresponde
  const artistMatch = deezerArtistNorm.includes(inputArtistNorm) || 
                      inputArtistNorm.includes(deezerArtistNorm);
  
  // Verificar se a música corresponde
  const songMatch = deezerSongNorm.includes(inputSongNorm) || 
                    inputSongNorm.includes(deezerSongNorm);
  
  // Ambos precisam corresponder para ser uma correspondência válida
  return artistMatch && songMatch;
};

// Define o componente X que está faltando
const X = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// Criar hook personalizado para verificar se é administrador
function useIsAdmin() {
  // Verificar se o usuário é administrador do ministério atual
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  useEffect(() => {
    const checkIfIsAdmin = () => {
      try {
        console.log("Verificando se o usuário é admin...");
        // Obter dados do usuário do localStorage
        const userData = localStorage.getItem('user');
        console.log("Dados do usuário:", userData);
        
        if (!userData) {
          console.log("Nenhum dado de usuário encontrado");
          setIsAdmin(false);
          return;
        }
        
        const usuario = JSON.parse(userData);
        console.log("Usuário parseado:", usuario);
        
        // Verificar se o usuário tem o ministério atual
        if (!usuario.ministerioId || !usuario.ministerios) {
          console.log("Usuário não tem ministério atual ou ministérios");
          setIsAdmin(false);
          return;
        }
        
        // Encontrar a relação do usuário com o ministério atual
        const relacao = usuario.ministerios.find((m: any) => 
          typeof m === 'object' ? 
            m.ministerioId === usuario.ministerioId : 
            m === usuario.ministerioId
        );
        
        console.log("Relação com ministério:", relacao);
        
        // Verificar se o usuário é administrador
        const admin = relacao && (typeof relacao === 'object' ? relacao.role === 'admin' : false);
        console.log("É admin?", admin);
        
        // Atualizar o estado com o valor real
        setIsAdmin(!!admin);
      } catch (error) {
        console.error('Erro ao verificar se usuário é admin:', error);
        setIsAdmin(false);
      }
    };
    
    checkIfIsAdmin();
    
    // Adicionar listener para mudanças no localStorage
    const handleStorageChange = () => {
      checkIfIsAdmin();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return isAdmin;
}

const Musicas = () => {
  // Hook para verificar permissões de administrador
  const isAdmin = useIsAdmin();
  
  const { user } = useAuth();
  
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [musicaSelecionada, setMusicaSelecionada] = useState<Musica | null>(null);
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [modalVisualizarLetra, setModalVisualizarLetra] = useState(false);
  const [modalPesquisaOnline, setModalPesquisaOnline] = useState(false);
  const [modalEditarMusica, setModalEditarMusica] = useState(false);
  const [pesquisaOnline, setPesquisaOnline] = useState('');
  const [resultadosPesquisa, setResultadosPesquisa] = useState<Array<ResultadoPesquisa>>([]);
  const [carregandoPesquisa, setCarregandoPesquisa] = useState(false);
  const [novaMusica, setNovaMusica] = useState<Omit<Musica, 'id' | 'dataCriacao' | 'buscaCompleta' | 'letraLink'>>({
    titulo: '',
    artista: '',
    tom: '',
    letra: '',
    andamento: '',
    tags: [],
    favoritada: false,
    ministerioId: user?.ministerioId || '1'
  });
  const [tagInput, setTagInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [musicaProcessandoId, setMusicaProcessandoId] = useState<string | number | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const { toast } = useToast();
  const [pesquisaTimeoutId, setPesquisaTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [musicasPotenciais, setMusicasPotenciais] = useState<Array<ResultadoPesquisa>>([]);
  const [modalSelecaoMusica, setModalSelecaoMusica] = useState(false);
  const [pesquisaAtual, setPesquisaAtual] = useState<{titulo: string, artista: string}>({titulo: '', artista: ''});

  // Hook para usar o ministério (dentro do componente Musicas)
  const { ministerios, ministerioAtual, getMinisterioAtual } = useMinisterio();

  // Obter detalhes do ministério atual
  const ministerioInfo = getMinisterioAtual();

  // Redefinir novaMusica quando o ministério atual mudar
  useEffect(() => {
    setNovaMusica(prev => ({
      ...prev,
      ministerioId: ministerioAtual || '1'
    }));
  }, [ministerioAtual]);

  // Carregar músicas do localStorage quando o componente é montado
  useEffect(() => {
    const carregarMusicas = async () => {
      const musicasSalvas = await musicaService.getTodasMusicas();
      setMusicas(musicasSalvas);
    };
    
    carregarMusicas();
  }, []);

  // Filtragem de músicas com base na pesquisa
  const musicasFiltradas = musicas.filter(
    (musica) =>
      musica.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
      musica.artista.toLowerCase().includes(pesquisa.toLowerCase()) ||
      musica.tom.toLowerCase().includes(pesquisa.toLowerCase()) ||
      musica.tags.some((tag) => tag.toLowerCase().includes(pesquisa.toLowerCase()))
  );

  // Implementar pesquisa com debounce para melhor performance
  const realizarPesquisaComDebounce = useCallback((termo: string) => {
    // Limpar timeout anterior se existir
    if (pesquisaTimeoutId) {
      clearTimeout(pesquisaTimeoutId);
    }

    // Definir novo timeout (300ms de delay)
    const timeoutId = setTimeout(() => {
      // Atualizar o estado de pesquisa
      setPesquisa(termo);
    }, 300);

    setPesquisaTimeoutId(timeoutId);
  }, [pesquisaTimeoutId]);

  // Destacar texto que corresponde à pesquisa
  const destacarTexto = (texto: string, termoPesquisa: string): JSX.Element => {
    if (!termoPesquisa.trim() || !texto) return <>{texto}</>;
    
    const regex = new RegExp(`(${termoPesquisa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const partes = texto.split(regex);
    
    return (
      <>
        {partes.map((parte, i) => 
          regex.test(parte) ? 
            <span key={i} className="bg-yellow-100 dark:bg-yellow-900 text-black dark:text-white px-0.5 rounded">
              {parte}
            </span> : 
            parte
        )}
      </>
    );
  };

  // Adicionar nova música
  const adicionarMusica = async () => {
    if (!novaMusica.titulo || !novaMusica.artista) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Título e artista são obrigatórios."
      });
      return;
    }

    setCarregando(true);
    
    try {
      // Verificar se a música já existe no banco de dados local
      const musicaExistente = await musicaService.buscarMusicaPorTituloEArtista(novaMusica.titulo, novaMusica.artista);
      
      if (musicaExistente) {
        toast({
          title: "Música já existe",
          description: `A música "${novaMusica.titulo}" de ${novaMusica.artista} já está no seu repertório.`
        });
        // Fechar modal e redefinir estado
        setModalAdicionar(false);
        setNovaMusica({
    titulo: '',
    artista: '',
    tom: '',
    letra: '',
          andamento: '',
          tags: [],
          favoritada: false,
          ministerioId: user?.ministerioId || '1'
        });
        setCarregando(false);
        return;
      }
      
      // Adicionar a música com dados completos (buscar letra, vídeo e cifra)
      toast({
        title: "Processando",
        description: "Buscando informações adicionais da música...",
      });
      
      const musicaCompleta = await musicaService.adicionarNovaMusica(novaMusica);
      
      // Atualizar a lista de músicas
      const musicasAtualizadas = await musicaService.getTodasMusicas();
      setMusicas(musicasAtualizadas);
      
      toast({
        title: "Música adicionada",
        description: `A música ${musicaCompleta.titulo} foi adicionada com sucesso.`
      });
      
      // Limpar formulário
      setNovaMusica({
      titulo: '',
      artista: '',
      tom: '',
      letra: '',
        andamento: '',
        tags: [],
        favoritada: false,
        ministerioId: user?.ministerioId || '1'
      });
      
      setModalAdicionar(false);
    } catch (error) {
      console.error("Erro ao adicionar música:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao adicionar a música. Tente novamente."
      });
    } finally {
      setCarregando(false);
    }
  };

  // Realizar pesquisa online com debounce (melhorada)
  const realizarPesquisaOnlineComDebounce = useCallback((termo: string) => {
    console.log("Realizando pesquisa online para:", termo);
    setPesquisaOnline(termo);
    
    // Limpar timeout anterior se existir
    if (pesquisaTimeoutId) {
      clearTimeout(pesquisaTimeoutId);
    }

    if (!termo.trim()) {
      setResultadosPesquisa([]);
      return;
    }

    // Definir novo timeout (500ms de delay)
    const timeoutId = setTimeout(async () => {
      setCarregandoPesquisa(true);
      try {
        // Usar o serviço para buscar músicas combinadas (banco local + online + google)
        // Note que agora a pesquisa usa o método melhorado que inclui busca intuitiva
        const resultados = await musicaService.pesquisarMusicasCombinadas(termo);
        
        console.log("Resultados da pesquisa online:", resultados.length);
        // Exibir os resultados sem filtragem adicional, já que o serviço
        // agora faz um trabalho melhor de ordenação e filtragem
        setResultadosPesquisa(resultados);
        
        // Removido: Não mostrar mais o modal de seleção automática
      } catch (error) {
        console.error("Erro ao pesquisar música online:", error);
        toast({
          variant: "destructive",
          title: "Erro na pesquisa",
          description: "Não foi possível realizar a pesquisa. Tente novamente."
        });
      } finally {
        setCarregandoPesquisa(false);
      }
    }, 500);

    setPesquisaTimeoutId(timeoutId);
  }, [pesquisaTimeoutId, toast]);

  // Selecionar música da pesquisa online
  const selecionarMusicaOnline = async (resultado: ResultadoPesquisa) => {
    // Se a música já estiver no banco local, apenas abre os detalhes
    if (resultado.origem === 'local' && resultado.id) {
      const todasMusicas = await musicaService.getTodasMusicas();
      const musica = todasMusicas.find(m => m.id === resultado.id);
      
      if (musica) {
        visualizarLetra(musica);
        setModalPesquisaOnline(false);
        return;
      }
    }

    // Se a chamada veio do botão "Adicionar" do modal de visualização, não devemos continuar
    // para evitar um loop infinito de adicionar → visualizar → adicionar
    if (resultado.origem === 'fromVisualizationModal') {
      toast({
        title: "Ação cancelada",
        description: `A música já está sendo visualizada.`
      });
      return;
    }

    // Identificador único para esta música
    const musicaId = resultado.id || `${resultado.titulo}_${resultado.artista}`;
    setMusicaProcessandoId(musicaId);
    
    try {
      // Verificar se a música já existe
      const musicaExistente = await musicaService.buscarMusicaPorTituloEArtista(
        normalizeText(resultado.titulo), 
        normalizeText(resultado.artista)
      );
      
      if (musicaExistente) {
        toast({
          title: "Música já existe",
          description: `A música "${resultado.titulo}" de ${resultado.artista} já está no seu repertório.`
        });
        
        // Visualizar a música existente
        visualizarLetra(musicaExistente);
        setModalPesquisaOnline(false);
        return;
      }
      
      // Adicionar a música com dados completos
      toast({
        title: "Processando",
        description: "Buscando informações completas da música...",
      });
      
      const musicaParaAdicionar = {
        titulo: normalizeText(resultado.titulo),
        artista: normalizeText(resultado.artista),
        tom: '',
        letra: '',
        andamento: '',
        tags: [],
        favoritada: false,
        // Adicionar dados do Deezer se disponíveis
        deezerId: resultado.deezerId,
        deezerCover: resultado.deezerCover,
        artistaImagem: resultado.artistaImagem,
        // Usar o ID do ministério atual
        ministerioId: ministerioAtual || '1'
      };
      
      const musicaCompleta = await musicaService.adicionarNovaMusica(musicaParaAdicionar);
      
      // Atualizar a lista de músicas
      const musicasAtualizadas = await musicaService.getTodasMusicas();
      setMusicas(musicasAtualizadas);
      
      toast({
        title: "Música adicionada",
        description: `A música ${musicaCompleta.titulo} foi adicionada com sucesso.`
      });
      
      // Fechar modal e limpar pesquisa
      setModalPesquisaOnline(false);
      setPesquisaOnline('');
      setResultadosPesquisa([]);
      
      // Visualizar a música recém-adicionada
      visualizarLetra(musicaCompleta);
      
    } catch (error) {
      console.error("Erro ao adicionar música da pesquisa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao adicionar a música. Tente novamente."
      });
    } finally {
      setMusicaProcessandoId(null);
    }
  };

  // Adicionar tag à música
  const adicionarTag = () => {
    if (!tagInput.trim()) return;
    if (novaMusica.tags.includes(tagInput.trim())) {
      toast({
        variant: "destructive",
        title: "Tag já existe",
        description: "Esta tag já foi adicionada."
      });
      return;
    }
    
    setNovaMusica({
      ...novaMusica,
      tags: [...novaMusica.tags, tagInput.trim()]
    });
    
    setTagInput('');
  };

  // Remover tag
  const removerTag = (tagParaRemover: string) => {
    setNovaMusica({
      ...novaMusica,
      tags: novaMusica.tags.filter(tag => tag !== tagParaRemover)
    });
  };

  // Marcar/desmarcar como favorita
  const toggleFavorita = async (id: number) => {
    try {
      const favorita = await musicaService.alternarFavorito(id);
      
      // Atualizar a lista de músicas localmente
      setMusicas(prevMusicas => 
        prevMusicas.map(musica => 
          musica.id === id 
            ? { ...musica, favoritada: favorita } 
            : musica
        )
      );
    } catch (error) {
      console.error("Erro ao marcar como favorita:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível marcar como favorita. Tente novamente."
      });
    }
  };

  // Excluir música
  const excluirMusica = async (id: number) => {
    // Verificar se o usuário é administrador
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Permissão negada",
        description: "Apenas administradores podem excluir músicas."
      });
      return;
    }
    
    const musicaParaExcluir = musicas.find(m => m.id === id);
    if (!musicaParaExcluir) return;
    
    try {
      const sucesso = await musicaService.excluirMusica(id);
      
      if (sucesso) {
        setMusicas(prevMusicas => prevMusicas.filter(musica => musica.id !== id));
        
        toast({
          title: "Música excluída",
          description: `A música ${musicaParaExcluir.titulo} foi excluída.`
        });
      }
    } catch (error) {
      console.error("Erro ao excluir música:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a música. Tente novamente."
      });
    }
  };

  // Visualizar letra da música
  const visualizarLetra = async (musica: Musica) => {
    setMusicaSelecionada(musica);
    setModalVisualizarLetra(true);
    
    // Se a música ainda não tem dados completos, buscar dados adicionais
    if (!musica.buscaCompleta) {
      setCarregandoDetalhe(true);
      try {
        // Buscar informações em múltiplas fontes (Deezer, YouTube, etc.)
        console.log('Buscando informações adicionais para:', musica.titulo, musica.artista);
        
        const musicaAtualizada = await musicaService.completarDadosMusica(musica);
        
        // Log dos links gerados
        console.log('Link da cifra gerado:', musicaAtualizada.cifraLink);
        console.log('Link da letra gerado:', musicaAtualizada.letraLink);
        
        // Atualizar a música selecionada e a lista de músicas
        setMusicaSelecionada(musicaAtualizada);
        setMusicas(musicas.map(m => m.id === musicaAtualizada.id ? musicaAtualizada : m));
      } catch (error) {
        console.error("Erro ao buscar dados adicionais da música:", error);
      } finally {
        setCarregandoDetalhe(false);
      }
    }
  };

  // Renderização da letra com quebras de linha
  const formatarLetra = (letra: string) => {
    return letra.split('\n').map((linha, index) => (
      <React.Fragment key={index}>
        {linha}
        <br />
      </React.Fragment>
    ));
  };

  // Função para abrir links externos
  const abrirLink = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Função para formatar texto para URLs (ex: "Aline Barros" → "aline-barros")
  const formatTextForUrl = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/[^a-z0-9-]/g, ""); // Remove caracteres especiais
  };

  // Função para gerar links formatados para serviços externos
  const gerarLinks = (artista: string, titulo: string) => {
    // Verificar se o título e artista estão definidos
    const tituloValido = titulo && titulo.trim() !== '';
    const artistaValido = artista && artista.trim() !== '';
    
    console.log('gerarLinks - Dados de entrada:', { artista, titulo });
    console.log('gerarLinks - Validação:', { artistaValido, tituloValido });
    
    // Formatar textos para URL
    const artistaFormatado = formatTextForUrl(artista);
    const tituloFormatado = formatTextForUrl(titulo);
    
    // IMPORTANTE: Ordem correta é artista/título (não título/artista)
    // Gerar o link de letras - Forçar ordem correta: artista/título
    let letrasLink;
    if (artistaValido && tituloValido) {
      // Gerar link para música específica - CORRIGIDO: artista/título
      letrasLink = `https://www.letras.mus.br/${artistaFormatado}/${tituloFormatado}/`;
    } else if (artistaValido) {
      // Gerar link apenas para o artista
      letrasLink = `https://www.letras.mus.br/${artistaFormatado}/`;
    } else {
      // Fallback para a página inicial
      letrasLink = 'https://www.letras.mus.br/';
    }
    
    // Gerar o link de cifra - Forçar ordem correta: artista/título
    const cifraLink = `https://www.cifraclub.com.br/${artistaFormatado}/${tituloFormatado}/`;
    
    // Depuração - remover após testar
    console.log('Gerando links para:', {artista, titulo});
    console.log('Artista formatado:', artistaFormatado);
    console.log('Título formatado:', tituloFormatado);
    console.log('Link letras.mus.br:', letrasLink);
    console.log('Link cifraclub:', cifraLink);
    
    return {
      letras: letrasLink,
      cifraClub: cifraLink,
    };
  };

  // Função auxiliar para extrair o ID do vídeo do YouTube a partir de uma URL
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Correspondências para diferentes formatos de URL do YouTube
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*v=)([^&\s]+)/,
      /youtube\.com\/shorts\/([^&\s]+)/
    ];
    
    for (const regex of regexPatterns) {
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Função para iniciar a edição de uma música
  const iniciarEdicaoMusica = (musica: Musica) => {
    // Verificar se o usuário é administrador
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Permissão negada",
        description: "Apenas administradores podem editar músicas."
      });
      return;
    }
    
    setMusicaSelecionada(musica);
    setNovaMusica({
      titulo: musica.titulo,
      artista: musica.artista,
      tom: musica.tom,
      letra: musica.letra,
      andamento: musica.andamento,
      tags: [...musica.tags],
      favoritada: musica.favoritada,
      ministerioId: ministerioAtual || '1'
    });
    setModalEditarMusica(true);
  };
  
  // Função para salvar as alterações de uma música
  const salvarEdicaoMusica = async () => {
    if (!musicaSelecionada) return;
    
    setCarregando(true);
    
    try {
      const musicaAtualizada: Musica = {
        ...musicaSelecionada,
        titulo: novaMusica.titulo,
        artista: novaMusica.artista,
        tom: novaMusica.tom,
        letra: novaMusica.letra,
        andamento: novaMusica.andamento,
        tags: novaMusica.tags,
        favoritada: novaMusica.favoritada,
        youtubeLink: musicaSelecionada.youtubeLink,
        deezerLink: musicaSelecionada.deezerLink,
        cifraLink: musicaSelecionada.cifraLink,
        letraLink: musicaSelecionada.letraLink,
        ministerioId: ministerioAtual || '1'
      };
      
      await musicaService.salvarMusica(musicaAtualizada);
      
      // Atualizar a lista de músicas
      const musicasAtualizadas = await musicaService.getTodasMusicas();
      setMusicas(musicasAtualizadas);
      
      toast({
        title: "Música atualizada",
        description: `A música ${musicaAtualizada.titulo} foi atualizada com sucesso.`
      });
      
      setModalEditarMusica(false);
    } catch (error) {
      console.error("Erro ao atualizar música:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a música. Tente novamente."
      });
    } finally {
      setCarregando(false);
    }
  };

  // Exibir modal de seleção para escolher entre múltiplas versões
  const exibirSelecaoDeMusicas = (resultados: ResultadoPesquisa[], termoPesquisa: string) => {
    // Extrair artista e título da busca (se possível)
    const partes = termoPesquisa.split(' - ');
    let artista = '';
    let titulo = '';
    
    if (partes.length > 1) {
      // Formato "Artista - Título"
      artista = partes[0].trim();
      titulo = partes.slice(1).join(' - ').trim();
    } else {
      // Se não houver formato específico, considera tudo como título
      titulo = termoPesquisa.trim();
    }
    
    setPesquisaAtual({titulo, artista});
    setMusicasPotenciais(resultados);
    setModalSelecaoMusica(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Título e subtítulo da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Repertório Musical</h1>
          <p className="text-muted-foreground mt-1">
          Gerencie suas músicas e organize seu repertório para os cultos.
          </p>
        </div>
        
      {/* Banner de ministério atual */}
      {ministerioInfo && (
        <div className="bg-muted rounded-lg p-4 mb-6 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-medium">Você está visualizando músicas de {ministerioInfo.nome}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Você está vendo apenas músicas específicas deste ministério e do repositório comum.
              Use o seletor de ministério no menu para visualizar músicas de outros ministérios.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Label htmlFor="pesquisar-input" className="sr-only">Pesquisar</Label>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
              id="pesquisar-input"
              type="search"
              placeholder="Pesquisar música ou artista..."
              className="pl-8"
              value={pesquisa}
              onChange={(e) => realizarPesquisaComDebounce(e.target.value)}
            />
            {pesquisa && (
              <Button 
                variant="ghost" 
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => {
                  setPesquisa('');
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
            </div>
          
        {/* Botões para adicionar música - apenas para administradores */}
        {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Música
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                console.log("Abrindo modal de adição manual");
                setModalAdicionar(true);
              }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Manualmente
                </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                console.log("Abrindo modal de pesquisa online");
                setModalPesquisaOnline(true);
              }}>
                  <Globe className="mr-2 h-4 w-4" />
                  Pesquisar Online
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Apenas o administrador do ministério pode adicionar músicas</span>
          </div>
          )}
      </div>
      
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="todas">Todas as Músicas</TabsTrigger>
          <TabsTrigger value="favoritas">Favoritas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todas" className="space-y-4">
          {musicasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>Nenhuma música encontrada{pesquisa ? ` para "${pesquisa}"` : ''}.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {musicasFiltradas.map((musica) => (
                <MusicaCard
                  key={musica.id}
                  id={musica.id}
                  titulo={musica.titulo}
                  artista={musica.artista}
                  tom={musica.tom}
                  tags={musica.tags}
                  dataCriacao={musica.dataCriacao}
                  favoritada={musica.favoritada}
                  onFavoritar={toggleFavorita}
                  onClick={() => setMusicaSelecionada(musica)}
                  onVerMais={() => visualizarLetra(musica)}
                  onEdit={isAdmin ? () => iniciarEdicaoMusica(musica) : undefined}
                  onDelete={isAdmin ? () => excluirMusica(musica.id) : undefined}
                  deezerCover={musica.deezerCover}
                  noRepositorioComum={musica.noRepositorioComum}
                  ministerioId={musica.ministerioId}
                  dataElegibilidadeRepositorio={musica.dataElegibilidadeRepositorio}
                  usuarioMinisterioId={user?.id}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favoritas" className="space-y-4">
          {musicasFiltradas.filter(m => m.favoritada).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>Nenhuma música favorita encontrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {musicasFiltradas
                .filter(musica => musica.favoritada)
                .map((musica) => (
                  <MusicaCard
                    key={musica.id}
                    id={musica.id}
                    titulo={musica.titulo}
                    artista={musica.artista}
                    tom={musica.tom}
                    tags={musica.tags}
                    dataCriacao={musica.dataCriacao}
                    favoritada={musica.favoritada}
                    onFavoritar={toggleFavorita}
                    onClick={() => setMusicaSelecionada(musica)}
                    onVerMais={() => visualizarLetra(musica)}
                    onEdit={isAdmin ? () => iniciarEdicaoMusica(musica) : undefined}
                    onDelete={isAdmin ? () => excluirMusica(musica.id) : undefined}
                    deezerCover={musica.deezerCover}
                    noRepositorioComum={musica.noRepositorioComum}
                    ministerioId={musica.ministerioId}
                    dataElegibilidadeRepositorio={musica.dataElegibilidadeRepositorio}
                    usuarioMinisterioId={user?.id}
                    isAdmin={isAdmin}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para adicionar música */}
      <Dialog open={modalAdicionar} onOpenChange={setModalAdicionar}>
        <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Música</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da música para adicionar ao repertório.
            </DialogDescription>
        </DialogHeader>
          
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
                <Label htmlFor="titulo">Título da Música *</Label>
              <Input
                  id="titulo"
                  placeholder="Ex: Oceanos"
                  value={novaMusica.titulo}
                  onChange={(e) => setNovaMusica({...novaMusica, titulo: e.target.value})}
            />
          </div>

          <div className="space-y-2">
                <Label htmlFor="artista">Artista/Compositor *</Label>
              <Input
                  id="artista"
                  placeholder="Ex: Hillsong United"
                  value={novaMusica.artista}
                  onChange={(e) => setNovaMusica({...novaMusica, artista: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tom">Tom</Label>
              <Input
                  id="tom"
                  placeholder="Ex: C, G, Dm"
                  value={novaMusica.tom}
                  onChange={(e) => setNovaMusica({...novaMusica, tom: e.target.value})}
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="andamento">Andamento</Label>
              <Input
                  id="andamento"
                  placeholder="Ex: Lento, Médio, Rápido"
                  value={novaMusica.andamento}
                  onChange={(e) => setNovaMusica({...novaMusica, andamento: e.target.value})}
              />
            </div>
          </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
              <Input
                  placeholder="Ex: Adoração, Louvor"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarTag();
                    }
                  }}
                />
                <Button type="button" onClick={adicionarTag}>
                  Adicionar
                </Button>
            </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {novaMusica.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-3 w-3 text-muted-foreground hover:text-foreground ml-1"
                      onClick={() => removerTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="letra">Letra da Música</Label>
              <Textarea
                id="letra"
                placeholder="Digite a letra da música..."
                rows={8}
                value={novaMusica.letra}
                onChange={(e) => setNovaMusica({...novaMusica, letra: e.target.value})}
                className="resize-none"
              />
            </div>
          </div>

        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalAdicionar(false)} disabled={carregando}>
            Cancelar
          </Button>
            <Button type="button" onClick={adicionarMusica} disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Adicionar Música</>
              )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      
      {/* Modal para editar música */}
      <Dialog open={modalEditarMusica} onOpenChange={setModalEditarMusica}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>Editar Música</DialogTitle>
          <DialogDescription>
              Atualize os detalhes da música.
          </DialogDescription>
        </DialogHeader>
        
          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
                <Label htmlFor="titulo-edit">Título da Música *</Label>
                <Input
                  id="titulo-edit"
                  placeholder="Ex: Oceanos"
                  value={novaMusica.titulo}
                  onChange={(e) => setNovaMusica({...novaMusica, titulo: e.target.value})}
            />
          </div>

          <div className="space-y-1">
                <Label htmlFor="artista-edit">Artista/Compositor *</Label>
                <Input
                  id="artista-edit"
                  placeholder="Ex: Hillsong United"
                  value={novaMusica.artista}
                  onChange={(e) => setNovaMusica({...novaMusica, artista: e.target.value})}
                />
                    </div>
                    </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label htmlFor="tom-edit">Tom</Label>
              <Input
                  id="tom-edit"
                  placeholder="Ex: C, G, Dm"
                  value={novaMusica.tom}
                  onChange={(e) => setNovaMusica({...novaMusica, tom: e.target.value})}
              />
                  </div>
              
            <div className="space-y-1">
                <Label htmlFor="andamento-edit">Andamento</Label>
              <Input
                  id="andamento-edit"
                  placeholder="Ex: Lento, Médio, Rápido"
                  value={novaMusica.andamento}
                  onChange={(e) => setNovaMusica({...novaMusica, andamento: e.target.value})}
              />
              </div>
          </div>

            <div className="space-y-1">
              <Label>Tags</Label>
              <div className="flex gap-2">
              <Input
                  placeholder="Ex: Adoração, Louvor"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarTag();
                    }
                  }}
                />
                <Button type="button" onClick={adicionarTag}>
                  Adicionar
                </Button>
                  </div>
              
              <div className="flex flex-wrap gap-2 mt-1">
                {novaMusica.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-3 w-3 text-muted-foreground hover:text-foreground ml-1"
                      onClick={() => removerTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
        </div>
            
            <div className="space-y-1">
              <Label htmlFor="letra-edit">Letra da Música</Label>
              <Textarea
                id="letra-edit"
                placeholder="Digite a letra da música..."
                rows={6}
                value={novaMusica.letra}
                onChange={(e) => setNovaMusica({...novaMusica, letra: e.target.value})}
                className="resize-none"
              />
            </div>
            
            {/* Links externos para edição */}
            {musicaSelecionada && (
              <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="youtubeLink-edit">Link do YouTube</Label>
              <Input
                  id="youtubeLink-edit"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={musicaSelecionada.youtubeLink || ''}
                  onChange={(e) => setMusicaSelecionada({
                    ...musicaSelecionada as Musica,
                    youtubeLink: e.target.value
                  })}
              />
            </div>
            
              <div className="space-y-1">
                <Label htmlFor="deezerLink-edit">Link do Deezer</Label>
                <Input
                  id="deezerLink-edit"
                  placeholder="https://www.deezer.com/track/..."
                  value={musicaSelecionada.deezerLink || ''}
                  onChange={(e) => setMusicaSelecionada({
                    ...musicaSelecionada as Musica,
                    deezerLink: e.target.value
                  })}
                />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="cifraLink-edit">Link da Cifra</Label>
                  <Input
                    id="cifraLink-edit"
                    placeholder="https://www.cifraclub.com.br/artista/musica/"
                    value={musicaSelecionada.cifraLink || gerarLinks(musicaSelecionada.artista, musicaSelecionada.titulo).cifraClub}
                    onChange={(e) => setMusicaSelecionada({
                      ...musicaSelecionada as Musica,
                      cifraLink: e.target.value
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O formato padrão é: cifraclub.com.br/artista/titulo
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="letraLink-edit">Link da Letra</Label>
                  <Input
                    id="letraLink-edit"
                    placeholder="https://www.letras.mus.br/artista/musica/"
                    value={musicaSelecionada.letraLink || gerarLinks(musicaSelecionada.artista, musicaSelecionada.titulo).letras}
                    onChange={(e) => setMusicaSelecionada({
                      ...musicaSelecionada as Musica,
                      letraLink: e.target.value
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O formato padrão é: letras.mus.br/artista/titulo
                  </p>
                </div>
          </div>
            )}
        </div>
          
        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalEditarMusica(false)} disabled={carregando}>
            Cancelar
          </Button>
            <Button type="button" onClick={salvarEdicaoMusica} disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Salvar Alterações</>
              )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Modal para pesquisa online */}
      <Dialog 
        open={modalPesquisaOnline} 
        onOpenChange={(open) => {
          console.log("Modal de pesquisa online:", open ? "abrindo" : "fechando");
          if (!open) {
            // Limpar resultados ao fechar
            setPesquisaOnline('');
            setResultadosPesquisa([]);
          }
          setModalPesquisaOnline(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <DialogTitle>Pesquisar Música</DialogTitle>
          <DialogDescription>
              Digite o nome da música ou artista para buscar em múltiplas fontes.
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                Novo: Busca intuitiva! Você pode digitar livremente como "Rocha Eterna Aline Barros" ou "Aline Barros Rocha Eterna".
              </p>
          </DialogDescription>
        </DialogHeader>
        
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: Hillsong United - Oceanos ou Oceanos Hillsong"
                  className="pl-8"
                  value={pesquisaOnline}
                  onChange={(e) => realizarPesquisaOnlineComDebounce(e.target.value)}
                  autoFocus
                />
                {pesquisaOnline && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1 h-6 w-6" 
                    onClick={() => {
                      setPesquisaOnline('');
                      setResultadosPesquisa([]);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
          </div>

            {carregandoPesquisa ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Pesquisando músicas...</span>
              </div>
            ) : resultadosPesquisa.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    {resultadosPesquisa.length} resultados encontrados
                  </span>
                </div>
                <ScrollArea className="h-[250px] rounded-md border">
                  <div className="p-3 space-y-3">
                    {resultadosPesquisa.map((resultado, index) => (
                      <Card 
                        key={index} 
                        className={
                          resultado.origem === 'local' 
                            ? 'border-primary/20' 
                            : resultado.origem === 'repositorio'
                              ? 'border-purple-500/50'
                              : 'border-blue-500/50'
                        }
                      >
                        <CardHeader className="py-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex gap-2 flex-shrink-0">
                              {resultado.deezerCover && (
                                <div 
                                  className="w-10 h-10 rounded overflow-hidden"
                                  style={{
                                    backgroundImage: `url(${resultado.deezerCover})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                  title="Capa do álbum"
                                />
                              )}
                              
                              {resultado.artistaImagem && (
                                <div 
                                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-800"
                                  style={{
                                    backgroundImage: `url(${resultado.artistaImagem})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                  title={`Foto de ${resultado.artista}`}
                                />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <CardTitle className="text-base font-bold">
                                {pesquisaOnline ? destacarTexto(resultado.titulo, pesquisaOnline) : resultado.titulo}
                                {resultado.titulo !== normalizeText(resultado.titulo) && (
                                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                                    Normalizado: {normalizeText(resultado.titulo)}
        </div>
                                )}
                              </CardTitle>
                              <CardDescription className="text-base mt-1">
                                <span className="text-muted-foreground font-medium">Artista: </span>
                                {pesquisaOnline ? destacarTexto(resultado.artista, pesquisaOnline) : resultado.artista}
                                {resultado.artista !== normalizeText(resultado.artista) && (
                                  <div className="text-sm font-normal text-muted-foreground mt-1">
                                    Normalizado: {normalizeText(resultado.artista)}
                                  </div>
                                )}
                              </CardDescription>
                              
                              {resultado.score && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Confiança: {resultado.score}%
                                </div>
                              )}
                            </div>
                            
                            <Badge 
                              variant={resultado.origem === 'local' ? 'secondary' : 'default'}
                              className={
                                resultado.origem === 'local'
                                  ? 'bg-primary/20'
                                  : resultado.origem === 'repositorio'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-blue-600 text-white'
                              }
                            >
                              {resultado.origem === 'local' 
                                ? 'No seu repertório' 
                                : resultado.origem === 'repositorio'
                                  ? 'Repositório Comum'
                                  : 'Online'
                              }
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardFooter className="pt-0 pb-2">
                          <div className="flex justify-between w-full">
                            <div className="flex space-x-2">
                              {resultado.origem === 'local' && (
          <Button 
                              size="sm" 
                              onClick={() => {
                                selecionarMusicaOnline(resultado);
                                    setModalPesquisaOnline(false);
                              }}
                              disabled={musicaProcessandoId !== null}
                            >
                              {musicaProcessandoId === (resultado.id || `${resultado.titulo}_${resultado.artista}`) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                    <>Ver Detalhes</>
                              )}
                          </Button>
                              )}

                              {resultado.origem !== 'local' && isAdmin && (
                                <Button 
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    selecionarMusicaOnline(resultado);
                                    setModalPesquisaOnline(false);
                                  }}
                                  disabled={musicaProcessandoId !== null}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Adicionar Música
                                </Button>
                              )}
                              
                              {resultado.origem !== 'local' && !isAdmin && (
                                <div className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Apenas administradores podem adicionar</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              {resultado.deezerId && (
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  title="Ouvir no Deezer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirLink(`https://www.deezer.com/track/${resultado.deezerId}`);
                                  }}
                                >
                                  <Headphones className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              
                              {resultado.origem === 'google' && resultado.link && (
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  title="Abrir no site original"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirLink(resultado.link || '');
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : pesquisaOnline && !carregandoPesquisa ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar letra */}
      <Dialog open={modalVisualizarLetra} onOpenChange={setModalVisualizarLetra}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informações da Música: {musicaSelecionada?.titulo}</DialogTitle>
            <DialogDescription>
              {musicaSelecionada?.artista}
              {musicaSelecionada?.tom && (
                <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                  Tom: {musicaSelecionada.tom}
                </span>
              )}
              {musicaSelecionada?.andamento && (
                <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400">
                  BPM: {musicaSelecionada.andamento}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {carregandoDetalhe ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Buscando informações adicionais...</span>
                      </div>
          ) : (
            <>
              {musicaSelecionada && (
                <div className="flex flex-col gap-3 py-2">
                  {/* Informações Musicais */}
                  <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                    <h3 className="text-sm font-medium mb-1">Informações Musicais</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Tonalidade</div>
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{musicaSelecionada?.tom || 'Não informado'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Andamento</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{musicaSelecionada?.andamento || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações de origem se for do repositório comum */}
                    {musicaSelecionada?.noRepositorioComum && musicaSelecionada.ministerioId !== user?.id && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-muted-foreground mb-1">Origem</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            Repositório Comum
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Esta música foi compartilhada por outro ministério
                        </span>
                      </div>
                    </div>
                    )}
                    
                    {/* Tags da música */}
                    {musicaSelecionada.tags && musicaSelecionada.tags.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-muted-foreground mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {musicaSelecionada.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Player do Deezer - Melhorar a visibilidade com borda e padding */}
                  {(musicaSelecionada.deezerId || musicaSelecionada.deezerPreview) && (
                    <div className="flex justify-center mb-3 border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                      <DeezerPlayer 
                        trackId={musicaSelecionada.deezerId}
                        previewUrl={musicaSelecionada.deezerPreview}
                        title={musicaSelecionada.titulo || ''}
                        artist={musicaSelecionada.artista || ''}
                        coverUrl={musicaSelecionada.deezerCover}
                      />
                    </div>
                  )}
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Link para o Cifra Club */}
                    <a
                      href={(() => {
                        console.log('Gerando link para cifra com artista:', musicaSelecionada.artista, 'e título:', musicaSelecionada.titulo);
                        // Para administradores, usar o link personalizado se existir
                        if (isAdmin && musicaSelecionada.cifraLink) {
                          console.log('Usando link personalizado da cifra:', musicaSelecionada.cifraLink);
                          return musicaSelecionada.cifraLink;
                        }
                        // Para usuários comuns ou caso não haja link personalizado
                        const link = gerarLinks(musicaSelecionada.artista, musicaSelecionada.titulo).cifraClub;
                        console.log('Link para cifra gerado:', link);
                        return link;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full h-10 flex justify-start gap-2"
                      >
                        <Guitar className="h-5 w-5 text-amber-600" />
                        <div className="flex flex-col items-start leading-tight">
                          <span className="font-bold text-sm">Ver Cifra</span>
                          <span className="text-xs text-muted-foreground">Cifra Club</span>
                        </div>
                      </Button>
                    </a>
                    
                    {/* Link para o Letras.mus.br */}
                    <a
                      href={(() => {
                        console.log('Gerando link para letra com artista:', musicaSelecionada.artista, 'e título:', musicaSelecionada.titulo);
                        // Para administradores, usar o link personalizado se existir
                        if (isAdmin && musicaSelecionada.letraLink) {
                          console.log('Usando link personalizado da letra:', musicaSelecionada.letraLink);
                          return musicaSelecionada.letraLink;
                        }
                        // Para usuários comuns ou caso não haja link personalizado
                        const link = gerarLinks(musicaSelecionada.artista, musicaSelecionada.titulo).letras;
                        console.log('Link para letra gerado:', link);
                        return link;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full h-10 flex justify-start gap-2"
                      >
                        <AlignLeft className="h-5 w-5 text-blue-500" />
                        <div className="flex flex-col items-start leading-tight">
                          <span className="font-bold text-sm">Ver Letra</span>
                          <span className="text-xs text-muted-foreground">Letras.mus.br</span>
                        </div>
                        </Button>
                    </a>
                    
                    {/* Link para o YouTube */}
                    {musicaSelecionada.youtubeLink && (
                      <a
                        href={musicaSelecionada.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                      >
                        <Button 
                          variant="outline" 
                          className="w-full h-10 flex justify-start gap-2"
                        >
                          <Youtube className="h-5 w-5 text-red-600" />
                          <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold text-sm">Ver Vídeo</span>
                            <span className="text-xs text-muted-foreground">YouTube</span>
                          </div>
                        </Button>
                      </a>
                    )}
                    
                    {/* Link para o Deezer */}
                    {musicaSelecionada.deezerLink && (
                      <a
                        href={musicaSelecionada.deezerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                      >
                        <Button 
                          variant="outline" 
                          className="w-full h-10 flex justify-start gap-2"
                        >
                          <Headphones className="h-5 w-5 text-blue-600" />
                          <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold text-sm">Ouvir Música</span>
                            <span className="text-xs text-muted-foreground">Deezer</span>
                          </div>
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Removido a exibição da letra para simplificar a interface */}
                    </div>
              )}
            </>
          )}
          
          <DialogFooter>
            {isAdmin && musicaSelecionada && (
              <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setModalVisualizarLetra(false);
                  iniciarEdicaoMusica(musicaSelecionada);
                }}
                className="mr-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar esta música
                        </Button>
                <Button 
                  type="button" 
                  variant="default" 
                  onClick={async () => {
                    // Em vez de chamar selecionarMusicaOnline, adicionar diretamente
                    if (!musicaSelecionada) return;
                    
                    setModalVisualizarLetra(false);
                    setCarregando(true);
                    
                    try {
                      // Verificar se a música já existe no banco de dados local
                      const musicaExistente = await musicaService.buscarMusicaPorTituloEArtista(musicaSelecionada.titulo, musicaSelecionada.artista);
                      
                      if (musicaExistente) {
                        toast({
                          title: "Música já existe",
                          description: `A música "${musicaSelecionada.titulo}" de ${musicaSelecionada.artista} já está no seu repertório.`
                        });
                        return;
                      }
                      
                      // Copiar a música para adicionar ao repertório
                      const musicaParaAdicionar = {
                        titulo: musicaSelecionada.titulo,
                        artista: musicaSelecionada.artista,
                        tom: musicaSelecionada.tom || '',
                        letra: musicaSelecionada.letra || '',
                        andamento: musicaSelecionada.andamento || '',
                        tags: [...(musicaSelecionada.tags || [])],
                        favoritada: false,
                        deezerId: musicaSelecionada.deezerId,
                        deezerCover: musicaSelecionada.deezerCover,
                        artistaImagem: musicaSelecionada.artistaImagem,
                        youtubeLink: musicaSelecionada.youtubeLink,
                        cifraLink: musicaSelecionada.cifraLink,
                        letraLink: musicaSelecionada.letraLink,
                        ministerioId: ministerioAtual || '1'
                      };
                      
                      const musicaCompleta = await musicaService.adicionarNovaMusica(musicaParaAdicionar);
                      
                      // Atualizar a lista de músicas
                      const musicasAtualizadas = await musicaService.getTodasMusicas();
                      setMusicas(musicasAtualizadas);
                      
                      toast({
                        title: "Música adicionada",
                        description: `A música ${musicaCompleta.titulo} foi adicionada com sucesso ao seu repertório.`
                      });
                    } catch (error) {
                      console.error("Erro ao adicionar música:", error);
                      toast({
                        variant: "destructive",
                        title: "Erro",
                        description: "Ocorreu um erro ao adicionar a música. Tente novamente."
                      });
                    } finally {
                      setCarregando(false);
                    }
                  }}
                  className="mr-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Música
                      </Button>
              </>
            )}
            {/* Remover a mensagem para usuários não administradores */}
            <Button onClick={() => setModalVisualizarLetra(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para seleção manual de múltiplas versões de uma música */}
      <Dialog open={modalSelecaoMusica} onOpenChange={setModalSelecaoMusica}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Selecione a Versão Correta</DialogTitle>
            <DialogDescription>
              Encontramos múltiplas versões desta música. Selecione a versão que melhor corresponde ao que você está procurando.
              <span className="text-sm block mt-1 text-blue-600 dark:text-blue-400">
                Os resultados estão organizados por relevância, com os mais prováveis no início.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-4">
                {musicasPotenciais.map((resultado, index) => (
                  <Card 
                    key={index}
                    className={
                      resultado.origem === 'local' 
                        ? 'border-primary/20' 
                        : resultado.origem === 'repositorio'
                          ? 'border-purple-500/50'
                          : 'border-blue-500/50'
                    }
                  >
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-2 flex-shrink-0">
                          {resultado.deezerCover && (
                            <div 
                              className="w-12 h-12 rounded overflow-hidden"
                              style={{
                                backgroundImage: `url(${resultado.deezerCover})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                              title="Capa do álbum"
                            />
                          )}
                          
                          {resultado.artistaImagem && (
                            <div 
                              className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-800"
                              style={{
                                backgroundImage: `url(${resultado.artistaImagem})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                              title={`Foto de ${resultado.artista}`}
                            />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold">
                            {resultado.titulo}
                            {resultado.titulo !== normalizeText(resultado.titulo) && (
                              <div className="text-sm font-normal text-muted-foreground mt-1">
                                Normalizado: {normalizeText(resultado.titulo)}
                              </div>
                            )}
                          </CardTitle>
                          <CardDescription className="text-base mt-1">
                            <span className="text-muted-foreground font-medium">Artista: </span>
                            {resultado.artista}
                            {resultado.artista !== normalizeText(resultado.artista) && (
                              <div className="text-sm font-normal text-muted-foreground mt-1">
                                Normalizado: {normalizeText(resultado.artista)}
                              </div>
                            )}
                          </CardDescription>
                          
                          {resultado.score && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Confiança: {resultado.score}%
                            </div>
                          )}
                        </div>
                        
                        <Badge 
                          variant={resultado.origem === 'local' ? 'secondary' : 'default'}
                          className={
                            resultado.origem === 'local'
                              ? 'bg-primary/20'
                              : resultado.origem === 'repositorio'
                                ? 'bg-purple-600 text-white'
                                : 'bg-blue-600 text-white'
                          }
                        >
                          {resultado.origem === 'local' 
                            ? 'No seu repertório' 
                            : resultado.origem === 'repositorio'
                              ? 'Repositório Comum'
                              : 'Online'
                          }
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 pb-4">
                      <div className="flex justify-between w-full">
                        <div className="flex space-x-2">
                          {resultado.origem === 'local' && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            selecionarMusicaOnline(resultado);
                            setModalSelecaoMusica(false);
                          }}
                          disabled={musicaProcessandoId !== null}
                        >
                          {musicaProcessandoId === (resultado.id || `${resultado.titulo}_${resultado.artista}`) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                                <>Ver Detalhes</>
                          )}
                      </Button>
                          )}

                          {resultado.origem !== 'local' && isAdmin && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                selecionarMusicaOnline(resultado);
                                setModalSelecaoMusica(false);
                              }}
                              disabled={musicaProcessandoId !== null}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar Música
                            </Button>
                          )}
                          
                          {resultado.origem !== 'local' && !isAdmin && (
                            <div className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>Apenas administradores podem adicionar</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          {resultado.deezerId && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              title="Ouvir no Deezer"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirLink(`https://www.deezer.com/track/${resultado.deezerId}`);
                              }}
                            >
                              <Headphones className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          
                          {resultado.origem === 'google' && resultado.link && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              title="Abrir no site original"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirLink(resultado.link || '');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalSelecaoMusica(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Musicas;