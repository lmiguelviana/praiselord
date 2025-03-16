import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gift, CalendarCheck } from 'lucide-react';
import { useMinisterio } from '@/hooks/useMinisterio';
import { useUsuario } from '@/hooks/useUsuario';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const AniversarianteDia = () => {
  const { ministerioAtual } = useMinisterio();
  const { obterUsuariosMinisterio } = useUsuario();
  
  // Data atual para verificar aniversariantes
  const hoje = new Date();
  const diaHoje = format(hoje, 'dd/MM');
  const dataFormatada = format(hoje, "dd 'de' MMMM", { locale: ptBR });
  
  // Obter membros do ministério atual
  const membros = obterUsuariosMinisterio();
  
  // Filtrar aniversariantes do dia
  const aniversariantes = membros
    ? membros.filter(membro => {
        if (!membro.dataNascimento) return false;
        
        try {
          // Formato esperado: 'YYYY-MM-DD' ou 'DD/MM/YYYY'
          const dataNasc = membro.dataNascimento;
          const diaMes = dataNasc.includes('-') 
            ? format(new Date(dataNasc), 'dd/MM')
            : dataNasc.split('/').slice(0, 2).join('/');
          
          return diaMes === diaHoje;
        } catch (error) {
          return false;
        }
      })
    : [];
  
  // Função para obter iniciais
  const getIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map(parte => parte[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Aniversariante do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aniversariantes.length > 0 ? (
          <div className="space-y-4">
            {aniversariantes.map(aniversariante => (
              <div key={aniversariante.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={aniversariante.foto || ''} />
                  <AvatarFallback className="bg-primary/20">
                    {getIniciais(aniversariante.nome || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{aniversariante.nome}</h4>
                  <p className="text-xs text-muted-foreground">Parabéns! 🎉</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32">
            <CalendarCheck className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhum aniversariante hoje
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {dataFormatada}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 