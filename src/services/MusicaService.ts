// MusicaService.ts
// Serviço para gerenciar músicas, incluindo armazenamento e integração com APIs externas

import dbService, { DocumentData } from './DatabaseService';
import deezerService, { DeezerTrack } from './DeezerService';
import searchService, { IntuitiveSearchResult } from './SearchService';
import googleSearchService from './GoogleSearchService';

// Chave da API do YouTube
const YOUTUBE_API_KEY = 'AIzaSyBeriGtVYXG20B6UXMQ4-FZrRF80OgxEck';

// Interface para os dados de música
export interface Musica {
  id: number;
  titulo: string;
  artista: string;
  tom: string;
  letra: string;
  andamento: string;
  tags: string[];
  dataCriacao: string;
  favoritada: boolean;
  youtubeLink?: string;
  youtubeId?: string;
  cifraLink?: string;
  letraLink?: string;
  buscaCompleta?: boolean; // Indica se todos os dados externos já foram buscados
  // Novos campos para integração com Deezer
  deezerId?: number;
  deezerLink?: string;
  deezerPreview?: string; // URL para 30 segundos de preview da música
  deezerCover?: string; // URL para capa do álbum
  artistaImagem?: string; // URL para imagem do artista
  // Novos campos para isolamento por ministério e repositório comum
  ministerioId: string; // ID do ministério ao qual a música pertence
  noRepositorioComum?: boolean; // Indica se a música está no repositório comum
  dataElegibilidadeRepositorio?: string; // Data em que a música se torna elegível para o repositório comum
}

// Interface para resultados de pesquisa online
export interface ResultadoPesquisa {
  titulo: string;
  artista: string;
  origem: 'local' | 'online' | 'google' | 'repositorio' | 'fromVisualizationModal'; // Adicionando origem para modal de visualização
  id?: number; // Apenas para resultados locais
  deezerId?: number; // ID do Deezer, se disponível
  deezerCover?: string; // URL da capa do álbum, se disponível
  artistaImagem?: string; // URL da imagem do artista
  score?: number; // Pontuação de relevância para resultados intuitivos
  link?: string; // Link externo para a música (usado na origem 'google')
  ministerioId?: string; // ID do ministério ao qual a música pertence
  tom?: string; // Tonalidade da música (ex: C, Dm, etc)
}

class MusicaService {
  private collectionName = 'musicas';
  private repositorioComumCollectionName = 'musicas_repositorio_comum';
  private ministerioId: string = ''; // Será definido durante a inicialização

  constructor() {
    // Inicializar o ID do ministério
    this.carregarMinisterioId();
    // Verificar músicas elegíveis para o repositório comum (executar a cada 12 horas)
    this.iniciarVerificacaoRepositorioComum();
  }

  // Carregar o ID do ministério do usuário atual
  private carregarMinisterioId() {
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        // Usar o ID do ministério atual do usuário
        this.ministerioId = userData.ministerioId || '';
        
        if (!this.ministerioId && userData.ministerios && userData.ministerios.length > 0) {
          // Se não há ministério atual mas o usuário tem ministérios, usar o primeiro
          if (typeof userData.ministerios[0] === 'object') {
            this.ministerioId = userData.ministerios[0].ministerioId;
          } else {
            this.ministerioId = userData.ministerios[0];
          }
        }
        
        console.log('Ministério ID carregado:', this.ministerioId);
      } else {
        // Valor padrão se não houver usuário
        this.ministerioId = '';
        console.log('Nenhum usuário logado. Ministério ID definido como vazio.');
      }
    } catch (error) {
      console.error('Erro ao carregar ID do ministério:', error);
      this.ministerioId = ''; // Valor padrão em caso de erro
    }

    // Adicionar um ouvinte para mudanças no localStorage para atualizar o ministério quando ele mudar
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        this.carregarMinisterioId(); // Recarregar o ID do ministério
        console.log('Ministério ID atualizado após mudança no localStorage:', this.ministerioId);
      }
    });
  }

  // Iniciar verificação periódica de músicas elegíveis para o repositório comum
  private iniciarVerificacaoRepositorioComum() {
    // Verificar imediatamente
    this.verificarMusicasElegiveisParaRepositorioComum();
    
    // Configurar verificação periódica (a cada 12 horas)
    setInterval(() => {
      this.verificarMusicasElegiveisParaRepositorioComum();
    }, 12 * 60 * 60 * 1000);
  }

  // Verificar e atualizar músicas elegíveis para o repositório comum
  private async verificarMusicasElegiveisParaRepositorioComum() {
    try {
      console.log('Verificando músicas elegíveis para o repositório comum...');
      const todasMusicas = await this.getTodasMusicas();
      const hoje = new Date();
      
      for (const musica of todasMusicas) {
        // Se a música já está no repositório comum, pular
        if (musica.noRepositorioComum) continue;
        
        // Se a data de elegibilidade está definida e já passou
        if (musica.dataElegibilidadeRepositorio) {
          const dataElegibilidade = new Date(musica.dataElegibilidadeRepositorio);
          
          console.log(`Verificando música "${musica.titulo}": Data elegibilidade: ${this.formatarData(dataElegibilidade)}, Hoje: ${this.formatarData(hoje)}`);
          
          if (hoje >= dataElegibilidade) {
            console.log(`Música "${musica.titulo}" (${musica.artista}) agora é elegível para o repositório comum! (Data: ${this.formatarData(dataElegibilidade)})`);
            await this.adicionarMusicaAoRepositorioComum(musica);
          } else {
            const diasRestantes = Math.ceil((dataElegibilidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`Música "${musica.titulo}" (${musica.artista}) será compartilhada em ${diasRestantes} dias`);
          }
        } else {
          // Se não tem data de elegibilidade, definir para 3 dias a partir de agora
          console.log(`Música "${musica.titulo}" não tem data de elegibilidade. Definindo para 3 dias a partir de agora.`);
          
          const dataElegibilidade = this.calcularDataElegibilidadeRepositorio(3);
          
          // Atualizar a música com a nova data de elegibilidade
          await this.salvarMusica({
            ...musica,
            dataElegibilidadeRepositorio: dataElegibilidade
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar músicas para repositório comum:', error);
    }
  }

  // Adicionar uma música ao repositório comum
  private async adicionarMusicaAoRepositorioComum(musica: Musica) {
    try {
      // Verificar se a música já existe no repositório comum
      const musicaExistente = await this.buscarMusicaNoRepositorioComum(musica.titulo, musica.artista);
      if (musicaExistente) {
        console.log(`Música "${musica.titulo}" já existe no repositório comum.`);
        
        // Atualizar a música local para indicar que já está no repositório comum
        await this.salvarMusica({
          ...musica,
          noRepositorioComum: true
        });
        
        return;
      }
      
      // Criar uma cópia da música para o repositório comum
      const musicaParaRepositorio = {
        ...musica,
        id: Date.now(), // Novo ID para evitar conflitos
        noRepositorioComum: true,
        // Manter o ministerioId original para rastreamento
      };
      
      // Salvar no repositório comum
      await dbService.setDocument(
        this.repositorioComumCollectionName,
        musicaParaRepositorio.id.toString(),
        musicaParaRepositorio
      );
      
      // Atualizar a música local para indicar que já está no repositório comum
      await this.salvarMusica({
        ...musica,
        noRepositorioComum: true
      });
      
      console.log(`Música "${musica.titulo}" adicionada ao repositório comum com sucesso.`);
    } catch (error) {
      console.error('Erro ao adicionar música ao repositório comum:', error);
    }
  }

  // Buscar música no repositório comum
  private async buscarMusicaNoRepositorioComum(titulo: string, artista: string): Promise<Musica | null> {
    try {
      const tituloNormalizado = this.normalizarString(titulo);
      const artistaNormalizado = this.normalizarString(artista);
      
      // Buscar todas as músicas no repositório comum
      const docs = await dbService.getCollection(this.repositorioComumCollectionName);
      
      // Encontrar uma correspondência
      const musicaEncontrada = docs.find(doc => {
        const data = doc.data();
        return this.normalizarString(data.titulo) === tituloNormalizado && 
               this.normalizarString(data.artista) === artistaNormalizado;
      });
      
      if (musicaEncontrada) {
        return this.convertToMusica(musicaEncontrada);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar música no repositório comum:', error);
      return null;
    }
  }

  // Converter documento do banco de dados para objeto Musica
  private convertToMusica(doc: DocumentData): Musica {
    const data = doc.data();
    return {
      id: parseInt(doc.id) || Math.floor(Math.random() * 10000),
      titulo: data.titulo || '',
      artista: data.artista || '',
      tom: data.tom || '',
      letra: data.letra || '',
      andamento: data.andamento || '',
      tags: data.tags || [],
      dataCriacao: data.dataCriacao || new Date().toISOString().split('T')[0],
      favoritada: data.favoritada || false,
      youtubeLink: data.youtubeLink || '',
      cifraLink: data.cifraLink || '',
      letraLink: data.letraLink || '',
      buscaCompleta: data.buscaCompleta || false,
      // Campos do Deezer
      deezerId: data.deezerId || null,
      deezerLink: data.deezerLink || '',
      deezerPreview: data.deezerPreview || '',
      deezerCover: data.deezerCover || '',
      artistaImagem: data.artistaImagem || '',
      // Campos de ministério e repositório comum
      ministerioId: data.ministerioId || this.ministerioId,
      noRepositorioComum: data.noRepositorioComum || false,
      dataElegibilidadeRepositorio: data.dataElegibilidadeRepositorio || ''
    };
  }

  // Formatar data para string
  private formatarData(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Obter todas as músicas do banco de dados para o ministério atual
  async getTodasMusicas(): Promise<Musica[]> {
    try {
      // Sempre recarregar o ID do ministério para garantir que está atualizado
      this.carregarMinisterioId();
      
      // Se não houver ministério atual, retornar array vazio
      if (!this.ministerioId) {
        console.log('Nenhum ministério selecionado. Retornando lista vazia de músicas.');
        return [];
      }
      
      console.log(`Buscando músicas para o ministério: ${this.ministerioId}`);
      
      // Array para armazenar todas as músicas
      let todasMusicas: Musica[] = [];
      
      // 1. Obter músicas do ministério atual (todas elas, independente de estarem no repositório comum)
      const docsMinisterio = await dbService.queryDocuments(
        this.collectionName,
        [{ field: 'ministerioId', operator: '==', value: this.ministerioId }]
      );
      
      const musicasMinisterio = docsMinisterio.map(doc => this.convertToMusica(doc));
      console.log(`Encontradas ${musicasMinisterio.length} músicas do ministério atual.`);
      todasMusicas.push(...musicasMinisterio);
      
      // 2. Obter músicas de outros ministérios que estão no repositório comum
      const docsRepositorioComum = await dbService.queryDocuments(
        this.collectionName,
        [
          { field: 'ministerioId', operator: '!=', value: this.ministerioId },
          { field: 'noRepositorioComum', operator: '==', value: true }
        ]
      );
      
      const musicasRepositorioComum = docsRepositorioComum.map(doc => this.convertToMusica(doc));
      console.log(`Encontradas ${musicasRepositorioComum.length} músicas adicionais do repositório comum.`);
      
      todasMusicas.push(...musicasRepositorioComum);
      
      console.log(`Total de músicas disponíveis: ${todasMusicas.length}`);
      return todasMusicas;
    } catch (error) {
      console.error("Erro ao carregar músicas do banco de dados:", error);
      return [];
    }
  }

  // Verificar e corrigir possíveis inversões de título e artista
  private verificarInversaoTituloArtista(musica: Musica): Musica {
    // Lista de artistas conhecidos para verificação
    const artistasConhecidos = [
      "davi sacer", "aline barros", "fernandinho", "gabriela rocha", 
      "hillsong", "elevation", "bethel", "diante do trono", "morada",
      "vineyard", "adhemar de campos", "ministério zoe", "anderson freire",
      "toque no altar", "thalles roberto", "leonardo gonçalves", 
      "ministério avivah", "gabriela rocha", "isaias saad", "grande eu sou"
    ];
    
    // Se o título parecer ser um artista conhecido...
    if (musica.titulo && artistasConhecidos.some(a => this.normalizarString(musica.titulo).includes(this.normalizarString(a)))) {
      console.log(`INVERSÃO DETECTADA: O título "${musica.titulo}" parece ser um artista, e o artista "${musica.artista}" parece ser um título.`);
      console.log(`Sugerindo correção: Artista="${musica.titulo}", Título="${musica.artista}"`);
      
      // Criar uma nova música com os valores corrigidos
      const musicaCorrigida = {
        ...musica,
        titulo: musica.artista,
        artista: musica.titulo
      };
      
      return musicaCorrigida;
    }
    
    return musica;
  }

  // Salvar uma música no banco de dados
  async salvarMusica(musica: Musica): Promise<Musica> {
    try {
      // Verificar possível inversão de título e artista
      const musicaVerificada = this.verificarInversaoTituloArtista(musica);
      
      // Se a música foi corrigida, logar a correção
      if (musicaVerificada.titulo !== musica.titulo) {
        console.log(`Música corrigida automaticamente. Antes: "${musica.titulo}" - "${musica.artista}", Depois: "${musicaVerificada.titulo}" - "${musicaVerificada.artista}"`);
      }
      
      // Garantir que o ministerioId está definido
      if (!musicaVerificada.ministerioId) {
        musicaVerificada.ministerioId = this.ministerioId;
      }
      
      // Se a música já tem ID, atualiza
      if (musicaVerificada.id) {
        await dbService.setDocument(
          this.collectionName, 
          musicaVerificada.id.toString(), 
          musicaVerificada
        );
        return musicaVerificada;
      } 
      // Caso contrário, adiciona nova
      else {
        const newId = Date.now();
        const novaMusica = {
          ...musicaVerificada,
          id: newId,
          dataCriacao: new Date().toISOString().split('T')[0],
          ministerioId: this.ministerioId,
          // Definir data de elegibilidade para o repositório comum (3 dias após criação)
          dataElegibilidadeRepositorio: this.calcularDataElegibilidadeRepositorio(3)
        };
        
        await dbService.setDocument(
          this.collectionName, 
          newId.toString(), 
          novaMusica
        );
        
        return novaMusica;
      }
    } catch (error) {
      console.error("Erro ao salvar música no banco de dados:", error);
      return musica;
    }
  }

  // Calcular a data em que uma música se torna elegível para o repositório comum
  private calcularDataElegibilidadeRepositorio(diasParaElegibilidade: number): string {
    const hoje = new Date();
    const dataElegibilidade = new Date(hoje);
    dataElegibilidade.setDate(hoje.getDate() + diasParaElegibilidade);
    
    console.log(`Data calculada para elegibilidade no repositório comum: ${dataElegibilidade.toISOString()}`);
    console.log(`Música será compartilhada em ${diasParaElegibilidade} dias (${this.formatarData(dataElegibilidade)})`);
    
    return dataElegibilidade.toISOString();
  }

  // Excluir uma música do banco de dados
  async excluirMusica(id: number): Promise<boolean> {
    try {
      await dbService.deleteDocument(this.collectionName, id.toString());
      return true;
    } catch (error) {
      console.error("Erro ao excluir música do banco de dados:", error);
      return false;
    }
  }

  // Alternar estado de favorito de uma música
  async alternarFavorito(id: number): Promise<boolean> {
    try {
      const docSnap = await dbService.getDocument(this.collectionName, id.toString());
      
      if (docSnap) {
        const musica = docSnap.data();
        const novoEstado = !musica.favoritada;
        
        const musicaAtualizada = {
          ...musica,
          favoritada: novoEstado
        };
        
        await dbService.setDocument(
          this.collectionName, 
          id.toString(), 
          musicaAtualizada
        );
        
        return novoEstado;
      }
      return false;
    } catch (error) {
      console.error("Erro ao alternar favorito no banco de dados:", error);
      return false;
    }
  }

  // Buscar música por título e artista no banco de dados local e no repositório comum
  async buscarMusicaPorTituloEArtista(titulo: string, artista: string): Promise<Musica | null> {
    try {
      const tituloNormalizado = this.normalizarString(titulo);
      const artistaNormalizado = this.normalizarString(artista);
      
      // Buscar primeiro no banco de dados local (ministério atual)
      const docs = await dbService.queryDocuments(
        this.collectionName,
        [
          { field: 'ministerioId', operator: '==', value: this.ministerioId },
          { field: 'titulo', operator: '==', value: titulo },
          { field: 'artista', operator: '==', value: artista }
        ]
      );
      
      if (docs.length > 0) {
        return this.convertToMusica(docs[0]);
      }
      
      // Busca secundária mais flexível no banco local
      const todasMusicas = await this.getTodasMusicas();
      const musicaEncontrada = todasMusicas.find(musica => 
        this.normalizarString(musica.titulo) === tituloNormalizado && 
        this.normalizarString(musica.artista) === artistaNormalizado
      );
      
      if (musicaEncontrada) {
        return musicaEncontrada;
      }
      
      // Se não encontrou no banco local, buscar no repositório comum
      return await this.buscarMusicaNoRepositorioComum(titulo, artista);
    } catch (error) {
      console.error("Erro ao buscar música no banco de dados:", error);
      return null;
    }
  }

  // Pesquisar no banco de dados local e no repositório comum com texto livre
  async pesquisarNoBanco(termo: string): Promise<ResultadoPesquisa[]> {
    try {
      // Sempre recarregar o ID do ministério para garantir que está atualizado
      this.carregarMinisterioId();
      
      // Se não houver ministério atual, retornar array vazio
      if (!this.ministerioId) {
        console.log('Nenhum ministério selecionado. Retornando lista vazia na pesquisa.');
        return [];
      }
      
      const termoNormalizado = this.normalizarString(termo);
      if (!termoNormalizado) return [];
      
      console.log(`Pesquisando músicas para o termo "${termo}" no ministério: ${this.ministerioId}`);
      
      // 1. Buscar no banco de dados local (ministério atual)
      const todasMusicas = await this.getTodasMusicas(); // Já filtra pelo ministério atual
      const resultadosLocais = this.filtrarMusicas(todasMusicas, termoNormalizado);
      console.log(`Encontradas ${resultadosLocais.length} músicas locais correspondentes.`);
      
      // 2. Buscar no repositório comum
      const musicasRepositorio = await this.getTodasMusicasRepositorioComum();
      const resultadosRepositorio = this.filtrarMusicas(musicasRepositorio, termoNormalizado)
        .map(musica => ({
          id: musica.id,
          titulo: musica.titulo,
          artista: musica.artista,
          origem: 'repositorio' as const,
          ministerioId: musica.ministerioId,
          deezerId: musica.deezerId,
          deezerCover: musica.deezerCover,
          artistaImagem: musica.artistaImagem
        }));
      console.log(`Encontradas ${resultadosRepositorio.length} músicas no repositório comum correspondentes.`);
      
      // 3. Filtrar resultados do repositório para remover duplicatas que já existem no banco local
      const titulosArtistasLocais = new Set(resultadosLocais.map(res => 
        `${this.normalizarString(res.titulo)}_${this.normalizarString(res.artista)}`
      ));
      
      const resultadosRepositorioFiltrados = resultadosRepositorio.filter(res => 
        !titulosArtistasLocais.has(`${this.normalizarString(res.titulo)}_${this.normalizarString(res.artista)}`)
      );
      
      // 4. Combinar resultados, priorizando os locais
      const resultadosCombinados = [...resultadosLocais, ...resultadosRepositorioFiltrados];
      console.log(`Total de resultados da pesquisa: ${resultadosCombinados.length}`);
      
      return resultadosCombinados;
    } catch (error) {
      console.error("Erro ao pesquisar no banco de dados:", error);
      return [];
    }
  }

  // Filtra músicas baseado em um termo de busca
  private filtrarMusicas(musicas: Musica[], termoNormalizado: string): ResultadoPesquisa[] {
    // Primeira passagem: Correspondência exata nos títulos e artistas
    let resultados: ResultadoPesquisa[] = [];
    
    for (const musica of musicas) {
      const tituloNormalizado = this.normalizarString(musica.titulo);
      const artistaNormalizado = this.normalizarString(musica.artista);
      
      // Verificar se é uma correspondência exata
      const isExataNoTitulo = tituloNormalizado === termoNormalizado;
      const isExataNoArtista = artistaNormalizado === termoNormalizado;
      
      // Verificar se contém o termo
      const contemNoTitulo = tituloNormalizado.includes(termoNormalizado);
      const contemNoArtista = artistaNormalizado.includes(termoNormalizado);
      
      // Verificar tags e outras informações
      const contemNasTags = musica.tags?.some(tag => 
        this.normalizarString(tag).includes(termoNormalizado)
      ) || false;
      
      const contemNoTom = musica.tom ? this.normalizarString(musica.tom).includes(termoNormalizado) : false;
      
      // Calcular pontuação
      let score = 0;
      
      if (isExataNoTitulo) score += 100;
      else if (contemNoTitulo) score += 80;
      
      if (isExataNoArtista) score += 90;
      else if (contemNoArtista) score += 70;
      
      if (contemNasTags) score += 50;
      if (contemNoTom) score += 40;
      
      // Se a música está no repositório comum, aumentar a pontuação
      if (musica.noRepositorioComum) score += 200;
      
      // Verificar se há correspondência em qualquer campo
      const temCorrespondencia = isExataNoTitulo || isExataNoArtista || 
        contemNoTitulo || contemNoArtista || contemNasTags || contemNoTom;
      
      // Adicionar à lista de resultados
      if (temCorrespondencia) {
        resultados.push({
          id: musica.id,
          titulo: musica.titulo,
          artista: musica.artista,
          origem: musica.noRepositorioComum ? 'repositorio' as const : 'local' as const,
          deezerId: musica.deezerId,
          deezerCover: musica.deezerCover,
          artistaImagem: musica.artistaImagem,
          ministerioId: musica.ministerioId,
          score: score,
          tom: musica.tom
        });
      }
    }
    
    // Ordenar por pontuação
    resultados.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      
      // Primeiro critério: músicas do repositório têm prioridade
      if (a.origem === 'repositorio' && b.origem !== 'repositorio') return -1;
      if (a.origem !== 'repositorio' && b.origem === 'repositorio') return 1;
      
      // Segundo critério: pontuação de relevância
      return scoreB - scoreA;
    });
    
    return resultados;
  }

  // Obter todas as músicas do repositório comum
  async getTodasMusicasRepositorioComum(): Promise<Musica[]> {
    try {
      const docs = await dbService.getCollection(this.repositorioComumCollectionName);
      return docs.map(doc => this.convertToMusica(doc));
    } catch (error) {
      console.error("Erro ao carregar músicas do repositório comum:", error);
      return [];
    }
  }

  // Pesquisar online por músicas (atualizado para usar a API do Deezer)
  async pesquisarOnline(termo: string): Promise<ResultadoPesquisa[]> {
    try {
      const termoNormalizado = this.normalizarString(termo);
      if (!termoNormalizado) return [];
      
      // Tentativa de separar artista e título se o usuário digitou ambos
      const possiveisTermos = this.separarArtistaTitulo(termo);
      
      // Buscar no Deezer com o termo original primeiro
      console.log("Buscando no Deezer:", termo);
      let tracks = await deezerService.searchTracks(termo);
      
      // Se não encontrou resultados, tenta com os termos separados
      if (tracks.length === 0 && possiveisTermos.artista && possiveisTermos.titulo) {
        console.log(`Buscando no Deezer com termos separados - Título: ${possiveisTermos.titulo}, Artista: ${possiveisTermos.artista}`);
        const queryEstruturada = `artist:"${possiveisTermos.artista}" track:"${possiveisTermos.titulo}"`;
        tracks = await deezerService.searchTracks(queryEstruturada);
      }
      
      if (tracks.length === 0) {
        console.log("Nenhum resultado encontrado no Deezer, usando fallback");
        // Fallback para nossos dados simulados se o Deezer não retornar resultados
        // Usar possíveis artistas detectados, ou gerar aleatórios
        const artistas = possiveisTermos.artista ? 
          [possiveisTermos.artista, ...this.gerarArtistasBaseadosNoTermo(termo).slice(0, 3)] : 
          this.gerarArtistasBaseadosNoTermo(termo);
        
        const titulo = possiveisTermos.titulo || termo;
        const titulos = this.gerarVariacoesTitulo(titulo);
        
        const resultados: ResultadoPesquisa[] = [];
        
        artistas.forEach((artista, index) => {
          const tituloFinal = index < titulos.length ? titulos[index] : titulo;
          
          resultados.push({
            titulo: tituloFinal,
            artista,
            origem: 'online'
          });
        });
        
        return resultados;
      }
      
      console.log(`Encontrados ${tracks.length} resultados no Deezer`);
      
      // Processar e priorizar os resultados
      const resultadosPriorizados = this.priorizarResultadosDeezer(tracks, possiveisTermos.titulo || termo, possiveisTermos.artista);
      
      // Converter resultados do Deezer para nosso formato
      return resultadosPriorizados.map(track => ({
        titulo: track.title,
        artista: track.artist.name,
        origem: 'online',
        deezerId: track.id,
        deezerCover: track.album.cover_medium,
        artistaImagem: track.artist.picture_medium || track.artist.picture
      }));
    } catch (error) {
      console.error("Erro ao pesquisar no Deezer:", error);
      
      // Em caso de erro na API, retornar resultados locais
      console.log("Usando dados locais devido a erro na API");
      const possiveisTermos = this.separarArtistaTitulo(termo);
      
      const artistas = possiveisTermos.artista ? 
        [possiveisTermos.artista, ...this.gerarArtistasBaseadosNoTermo(termo).slice(0, 2)] : 
        this.gerarArtistasBaseadosNoTermo(termo);
      
      const titulo = possiveisTermos.titulo || termo;
      const titulos = this.gerarVariacoesTitulo(titulo);
      
      const resultados: ResultadoPesquisa[] = [];
      
      artistas.forEach((artista, index) => {
        const tituloFinal = index < titulos.length ? titulos[index] : titulo;
        
        resultados.push({
          titulo: tituloFinal,
          artista,
          origem: 'online'
        });
      });
      
      return resultados;
    }
  }

  // Priorizar resultados do Deezer com base na relevância e qualidade
  private priorizarResultadosDeezer(tracks: DeezerTrack[], titulo?: string, artista?: string): DeezerTrack[] {
    // Se não temos título ou artista de referência, retornar a ordem original
    if (!titulo && !artista) return tracks;
    
    // Clonar o array para não modificar o original
    const tracksParaOrdenar = [...tracks];
    
    // Normalizar título e artista de referência
    const tituloNormalizado = titulo ? this.normalizarString(titulo) : '';
    const artistaNormalizado = artista ? this.normalizarString(artista) : '';
    
    // Ordenar os resultados baseado em uma pontuação de relevância
    return tracksParaOrdenar.sort((a, b) => {
      // Pontuação inicial é 0 para ambos
      let pontuacaoA = 0;
      let pontuacaoB = 0;
      
      // Título e artista normalizados de cada track
      const tituloA = this.normalizarString(a.title);
      const artistaA = this.normalizarString(a.artist.name);
      const tituloB = this.normalizarString(b.title);
      const artistaB = this.normalizarString(b.artist.name);
      
      // Pontos para correspondência de título
      if (tituloNormalizado) {
        if (tituloA === tituloNormalizado) pontuacaoA += 5;
        else if (tituloA.includes(tituloNormalizado)) pontuacaoA += 3;
        else if (tituloNormalizado.includes(tituloA)) pontuacaoA += 2;
        
        if (tituloB === tituloNormalizado) pontuacaoB += 5;
        else if (tituloB.includes(tituloNormalizado)) pontuacaoB += 3;
        else if (tituloNormalizado.includes(tituloB)) pontuacaoB += 2;
      }
      
      // Pontos para correspondência de artista
      if (artistaNormalizado) {
        if (artistaA === artistaNormalizado) pontuacaoA += 5;
        else if (artistaA.includes(artistaNormalizado)) pontuacaoA += 3;
        else if (artistaNormalizado.includes(artistaA)) pontuacaoA += 2;
        
        if (artistaB === artistaNormalizado) pontuacaoB += 5;
        else if (artistaB.includes(artistaNormalizado)) pontuacaoB += 3;
        else if (artistaNormalizado.includes(artistaB)) pontuacaoB += 2;
      }
      
      // Penalizar versões ao vivo, acústicas, remixes, etc.
      if (/ao vivo|live|acoustic|acustic|cover|remix/i.test(a.title)) pontuacaoA -= 2;
      if (/ao vivo|live|acoustic|acustic|cover|remix/i.test(b.title)) pontuacaoB -= 2;
      
      // Ordenar pela pontuação (maior primeiro)
      return pontuacaoB - pontuacaoA;
    });
  }

  // Função auxiliar para gerar artistas (mantida para o fallback)
  private gerarArtistasBaseadosNoTermo(termo: string): string[] {
    const artistas = [
      "Hillsong United", "Elevation Worship", "Tasha Cobbs", "Bethel Music", 
      "Jesus Culture", "Gabriela Rocha", "Tori Kelly", "Isadora Pompeo",
      "Aline Barros", "Fernandinho", "Diante do Trono", "Laura Souguellis",
      "Morada", "Maverick City Music", "Casting Crowns", "Chris Tomlin"
    ];
    
    // Selecionar 3-5 artistas aleatoriamente
    const numArtistas = Math.floor(Math.random() * 3) + 3;
    const artistasSelecionados = [];
    
    for (let i = 0; i < numArtistas; i++) {
      const idx = Math.floor(Math.random() * artistas.length);
      artistasSelecionados.push(artistas[idx]);
      artistas.splice(idx, 1); // Evitar duplicatas
    }
    
    return artistasSelecionados;
  }
  
  // Função auxiliar para gerar variações de títulos (mantida para o fallback)
  private gerarVariacoesTitulo(termo: string): string[] {
    return [
      termo,
      `${termo} (Versão Acústica)`,
      `${termo} - Ao Vivo`,
      `${termo} (Remix)`,
      `${termo} ft. convidado`
    ];
  }

  // Adicionar um novo método para busca intuitiva
  async buscarMusicaIntuitiva(termo: string): Promise<ResultadoPesquisa[]> {
    if (!termo.trim()) return [];
    
    try {
      console.log('Iniciando busca intuitiva para:', termo);
      
      // Buscar resultados usando o serviço de busca intuitiva
      const resultadosIntuitivos = await searchService.intuitiveSearch(termo);
      
      // Verificar se encontramos algo com alta confiança
      const temResultadoConfiavel = resultadosIntuitivos.some(r => r.score >= 80);
      
      // Se não temos resultados confiáveis, também buscar no Deezer
      let resultadosDeezer: ResultadoPesquisa[] = [];
      if (!temResultadoConfiavel) {
        console.log('Sem resultados de alta confiança, buscando também no Deezer');
        resultadosDeezer = await this.pesquisarOnline(termo);
      }
      
      // Buscar no banco de dados local usando o melhor palpite da busca intuitiva
      let resultadosLocais: ResultadoPesquisa[] = [];
      let resultadosRepositorio: ResultadoPesquisa[] = [];
      
      if (resultadosIntuitivos.length > 0) {
        const melhorPalpite = resultadosIntuitivos[0]; // O primeiro resultado tem o maior score
        
        // Buscar no banco local
        resultadosLocais = await this.pesquisarNoBanco(`${melhorPalpite.artista} ${melhorPalpite.titulo}`);
        
        // Verificar se já temos resultados do repositório comum (incluídos pelo pesquisarNoBanco)
        resultadosRepositorio = resultadosLocais.filter(r => r.origem === 'repositorio');
        // Filtrar para manter apenas resultados locais
        resultadosLocais = resultadosLocais.filter(r => r.origem === 'local');
      }
      
      // Converter resultados intuitivos para o formato de ResultadoPesquisa
      const resultadosConvertidos: ResultadoPesquisa[] = resultadosIntuitivos.map(r => ({
        titulo: r.titulo,
        artista: r.artista,
        origem: r.origem === 'google' ? 'google' : 'online',
        score: r.score,
        link: r.link,
        deezerId: r.deezerId ? Number(r.deezerId) : undefined,
        deezerCover: r.deezerCover,
        artistaImagem: r.artistaImagem
      }));
      
      // Remover duplicatas entre todas as fontes e organizar por relevância
      return this.consolidarResultadosDeBusca([
        ...resultadosLocais, 
        ...resultadosRepositorio,
        ...resultadosConvertidos,
        ...resultadosDeezer
      ]);
    } catch (error) {
      console.error('Erro ao realizar busca intuitiva:', error);
      // Em caso de erro, cair para o método de busca padrão
      return this.pesquisarMusicasCombinadas(termo);
    }
  }
  
  // Método para consolidar resultados de diferentes fontes e remover duplicatas
  private consolidarResultadosDeBusca(resultados: ResultadoPesquisa[]): ResultadoPesquisa[] {
    // Mapa para rastrear resultados únicos, usando a combinação normalizada de artista+título como chave
    const resultadosUnicos = new Map<string, ResultadoPesquisa>();
    
    for (const resultado of resultados) {
      const chave = `${this.normalizarString(resultado.artista)}_${this.normalizarString(resultado.titulo)}`;
      
      // Se já existe um resultado com esta chave, manter o de maior score ou o que vem do banco local
      if (resultadosUnicos.has(chave)) {
        const existente = resultadosUnicos.get(chave)!;
        
        // Prioridade: local > google > online
        const prioridadeExistente = existente.origem === 'local' ? 3 : existente.origem === 'google' ? 2 : 1;
        const prioridadeAtual = resultado.origem === 'local' ? 3 : resultado.origem === 'google' ? 2 : 1;
        
        // Manter o resultado com maior prioridade
        if (prioridadeAtual > prioridadeExistente) {
          resultadosUnicos.set(chave, resultado);
        }
        // Se têm a mesma prioridade, usar o score
        else if (prioridadeAtual === prioridadeExistente && 
                 resultado.score && existente.score && 
                 resultado.score > existente.score) {
          resultadosUnicos.set(chave, resultado);
        }
        // Se ambos tiverem a mesma prioridade e não tiverem score, preferir o resultado com mais campos preenchidos
        else if (prioridadeAtual === prioridadeExistente && 
                (!resultado.score || !existente.score)) {
          const camposExistente = Object.keys(existente).filter(k => existente[k as keyof ResultadoPesquisa]).length;
          const camposAtual = Object.keys(resultado).filter(k => resultado[k as keyof ResultadoPesquisa]).length;
          
          if (camposAtual > camposExistente) {
            resultadosUnicos.set(chave, resultado);
          }
        }
      } 
      else {
        // Se não existe, adicionar diretamente
        resultadosUnicos.set(chave, resultado);
      }
    }
    
    // Converter de volta para array e ordenar por relevância
    const resultadosFinais = Array.from(resultadosUnicos.values());
    
    // Ordenar por: origem (local > google > online) e depois por score
    return resultadosFinais.sort((a, b) => {
      // Prioridade de origem
      const prioridadeA = a.origem === 'local' ? 3 : a.origem === 'google' ? 2 : 1;
      const prioridadeB = b.origem === 'local' ? 3 : b.origem === 'google' ? 2 : 1;
      
      if (prioridadeA !== prioridadeB) {
        return prioridadeB - prioridadeA;
      }
      
      // Se a origem é a mesma, ordenar por score
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    });
  }

  // Melhora o método de pesquisa combinada para incluir músicas do repositório comum
  async pesquisarMusicasCombinadas(termo: string): Promise<ResultadoPesquisa[]> {
    try {
      // Se o termo parecer uma busca intuitiva (contém múltiplas palavras sem o separador '-'), 
      // usar a nova busca intuitiva
      if (termo.split(' ').length > 2 && !termo.includes('-')) {
        const resultadosIntuitivos = await this.buscarMusicaIntuitiva(termo);
        
        // Identificar quais resultados são do repositório comum
        const resultadosRepositorio = resultadosIntuitivos.filter(r => r.origem === 'repositorio');
        const resultadosOutros = resultadosIntuitivos.filter(r => r.origem !== 'repositorio');
        
        // Retornar com prioridade para o repositório comum
        return [...resultadosRepositorio, ...resultadosOutros];
      }
      
      // Caso contrário, usar o método original com adição do repositório comum
      const [resultadosLocais, resultadosOnline] = await Promise.all([
        this.pesquisarNoBanco(termo), // Já inclui resultados do repositório comum
        this.pesquisarOnline(termo)
      ]);
      
      // Separar resultados locais dos resultados do repositório
      const resultadosApenasLocais = resultadosLocais.filter(r => r.origem === 'local');
      const resultadosRepositorio = resultadosLocais.filter(r => r.origem === 'repositorio');
      
      // Filtrar resultados online para remover duplicatas que já existem no banco local
      const titulosArtistasLocais = new Set(resultadosLocais.map(res => 
        `${this.normalizarString(res.titulo)}_${this.normalizarString(res.artista)}`
      ));
      
      const resultadosOnlineFiltrados = resultadosOnline.filter(res => 
        !titulosArtistasLocais.has(`${this.normalizarString(res.titulo)}_${this.normalizarString(res.artista)}`)
      );
      
      // Combinar resultados, colocando primeiro o repositório comum, depois os locais e por fim os online
      return [...resultadosRepositorio, ...resultadosApenasLocais, ...resultadosOnlineFiltrados];
    } catch (error) {
      console.error("Erro ao realizar pesquisa combinada:", error);
      return [];
    }
  }

  // Normalizar string para comparação (remover acentos, espaços extras, maiúsculas)
  private normalizarString(str: string): string {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Buscar letra da música no site letras.mus.br
  async buscarLetra(artista: string, titulo: string): Promise<string> {
    try {
      // Verificar se parece que título e artista estão invertidos
      // Alguns artistas conhecidos que podem estar no campo errado
      const artistasConhecidos = [
        "davi sacer", "aline barros", "fernandinho", "gabriela rocha", 
        "hillsong", "elevation", "bethel", "diante do trono", "morada",
        "vineyard", "adhemar de campos", "ministério zoe", "anderson freire"
      ];
      
      let artistaCorrigido = artista;
      let tituloCorrigido = titulo;
      
      // Verificar se o título parece ser um artista conhecido
      if (titulo && artistasConhecidos.some(a => this.normalizarString(titulo).includes(this.normalizarString(a)))) {
        console.log(`buscarLetra - Possível inversão detectada: "${titulo}" parece ser um artista, enquanto "${artista}" parece ser um título.`);
        // Trocar título e artista para corrigir
        artistaCorrigido = titulo;
        tituloCorrigido = artista;
        console.log(`buscarLetra - Corrigindo para: Artista="${artistaCorrigido}", Título="${tituloCorrigido}"`);
      }
      
      // Gerar URL com os valores corrigidos
      const url = this.gerarLinkLetra(artistaCorrigido, tituloCorrigido);
      
      // Tentar obter a letra diretamente (isso seria mais complexo na prática, necessitando de um servidor backend para o scraping)
      // Como é apenas uma simulação, vamos retornar um texto informativo
      return `Letra de ${tituloCorrigido} - ${artistaCorrigido}\n\nA letra completa estaria disponível em: ${url}\n\nPor limitações técnicas, não podemos mostrar a letra completa.\nVocê pode acessar a letra completa clicando no botão "Ver Letra Online".`;
    } catch (error) {
      console.error("Erro ao buscar letra:", error);
      return `Não foi possível obter a letra de ${titulo} - ${artista}. Tente acessar diretamente no site.`;
    }
  }

  // Buscar vídeo no YouTube
  async buscarVideoYoutube(termo: string): Promise<string> {
    try {
      const apiKey = YOUTUBE_API_KEY;
      const termoFormatado = termo.replace(/\s+/g, '%20');
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${termoFormatado}&type=video&key=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const videoId = data.items[0].id.videoId;
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
      
      return '';
    } catch (error) {
      console.error("Erro ao buscar vídeo do YouTube:", error);
      return '';
    }
  }

  // Gerar link para cifra no Cifras Club
  gerarLinkCifra(artista: string, titulo: string): string {
    // Verificar se parece que título e artista estão invertidos
    // Alguns artistas conhecidos que podem estar no campo errado
    const artistasConhecidos = [
      "davi sacer", "aline barros", "fernandinho", "gabriela rocha", 
      "hillsong", "elevation", "bethel", "diante do trono", "morada",
      "vineyard", "adhemar de campos", "ministério zoe", "anderson freire"
    ];
    
    let artistaCorrigido = artista;
    let tituloCorrigido = titulo;
    
    // Verificar se o título parece ser um artista conhecido
    if (titulo && artistasConhecidos.some(a => this.normalizarString(titulo).includes(this.normalizarString(a)))) {
      console.log(`CifraClub - Possível inversão detectada: "${titulo}" parece ser um artista, enquanto "${artista}" parece ser um título.`);
      // Trocar título e artista para corrigir
      artistaCorrigido = titulo;
      tituloCorrigido = artista;
      console.log(`CifraClub - Corrigindo para: Artista="${artistaCorrigido}", Título="${tituloCorrigido}"`);
    }
    
    // Formatar artista e título
    const artistaFormatado = this.formatarParaURL(artistaCorrigido);
    const tituloFormatado = this.formatarParaURL(tituloCorrigido);
    
    // Gerar a URL do CifraClub
    const url = `https://www.cifraclub.com.br/${artistaFormatado}/${tituloFormatado}/`;
    
    console.log('CifraClub - URL gerado:', url);
    return url;
  }

  // Gerar link para letra no letras.mus.br
  gerarLinkLetra(artista: string, titulo: string): string {
    // Verificar se parece que título e artista estão invertidos
    // Alguns artistas conhecidos que podem estar no campo errado
    const artistasConhecidos = [
      "davi sacer", "aline barros", "fernandinho", "gabriela rocha", 
      "hillsong", "elevation", "bethel", "diante do trono", "morada",
      "vineyard", "adhemar de campos", "ministério zoe", "anderson freire"
    ];
    
    let artistaCorrigido = artista;
    let tituloCorrigido = titulo;
    
    // Verificar se o título parece ser um artista conhecido
    if (titulo && artistasConhecidos.some(a => this.normalizarString(titulo).includes(this.normalizarString(a)))) {
      console.log(`Possível inversão detectada: "${titulo}" parece ser um artista, enquanto "${artista}" parece ser um título.`);
      // Trocar título e artista para corrigir
      artistaCorrigido = titulo;
      tituloCorrigido = artista;
      console.log(`Corrigindo para: Artista="${artistaCorrigido}", Título="${tituloCorrigido}"`);
    }
    
    // Normalizar e formatar o texto para URL
    const artistaFormatado = this.formatarParaURL(artistaCorrigido);
    const tituloFormatado = this.formatarParaURL(tituloCorrigido);
    
    // Se não temos título, gerar um link para a página do artista
    if (!tituloFormatado || tituloFormatado === "") {
      const url = `https://www.letras.mus.br/${artistaFormatado}/letras-de-musicas/`;
      console.log('gerarLinkLetra - URL para artista:', url);
      return url;
    }
    
    // Ordem correta: primeiro artista, depois título da música
    const url = `https://www.letras.mus.br/${artistaFormatado}/${tituloFormatado}/`;
    
    // Depuração - remover após testar
    console.log('gerarLinkLetra - Parâmetros originais:', {artista, titulo});
    console.log('gerarLinkLetra - Parâmetros corrigidos:', {artista: artistaCorrigido, titulo: tituloCorrigido});
    console.log('gerarLinkLetra - Formatados:', {artistaFormatado, tituloFormatado});
    console.log('gerarLinkLetra - URL gerado:', url);
    
    return url;
  }
  
  // Método auxiliar para formatar texto para URL
  private formatarParaURL(texto: string): string {
    if (!texto) return "";
    
    // Normalizar texto (remover acentos, converter para minúsculas)
    const normalizado = texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    // Substituir espaços por hífens e remover caracteres especiais
    const formatado = normalizado
      .replace(/\s+/g, "-")        // Substitui espaços por hífens
      .replace(/[^a-z0-9-]/g, "")  // Remove caracteres especiais
      .replace(/-+/g, "-")         // Remove múltiplos hífens consecutivos
      .replace(/^-|-$/g, "");      // Remove hífens no início ou fim
    
    console.log(`Formatando texto "${texto}" para URL: "${formatado}"`);
    return formatado;
  }

  // Completar dados da música com informações de APIs externas
  async completarDadosMusica(musica: Musica): Promise<Musica> {
    try {
      // Se a música já está completa, retorna ela mesma
      if (musica.buscaCompleta) {
        return musica;
      }
      
      // Verificar possível inversão de título e artista
      const musicaVerificada = this.verificarInversaoTituloArtista(musica);
      
      // Se a música foi corrigida, atualizar no banco antes de prosseguir
      if (musicaVerificada.titulo !== musica.titulo) {
        console.log(`Música corrigida antes de buscar dados. Antes: "${musica.titulo}" - "${musica.artista}", Depois: "${musicaVerificada.titulo}" - "${musicaVerificada.artista}"`);
        // Salvar as correções no banco de dados
        await this.salvarMusica(musicaVerificada);
        // Continuar com os dados corrigidos
        musica = musicaVerificada;
      }
      
      // Se não tem letra, buscar
      if (!musica.letra) {
        musica.letra = await this.buscarLetra(musica.artista, musica.titulo);
      }
      
      // Se não tem link do YouTube, buscar
      if (!musica.youtubeLink) {
        musica.youtubeLink = await this.buscarVideoYoutube(`${musica.titulo} ${musica.artista}`);
      }
      
      // Se não tem link de cifra ou tom, buscar via Google (nova funcionalidade)
      if (!musica.cifraLink || !musica.tom) {
        try {
          console.log('Buscando informações musicais via Google CSE...');
          const musicInfo = await googleSearchService.searchMusicInfo(musica.artista, musica.titulo);
          
          // Processar resultados da busca de cifras
          if (musicInfo.cifras.length > 0 && !musica.cifraLink) {
            // Usar o primeiro resultado como cifra principal
            musica.cifraLink = musicInfo.cifras[0].link;
            console.log(`Cifra encontrada: ${musica.cifraLink} (${musicInfo.cifras[0].source})`);
            
            // Se o tom não está definido, verificar se foi encontrado na busca de cifra
            if (!musica.tom && musicInfo.cifras[0].tom) {
              musica.tom = musicInfo.cifras[0].tom;
              console.log(`Tom extraído da cifra: ${musica.tom}`);
            }
            
            // Se o andamento não está definido, verificar se foi encontrado na busca de cifra
            if (!musica.andamento && musicInfo.cifras[0].andamento) {
              musica.andamento = musicInfo.cifras[0].andamento;
              console.log(`Andamento extraído da cifra: ${musica.andamento}`);
            }
          } else if (!musica.cifraLink) {
            // Fallback para o método antigo se não encontrar via Google
            // Forçar a ordem correta: artista/título
            const artistaFormatado = this.formatarParaURL(musica.artista);
            const tituloFormatado = this.formatarParaURL(musica.titulo);
            musica.cifraLink = `https://www.cifraclub.com.br/${artistaFormatado}/${tituloFormatado}/`;
            console.log(`Nenhuma cifra encontrada via Google, usando geração padrão forçada: ${musica.cifraLink}`);
          }
          
          // Processar resultado da busca de tom
          if (musicInfo.tom && !musica.tom) {
            musica.tom = musicInfo.tom.tom;
            console.log(`Tom encontrado: ${musica.tom} (confiança: ${musicInfo.tom.confianca}%, fonte: ${musicInfo.tom.fonte})`);
          }
        } catch (error) {
          console.error('Erro ao buscar informações musicais via Google:', error);
          // Fallback para o método antigo em caso de erro
          if (!musica.cifraLink) {
            // Forçar a ordem correta: artista/título
            const artistaFormatado = this.formatarParaURL(musica.artista);
            const tituloFormatado = this.formatarParaURL(musica.titulo);
            musica.cifraLink = `https://www.cifraclub.com.br/${artistaFormatado}/${tituloFormatado}/`;
            console.log(`Fallback para cifra com ordem forçada: ${musica.cifraLink}`);
          }
        }
      }
      
      // Adicionar link para letra online se não existir
      if (!musica.letraLink) {
        console.log('Gerando link para letra com artista:', musica.artista, 'e título:', musica.titulo);
        
        // Forçar a ordem correta: artista/título
        const artistaFormatado = this.formatarParaURL(musica.artista);
        const tituloFormatado = this.formatarParaURL(musica.titulo);
        musica.letraLink = `https://www.letras.mus.br/${artistaFormatado}/${tituloFormatado}/`;
        
        console.log('Link para letra gerado (forçando ordem correta):', musica.letraLink);
      }
      
      // Buscar informações do Deezer se ainda não tiver
      if (!musica.deezerId) {
        // Usar a versão melhorada para buscar no Deezer
        const deezerTrack = await deezerService.searchByTitleAndArtist(musica.titulo, musica.artista);
        
        if (deezerTrack) {
          musica.deezerId = deezerTrack.id;
          musica.deezerLink = deezerTrack.link || `https://www.deezer.com/track/${deezerTrack.id}`;
          musica.deezerPreview = deezerTrack.preview;
          musica.deezerCover = deezerTrack.album.cover_medium;
          musica.artistaImagem = deezerTrack.artist.picture_medium || deezerTrack.artist.picture;
          
          console.log(`Informações do Deezer obtidas para: ${musica.titulo} - ID: ${musica.deezerId}`);
        } else {
          console.log(`Não foi possível encontrar correspondência no Deezer para: ${musica.titulo} - ${musica.artista}`);
        }
      }
      
      // Marcar a música como completa
      musica.buscaCompleta = true;
      
      // Salvar a música atualizada no banco de dados
      await this.salvarMusica(musica);
      
      return musica;
    } catch (error) {
      console.error("Erro ao completar dados da música:", error);
      return musica;
    }
  }

  // Adicionar nova música com busca completa
  async adicionarNovaMusica(musica: Omit<Musica, 'id' | 'dataCriacao' | 'buscaCompleta'>): Promise<Musica> {
    try {
      // Definir se a música deve ir para o repositório comum ou ficar exclusiva do ministério
      const isMinisterioAdmin = await this.verificarSeUsuarioIsAdmin();
      
      // Criar música básica
      const novaMusica: Musica = {
        ...musica,
        id: Date.now(),
        dataCriacao: new Date().toISOString().split('T')[0],
        buscaCompleta: false,
        // Se adicionada por um administrador, a música fica exclusiva do ministério por 3 dias
        // Caso contrário, vai direto para o repositório comum
        noRepositorioComum: !isMinisterioAdmin,
        // Definir data de elegibilidade para o repositório comum (3 dias a partir de agora)
        dataElegibilidadeRepositorio: isMinisterioAdmin 
          ? this.calcularDataElegibilidadeRepositorio(3) // 3 dias para admins
          : new Date().toISOString() // Imediatamente para usuários normais
      };
      
      console.log('Adicionando nova música:', novaMusica.titulo, 'por', novaMusica.artista);
      console.log('Status de compartilhamento:', isMinisterioAdmin ? 'Exclusiva por 3 dias' : 'Compartilhada imediatamente');
      
      // Salvar no banco de dados inicialmente
      await this.salvarMusica(novaMusica);
      
      // Completar dados com APIs externas
      return await this.completarDadosMusica(novaMusica);
    } catch (error) {
      console.error("Erro ao adicionar nova música:", error);
      return {
        ...musica,
        id: Date.now(),
        dataCriacao: new Date().toISOString().split('T')[0],
        buscaCompleta: false
      };
    }
  }

  // Verificar se o usuário atual é administrador do ministério
  private async verificarSeUsuarioIsAdmin(): Promise<boolean> {
    try {
      // Obter dados do usuário do localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return false;
      
      const usuario = JSON.parse(userData);
      
      // Verificar se o usuário tem o ministério atual
      if (!usuario.ministerioId || !usuario.ministerios) return false;
      
      // Encontrar a relação do usuário com o ministério atual
      const relacao = usuario.ministerios.find((m: any) => m.ministerioId === usuario.ministerioId);
      
      // Verificar se o usuário é administrador
      return relacao && relacao.role === 'admin';
    } catch (error) {
      console.error('Erro ao verificar se usuário é admin:', error);
      return false;
    }
  }

  // Função auxiliar para tentar separar artista e título de uma busca combinada
  private separarArtistaTitulo(termo: string): { titulo?: string, artista?: string } {
    // Lista de conectores comuns entre título e artista
    const conectores = [' - ', ' by ', ' de ', ' por ', ' from '];
    
    // Verificar se o termo contém algum dos conectores
    for (const conector of conectores) {
      if (termo.includes(conector)) {
        const partes = termo.split(conector);
        
        // Caso comum: "Título - Artista"
        return {
          titulo: partes[0].trim(),
          artista: partes[1].trim()
        };
      }
    }
    
    // Procurar por nomes de artistas conhecidos no termo
    const artistasConhecidos = [
      "Hillsong", "Elevation", "Bethel", "Jesus Culture", 
      "Gabriela Rocha", "Tori Kelly", "Isadora Pompeo",
      "Aline Barros", "Fernandinho", "Diante do Trono", 
      "Morada", "Maverick City", "Casting Crowns", "Chris Tomlin"
    ];
    
    for (const artista of artistasConhecidos) {
      const indice = termo.toLowerCase().indexOf(artista.toLowerCase());
      if (indice !== -1) {
        // Se o nome do artista aparece no fim da string
        if (indice > 0) {
          return {
            titulo: termo.substring(0, indice).trim(),
            artista: termo.substring(indice).trim()
          };
        }
        // Se o nome do artista aparece no início da string
        else {
          const restante = termo.substring(artista.length).trim();
          if (restante) {
            return {
              titulo: restante,
              artista: artista
            };
          }
        }
      }
    }
    
    // Se não conseguiu identificar um padrão claro
    return {};
  }
}

// Exportar uma instância singleton do serviço
const musicaService = new MusicaService();
export default musicaService; 