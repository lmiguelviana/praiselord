import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Music, Loader2 } from 'lucide-react';
import searchService from '@/services/SearchService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CifraSearchTest from './CifraSearchTest';

const EXEMPLOS = [
  'Rocha Eterna Aline Barros',
  'Aline Barros Rocha Eterna',
  'Oceanos Hillsong',
  'Aquieta Minh\'alma Ministério Zoe',
  'Vineyard Worthy',
  'Digno Fernandinho',
  'Fernandinho Ainda Que A Figueira',
];

const TestBusca: React.FC = () => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [ultimaBusca, setUltimaBusca] = useState('');

  const realizarBusca = async (termo: string) => {
    if (!termo.trim()) return;

    setBuscando(true);
    setUltimaBusca(termo);

    try {
      const resultado = await searchService.intuitiveSearch(termo);
      setResultados(resultado);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ferramentas de Busca</CardTitle>
        <CardDescription>
          Teste as funcionalidades avançadas de busca disponíveis no PraiseLord.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="intuitive" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="intuitive">Busca Intuitiva</TabsTrigger>
            <TabsTrigger value="cifras">Busca de Cifras</TabsTrigger>
          </TabsList>
          
          <TabsContent value="intuitive" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite como você falaria naturalmente, ex: Rocha Eterna Aline Barros"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      realizarBusca(query);
                    }
                  }}
                />
              </div>
              <Button onClick={() => realizarBusca(query)} disabled={buscando || !query.trim()}>
                {buscando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>Buscar</>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 my-2">
              {EXEMPLOS.map((exemplo) => (
                <Button
                  key={exemplo}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(exemplo);
                    realizarBusca(exemplo);
                  }}
                >
                  {exemplo}
                </Button>
              ))}
            </div>

            {ultimaBusca && (
              <div className="text-sm text-muted-foreground">
                Resultados para: <span className="font-semibold">{ultimaBusca}</span>
              </div>
            )}

            {buscando ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Analisando sua consulta...</span>
              </div>
            ) : resultados.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-4">
                  {resultados.map((resultado, index) => (
                    <Card
                      key={index}
                      className={
                        resultado.origem === 'local'
                          ? 'border-primary/20'
                          : resultado.origem === 'google'
                          ? 'border-green-500/50'
                          : 'border-blue-500/50'
                      }
                    >
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{resultado.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              <span className="font-medium">Artista: </span>
                              {resultado.artista}
                            </CardDescription>
                            <div className="text-xs text-muted-foreground mt-1">
                              Confiança: {resultado.score}%
                            </div>
                          </div>

                          <Badge
                            className={
                              resultado.origem === 'google'
                                ? 'bg-green-600 text-white'
                                : resultado.origem === 'regex'
                                ? 'bg-orange-500 text-white'
                                : 'bg-blue-600 text-white'
                            }
                          >
                            {resultado.origem === 'google'
                              ? 'Google'
                              : resultado.origem === 'regex'
                              ? 'Análise de Texto'
                              : resultado.origem}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : ultimaBusca ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
              </div>
            ) : null}
          </TabsContent>
          
          <TabsContent value="cifras">
            <CifraSearchTest />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TestBusca; 