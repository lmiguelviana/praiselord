// Serviço de busca avançada para processamento intuitivo de consultas de música

// Credenciais do Google Custom Search
const GOOGLE_API_KEY = 'AIzaSyCcx2vgBxh5VrD5Cd-8-LBHn11s3mxlUqI';
const GOOGLE_CSE_ID = 'f453df7ab069144ae';

/**
 * Interface para resultado de busca intuitiva
 */
export interface IntuitiveSearchResult {
  id?: number;
  titulo: string;
  artista: string;
  origem: 'google' | 'regex' | 'local';
  link?: string;
  deezerId?: string;
  deezerCover?: string;
  artistaImagem?: string;
  score: number; // Pontuação de relevância (0-100)
}

/**
 * Serviço para busca intuitiva de músicas
 */
class SearchService {
  
  /**
   * Extrai potenciais artistas e títulos de músicas a partir de uma consulta de texto livre
   */
  parseQuery(query: string): Array<{artista: string, titulo: string, score: number}> {
    // Normalizar a consulta
    const normalizedQuery = query.trim().toLowerCase();
    const results: Array<{artista: string, titulo: string, score: number}> = [];
    
    // Padrão 1: "Artista - Música"
    const pattern1 = normalizedQuery.match(/(.+?)\s+-\s+(.+)/);
    if (pattern1) {
      results.push({
        artista: pattern1[1].trim(),
        titulo: pattern1[2].trim(),
        score: 90 // Alta probabilidade 
      });
    }
    
    // Padrão 2: "Música - Artista"
    const pattern2 = normalizedQuery.match(/(.+?)\s+-\s+(.+)/);
    if (pattern2) {
      results.push({
        artista: pattern2[2].trim(),
        titulo: pattern2[1].trim(),
        score: 80 // Menos comum, mas possível
      });
    }
    
    // Padrão 3: Entender a ordem comum: "Música Artista"
    const words = normalizedQuery.split(' ');
    if (words.length >= 2) {
      // Variar as combinações possíveis
      // 1. Última palavra como artista
      const possibleArtist1 = words[words.length - 1];
      const possibleSong1 = words.slice(0, words.length - 1).join(' ');
      results.push({
        artista: possibleArtist1,
        titulo: possibleSong1,
        score: 60
      });
      
      // 2. Primeira palavra como artista  
      const possibleArtist2 = words[0];
      const possibleSong2 = words.slice(1).join(' ');
      results.push({
        artista: possibleArtist2,
        titulo: possibleSong2,
        score: 60
      });
      
      // 3. Primeiro metade como artista, segunda metade como música
      const mid = Math.floor(words.length / 2);
      const possibleArtist3 = words.slice(0, mid).join(' ');
      const possibleSong3 = words.slice(mid).join(' ');
      results.push({
        artista: possibleArtist3,
        titulo: possibleSong3,
        score: 70
      });
      
      // 4. Segunda metade como artista, primeira metade como música
      const possibleArtist4 = words.slice(mid).join(' ');
      const possibleSong4 = words.slice(0, mid).join(' ');
      results.push({
        artista: possibleArtist4,
        titulo: possibleSong4,
        score: 65
      });
    }
    
    return results;
  }
  
  /**
   * Busca no Google Custom Search para desambiguação
   */
  async searchGoogle(query: string): Promise<any[]> {
    try {
      const encodedQuery = encodeURIComponent(query + " música letra");
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodedQuery}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google CSE Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Erro na busca Google:", error);
      return [];
    }
  }
  
  /**
   * Extrai artista e música de um título do Google
   */
  parseGoogleTitle(title: string): {artista: string, titulo: string} | null {
    // Várias expressões regulares para capturar diferentes formatos de sites
    
    // Formato: "Artista - Música (Letra) - Letras.mus.br"
    const letrasPattern = title.match(/(.*?)\s*-\s*(.*?)(\s*\(|$)/);
    if (letrasPattern) {
      return {
        artista: letrasPattern[1].trim(),
        titulo: letrasPattern[2].trim()
      };
    }
    
    // Formato: "Música - Artista - CIFRA CLUB"
    const cifraPattern = title.match(/(.*?)\s*-\s*(.*?)\s*-\s*CIFRA/i);
    if (cifraPattern) {
      return {
        artista: cifraPattern[2].trim(),
        titulo: cifraPattern[1].trim()
      };
    }
    
    // Formato: "Música - Artista | Letra da Música"
    const genericPattern = title.match(/(.*?)\s*-\s*(.*?)\s*(\||$)/);
    if (genericPattern) {
      return {
        artista: genericPattern[2].trim(),
        titulo: genericPattern[1].trim()
      };
    }
    
    return null;
  }
  
  /**
   * Busca intuitiva combinando várias técnicas
   */
  async intuitiveSearch(query: string): Promise<IntuitiveSearchResult[]> {
    if (!query.trim()) return [];
    
    const results: IntuitiveSearchResult[] = [];
    
    // 1. Extrair possíveis combinações artista/música a partir da consulta
    const possibleCombinations = this.parseQuery(query);
    
    // 2. Adicionar combinações de regex ao resultado
    possibleCombinations.forEach(combo => {
      results.push({
        titulo: combo.titulo,
        artista: combo.artista,
        origem: 'regex',
        score: combo.score
      });
    });
    
    // 3. Busca no Google para validação
    try {
      const googleResults = await this.searchGoogle(query);
      
      // Processar até os 3 primeiros resultados
      const topResults = googleResults.slice(0, 3);
      for (const result of topResults) {
        const parsed = this.parseGoogleTitle(result.title);
        if (parsed) {
          results.push({
            titulo: parsed.titulo,
            artista: parsed.artista,
            origem: 'google',
            link: result.link,
            score: 85 // Alta confiança para resultados do Google
          });
        }
      }
    } catch (err) {
      console.error("Erro na busca intuitiva:", err);
    }
    
    // 4. Remover duplicados (preferindo os com score mais alto)
    const uniqueResults = this.removeDuplicates(results);
    
    // 5. Ordenar por score (relevância)
    return uniqueResults.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Remove resultados duplicados, mantendo os com maior score
   */
  private removeDuplicates(results: IntuitiveSearchResult[]): IntuitiveSearchResult[] {
    const uniqueMap = new Map<string, IntuitiveSearchResult>();
    
    results.forEach(result => {
      // Criar chave única para artista + título
      const normalizedArtist = result.artista.toLowerCase().trim();
      const normalizedTitle = result.titulo.toLowerCase().trim();
      const key = `${normalizedArtist}|${normalizedTitle}`;
      
      // Se já existe, manter o com maior score
      if (!uniqueMap.has(key) || uniqueMap.get(key)!.score < result.score) {
        uniqueMap.set(key, result);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
}

export default new SearchService(); 