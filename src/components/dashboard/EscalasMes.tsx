import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Music, User } from 'lucide-react';
import { useMinisterio } from '@/hooks/useMinisterio';
import { useUsuario } from '@/hooks/useUsuario';
import escalaService from '@/services/EscalaService';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

export const EscalasMes = () => {
  const { ministerioAtual } = useMinisterio();
  const { usuario } = useUsuario();
  
  // Obter o mês atual
  const mesAtual = new Date();
  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  const nomeMes = format(mesAtual, 'MMMM', { locale: ptBR });
  
  // Obter escalas do usuário no mês atual
  const qtdEscalasMes = usuario 
    ? escalaService.getQtdEscalasMesAtual(usuario.id) 
    : 0;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Minhas Escalas do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-32">
          <span className="text-4xl font-bold text-primary">{qtdEscalasMes}</span>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {qtdEscalasMes === 0
              ? `Você não tem escalas em ${nomeMes}`
              : qtdEscalasMes === 1
              ? `Você tem 1 escala em ${nomeMes}`
              : `Você tem ${qtdEscalasMes} escalas em ${nomeMes}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 