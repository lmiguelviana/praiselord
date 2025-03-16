export const GOOGLE_SEARCH_CONFIG = {
  API_KEY: 'AIzaSyCRN6VaFb7BP5gDJ7QX68ZdAbIqZyLm3H4', // Sua chave da API
  CSE_ID: 'a6853747103fa41b8', // ID do seu Custom Search Engine
  BASE_URL: 'https://www.googleapis.com/customsearch/v1',
  SITES: {
    LETRAS: ['letras.mus.br', 'vagalume.com.br'],
    CIFRAS: ['cifraclub.com.br', 'cifras.com.br']
  }
};

export const generateSearchUrl = (query: string, siteRestriction?: string) => {
  const baseUrl = GOOGLE_SEARCH_CONFIG.BASE_URL;
  const apiKey = GOOGLE_SEARCH_CONFIG.API_KEY;
  const cseId = GOOGLE_SEARCH_CONFIG.CSE_ID;
  
  let searchQuery = encodeURIComponent(query);
  if (siteRestriction) {
    searchQuery += ` ${siteRestriction}`;
  }
  
  return `${baseUrl}?key=${apiKey}&cx=${cseId}&q=${searchQuery}`;
}; 