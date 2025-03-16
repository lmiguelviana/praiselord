/**
 * Serviço para integração com a API do Vagalume
 * Documentação: https://api.vagalume.com.br/docs/
 */

const API_KEY = process.env.NEXT_PUBLIC_VAGALUME_API_KEY;
const BASE_URL = 'https://api.vagalume.com.br';

interface VagalumeResponse {
  type: 'exact' | 'aprox' | 'song_notfound' | 'notfound';
  art: {
    id: string;
    name: string;
    url: string;
  };
  mus?: Array<{
    id: string;
    name: string;
    lang: number;
    url: string;
    text: string;
    translate?: Array<{
      id: string;
      lang: number;
      url: string;
      text: string;
    }>;
  }>;
}

export async function buscarLetra(artista: string, musica: string): Promise<VagalumeResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/search.php?art=${encodeURIComponent(artista)}&mus=${encodeURIComponent(musica)}&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Erro ao buscar letra da música');
    }

    const data = await response.json();
    
    // Verifica se há captcha
    if (data.captcha) {
      throw new Error('Limite de requisições atingido. Por favor, tente novamente mais tarde.');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar letra:', error);
    throw error;
  }
}

export function getIdiomaMusica(langId: number): string {
  const idiomas = {
    1: 'Português Brasil',
    2: 'Inglês',
    3: 'Espanhol',
    4: 'Francês',
    5: 'Alemão',
    6: 'Italiano',
    7: 'Holandês',
    8: 'Japonês',
    9: 'Português Portugal',
    999999: 'Outros'
  };
  
  return idiomas[langId as keyof typeof idiomas] || 'Desconhecido';
} 