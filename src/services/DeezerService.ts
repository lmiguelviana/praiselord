// DeezerService.ts
// Serviço para integração com a API do Deezer

// Interface para resultados de pesquisa de música do Deezer
export interface DeezerTrack {
  id: number;
  title: string;
  link: string;
  preview: string; // URL de 30seg da música
  artist: {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
  };
  duration: number; // em segundos
  explicit_lyrics: boolean;
  type: string;
}

export interface DeezerSearchResult {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

class DeezerService {
  private baseUrl = 'https://api.deezer.com';
  private corsProxy = 'https://cors-anywhere.herokuapp.com/'; // Para evitar problemas de CORS em ambiente de desenvolvimento

  // Função para normalizar texto (remover parênteses, sufix, etc)
  private normalizeText(text: string): string {
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
  }

  // Função para formatar texto para comparação
  private formatForComparison(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, ""); // Remove caracteres especiais
  }

  // Valida correspondência entre input e resultado do Deezer
  private validateMatch(inputTitle: string, inputArtist: string, deezerTitle: string, deezerArtist: string): boolean {
    const inputTitleNorm = this.formatForComparison(inputTitle);
    const inputArtistNorm = this.formatForComparison(inputArtist);
    const deezerTitleNorm = this.formatForComparison(deezerTitle);
    const deezerArtistNorm = this.formatForComparison(deezerArtist);

    // Verificar se o artista corresponde
    const artistMatch = deezerArtistNorm.includes(inputArtistNorm) || 
                       inputArtistNorm.includes(deezerArtistNorm);
    
    // Verificar se a música corresponde
    const titleMatch = deezerTitleNorm.includes(inputTitleNorm) || 
                     inputTitleNorm.includes(deezerTitleNorm);
    
    // Ambos precisam corresponder para ser uma correspondência válida
    return artistMatch && titleMatch;
  }

  // Pesquisar música no Deezer
  async searchTracks(query: string, limit: number = 10): Promise<DeezerTrack[]> {
    try {
      const endpoint = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      // Usar cors-proxy em desenvolvimento local para evitar problemas de CORS
      const url = process.env.NODE_ENV === 'development' ? `${this.corsProxy}${endpoint}` : endpoint;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na busca do Deezer: ${response.statusText}`);
      }
      
      const data: DeezerSearchResult = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao pesquisar no Deezer:', error);
      return [];
    }
  }

  // Buscar detalhes de uma música pelo ID
  async getTrack(trackId: number): Promise<DeezerTrack | null> {
    try {
      const endpoint = `${this.baseUrl}/track/${trackId}`;
      const url = process.env.NODE_ENV === 'development' ? `${this.corsProxy}${endpoint}` : endpoint;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar faixa no Deezer: ${response.statusText}`);
      }
      
      const track: DeezerTrack = await response.json();
      return track;
    } catch (error) {
      console.error('Erro ao buscar faixa no Deezer:', error);
      return null;
    }
  }

  // Buscar música por título e artista - Versão melhorada
  async searchByTitleAndArtist(title: string, artist: string): Promise<DeezerTrack | null> {
    try {
      // Normalizar título e artista antes da busca
      const normalizedTitle = this.normalizeText(title);
      const normalizedArtist = this.normalizeText(artist);
      
      // Estratégia 1: Busca específica usando formato artista:"X" track:"Y"
      const structuredQuery = `artist:"${normalizedArtist}" track:"${normalizedTitle}"`;
      console.log(`Buscando no Deezer com query estruturada: ${structuredQuery}`);
      let tracks = await this.searchTracks(structuredQuery, 5);
      
      // Se encontrou resultados, verifica e retorna o melhor
      if (tracks.length > 0) {
        // Filtra pela melhor correspondência
        const validTracks = tracks.filter(track => 
          this.validateMatch(normalizedTitle, normalizedArtist, track.title, track.artist.name)
        );
        
        if (validTracks.length > 0) {
          console.log(`Encontrada correspondência válida para ${normalizedTitle} - ${normalizedArtist}`);
          // Priorizar versões originais (sem "ao vivo", "acústico", etc)
          const sortedTracks = validTracks.sort((a, b) => {
            const aIsLive = /live|ao vivo|acustic|cover/i.test(a.title);
            const bIsLive = /live|ao vivo|acustic|cover/i.test(b.title);
            
            if (!aIsLive && bIsLive) return -1;
            if (aIsLive && !bIsLive) return 1;
            return 0;
          });
          
          return sortedTracks[0];
        }
      }
      
      // Estratégia 2: Busca simples combinando artista e título
      const simpleQuery = `${normalizedArtist} ${normalizedTitle}`;
      console.log(`Tentando busca simples: ${simpleQuery}`);
      tracks = await this.searchTracks(simpleQuery, 10);
      
      if (tracks.length > 0) {
        // Filtra e valida novamente
        const validTracks = tracks.filter(track => 
          this.validateMatch(normalizedTitle, normalizedArtist, track.title, track.artist.name)
        );
        
        if (validTracks.length > 0) {
          // Priorizar versões originais
          const sortedTracks = validTracks.sort((a, b) => {
            const aIsLive = /live|ao vivo|acustic|cover/i.test(a.title);
            const bIsLive = /live|ao vivo|acustic|cover/i.test(b.title);
            
            if (!aIsLive && bIsLive) return -1;
            if (aIsLive && !bIsLive) return 1;
            return 0;
          });
          
          return sortedTracks[0];
        }
      }
      
      // Se chegou aqui, não encontrou correspondência válida
      console.log(`Nenhuma correspondência válida encontrada para ${title} - ${artist}`);
      return null;
    } catch (error) {
      console.error('Erro ao buscar por título e artista no Deezer:', error);
      return null;
    }
  }

  // Obter URL direta para reprodução no Deezer
  getPlayerUrl(trackId: number): string {
    return `https://www.deezer.com/plugins/player?format=classic&autoplay=false&playlist=true&width=700&height=350&color=007FEB&layout=dark&size=medium&type=tracks&id=${trackId}`;
  }

  // Obter URL para incorporar player do Deezer
  getEmbedUrl(trackId: number): string {
    return `https://widget.deezer.com/widget/dark/track/${trackId}`;
  }
}

// Exportar uma instância singleton do serviço
const deezerService = new DeezerService();
export default deezerService; 