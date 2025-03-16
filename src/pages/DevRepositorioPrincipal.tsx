import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Library, RefreshCw, Plus, Trash2, Search, Music2, ArrowUp, ArrowDown, Edit, Music, Youtube, Link, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Musica } from "@/services/MusicaService";
import LocalDatabaseService from '@/lib/local-database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkDevAccess } from '@/lib/dev-auth';

interface FilterOptions {
  artista: string;
  titulo: string;
  tom: string;
  sortBy: 'artista' | 'titulo' | 'dataCriacao';
  sortAsc: boolean;
  onlyRepositorio: boolean;
}

// Nova interface para controlar o modal de adição/edição de música
interface MusicaEditar {
  id?: number;
  titulo: string;
  artista: string;
  tom: string;
  letra: string;
  andamento: string;
  youtubeLink: string;
  cifraLink: string;
  letraLink: string;
  deezerLink: string;
  tags: string;
  ministerioId: string;
  noRepositorioComum: boolean;
}

// Página de gerenciamento do repositório principal para o modo desenvolvedor
const DevRepositorioPrincipal = () => {
  const [allMusicas, setAllMusicas] = useState<Musica[]>([]);
  const [filteredMusicas, setFilteredMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusicas, setSelectedMusicas] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    artista: '',
    titulo: '',
    tom: '',
    sortBy: 'dataCriacao',
    sortAsc: false,
    onlyRepositorio: false
  });

  // Estados para o modal de adição/edição de música
  const [isAddMusicaModalOpen, setIsAddMusicaModalOpen] = useState(false);
  const [musicaEmEdicao, setMusicaEmEdicao] = useState<MusicaEditar>({
    titulo: '',
    artista: '',
    tom: '',
    letra: '',
    andamento: '',
    youtubeLink: '',
    cifraLink: '',
    letraLink: '',
    deezerLink: '',
    tags: '',
    ministerioId: '',
    noRepositorioComum: false
  });
  const [pesquisaOnline, setPesquisaOnline] = useState('');
  const [resultadosPesquisa, setResultadosPesquisa] = useState<any[]>([]);
  const [pesquisandoOnline, setPesquisandoOnline] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("manual");
  const [musicaSelecionadaOnline, setMusicaSelecionadaOnline] = useState<any | null>(null);

  // Obter referência ao usuário logado
  const [usuario, setUsuario] = useState<any>(null);
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUsuario(JSON.parse(userData));
    }
  }, []);

  // Verificar acesso - apenas para o usuário autorizado
  useEffect(() => {
    checkDevAccess();
  }, []);

  // Função auxiliar para calcular a data de elegibilidade (3 dias no futuro)
  const calcularDataElegibilidadeRepositorio = (): string => {
    const hoje = new Date();
    const dataElegibilidade = new Date(hoje);
    dataElegibilidade.setDate(hoje.getDate() + 3); // 3 dias no futuro
    return dataElegibilidade.toISOString();
  };

  // NOVA função para abrir o modal de adicionar música - simplificada e sem parâmetros de evento
  const handleAddMusicaClick = () => {
    // Resetar o formulário
    setMusicaEmEdicao({
      titulo: '',
      artista: '',
      tom: '',
      letra: '',
      andamento: '',
      youtubeLink: '',
      cifraLink: '',
      letraLink: '',
      deezerLink: '',
      tags: '',
      ministerioId: usuario?.id || '',
      noRepositorioComum: false
    });
    setMusicaSelecionadaOnline(null);
    setPesquisaOnline('');
    setResultadosPesquisa([]);
    setCurrentTab("manual");
    
    // Abrir o modal
    setIsAddMusicaModalOpen(true);
  };

  // Função para pesquisar música online
  const pesquisarMusicaOnline = async () => {
    if (!pesquisaOnline.trim()) return;

    setPesquisandoOnline(true);
    try {
      // Obter banco de dados para verificar músicas existentes
      const dbStr = localStorage.getItem('praiseapp_database') || '{}';
      const db = JSON.parse(dbStr);
      const todasMusicas = db.musicas || [];

      // Primeiro, pesquisar no banco de dados local (músicas do repositório comum e locais)
      // Normalizar termo de pesquisa
      const termo = pesquisaOnline.toLowerCase();
      
      // Filtrar músicas que correspondem ao termo (priorizar músicas do repositório)
      const resultadosLocais = todasMusicas
        .filter((musica) => 
          (musica.titulo && musica.titulo.toLowerCase().includes(termo)) || 
          (musica.artista && musica.artista.toLowerCase().includes(termo)) ||
          (musica.tags && Array.isArray(musica.tags) && musica.tags.some(tag => tag && tag.toLowerCase().includes(termo)))
        )
        .map(musica => ({
          id: musica.id,
          titulo: musica.titulo || '',
          artista: musica.artista || '',
          tom: musica.tom || '',
          origem: musica.noRepositorioComum ? 'repositorio' : 'local',
          tags: Array.isArray(musica.tags) ? musica.tags : [],
          letra: musica.letra || '',
          andamento: musica.andamento || '',
          youtubeLink: musica.youtubeLink || '',
          cifraLink: musica.cifraLink || '',
          letraLink: musica.letraLink || '',
          deezerLink: musica.deezerLink || '',
          ministerioId: musica.ministerioId || '',
          noRepositorioComum: !!musica.noRepositorioComum
        }));
      
      // Ordenar resultados: primeiro músicas do repositório, depois músicas locais
      resultadosLocais.sort((a, b) => {
        if (a.origem === 'repositorio' && b.origem !== 'repositorio') return -1;
        if (a.origem !== 'repositorio' && b.origem === 'repositorio') return 1;
        return 0;
      });
      
      // Limitar a 20 resultados
      const resultadosFiltrados = resultadosLocais.slice(0, 20);
      
      setResultadosPesquisa(resultadosFiltrados);
      
      if (resultadosFiltrados.length > 0) {
        toast.success(`${resultadosFiltrados.length} resultados encontrados no banco de dados`);
      } else {
        toast.info("Nenhum resultado encontrado para esta pesquisa");
      }
    } catch (error) {
      console.error("Erro ao pesquisar música online:", error);
      toast.error("Erro ao realizar a pesquisa online");
    } finally {
      setPesquisandoOnline(false);
    }
  };

  // NOVA função para salvar música - simplificada e sem parâmetros de evento
  const handleSaveMusica = () => {
    if (!musicaEmEdicao.titulo || !musicaEmEdicao.artista) {
      toast.error("Título e artista são obrigatórios");
      return;
    }

    try {
      // Obter banco de dados
      const dbStr = localStorage.getItem('praiseapp_database') || '{}';
      const db = JSON.parse(dbStr);
      
      // Garantir que existe a coleção de músicas
      if (!db.musicas) db.musicas = [];
      
      // Preparar objeto da música
      const tagsArray = musicaEmEdicao.tags
        ? musicaEmEdicao.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];
      
      const musicaObj: Musica = {
        id: musicaEmEdicao.id || Date.now(),
        titulo: musicaEmEdicao.titulo,
        artista: musicaEmEdicao.artista,
        tom: musicaEmEdicao.tom || '',
        letra: musicaEmEdicao.letra || '',
        andamento: musicaEmEdicao.andamento || '',
        tags: tagsArray,
        dataCriacao: new Date().toISOString(),
        favoritada: false,
        youtubeLink: musicaEmEdicao.youtubeLink || '',
        cifraLink: musicaEmEdicao.cifraLink || '',
        letraLink: musicaEmEdicao.letraLink || '',
        deezerLink: musicaEmEdicao.deezerLink || '',
        ministerioId: musicaEmEdicao.ministerioId || usuario?.id || '1',
        noRepositorioComum: musicaEmEdicao.noRepositorioComum,
        dataElegibilidadeRepositorio: musicaEmEdicao.noRepositorioComum 
          ? new Date().toISOString() 
          : calcularDataElegibilidadeRepositorio(),
        buscaCompleta: true  // Marcar como completamente preenchida
      };
      
      // Se for edição, atualizar música existente
      if (musicaEmEdicao.id) {
        const index = db.musicas.findIndex((m: Musica) => m.id === musicaEmEdicao.id);
        if (index !== -1) {
          // Manter a data de criação original
          musicaObj.dataCriacao = db.musicas[index].dataCriacao;
          // Atualizar o objeto
          db.musicas[index] = musicaObj;
          toast.success(`Música "${musicaObj.titulo}" atualizada com sucesso`);
        } else {
          // Se não encontrar (improvável), adicionar como nova
          db.musicas.push(musicaObj);
          toast.success(`Música "${musicaObj.titulo}" adicionada com sucesso`);
        }
      } else {
        // Adicionar nova música
        
        // Verificar se a música já existe (para evitar duplicatas)
        const musicaExistente = db.musicas.find((m: Musica) => 
          m.titulo.toLowerCase() === musicaObj.titulo.toLowerCase() && 
          m.artista.toLowerCase() === musicaObj.artista.toLowerCase()
        );
        
        if (musicaExistente) {
          toast.error(`A música "${musicaObj.titulo}" de ${musicaObj.artista} já existe no banco de dados`);
          return;
        }
        
        db.musicas.push(musicaObj);
        toast.success(`Música "${musicaObj.titulo}" adicionada com sucesso ao banco de dados`);
      }
      
      // Salvar no localStorage
      localStorage.setItem('praiseapp_database', JSON.stringify(db));
      
      // Atualizar estado local
      setAllMusicas(db.musicas);
      
      // Recarregar a lista de músicas
      loadMusicas();
      
      // Fechar o modal
      setIsAddMusicaModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar música:", error);
      toast.error("Erro ao salvar música no banco de dados");
    }
  };

  // Carregar músicas do banco de dados
  useEffect(() => {
    loadMusicas();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [allMusicas, filters]);

  // Função para carregar todas as músicas
  const loadMusicas = async () => {
    setLoading(true);
    try {
      // Obter banco de dados completo do localStorage
      const dbStr = localStorage.getItem('praiseapp_database') || '{}';
      const db = JSON.parse(dbStr);
      
      // Obter músicas
      const musicas = db.musicas || [];
      setAllMusicas(musicas);
      
      toast.success(`${musicas.length} músicas carregadas`);
    } catch (error) {
      console.error("Erro ao carregar músicas:", error);
      toast.error("Erro ao carregar músicas do banco");
    } finally {
      setLoading(false);
    }
  };

  // Função para aplicar filtros e ordenação
  const applyFilters = () => {
    let result = [...allMusicas];
    
    // Filtrar pelo repositório comum
    if (filters.onlyRepositorio) {
      result = result.filter(m => m.noRepositorioComum === true);
    }
    
    // Aplicar filtros de texto
    if (filters.artista) {
      result = result.filter(m => 
        m.artista.toLowerCase().includes(filters.artista.toLowerCase())
      );
    }
    
    if (filters.titulo) {
      result = result.filter(m => 
        m.titulo.toLowerCase().includes(filters.titulo.toLowerCase())
      );
    }
    
    if (filters.tom) {
      result = result.filter(m => 
        m.tom?.toLowerCase().includes(filters.tom.toLowerCase())
      );
    }
    
    // Aplicar ordenação
    result.sort((a, b) => {
      let valueA, valueB;
      
      switch (filters.sortBy) {
        case 'artista':
          valueA = a.artista.toLowerCase();
          valueB = b.artista.toLowerCase();
          break;
        case 'titulo':
          valueA = a.titulo.toLowerCase();
          valueB = b.titulo.toLowerCase();
          break;
        case 'dataCriacao':
          valueA = new Date(a.dataCriacao || 0).getTime();
          valueB = new Date(b.dataCriacao || 0).getTime();
          break;
        default:
          valueA = a.titulo.toLowerCase();
          valueB = b.titulo.toLowerCase();
      }
      
      return filters.sortAsc 
        ? valueA > valueB ? 1 : -1
        : valueA < valueB ? 1 : -1;
    });
    
    setFilteredMusicas(result);
  };

  // Função para alternar a seleção de uma música
  const toggleMusicaSelection = (id: number) => {
    if (selectedMusicas.includes(id)) {
      setSelectedMusicas(selectedMusicas.filter(musicaId => musicaId !== id));
    } else {
      setSelectedMusicas([...selectedMusicas, id]);
    }
  };

  // Função para marcar/desmarcar todas as músicas
  const toggleAllMusicas = () => {
    if (selectedMusicas.length === filteredMusicas.length) {
      setSelectedMusicas([]);
    } else {
      setSelectedMusicas(filteredMusicas.map(m => m.id));
    }
  };

  // Função para marcar músicas como parte do repositório comum
  const addToRepositorio = () => {
    if (selectedMusicas.length === 0) {
      toast.warning("Selecione pelo menos uma música");
      return;
    }
    
    try {
      // Obter banco de dados completo
      const dbStr = localStorage.getItem('praiseapp_database') || '{}';
      const db = JSON.parse(dbStr);
      
      // Atualizar status das músicas selecionadas
      const updatedMusicas = db.musicas.map((musica: Musica) => {
        if (selectedMusicas.includes(musica.id)) {
          return {
            ...musica,
            noRepositorioComum: true,
            dataElegibilidadeRepositorio: new Date().toISOString()
          };
        }
        return musica;
      });
      
      // Atualizar banco de dados
      db.musicas = updatedMusicas;
      localStorage.setItem('praiseapp_database', JSON.stringify(db));
      
      // Atualizar estado local
      setAllMusicas(updatedMusicas);
      setSelectedMusicas([]);
      
      toast.success(`${selectedMusicas.length} músicas adicionadas ao repositório comum`);
    } catch (error) {
      console.error("Erro ao adicionar músicas ao repositório:", error);
      toast.error("Erro ao atualizar músicas");
    }
  };

  // Função para remover músicas do repositório comum
  const removeFromRepositorio = () => {
    if (selectedMusicas.length === 0) {
      toast.warning("Selecione pelo menos uma música");
      return;
    }
    
    try {
      // Obter banco de dados completo
      const dbStr = localStorage.getItem('praiseapp_database') || '{}';
      const db = JSON.parse(dbStr);
      
      // Atualizar status das músicas selecionadas
      const updatedMusicas = db.musicas.map((musica: Musica) => {
        if (selectedMusicas.includes(musica.id)) {
          return {
            ...musica,
            noRepositorioComum: false,
            dataElegibilidadeRepositorio: null
          };
        }
        return musica;
      });
      
      // Atualizar banco de dados
      db.musicas = updatedMusicas;
      localStorage.setItem('praiseapp_database', JSON.stringify(db));
      
      // Atualizar estado local
      setAllMusicas(updatedMusicas);
      setSelectedMusicas([]);
      
      toast.success(`${selectedMusicas.length} músicas removidas do repositório comum`);
    } catch (error) {
      console.error("Erro ao remover músicas do repositório:", error);
      toast.error("Erro ao atualizar músicas");
    }
  };

  // Função para selecionar uma música do resultado da pesquisa
  const selecionarMusicaOnline = (musica: any) => {
    try {
      setMusicaSelecionadaOnline(musica);
      
      // Preencher o formulário com os dados da música selecionada
      setMusicaEmEdicao({
        titulo: musica?.titulo || '',
        artista: musica?.artista || '',
        tom: musica?.tom || '',
        letra: musica?.letra || '',
        andamento: musica?.andamento || '',
        youtubeLink: musica?.youtubeLink || '',
        cifraLink: musica?.cifraLink || '',
        letraLink: musica?.letraLink || '',
        deezerLink: musica?.deezerLink || '',
        tags: Array.isArray(musica?.tags) ? musica.tags.join(', ') : '',
        ministerioId: musica?.ministerioId || usuario?.id || '',
        noRepositorioComum: !!musica?.noRepositorioComum
      });
      
      // Mudar para a aba manual após selecionar
      setCurrentTab("manual");
    } catch (error) {
      console.error("Erro ao selecionar música:", error);
      toast.error("Ocorreu um erro ao selecionar esta música");
    }
  };

  // Função para abrir o modal para editar uma música
  const abrirModalEditarMusica = (musica: Musica) => {
    setMusicaEmEdicao({
      id: musica.id,
      titulo: musica.titulo || '',
      artista: musica.artista || '',
      tom: musica.tom || '',
      letra: musica.letra || '',
      andamento: musica.andamento || '',
      youtubeLink: musica.youtubeLink || '',
      cifraLink: musica.cifraLink || '',
      letraLink: musica.letraLink || '',
      deezerLink: musica.deezerLink || '',
      tags: musica.tags?.join(', ') || '',
      ministerioId: musica.ministerioId || usuario?.id || '',
      noRepositorioComum: !!musica.noRepositorioComum
    });
    setCurrentTab("manual");
    setIsAddMusicaModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Library className="mr-2 h-6 w-6 text-primary" />
            Repositório Principal
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar músicas no repositório comum do PraiseLord
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleAddMusicaClick}
            className="bg-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Música
          </Button>
          <Button 
            variant="outline" 
            onClick={loadMusicas}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Filtrar e ordenar músicas do banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Artista</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por artista..."
                  className="pl-8"
                  value={filters.artista}
                  onChange={(e) => setFilters({...filters, artista: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por título..."
                  className="pl-8"
                  value={filters.titulo}
                  onChange={(e) => setFilters({...filters, titulo: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tom</label>
              <div className="relative">
                <Music2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por tom..."
                  className="pl-8"
                  value={filters.tom}
                  onChange={(e) => setFilters({...filters, tom: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <Toggle 
              aria-label="Ordenar por Artista"
              pressed={filters.sortBy === 'artista'}
              onClick={() => setFilters({
                ...filters, 
                sortBy: 'artista', 
                sortAsc: filters.sortBy === 'artista' ? !filters.sortAsc : true
              })}
              className="flex gap-1 items-center"
            >
              Artista
              {filters.sortBy === 'artista' && (
                filters.sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </Toggle>
            
            <Toggle 
              aria-label="Ordenar por Título"
              pressed={filters.sortBy === 'titulo'}
              onClick={() => setFilters({
                ...filters, 
                sortBy: 'titulo', 
                sortAsc: filters.sortBy === 'titulo' ? !filters.sortAsc : true
              })}
              className="flex gap-1 items-center"
            >
              Título
              {filters.sortBy === 'titulo' && (
                filters.sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </Toggle>
            
            <Toggle 
              aria-label="Ordenar por Data"
              pressed={filters.sortBy === 'dataCriacao'}
              onClick={() => setFilters({
                ...filters, 
                sortBy: 'dataCriacao', 
                sortAsc: filters.sortBy === 'dataCriacao' ? !filters.sortAsc : true
              })}
              className="flex gap-1 items-center"
            >
              Data
              {filters.sortBy === 'dataCriacao' && (
                filters.sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </Toggle>
            
            <Toggle 
              aria-label="Mostrar apenas músicas do repositório"
              pressed={filters.onlyRepositorio}
              onClick={() => setFilters({...filters, onlyRepositorio: !filters.onlyRepositorio})}
              className="flex gap-1 items-center"
            >
              Apenas Repositório
            </Toggle>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-muted-foreground">
              {filteredMusicas.length} músicas encontradas
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={addToRepositorio}
                disabled={selectedMusicas.length === 0}
                variant="outline"
                className="text-green-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar ao Repositório
              </Button>
              
              <Button 
                size="sm" 
                onClick={removeFromRepositorio}
                disabled={selectedMusicas.length === 0}
                variant="outline"
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover do Repositório
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Lista de músicas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Lista de Músicas</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="selectAll" 
                onCheckedChange={toggleAllMusicas}
                checked={selectedMusicas.length > 0 && selectedMusicas.length === filteredMusicas.length}
              />
              <label htmlFor="selectAll" className="text-sm">Selecionar todas</label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando músicas...</span>
            </div>
          ) : filteredMusicas.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredMusicas.map(musica => (
                  <div 
                    key={musica.id}
                    className={`flex items-center p-3 rounded-md border ${
                      selectedMusicas.includes(musica.id) ? 'bg-primary/10 border-primary' : ''
                    } ${musica.noRepositorioComum ? 'border-green-200' : ''}`}
                  >
                    <Checkbox 
                      checked={selectedMusicas.includes(musica.id)}
                      onCheckedChange={() => toggleMusicaSelection(musica.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="font-medium">{musica.titulo}</div>
                          <div className="text-sm text-muted-foreground">{musica.artista}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {musica.tom && (
                            <Badge variant="outline" className="text-xs">
                              Tom: {musica.tom}
                            </Badge>
                          )}
                          {musica.noRepositorioComum && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Repositório Comum
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => abrirModalEditarMusica(musica)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma música encontrada com os filtros atuais</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar/editar música */}
      <Dialog open={isAddMusicaModalOpen} onOpenChange={setIsAddMusicaModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{musicaEmEdicao.id ? 'Editar Música' : 'Adicionar Música'}</DialogTitle>
            <DialogDescription>
              {musicaEmEdicao.id 
                ? 'Edite os detalhes da música selecionada' 
                : 'Adicione uma nova música ao banco de dados'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Adicionar Manualmente</TabsTrigger>
                <TabsTrigger value="online">Buscar Online</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título*</Label>
                    <Input 
                      id="titulo" 
                      placeholder="Título da música" 
                      value={musicaEmEdicao.titulo}
                      onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, titulo: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="artista">Artista*</Label>
                    <Input 
                      id="artista" 
                      placeholder="Nome do artista" 
                      value={musicaEmEdicao.artista}
                      onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, artista: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tom">Tom</Label>
                    <Select 
                      value={musicaEmEdicao.tom} 
                      onValueChange={(value) => setMusicaEmEdicao({...musicaEmEdicao, tom: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Selecione...</SelectItem>
                        <SelectItem value="C">C (Dó)</SelectItem>
                        <SelectItem value="C#">C# (Dó#)</SelectItem>
                        <SelectItem value="D">D (Ré)</SelectItem>
                        <SelectItem value="D#">D# (Ré#)</SelectItem>
                        <SelectItem value="E">E (Mi)</SelectItem>
                        <SelectItem value="F">F (Fá)</SelectItem>
                        <SelectItem value="F#">F# (Fá#)</SelectItem>
                        <SelectItem value="G">G (Sol)</SelectItem>
                        <SelectItem value="G#">G# (Sol#)</SelectItem>
                        <SelectItem value="A">A (Lá)</SelectItem>
                        <SelectItem value="A#">A# (Lá#)</SelectItem>
                        <SelectItem value="B">B (Si)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="andamento">Andamento (BPM)</Label>
                    <Input 
                      id="andamento" 
                      type="number" 
                      placeholder="Ex: 120" 
                      value={musicaEmEdicao.andamento}
                      onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, andamento: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtubeLink">Link do YouTube</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="youtubeLink" 
                        placeholder="https://youtube.com/watch?v=..." 
                        value={musicaEmEdicao.youtubeLink}
                        onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, youtubeLink: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(musicaEmEdicao.youtubeLink, '_blank')}
                        disabled={!musicaEmEdicao.youtubeLink}
                      >
                        <Youtube className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deezerLink">Link do Deezer</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="deezerLink" 
                        placeholder="https://deezer.com/track/..." 
                        value={musicaEmEdicao.deezerLink}
                        onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, deezerLink: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(musicaEmEdicao.deezerLink, '_blank')}
                        disabled={!musicaEmEdicao.deezerLink}
                      >
                        <Music className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cifraLink">Link da Cifra</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="cifraLink" 
                        placeholder="https://cifraclub.com.br/..." 
                        value={musicaEmEdicao.cifraLink}
                        onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, cifraLink: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(musicaEmEdicao.cifraLink, '_blank')}
                        disabled={!musicaEmEdicao.cifraLink}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="letraLink">Link da Letra</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="letraLink" 
                        placeholder="https://letras.mus.br/..." 
                        value={musicaEmEdicao.letraLink}
                        onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, letraLink: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(musicaEmEdicao.letraLink, '_blank')}
                        disabled={!musicaEmEdicao.letraLink}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input 
                      id="tags" 
                      placeholder="adoração, louvor, rápida, etc" 
                      value={musicaEmEdicao.tags}
                      onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, tags: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="repositorioComum" 
                        checked={musicaEmEdicao.noRepositorioComum}
                        onCheckedChange={(checked) => 
                          setMusicaEmEdicao({
                            ...musicaEmEdicao, 
                            noRepositorioComum: checked as boolean
                          })
                        }
                      />
                      <Label htmlFor="repositorioComum">Adicionar diretamente ao repositório comum</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="letra">Letra da Música</Label>
                  <Textarea 
                    id="letra" 
                    placeholder="Cole a letra da música aqui..." 
                    className="min-h-[200px]"
                    value={musicaEmEdicao.letra}
                    onChange={(e) => setMusicaEmEdicao({...musicaEmEdicao, letra: e.target.value})}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="online" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Buscar música online..." 
                    value={pesquisaOnline}
                    onChange={(e) => setPesquisaOnline(e.target.value)}
                  />
                  <Button 
                    variant="secondary" 
                    disabled={pesquisandoOnline || !pesquisaOnline.trim()} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      pesquisarMusicaOnline();
                    }}
                  >
                    {pesquisandoOnline ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Buscar
                  </Button>
                </div>
                
                {/* Lista de músicas nos resultados de pesquisa */}
                {resultadosPesquisa.length > 0 ? (
                  <ScrollArea className="h-[300px] border rounded-md p-2">
                    <div className="space-y-2">
                      {resultadosPesquisa.map((musica) => (
                        <div 
                          key={musica.id || `${musica.titulo}_${musica.artista}`}
                          className={`p-3 rounded-md cursor-pointer hover:bg-primary/5 transition-colors ${
                            musicaSelecionadaOnline?.id === musica.id ? 'bg-primary/10 border-primary border' : 'border'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            try {
                              selecionarMusicaOnline(musica);
                            } catch (error) {
                              console.error("Erro ao selecionar música:", error);
                              toast.error("Erro ao selecionar esta música");
                            }
                          }}
                        >
                          <div className="font-medium">{musica.titulo}</div>
                          <div className="text-sm text-muted-foreground">{musica.artista}</div>
                          <div className="flex items-center mt-1 gap-2">
                            <Badge variant="outline" className="text-xs">
                              {musica.origem === 'local' ? 'Banco Local' : musica.origem === 'repositorio' ? 'Repositório' : 'Online'}
                            </Badge>
                            {musica.tom && (
                              <Badge variant="outline" className="text-xs">
                                Tom: {musica.tom}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : pesquisaOnline && !pesquisandoOnline ? (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                  </div>
                ) : null}
                
                {musicaSelecionadaOnline && (
                  <div className="border p-4 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Música Selecionada</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Título:</span> {musicaSelecionadaOnline.titulo}
                      </div>
                      <div>
                        <span className="font-semibold">Artista:</span> {musicaSelecionadaOnline.artista}
                      </div>
                    </div>
                    <p className="text-sm mt-2">
                      Esta música será adicionada ao banco de dados com os detalhes exibidos.
                      Você pode editar os detalhes na aba "Adicionar Manualmente".
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                setIsAddMusicaModalOpen(false);
              }}
              type="button"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                try {
                  handleSaveMusica();
                } catch (error) {
                  console.error("Erro ao salvar música:", error);
                  toast.error("Ocorreu um erro ao salvar a música. Verifique os dados e tente novamente.");
                }
              }}
              disabled={!musicaEmEdicao.titulo || !musicaEmEdicao.artista}
              type="button"
            >
              <Save className="h-4 w-4 mr-2" />
              {musicaEmEdicao.id ? 'Atualizar Música' : 'Salvar Música'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevRepositorioPrincipal; 