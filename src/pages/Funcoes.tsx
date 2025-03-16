import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic2, Music2, Guitar, Drum, Piano, Radio, Users, ChevronRight, Headphones, Music4 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Lista de funções disponíveis
const funcoes = [
  {
    id: 'ministro',
    nome: 'Ministro',
    descricao: 'Lidera o ministério e conduz os momentos de adoração',
    icon: <Mic2 className="h-6 w-6" />,
    cor: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'vocal',
    nome: 'Vocal',
    descricao: 'Canta como vocalista principal ou backing vocal',
    icon: <Music2 className="h-6 w-6" />,
    cor: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'backing',
    nome: 'Backing Vocal',
    descricao: 'Fornece harmonia vocal e suporte ao vocal principal',
    icon: <Headphones className="h-6 w-6" />,
    cor: 'bg-sky-100 text-sky-600'
  },
  {
    id: 'guitarrista',
    nome: 'Guitarrista',
    descricao: 'Toca guitarra elétrica',
    icon: <Guitar className="h-6 w-6" />,
    cor: 'bg-red-100 text-red-600'
  },
  {
    id: 'baterista',
    nome: 'Baterista',
    descricao: 'Toca bateria e percussão',
    icon: <Drum className="h-6 w-6" />,
    cor: 'bg-orange-100 text-orange-600'
  },
  {
    id: 'tecladista',
    nome: 'Tecladista',
    descricao: 'Toca teclado e piano',
    icon: <Piano className="h-6 w-6" />,
    cor: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: 'baixista',
    nome: 'Baixista',
    descricao: 'Toca baixo elétrico',
    icon: <Music4 className="h-6 w-6" />,
    cor: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'sonoplasta',
    nome: 'Sonoplasta',
    descricao: 'Responsável pela mixagem e som',
    icon: <Radio className="h-6 w-6" />,
    cor: 'bg-indigo-100 text-indigo-600'
  },
  {
    id: 'coordenador',
    nome: 'Coordenador',
    descricao: 'Coordena equipes e organiza escalas',
    icon: <Users className="h-6 w-6" />,
    cor: 'bg-pink-100 text-pink-600'
  }
];

const Funcoes = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funções</h1>
          <p className="text-muted-foreground">
            Selecione as funções que você exerce no ministério
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funcoes.map((funcao) => (
          <Card 
            key={funcao.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/perfil?funcao=' + funcao.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">{funcao.nome}</CardTitle>
              <div className={`p-2 rounded-full ${funcao.cor}`}>
                {funcao.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{funcao.descricao}</p>
              <Button 
                variant="ghost" 
                className="w-full mt-4 justify-between"
                onClick={() => navigate('/perfil?funcao=' + funcao.id)}
              >
                Selecionar função
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Funcoes; 