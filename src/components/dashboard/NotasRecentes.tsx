import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useNotas, Nota } from '@/hooks/useNotas';
import { useMinisterio } from '@/hooks/useMinisterio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useUsuario } from '@/hooks/useUsuario';
import { Link } from 'react-router-dom';

export const NotasRecentes = () => {
  const { notas } = useNotas();
  const { ministerioAtual } = useMinisterio();
  const { usuario } = useUsuario();
  
  // Verificar se o usuário é administrador do ministério atual
  const isAdminMinisterio = ministerioAtual && usuario && ministerioAtual.adminId === usuario.id;
  
  // Estado para controlar o modal de visualização
  const [modalOpen, setModalOpen] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<Nota | null>(null);
  
  // Função para abrir o modal de visualização
  const visualizarNota = (nota: Nota) => {
    console.log("Abrindo nota:", nota.id, nota.titulo);
    setNotaSelecionada(nota);
    setModalOpen(true);
  };
  
  // Função para renderizar o ícone de prioridade
  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'media':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'baixa':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  // Obter apenas as 3 notas mais recentes
  const notasRecentes = notas.slice(0, 3);
  
  return (
    <>
      <Card className="col-span-1 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium">Notas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {notasRecentes.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              Nenhuma nota disponível
            </div>
          ) : (
            <div className="space-y-3">
              {notasRecentes.map((nota) => (
                <div 
                  key={nota.id} 
                  className="p-3 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => visualizarNota(nota)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{nota.titulo}</h4>
                    {getPrioridadeIcon(nota.prioridade)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{nota.conteudo}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{nota.data}</span>
                  </div>
                </div>
              ))}
              {notas.length > 3 && (
                <div className="text-center mt-4">
                  <Link 
                    to="/notas" 
                    className="text-xs text-primary hover:underline"
                  >
                    Ver todas as notas ({notas.length})
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Visualização - implementação mais direta */}
      <Dialog 
        open={modalOpen} 
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setNotaSelecionada(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          {notaSelecionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {notaSelecionada.titulo}
                  {getPrioridadeIcon(notaSelecionada.prioridade)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{notaSelecionada.data}</span>
                </div>
                <div className="border-t pt-4">
                  <p className="whitespace-pre-wrap">{notaSelecionada.conteudo}</p>
                </div>
              </div>
              <DialogFooter>
                {isAdminMinisterio && (
                  <Link 
                    to={`/notas?edit=${notaSelecionada.id}`}
                    className="mr-auto"
                  >
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                )}
                <Button onClick={() => setModalOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 