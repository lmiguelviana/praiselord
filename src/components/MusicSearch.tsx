import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Interface para os resultados da busca
interface SearchResults {
  lyricsLink: string;
  cifraLink: string;
  deezerLink: string;
}

export const MusicSearch = () => {
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [lyricsLink, setLyricsLink] = useState("");
  const [cifraLink, setCifraLink] = useState("");
  const [deezerLink, setDeezerLink] = useState("");
  const [loading, setLoading] = useState(false);

  // Configurações da API do Google
  const GOOGLE_API_KEY = "SUA_API_KEY";
  const CSE_ID = "SEU_CSE_ID";

  // Busca letra via Google CSE
  const searchLyrics = async (artist: string, song: string) => {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(artist + " " + song + " letra")}`
    );
    const data = await response.json();
    return data.items?.[0]?.link || "";
  };

  // Busca cifra via Google CSE
  const searchCifra = async (artist: string, song: string) => {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(artist + " " + song + " cifra")}`
    );
    const data = await response.json();
    return data.items?.[0]?.link || "";
  };

  // Busca música no Deezer
  const searchDeezerTrack = async (artist: string, song: string) => {
    try {
      const response = await fetch(
        `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artist)}" track:"${encodeURIComponent(song)}"`
      );
      const data = await response.json();
      // Retorna o ID da primeira faixa encontrada
      return data.data?.[0]?.id || null;
    } catch (error) {
      console.error("Erro na busca do Deezer:", error);
      return null;
    }
  };

  // Gera o link direto para o Deezer
  const generateDeezerLink = (trackId: number) => {
    return `https://www.deezer.com/track/${trackId}`;
  };

  const handleSearch = async () => {
    if (!artist || !song) return;
    setLoading(true);

    try {
      // Busca todas as informações em paralelo
      const [lyrics, cifra, deezerTrackId] = await Promise.all([
        searchLyrics(artist, song),
        searchCifra(artist, song),
        searchDeezerTrack(artist, song),
      ]);

      // Atualiza os estados
      setLyricsLink(lyrics);
      setCifraLink(cifra);
      setDeezerLink(deezerTrackId ? generateDeezerLink(deezerTrackId) : "");
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Artista"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full"
            />
            <Input
              placeholder="Música"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Buscar"
              )}
            </Button>
          </div>

          {/* Resultados */}
          <div className="space-y-2">
            {lyricsLink && (
              <a
                href={lyricsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                🔍 Ver Letra
              </a>
            )}

            {cifraLink && (
              <a
                href={cifraLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                🎸 Ver Cifra
              </a>
            )}

            {deezerLink && (
              <a
                href={deezerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                🎧 Ouvir no Deezer
              </a>
            )}

            {!deezerLink && loading === false && artist && song && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Música não encontrada no Deezer.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicSearch;