import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Music, Loader2, FileText, ExternalLink } from 'lucide-react';
import googleSearchService, { CifraSearchResult, TomSearchResult } from '@/services/GoogleSearchService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

// Exemplos pré-configurados para teste rápido
const EXEMPLOS = [
  {
    artista: 'Aline Barros',
    musica: 'Ressuscita-me'
  },
  {
    artista: 'Fernandinho',
    musica: 'Ainda que a Figueira'
  },
  {
    artista: 'Hillsong',
    musica: 'Oceans'
  },
  {
    artista: 'Gabriela Rocha',
    musica: 'Lugar Secreto'
  },
];

const CifraSearchTest: React.FC = () => {
  const [artista, setArtista] = useState('');
  const [musica, setMusica] = useState('');
  const [cifras, setCifras] = useState<CifraSearchResult[]>([]);
  const [tom, setTom] = useState<TomSearchResult | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [ultimaBusca, setUltimaBusca] = useState({ artista: '', musica: '' });

  const realizarBusca = async () => {
    if (!artista.trim() || !musica.trim()) return;

    setBuscando(true);
    setUltimaBusca({ artista, musica });

    try {
      // Buscar informações completas de uma vez
      const resultado = await googleSearchService.searchMusicInfo(artista, musica);
      setCifras(resultado.cifras);
      setTom(resultado.tom);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleExemploClick = (exemplo: typeof EXEMPLOS[0]) => {
    setArtista(exemplo.artista);
    setMusica(exemplo.musica);
    // Executar a busca com os dados do exemplo
    setTimeout(() => realizarBusca(), 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Busca de Cifras e Tom</CardTitle>
        <CardDescription>
          Teste a busca de cifras e tom usando a Google Custom Search API.
          Este componente demonstra como encontrar cifras e o tom de músicas com alta precisão.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="artista">Artista</Label>
            <Input
              id="artista"
              placeholder="Ex: Aline Barros"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && artista && musica) {
                  realizarBusca();
                }
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="musica">Música</Label>
            <div className="flex gap-2">
              <Input
                id="musica"
                placeholder="Ex: Ressuscita-me"
                value={musica}
                onChange={(e) => setMusica(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && artista && musica) {
                    realizarBusca();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={realizarBusca} disabled={buscando || !artista.trim() || !musica.trim()}>
                {buscando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-4">
          <p className="text-sm text-muted-foreground w-full mb-1">Exemplos rápidos:</p>
          {EXEMPLOS.map((exemplo) => (
            <Button
              key={`${exemplo.artista}-${exemplo.musica}`}
              variant="outline"
              size="sm"
              onClick={() => handleExemploClick(exemplo)}
            >
              {exemplo.artista} - {exemplo.musica}
            </Button>
          ))}
        </div>

        {ultimaBusca.artista && ultimaBusca.musica && (
          <div className="text-sm text-muted-foreground">
            Resultados para: <span className="font-semibold">{ultimaBusca.artista} - {ultimaBusca.musica}</span>
          </div>
        )}

        {buscando ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Buscando informações...</span>
          </div>
        ) : (
          <Tabs defaultValue="cifras" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cifras">Cifras ({cifras.length})</TabsTrigger>
              <TabsTrigger value="tom">Tom da Música</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cifras">
              {cifras.length > 0 ? (
                <ScrollArea className="h-[350px] rounded-md border p-2">
                  <div className="space-y-4 p-2">
                    {cifras.map((cifra, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="py-4 bg-secondary/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg font-medium">{cifra.title}</CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {cifra.snippet}
                              </CardDescription>
                            </div>

                            <Badge variant="secondary">
                              {cifra.source}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="py-4">
                          <div className="grid gap-2 sm:grid-cols-2">
                            {cifra.tom && (
                              <div className="flex items-center">
                                <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">Tom: <strong>{cifra.tom}</strong></span>
                              </div>
                            )}
                            
                            {cifra.andamento && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">Andamento: <strong>{cifra.andamento} BPM</strong></span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-0 pb-4">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(cifra.link, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Cifra
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : ultimaBusca.artista ? (
                <div className="text-center py-10 border rounded-md mt-4">
                  <p className="text-muted-foreground">Nenhuma cifra encontrada para esta música.</p>
                </div>
              ) : null}
            </TabsContent>
            
            <TabsContent value="tom">
              {tom ? (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Tom da Música: <span className="text-primary">{tom.tom}</span></CardTitle>
                    <CardDescription>
                      Encontrado com {tom.confianca}% de confiança via {tom.fonte}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tom.confianca > 80 
                        ? "Este tom foi encontrado com alta confiança em um site especializado."
                        : tom.confianca > 60
                        ? "Este tom foi identificado pela análise de vários resultados."
                        : "Este tom é uma estimativa baseada na análise dos resultados de busca."}
                    </p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Tons relativos:</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {relatedKeys(tom.tom).map((relatedKey, idx) => (
                          <span key={idx} className="text-center p-2 bg-secondary rounded text-sm">
                            {relatedKey}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : ultimaBusca.artista ? (
                <div className="text-center py-10 border rounded-md mt-4">
                  <p className="text-muted-foreground">Não foi possível determinar o tom desta música.</p>
                  <p className="text-xs mt-2">Tente pesquisar em sites de cifra diretamente.</p>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

// Função utilitária para encontrar tons relacionados
function relatedKeys(key: string): string[] {
  // Tons maiores
  const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab'];
  // Tons menores relativos
  const minorKeys = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Dm', 'Gm', 'Cm', 'Fm'];
  
  const keyMap: Record<string, string[]> = {};
  
  // Mapear cada tom para seu tom relativo menor/maior e tons próximos no círculo de quintas
  majorKeys.forEach((majorKey, idx) => {
    const minorKey = minorKeys[idx];
    
    // Para tons maiores, mostrar o relativo menor e vizinhos no círculo de quintas
    keyMap[majorKey] = [
      majorKey,
      minorKey,
      majorKeys[(idx + 1) % 12],  // Um tom acima no círculo de quintas
      majorKeys[(idx + 11) % 12]  // Um tom abaixo no círculo de quintas
    ];
    
    // Para tons menores, mostrar o relativo maior e vizinhos no círculo de quintas
    keyMap[minorKey] = [
      minorKey,
      majorKey,
      minorKeys[(idx + 1) % 12],  // Um tom acima no círculo de quintas
      minorKeys[(idx + 11) % 12]  // Um tom abaixo no círculo de quintas
    ];
  });
  
  // Adicionar versões com bemol/sustenido alternativas
  const enharmonics: Record<string, string> = {
    'F#': 'Gb', 'Gb': 'F#', 
    'C#': 'Db', 'Db': 'C#',
    'A#': 'Bb', 'Bb': 'A#',
    'D#': 'Eb', 'Eb': 'D#',
    'G#': 'Ab', 'Ab': 'G#',
    'D#m': 'Ebm', 'Ebm': 'D#m',
    'G#m': 'Abm', 'Abm': 'G#m',
    'A#m': 'Bbm', 'Bbm': 'A#m',
    'C#m': 'Dbm', 'Dbm': 'C#m',
    'F#m': 'Gbm', 'Gbm': 'F#m'
  };
  
  // Verificar se o tom não está no mapa, mas tem uma versão enarmônica
  if (!keyMap[key] && enharmonics[key]) {
    return keyMap[enharmonics[key]] || [key];
  }
  
  return keyMap[key] || [key];
}

export default CifraSearchTest; 