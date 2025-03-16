/**
 * GoogleSearchService.ts
 * 
 * Serviço para busca de cifras e informações de músicas usando a Google Custom Search API
 */

// Credenciais da Google Custom Search
const GOOGLE_API_KEY = 'AIzaSyCRN6VaFb7BP5gDJ7QX68ZdAbIqZyLm3H4';
const GOOGLE_CSE_ID = '54ee0cfbab7d64a56';

// Interface para resultados de busca de cifra
export interface CifraSearchResult {
  link: string;        // URL da cifra
  title: string;       // Título do resultado
  snippet: string;     // Trecho do resultado
  source: string;      // Fonte (ex: cifraclub, etc)
  tom?: string;        // Tom da música (se encontrado via análise)
  andamento?: string;  // Andamento (se encontrado via análise)
}

// Interface para resultados de busca de tom
export interface TomSearchResult {
  tom: string;
  fonte: string;
  confianca: number; // 0-100%
}

class GoogleSearchService {

  /**
   * Busca cifras para uma música específica
   * @param artist Nome do artista
   * @param song Título da música
   * @returns Promise com os resultados da busca de cifras
   */
  async searchCifra(artist: string, song: string): Promise<CifraSearchResult[]> {
    try {
      // Construir query - filtrando para sites conhecidos de cifras
      const query = encodeURIComponent(`${artist} ${song} cifra tom`);
      
      // Sites principais de cifra (podemos expandir esta lista)
      const siteRestriction = 'site:cifraclub.com.br OR site:cifras.com.br OR site:ciframais.com.br OR site:letras.mus.br';
      
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${query} ${siteRestriction}`;
      
      console.log('Buscando cifras via Google CSE:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Custom Search Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log('Nenhum resultado encontrado para cifra');
        return [];
      }
      
      // Processar os resultados
      return data.items.map((item: any): CifraSearchResult => {
        // Detectar a fonte com base no URL
        let source = 'Desconhecido';
        if (item.link.includes('cifraclub.com.br')) source = 'Cifra Club';
        else if (item.link.includes('cifras.com.br')) source = 'Cifras.com.br';
        else if (item.link.includes('ciframais.com.br')) source = 'Cifra Mais';
        else if (item.link.includes('letras.mus.br')) source = 'Letras.mus.br';
        
        // Tentar extrair o tom do snippet ou título (se estiver lá)
        const tomMatch = 
          item.snippet?.match(/Tom:?\s*([A-G][#b]?m?)/i) || 
          item.title?.match(/Tom:?\s*([A-G][#b]?m?)/i);
        
        // Tentar extrair o andamento do snippet (se estiver lá)
        const andamentoMatch = item.snippet?.match(/BPM:?\s*(\d+)/i);
        
        return {
          link: item.link,
          title: item.title,
          snippet: item.snippet,
          source: source,
          tom: tomMatch ? tomMatch[1] : undefined,
          andamento: andamentoMatch ? andamentoMatch[1] : undefined
        };
      });
    } catch (error) {
      console.error('Erro ao buscar cifras:', error);
      return [];
    }
  }
  
  /**
   * Busca o tom da música via Google Search
   * @param artist Nome do artista
   * @param song Título da música
   * @returns Promise com o resultado da busca de tom
   */
  async searchTom(artist: string, song: string): Promise<TomSearchResult | null> {
    try {
      // Ajustar a query para aumentar a chance de encontrar o tom
      const query = encodeURIComponent(`${artist} ${song} "tom" "cifra"`);
      
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${query}`;
      
      console.log('Buscando tom via Google CSE:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Custom Search Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log('Nenhum resultado encontrado para tom');
        return null;
      }
      
      // Extrair o tom de snippets ou títulos dos resultados
      for (const item of data.items) {
        // Verificar o snippet e título por padrões como "Tom: C" ou "Tonalidade: Am"
        const tomMatches = [
          // Snippet
          item.snippet?.match(/Tom:?\s*([A-G][#b]?m?)/i),
          item.snippet?.match(/Tonalidade:?\s*([A-G][#b]?m?)/i),
          // Título
          item.title?.match(/Tom:?\s*([A-G][#b]?m?)/i),
          item.title?.match(/Tonalidade:?\s*([A-G][#b]?m?)/i)
        ].filter(Boolean);
        
        if (tomMatches && tomMatches.length > 0) {
          // Usar o primeiro match encontrado
          const tomMatch = tomMatches[0];
          
          // Determinar a fonte
          let fonte = 'Google Search';
          if (item.link.includes('cifraclub.com.br')) fonte = 'Cifra Club';
          else if (item.link.includes('cifras.com.br')) fonte = 'Cifras.com.br';
          else if (item.link.includes('ciframais.com.br')) fonte = 'Cifra Mais';
          
          return {
            tom: tomMatch[1], // O grupo capturado é o tom
            fonte: fonte,
            confianca: 85 // Confiança alta para tom encontrado em um site especializado
          };
        }
      }
      
      // Nenhum tom específico encontrado nos snippets, fazer análise mais ampla
      // Procurar por qualquer menção de um tom musical nos snippets
      const todosSnippets = data.items.map(item => item.snippet).join(' ');
      const padraoTom = /\b([A-G][#b]?m?)\b/g;
      
      const todosMatches = todosSnippets.match(padraoTom);
      
      if (todosMatches && todosMatches.length > 0) {
        // Contar a frequência de cada tom mencionado
        const contagem = todosMatches.reduce((acc, tom) => {
          acc[tom] = (acc[tom] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Encontrar o tom mais mencionado
        let tomMaisComum = '';
        let maxContagem = 0;
        
        for (const [tom, count] of Object.entries(contagem)) {
          if ((count as number) > maxContagem) {
            tomMaisComum = tom;
            maxContagem = count as number;
          }
        }
        
        if (tomMaisComum) {
          return {
            tom: tomMaisComum,
            fonte: 'Análise de textos Google',
            confianca: Math.min(60 + (maxContagem * 5), 90) // Confiança baseada na frequência, mas limitada a 90%
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar tom:', error);
      return null;
    }
  }

  /**
   * Busca completa de informações musicais (cifra e tom)
   * @param artist Nome do artista
   * @param song Título da música
   * @returns Promise com cifras e tom
   */
  async searchMusicInfo(artist: string, song: string): Promise<{
    cifras: CifraSearchResult[],
    tom: TomSearchResult | null
  }> {
    try {
      // Realizar as buscas em paralelo
      const [cifras, tom] = await Promise.all([
        this.searchCifra(artist, song),
        this.searchTom(artist, song)
      ]);
      
      // Se um tom foi encontrado nas cifras mas não na busca específica por tom
      if (!tom && cifras.length > 0) {
        const cifraComTom = cifras.find(c => c.tom);
        
        if (cifraComTom && cifraComTom.tom) {
          return {
            cifras,
            tom: {
              tom: cifraComTom.tom,
              fonte: cifraComTom.source,
              confianca: 80
            }
          };
        }
      }
      
      return { cifras, tom };
    } catch (error) {
      console.error('Erro na busca completa de informações musicais:', error);
      return { cifras: [], tom: null };
    }
  }
}

export default new GoogleSearchService(); 