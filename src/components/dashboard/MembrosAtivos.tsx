import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { useMinisterio } from '@/hooks/useMinisterio';
import { useUsuario } from '@/hooks/useUsuario';

export const MembrosAtivos = () => {
  const { ministerioAtual } = useMinisterio();
  const { obterUsuariosMinisterio } = useUsuario();
  
  // Obter membros do ministério atual
  const membros = obterUsuariosMinisterio();
  const qtdMembros = membros ? membros.length : 0;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Membros Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-32">
          <span className="text-4xl font-bold text-primary">{qtdMembros}</span>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {qtdMembros === 0
              ? 'Nenhum membro ativo neste ministério'
              : qtdMembros === 1
              ? '1 membro ativo neste ministério'
              : `${qtdMembros} membros ativos neste ministério`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 