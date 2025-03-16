import { env } from '@/env';

interface GoogleSearchResult {
  items?: Array<{
    link: string;
    title: string;
    snippet: string;
  }>;
}

class GoogleSearchService {
  private readonly GOOGLE_API_KEY = env.GOOGLE_API_KEY;
  private readonly CSE_ID = env.GOOGLE_CSE_ID;

  /**
   * Busca letras de música usando o Google Custom Search
   */
  async searchLyrics(artist: string, song: string): Promise<string | null> {
    try {
      console.log(`Buscando letra para: ${artist} - ${song}`);
      
      const query = encodeURIComponent(`${artist} ${song} letra site:letras.mus.br OR site:vagalume.com.br`);
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.GOOGLE_API_KEY}&cx=${this.CSE_ID}&q=${query}`;
      
      const response = await fetch(url);
      const data: GoogleSearchResult = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log('Nenhum resultado encontrado para letra');
        return null;
      }

      // Prioriza resultados do letras.mus.br
      const letrasMusResult = data.items.find(item => item.link.includes('letras.mus.br'));
      if (letrasMusResult) {
        console.log('Encontrado resultado no letras.mus.br:', letrasMusResult.link);
        return letrasMusResult.link;
      }

      // Se não encontrar no letras.mus.br, usa o primeiro resultado
      console.log('Usando primeiro resultado encontrado:', data.items[0].link);
      return data.items[0].link;
    } catch (error) {
      console.error('Erro ao buscar letra:', error);
      return null;
    }
  }

  /**
   * Busca cifras usando o Google Custom Search
   */
  async searchCifra(artist: string, song: string): Promise<string | null> {
    try {
      console.log(`Buscando cifra para: ${artist} - ${song}`);
      
      const query = encodeURIComponent(`${artist} ${song} cifra site:cifraclub.com.br OR site:cifras.com.br`);
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.GOOGLE_API_KEY}&cx=${this.CSE_ID}&q=${query}`;
      
      const response = await fetch(url);
      const data: GoogleSearchResult = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log('Nenhum resultado encontrado para cifra');
        return null;
      }

      // Prioriza resultados do Cifra Club
      const cifraClubResult = data.items.find(item => item.link.includes('cifraclub.com.br'));
      if (cifraClubResult) {
        console.log('Encontrado resultado no cifraclub:', cifraClubResult.link);
        return cifraClubResult.link;
      }

      // Se não encontrar no Cifra Club, usa o primeiro resultado
      console.log('Usando primeiro resultado encontrado:', data.items[0].link);
      return data.items[0].link;
    } catch (error) {
      console.error('Erro ao buscar cifra:', error);
      return null;
    }
  }
}

export const googleSearchService = new GoogleSearchService(); 